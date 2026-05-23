import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchProductList } from "../../services/productService";
import {
  applyStockDelta,
  fetchStockAvailable,
  getAllStockMovementsByProduct,
} from "../../services/stockService";
import { fetchCombinationsByProduct } from "../../services/combinationService";
import { fetchProductOptionList } from "../../services/productOptionService";
import { fetchProductOptionValueList } from "../../services/productOptionValueService";

const StockManager = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [optionValueMap, setOptionValueMap] = useState({});
  const [combinations, setCombinations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedCombinationId, setSelectedCombinationId] = useState("");
  const [currentStock, setCurrentStock] = useState(null);
  const [delta, setDelta] = useState("");
  const [movementType, setMovementType] = useState("ajout"); // "ajout" or "retrait"
  const [logEntries, setLogEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCombinations, setLoadingCombinations] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);


  // Hover state track for table rows
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    let isActive = true;

    Promise.all([
      fetchProductList(),
      fetchProductOptionList(),
      fetchProductOptionValueList(),
    ])
      .then(([productsData, optionsData, optionValuesData]) => {
        if (!isActive) return;

        const optMap = {};
        optionsData.forEach((opt) => {
          optMap[opt.id] = opt.name;
        });

        const optValMap = {};
        optionValuesData.forEach((val) => {
          optValMap[val.id] = {
            name: val.name,
            optionName: optMap[val.id_product_option] || "",
          };
        });

        setProducts(productsData);
        setOptionValueMap(optValMap);
        setLoading(false);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err);
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setCombinations([]);
      setSelectedCombinationId("");
      setCurrentStock(null);
      return;
    }

    setError(null);
    setLoadingCombinations(true);

    fetchCombinationsByProduct(selectedId)
      .then((combs) => {
        setCombinations(combs);
        if (combs.length > 0) {
          setSelectedCombinationId(combs[0].id);
        } else {
          setSelectedCombinationId("0");
        }
        setLoadingCombinations(false);
      })
      .catch((err) => {
        setError(err);
        setCombinations([]);
        setSelectedCombinationId("0");
        setLoadingCombinations(false);
      });
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || selectedCombinationId === "") {
      setCurrentStock(null);
      setLogEntries([]);
      return;
    }

    setError(null);
    Promise.all([
      fetchStockAvailable(selectedId, selectedCombinationId),
      getAllStockMovementsByProduct(selectedId, selectedCombinationId),
    ])
      .then(([stock, mvts]) => {
        setCurrentStock(stock);
        setLogEntries(mvts);
      })
      .catch((err) => setError(err));
  }, [selectedId, selectedCombinationId]);

  const dailyRows = useMemo(() => {
    if (!selectedId) return [];

    const rows = {};
    logEntries.forEach((entry) => {
      if (!rows[entry.date]) {
        rows[entry.date] = {
          date: entry.date,
          totalDelta: 0,
          lastQuantity: entry.quantityAfter,
          moves: 0,
        };
      }
      rows[entry.date].totalDelta += entry.delta;
      rows[entry.date].lastQuantity = entry.quantityAfter;
      rows[entry.date].moves += 1;
    });

    return Object.values(rows).sort((a, b) => a.date.localeCompare(b.date));
  }, [logEntries, selectedId]);

  const getCombinationLabel = (comb) => {
    if (!comb) return "";
    const detailParts = (comb.option_value_ids || [])
      .map((id) => {
        const val = optionValueMap[id];
        return val ? `${val.optionName}: ${val.name}` : `ID ${id}`;
      })
      .filter(Boolean);

    const details =
      detailParts.length > 0 ? ` (${detailParts.join(", ")})` : "";
    return `${comb.reference || "Combinaison #" + comb.id}${details}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess(null);
    setError(null);

    const parsedDeltaVal = Number(delta);
    if (!selectedId || Number.isNaN(parsedDeltaVal) || parsedDeltaVal <= 0) {
      setError(new Error("Veuillez saisir une quantite positive."));
      return;
    }

    const finalDelta = movementType === "ajout" ? parsedDeltaVal : -parsedDeltaVal;
    const attributeId = Number(selectedCombinationId || 0);

    setUpdating(true);
    try {
      const updated = await applyStockDelta(
        selectedId,
        attributeId,
        finalDelta
      );
      setCurrentStock(updated);

      const mvts = await getAllStockMovementsByProduct(selectedId, selectedCombinationId);
      setLogEntries(mvts);
      setDelta("");
      setSuccess("Stock mis a jour avec succes.");
    } catch (err) {
      setError(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Chargement des produits...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <div style={styles.pageContent}>
        <div style={styles.headerSection}>
          <h1 style={styles.title}>Gestion du stock</h1>
          <p style={styles.subtitle}>Ajustez les stocks et suivez l'évolution journalière de vos produits en temps réel.</p>
        </div>

        {error && (
          <div style={{ ...styles.alert, ...styles.alertError }}>
            <span style={{ fontSize: "1.25rem" }}>⚠️</span>
            <span>Erreur : {error.message}</span>
          </div>
        )}
        {success && (
          <div style={{ ...styles.alert, ...styles.alertSuccess }}>
            <span style={{ fontSize: "1.25rem" }}>✨</span>
            <span>{success}</span>
          </div>
        )}

        <div style={styles.grid}>
          {/* Form Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Mouvement de Stock</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Produit</label>
                <select
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  style={styles.select}
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.nom || "Sans nom"} (#{product.id})
                    </option>
                  ))}
                </select>
              </div>

              {loadingCombinations && (
                <div style={{ ...styles.formGroup, color: "var(--accent)", fontStyle: "italic", fontSize: "0.9rem" }}>
                  Chargement des déclinaisons...
                </div>
              )}

              {!loadingCombinations && combinations.length > 0 && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Déclinaison</label>
                  <select
                    value={selectedCombinationId}
                    onChange={(event) =>
                      setSelectedCombinationId(event.target.value)
                    }
                    style={styles.select}
                  >
                    {combinations.map((comb) => (
                      <option key={comb.id} value={comb.id}>
                        {getCombinationLabel(comb)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedId && selectedCombinationId !== "" && (
                <div style={styles.stockBadgeContainer}>
                  <span style={styles.stockBadgeLabel}>Stock actuel disponible :</span>
                  <span style={styles.stockBadgeValue}>
                    {currentStock !== null ? currentStock.quantity : "..."}
                  </span>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Type de mouvement</label>
                <select
                  value={movementType}
                  onChange={(event) => setMovementType(event.target.value)}
                  style={styles.select}
                >
                  <option value="ajout">Ajouter (+)</option>
                  <option value="retrait">Retirer (-)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Quantité</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Ex: 10"
                  value={delta}
                  onChange={(event) => setDelta(event.target.value)}
                  style={styles.input}
                  disabled={!selectedId}
                />
              </div>

              <button
                type="submit"
                style={{
                  ...styles.button,
                  ...((updating || !selectedId || selectedCombinationId === "") ? styles.buttonDisabled : {})
                }}
                disabled={updating || !selectedId || selectedCombinationId === ""}
              >
                {updating ? (
                  <>
                    <span style={styles.spinnerSmall}></span>
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Enregistrer le mouvement
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Evolution Table Card */}
          <div style={{ ...styles.card, ...styles.tableCard }}>
            <h2 style={styles.cardTitle}>Évolution Journalière</h2>

            {!selectedId && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📊</span>
                <h3>Sélectionnez un produit</h3>
                <p>Choisissez un produit et une déclinaison pour visualiser l'historique de ses mouvements de stock.</p>
              </div>
            )}

            {selectedId && dailyRows.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📦</span>
                <h3>Aucun mouvement enregistré</h3>
                <p>Aucun mouvement de stock n'a été enregistré pour ce produit ou cette déclinaison.</p>
              </div>
            )}

            {selectedId && dailyRows.length > 0 && (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Variation Totale</th>
                      <th style={styles.th}>Nb Mouvements</th>
                      <th style={styles.th}>Stock Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows.map((row, idx) => (
                      <tr
                        key={row.date}
                        style={{
                          ...styles.tr,
                          ...(hoveredRow === idx ? styles.trHover : {})
                        }}
                        onMouseEnter={() => setHoveredRow(idx)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td style={{ ...styles.td, fontWeight: "600", color: "var(--text-h)" }}>{row.date}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            ...(row.totalDelta >= 0 ? styles.badgeSuccess : styles.badgeDanger)
                          }}>
                            {row.totalDelta >= 0 ? `+${row.totalDelta}` : row.totalDelta}
                          </span>
                        </td>
                        <td style={styles.td}>{row.moves}</td>
                        <td style={{ ...styles.td, fontWeight: "700", color: "var(--accent)" }}>{row.lastQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "var(--sans)",
    color: "var(--text)",
    backgroundColor: "var(--bg)",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--border)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  navContainer: {
    maxWidth: "1126px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.8rem 1.5rem",
    boxSizing: "border-box",
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "700",
    fontSize: "1.2rem",
    color: "var(--text-h)",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  navLink: {
    textDecoration: "none",
    color: "var(--text)",
    fontSize: "0.9rem",
    fontWeight: "500",
    padding: "6px 12px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  activeNavLink: {
    color: "var(--accent)",
    background: "var(--accent-bg)",
    fontWeight: "600",
  },
  pageContent: {
    maxWidth: "1126px",
    width: "100%",
    margin: "0 auto",
    padding: "2rem 1.5rem",
    boxSizing: "border-box",
  },
  headerSection: {
    marginBottom: "2.5rem",
    textAlign: "left",
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: "700",
    color: "var(--text-h)",
    margin: "0 0 0.5rem 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "1rem",
    color: "var(--text)",
    margin: 0,
    opacity: 0.8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr",
    gap: "2rem",
    alignItems: "start",
  },
  card: {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "2rem",
    boxShadow: "var(--shadow)",
    backdropFilter: "blur(8px)",
    textAlign: "left",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "var(--text-h)",
    margin: "0 0 1.5rem 0",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "0.75rem",
  },
  formGroup: {
    marginBottom: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "var(--text-h)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  select: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--bg)",
    color: "var(--text-h)",
    fontSize: "0.95rem",
    fontFamily: "var(--sans)",
    outline: "none",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--bg)",
    color: "var(--text-h)",
    fontSize: "0.95rem",
    fontFamily: "var(--sans)",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },
  stockBadgeContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem",
    borderRadius: "10px",
    backgroundColor: "var(--accent-bg)",
    border: "1px solid var(--accent-border)",
    margin: "1.5rem 0",
  },
  stockBadgeLabel: {
    fontSize: "0.95rem",
    fontWeight: "500",
    color: "var(--text-h)",
  },
  stockBadgeValue: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "var(--accent)",
  },
  button: {
    width: "100%",
    padding: "0.85rem 1.5rem",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "var(--accent)",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px var(--accent-bg)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
  },
  buttonDisabled: {
    backgroundColor: "var(--border)",
    color: "var(--text)",
    cursor: "not-allowed",
    boxShadow: "none",
    opacity: 0.6,
  },
  alert: {
    padding: "1rem 1.25rem",
    borderRadius: "10px",
    marginBottom: "1.5rem",
    fontSize: "0.9rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  alertSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#10b981",
  },
  alertError: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
  },
  tableCard: {
    minHeight: "350px",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "10px",
    border: "1px solid var(--border)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.95rem",
    textAlign: "left",
  },
  th: {
    padding: "1rem 1.25rem",
    backgroundColor: "var(--code-bg)",
    color: "var(--text-h)",
    fontWeight: "600",
    borderBottom: "1px solid var(--border)",
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  td: {
    padding: "1rem 1.25rem",
    borderBottom: "1px solid var(--border)",
    color: "var(--text)",
  },
  tr: {
    transition: "background-color 0.2s ease",
  },
  trHover: {
    backgroundColor: "var(--accent-bg)",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 2rem",
    color: "var(--text)",
    opacity: 0.7,
    gap: "1rem",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "3.5rem",
  },
  badge: {
    display: "inline-block",
    padding: "0.25rem 0.6rem",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  badgeSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    color: "#10b981",
  },
  badgeDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    color: "var(--text)",
    gap: "1rem",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid var(--border)",
    borderTop: "4px solid var(--accent)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  spinnerSmall: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    display: "inline-block",
  },
};

export default StockManager;
