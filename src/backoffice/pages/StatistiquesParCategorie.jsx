import { useEffect, useState } from "react";
import { fetchCategoryList } from "../../services/categoryService";
import { fetchProductList } from "../../services/productService";
import { fetchOrderList } from "../../services/orderService";
import { fetchStockAvailableList } from "../../services/stockService";

const formatEuro = (value) => {
  return (
    (parseFloat(value) || 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
};

const StatistiquesParCategorie = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States to filter/analyze
  const [selectedStateFilter, setSelectedStateFilter] = useState("all-active"); // "all-active" (2 and 5) or "all" (2, 5, 6, etc)

  useEffect(() => {
    let isActive = true;

    (async () => {
      try {
        const [catData, prodData, orderData, stockData] = await Promise.all([
          fetchCategoryList(),
          fetchProductList(),
          fetchOrderList(),
          fetchStockAvailableList(),
        ]);

        if (!isActive) return;

        setCategories(catData);
        setProducts(prodData);
        setOrders(orderData);
        console.log("Stocks bruts:", stockData);
        setStocks(stockData);
        // Cherche un produit qui a des variantes
        const grouped = {};
        stockData.forEach((s) => {
          if (!grouped[s.productId]) grouped[s.productId] = [];
          grouped[s.productId].push(s);
        });
        const withVariants = Object.entries(grouped).filter(
          ([, arr]) => arr.length > 1,
        );
        console.log(
          "Produits multi-entrées (variantes):",
          withVariants.slice(0, 3),
        );
      } catch (err) {
        if (!isActive) return;
        setError(err);
      } finally {
        if (isActive) setLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  if (loading)
    return (
      <div style={styles.loading}>Chargement des statistiques en cours...</div>
    );
  if (error)
    return (
      <div style={styles.error}>
        Erreur lors du chargement : {error.message}
      </div>
    );

  // 1. Build maps for rapid lookup
  const productMap = {}; // id -> product
  products.forEach((p) => {
    productMap[String(p.id)] = p;
  });

  
  const categoryMap = {}; // id -> categoryName
  categories.forEach((c) => {
    categoryMap[String(c.id)] = c.nom || "Sans nom";
  });

  // Include home/default category or any uncategorized
  categoryMap["1"] = "Accueil / Non classé";

  // 2. Filter orders for financial stats
  // Typically, "ventes" (sales) are paid (2) or delivered (5) orders. Cancelled (6) are not counted. Carts are not orders.
  const financialOrders = orders.filter((o) => {
    const state = String(o.current_state);
    if (selectedStateFilter === "all-active") {
      return state === "2" || state === "11" || state === "5";
    }
    // "all" except carts and invalid
    return state === "2" || state === "11" || state === "5" || state === "6";
  });

  // 3. Compute Financial Stats per Category
  const statsByCategory = {};
  categories.forEach((c) => {
    statsByCategory[String(c.id)] = {
      id: c.id,
      name: c.nom || "Sans nom",
      totalSalesHt: 0,
      totalPurchaseHt: 0,
    };
  });

  financialOrders.forEach((order) => {
    const rows = order.order_rows || [];
    rows.forEach((row) => {
      const prodId = String(row.product_id);
      const product = productMap[prodId];
      const categoryId = product ? String(product.id_category_default) : "1";

      if (!statsByCategory[categoryId]) {
        statsByCategory[categoryId] = {
          id: categoryId,
          name: categoryMap[categoryId] || "Autre",
          totalSalesHt: 0,
          totalPurchaseHt: 0,
        };
      }

      const quantity = row.product_quantity || 0;
      const salesHt = (row.unit_price_tax_excl || 0) * quantity;

      // Wholesale price HT
      const wholesalePrice = product ? parseFloat(product.prix_achat || 0) : 0;
      const purchaseHt = wholesalePrice * quantity;

      statsByCategory[categoryId].totalSalesHt += salesHt;
      statsByCategory[categoryId].totalPurchaseHt += purchaseHt;
    });
  });

  // 4. Compute Stock Quantities per Category
  // Available Quantity: sum of quantity in stocks for products in this category
  // Reserved Quantity: sum of quantity in orders in state 2 (paiement effectué) for products in this category
  // Physical Quantity: Available + Reserved
  const stockByCategory = {};
  categories.forEach((c) => {
    stockByCategory[String(c.id)] = {
      id: c.id,
      name: c.nom || "Sans nom",
      availableQty: 0,
      reservedQty: 0,
      physicalQty: 0,
    };
  });

  // Sum available stocks
  // ✅ Après — construire d'abord un Set des produits qui ont des variantes
  const productsWithVariants = new Set(
    stocks.filter((s) => s.attributeId !== "0").map((s) => s.productId),
  );

  stocks.forEach((s) => {
    // Si ce produit a des variantes, ignorer la ligne agrégée (attributeId "0")
    if (s.attributeId === "0" && productsWithVariants.has(s.productId)) return;

    const prodId = String(s.productId);
    const product = productMap[prodId];
    const categoryId = product ? String(product.id_category_default) : "1";

    if (!stockByCategory[categoryId]) {
      stockByCategory[categoryId] = {
        id: categoryId,
        name: categoryMap[categoryId] || "Autre",
        availableQty: 0,
        reservedQty: 0,
        physicalQty: 0,
      };
    }
    stockByCategory[categoryId].availableQty += s.quantity || 0;
  });

  // Sum reserved stocks (from orders with state = 2)
  const reservedOrders = orders.filter(
    (o) => String(o.current_state) === "2" || String(o.current_state) === "11",
  );
  reservedOrders.forEach((order) => {
    const rows = order.order_rows || [];
    rows.forEach((row) => {
      const prodId = String(row.product_id);
      const product = productMap[prodId];
      const categoryId = product ? String(product.id_category_default) : "1";

      if (!stockByCategory[categoryId]) {
        stockByCategory[categoryId] = {
          id: categoryId,
          name: categoryMap[categoryId] || "Autre",
          availableQty: 0,
          reservedQty: 0,
          physicalQty: 0,
        };
      }
      stockByCategory[categoryId].reservedQty += row.product_quantity || 0;
    });
  });

  // Calculate physical stock for each category
  Object.keys(stockByCategory).forEach((catId) => {
    const cat = stockByCategory[catId];
    cat.physicalQty = cat.availableQty + cat.reservedQty;
  });

  // Financial Grand Totals
  let grandTotalSalesHt = 0;
  let grandTotalPurchaseHt = 0;
  Object.values(statsByCategory).forEach((c) => {
    grandTotalSalesHt += c.totalSalesHt;
    grandTotalPurchaseHt += c.totalPurchaseHt;
  });
  const grandTotalBenefit = grandTotalSalesHt - grandTotalPurchaseHt;

  // Stock Grand Totals
  let grandTotalPhysical = 0;
  let grandTotalReserved = 0;
  let grandTotalAvailable = 0;
  Object.values(stockByCategory).forEach((c) => {
    grandTotalPhysical += c.physicalQty;
    grandTotalReserved += c.reservedQty;
    grandTotalAvailable += c.availableQty;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Statistiques par Catégorie</h1>
          <p style={styles.subtitle}>
            Analyse financière et état des stocks consolidés par catégorie de
            produit.
          </p>
        </div>
        <div style={styles.filterContainer}>
          <label style={styles.filterLabel} htmlFor="state-filter">
            Période financière :
          </label>
          <select
            id="state-filter"
            style={styles.select}
            value={selectedStateFilter}
            onChange={(e) => setSelectedStateFilter(e.target.value)}
          >
            <option value="all-active">
              Payées & Livrées (États 2 ,11 , 5)
            </option>
            <option value="all">Toutes avec Annulées (États 2,11, 5 ,6)</option>
          </select>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div style={styles.cardGrid}>
        <div style={{ ...styles.card, borderLeft: "5px solid #22c55e" }}>
          <p style={styles.cardLabel}>Ventes Totales (HT)</p>
          <p style={{ ...styles.cardValue, color: "#16a34a" }}>
            {formatEuro(grandTotalSalesHt)}
          </p>
        </div>
        <div style={{ ...styles.card, borderLeft: "5px solid #f97316" }}>
          <p style={styles.cardLabel}>Coût d'Achat Total (HT)</p>
          <p style={{ ...styles.cardValue, color: "#ea580c" }}>
            {formatEuro(grandTotalPurchaseHt)}
          </p>
        </div>
        <div style={{ ...styles.card, borderLeft: "5px solid #3b82f6" }}>
          <p style={styles.cardLabel}>Bénéfice Total (HT)</p>
          <p style={{ ...styles.cardValue, color: "#2563eb" }}>
            {formatEuro(grandTotalBenefit)}
          </p>
        </div>
      </div>

      {/* Section 1: Financial Table */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>💰 Analyse Financière par Catégorie</h2>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Catégorie</th>
                <th style={styles.thRight}>Total Ventes (HT)</th>
                <th style={styles.thRight}>Total Achats (HT)</th>
                <th style={styles.thRight}>Bénéfice (HT)</th>
                <th style={styles.thRight}>Marge bénéficiaire</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(statsByCategory).map((item) => {
                const benefit = item.totalSalesHt - item.totalPurchaseHt;
                const margin =
                  item.totalSalesHt > 0
                    ? (benefit / item.totalSalesHt) * 100
                    : 0;
                return (
                  <tr key={item.id} style={styles.row}>
                    <td style={styles.tdCategory}>{item.name}</td>
                    <td style={styles.tdRight}>
                      {formatEuro(item.totalSalesHt)}
                    </td>
                    <td style={styles.tdRight}>
                      {formatEuro(item.totalPurchaseHt)}
                    </td>
                    <td
                      style={{
                        ...styles.tdRightBold,
                        color: benefit >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {formatEuro(benefit)}
                    </td>
                    <td
                      style={{
                        ...styles.tdRight,
                        fontWeight: "500",
                        color: benefit >= 0 ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {item.totalSalesHt > 0 ? `${margin.toFixed(1)} %` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={styles.footerRow}>
                <td style={styles.tdFooter}>Total général</td>
                <td style={styles.tdFooterRight}>
                  {formatEuro(grandTotalSalesHt)}
                </td>
                <td style={styles.tdFooterRight}>
                  {formatEuro(grandTotalPurchaseHt)}
                </td>
                <td
                  style={{
                    ...styles.tdFooterRight,
                    color: grandTotalBenefit >= 0 ? "#15803d" : "#b91c1c",
                  }}
                >
                  {formatEuro(grandTotalBenefit)}
                </td>
                <td style={styles.tdFooterRight}>
                  {grandTotalSalesHt > 0
                    ? `${((grandTotalBenefit / grandTotalSalesHt) * 100).toFixed(1)} %`
                    : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Section 2: Stock Quantities Table */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📦 État des Stocks par Catégorie</h2>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Catégorie</th>
                <th style={styles.thRight}>Qté Physique</th>
                <th style={styles.thRight}>Qté Réservée</th>
                <th style={styles.thRight}>Qté Disponible</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(stockByCategory).map((item) => (
                <tr key={item.id} style={styles.row}>
                  <td style={styles.tdCategory}>{item.name}</td>
                  <td
                    style={{
                      ...styles.tdRight,
                      fontWeight: "600",
                      color: "#334155",
                    }}
                  >
                    {item.physicalQty} units
                  </td>
                  <td
                    style={{
                      ...styles.tdRight,
                      color: "#f59e0b",
                      fontWeight: "600",
                    }}
                  >
                    {item.reservedQty} units
                  </td>
                  <td
                    style={{
                      ...styles.tdRight,
                      color: item.availableQty > 0 ? "#10b981" : "#ef4444",
                      fontWeight: "700",
                    }}
                  >
                    {item.availableQty} units
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={styles.footerRow}>
                <td style={styles.tdFooter}>Total général</td>
                <td style={styles.tdFooterRight}>{grandTotalPhysical} units</td>
                <td style={styles.tdFooterRight}>{grandTotalReserved} units</td>
                <td style={{ ...styles.tdFooterRight, fontWeight: "700" }}>
                  {grandTotalAvailable} units
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "2.5rem",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
    color: "#1e293b",
    backgroundColor: "#fafcff",
    borderRadius: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2.5rem",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1.5rem",
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 0.5rem 0",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    margin: 0,
  },
  filterContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  filterLabel: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#475569",
  },
  select: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#1e293b",
    outline: "none",
    cursor: "pointer",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    transition: "border-color 0.2s",
  },
  loading: {
    padding: "6rem 2rem",
    textAlign: "center",
    fontSize: "1.25rem",
    fontWeight: "500",
    color: "#64748b",
  },
  error: {
    padding: "2rem",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    borderRadius: "12px",
    border: "1px solid #fee2e2",
    margin: "2rem auto",
    maxWidth: "600px",
    textAlign: "center",
    fontWeight: "500",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginBottom: "3rem",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "1.75rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02)",
    border: "1px solid #f1f5f9",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  cardLabel: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: "0 0 0.5rem 0",
  },
  cardValue: {
    fontSize: "1.85rem",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.03em",
  },
  section: {
    marginBottom: "3.5rem",
  },
  sectionTitle: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "1.25rem",
    letterSpacing: "-0.01em",
  },
  tableWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow:
      "0 4px 20px -2px rgba(0,0,0,0.04), 0 2px 6px -1px rgba(0,0,0,0.02)",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.95rem",
  },
  th: {
    textAlign: "left",
    padding: "1.1rem 1.5rem",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontWeight: "600",
    borderBottom: "2px solid #e2e8f0",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  thRight: {
    textAlign: "right",
    padding: "1.1rem 1.5rem",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontWeight: "600",
    borderBottom: "2px solid #e2e8f0",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  row: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#f8fafc",
    },
  },
  tdCategory: {
    padding: "1.1rem 1.5rem",
    fontWeight: "600",
    color: "#1e293b",
  },
  tdRight: {
    padding: "1.1rem 1.5rem",
    textAlign: "right",
    color: "#475569",
  },
  tdRightBold: {
    padding: "1.1rem 1.5rem",
    textAlign: "right",
    fontWeight: "700",
  },
  footerRow: {
    backgroundColor: "#f8fafc",
    borderTop: "2.5px solid #e2e8f0",
  },
  tdFooter: {
    padding: "1.2rem 1.5rem",
    fontWeight: "700",
    color: "#0f172a",
    fontSize: "0.95rem",
  },
  tdFooterRight: {
    padding: "1.2rem 1.5rem",
    textAlign: "right",
    fontWeight: "700",
    color: "#0f172a",
    fontSize: "0.95rem",
  },
};

export default StatistiquesParCategorie;
