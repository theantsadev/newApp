import { useState, useEffect, useMemo } from "react";
import { applyStockDelta, fetchStockAvailableList } from "../../services/stockService";
import { fetchCategoryList } from "../../services/categoryService";
import { fetchProductList } from "../../services/productService";
import { fetchAllCombinations } from "../../services/combinationService";

const normalizeAttributeId = (value) => {
  if (value === null || value === undefined) return "0";
  const str = String(value).trim();
  return str === "" || str === "0" ? "0" : str;
};

const APPLY_CONCURRENCY = 8;

const runWithConcurrency = async (items, limit, worker) => {
  if (!items.length) return;
  let nextIndex = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      await worker(items[current], current);
    }
  });
  await Promise.all(workers);
};

const buildStockEntries = ({
  stocks,
  productById,
  productHasCombi,
  allowedProductIds,
}) => {
  const entries = [];
  const seenKeys = new Set();

  for (const s of stocks) {
    const prodId = String(s.productId);
    if (allowedProductIds && !allowedProductIds.has(prodId)) {
      continue;
    }

    const attributeId = normalizeAttributeId(s.attributeId);
    const hasCombination = attributeId !== "0" && attributeId !== "";

    if (!hasCombination && productHasCombi[prodId]) {
      continue;
    }

    const product = productById[prodId];
    const categoryId = product ? String(product.id_category_default) : "1";
    const key = `${prodId};${attributeId};${categoryId}`;
    if (seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);

    entries.push({
      productId: prodId,
      attributeId,
      categoryId,
      qtyDispo: Number(s.quantity),
    });
  }

  return entries;
};

const buildStatsFromEntries = ({
  entries,
  categoryNameById,
  quantity,
  stockLimit,
  direction,
}) => {
  const mapByKey = {};
  const stockByCat = {};
  Object.entries(categoryNameById).forEach(([categoryId, name]) => {
    stockByCat[categoryId] = {
      id: categoryId,
      name,
      expectedQty: 0,
      realQty: 0,
    };
  });

  for (const entry of entries) {
    let realQty = quantity;

    if (direction === "add") {
      realQty = Math.min(quantity, stockLimit - entry.qtyDispo);
    } else {
      realQty = Math.min(quantity, entry.qtyDispo);
    }

    if (realQty < 0) {
      realQty = 0;
    }

    const key = `${entry.productId};${entry.attributeId};${entry.categoryId}`;
    mapByKey[key] = { expectedQty: quantity, realQty };

    if (!stockByCat[entry.categoryId]) {
      stockByCat[entry.categoryId] = {
        id: entry.categoryId,
        name: categoryNameById[entry.categoryId] || "Autre",
        expectedQty: 0,
        realQty: 0,
      };
    }

    stockByCat[entry.categoryId].expectedQty += quantity;
    stockByCat[entry.categoryId].realQty += realQty;
  }

  return { mapByKey, stockByCat };
};

const LoginStock = ({ canOpenPopup, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categorieAdd, setCategorieAdd] = useState("");
  const [categorieRemove, setCategorieRemove] = useState("");
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [stockLimit, setStockLimit] = useState(0);
  const [quantityAdd, setQuantityAdd] = useState(1);
  const [quantityRemove, setQuantityRemove] = useState(1);
  const [stockByCategoryAdd, setStockByCategoryAdd] = useState(null);
  const [stockByCategoryRemove, setStockByCategoryRemove] = useState(null);
  // FIX 1 : combinationMap est maintenant dans le state
  const [combinationMap, setCombinationMap] = useState({});
  const [mapAddReal, setMapAddReal] = useState({});
  const [mapRemoveReal, setMapRemoveReal] = useState({});

  const productById = useMemo(() => {
    const map = {};
    for (const p of products) {
      map[String(p.id)] = p;
    }
    return map;
  }, [products]);

  const categoryNameById = useMemo(() => {
    const map = {};
    for (const c of categories) {
      map[String(c.id)] = c.nom || "Sans nom";
    }
    return map;
  }, [categories]);

  const productIdsByCategory = useMemo(() => {
    const map = {};
    for (const p of products) {
      const categoryId = String(p.id_category_default ?? "1");
      if (!map[categoryId]) {
        map[categoryId] = new Set();
      }
      map[categoryId].add(String(p.id));
    }
    return map;
  }, [products]);

  const productHasCombi = useMemo(() => {
    const map = {};
    for (const s of stocks) {
      const prodId = String(s.productId);
      const attr = normalizeAttributeId(s.attributeId);
      if (attr !== "0" && attr !== "") {
        map[prodId] = true;
      }
    }
    return map;
  }, [stocks]);

  const handleFilterRemove = (event) => {
    setCategorieRemove(event.target.value);
  };

  const handleFilterAdd = (event) => {
    setCategorieAdd(event.target.value);
  };

  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const [catData, prodData, stockData, combinationData] = await Promise.all([
          fetchCategoryList(),
          fetchProductList(),
          fetchStockAvailableList(),
          fetchAllCombinations(),
        ]);
        if (!isActive) return;
        setCategories(catData);
        setProducts(prodData);
        setStocks(stockData);
        // FIX 1 : on sauvegarde bien combinationMap dans le state
        setCombinationMap(combinationData);
      } catch (err) {
        if (!isActive) return;
        setError(err);
      } finally {
        if (isActive) setLoading(false);
      }
    })();
    return () => { isActive = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidating(true);

    try {
      const entryCache = new Map();
      const getEntriesForCategory = (categoryId) => {
        if (!categoryId) return [];
        if (entryCache.has(categoryId)) {
          return entryCache.get(categoryId);
        }
        const allowedProductIds = productIdsByCategory[categoryId] ?? new Set();
        if (allowedProductIds.size === 0) {
          entryCache.set(categoryId, []);
          return [];
        }
        const entries = buildStockEntries({
          stocks,
          productById,
          productHasCombi,
          allowedProductIds,
        });
        entryCache.set(categoryId, entries);
        return entries;
      };

      const applyDeltas = async (mapByKey, categoryId, sign) => {
        if (!categoryId) return {};
        const result = {};
        const tasks = [];
        for (const [key, value] of Object.entries(mapByKey)) {
          const [productId, attributeId, entryCategoryId] = key.split(";");
          if (entryCategoryId !== categoryId) {
            continue;
          }
          result[key] = { realQty: value.realQty, expectedQty: value.expectedQty };
          if (value.realQty > 0) {
            tasks.push({
              productId,
              attributeId,
              delta: sign * value.realQty,
            });
          }
        }

        await runWithConcurrency(tasks, APPLY_CONCURRENCY, (task) =>
          applyStockDelta(task.productId, Number(task.attributeId), task.delta)
        );

        return result;
      };

      let addStats = null;
      let add = {};
      if (categorieAdd) {
        const addEntries = getEntriesForCategory(categorieAdd);
        addStats = buildStatsFromEntries({
          entries: addEntries,
          categoryNameById,
          quantity: quantityAdd,
          stockLimit,
          direction: "add",
        });
        add = await applyDeltas(addStats.mapByKey, categorieAdd, 1);
      }

      let removeStats = null;
      let remove = {};
      if (categorieRemove) {
        const removeEntries = getEntriesForCategory(categorieRemove);
        removeStats = buildStatsFromEntries({
          entries: removeEntries,
          categoryNameById,
          quantity: quantityRemove,
          stockLimit,
          direction: "remove",
        });
        remove = await applyDeltas(removeStats.mapByKey, categorieRemove, -1);
      }

      setStockByCategoryAdd(categorieAdd ? addStats?.stockByCat[categorieAdd] ?? null : null);
      setMapAddReal(add);

      setStockByCategoryRemove(categorieRemove ? removeStats?.stockByCat[categorieRemove] ?? null : null);
      setMapRemoveReal(remove);

    } catch (err) {
      setError(err);
    } finally {
      setValidating(false);
    }
  };

  if (!canOpenPopup) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "1.5rem",
          minWidth: "500px",
          maxWidth: "90vw",
          maxHeight: "80vh",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          overflowY: "auto",
        }}
      >
        {loading ? (
          <div>Chargement des statistiques en cours...</div>
        ) : error ? (
          <div style={{ color: "#c00" }}>
            Erreur lors du chargement : {error.message}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="categorieAdd">Catégorie Add</label>
            <select
              id="categorieAdd"
              name="categorieAdd"
              value={categorieAdd}
              onChange={handleFilterAdd}
              style={{
                display: "block",
                width: "100%",
                margin: "0.5rem 0 1rem",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              {/* FIX 6 : option vide pour "toutes les catégories" */}
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nom}
                </option>
              ))}
            </select>

            <label htmlFor="stockLimit">Limite de stock</label>
            <input
              id="stockLimit"
              name="stockLimit"
              type="number"
              value={stockLimit}
              onChange={(e) => setStockLimit(Number(e.target.value))}
              style={{
                display: "block",
                width: "100%",
                margin: "0.5rem 0 1rem",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />

            <label htmlFor="quantityAdd">Quantité Add</label>
            <input
              id="quantityAdd"
              name="quantityAdd"
              type="number"
              min="1"
              value={quantityAdd}
              onChange={(e) => setQuantityAdd(Number(e.target.value))}
              style={{
                display: "block",
                width: "100%",
                margin: "0.5rem 0 1rem",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />

            <label htmlFor="categorieRemove">Catégorie Remove</label>
            <select
              id="categorieRemove"
              name="categorieRemove"
              value={categorieRemove}
              onChange={handleFilterRemove}
              style={{
                display: "block",
                width: "100%",
                margin: "0.5rem 0 1rem",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              {/* FIX 6 : option vide pour "toutes les catégories" */}
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nom}
                </option>
              ))}
            </select>

            <label htmlFor="quantityRemove">Quantité Remove</label>
            <input
              id="quantityRemove"
              name="quantityRemove"
              type="number"
              min="1"
              value={quantityRemove}
              onChange={(e) => setQuantityRemove(Number(e.target.value))}
              style={{
                display: "block",
                width: "100%",
                margin: "0.5rem 0 1rem",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />

            {stockByCategoryAdd && (
              <div style={{ marginBottom: "1rem" }}>
                <h3>Résultat par catégorie Add</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                      <th style={thStyle}>Catégorie</th>
                      <th style={thStyle}>Qté attendue</th>
                      <th style={thStyle}>Qté réelle</th>
                      <th style={thStyle}>Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={tdStyle}>{stockByCategoryAdd.name}</td>
                      <td style={tdStyle}>{stockByCategoryAdd.expectedQty}</td>
                      <td style={tdStyle}>{stockByCategoryAdd.realQty}</td>
                      <td style={{
                        ...tdStyle,
                        color: stockByCategoryAdd.expectedQty - stockByCategoryAdd.realQty > 0 ? "#c00" : "#080",
                        fontWeight: "600",
                      }}>
                        {stockByCategoryAdd.expectedQty - stockByCategoryAdd.realQty}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {Object.keys(mapAddReal).length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h3>Résultat par produit Add</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                      <th style={thStyle}>Produit</th>
                      <th style={thStyle}>Qté attendue</th>
                      <th style={thStyle}>Qté réelle</th>
                      <th style={thStyle}>Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* FIX 2 + 3 + 4 : destructuring correct, return, key */}
                    {Object.entries(mapAddReal).map(([key, value]) => {
                      const [productId, attributeId] = key.split(";");
                      const ref = combinationMap[attributeId] ?? productById[productId]?.reference ?? "Inconnu";
                      return (
                        <tr key={key}>
                          <td style={tdStyle}>{ref}</td>
                          <td style={tdStyle}>{value.expectedQty}</td>
                          <td style={tdStyle}>{value.realQty}</td>
                          <td style={{
                            ...tdStyle,
                            color: value.expectedQty - value.realQty > 0 ? "#c00" : "#080",
                            fontWeight: "600",
                          }}>
                            {value.expectedQty - value.realQty}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {stockByCategoryRemove && (
              <div style={{ marginBottom: "1rem" }}>
                <h3>Résultat par catégorie Remove</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                      <th style={thStyle}>Catégorie</th>
                      <th style={thStyle}>Qté attendue</th>
                      <th style={thStyle}>Qté réelle</th>
                      <th style={thStyle}>Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={tdStyle}>{stockByCategoryRemove.name}</td>
                      <td style={tdStyle}>{stockByCategoryRemove.expectedQty}</td>
                      <td style={tdStyle}>{stockByCategoryRemove.realQty}</td>
                      <td style={{
                        ...tdStyle,
                        color: stockByCategoryRemove.expectedQty - stockByCategoryRemove.realQty > 0 ? "#c00" : "#080",
                        fontWeight: "600",
                      }}>
                        {stockByCategoryRemove.expectedQty - stockByCategoryRemove.realQty}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {Object.keys(mapRemoveReal).length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                {/* FIX 5 : titre corrigé Remove */}
                <h3>Résultat par produit Remove</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                      <th style={thStyle}>Produit</th>
                      <th style={thStyle}>Qté attendue</th>
                      <th style={thStyle}>Qté réelle</th>
                      <th style={thStyle}>Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* FIX 2 + 3 + 4 : destructuring correct, return, key */}
                    {Object.entries(mapRemoveReal).map(([key, value]) => {
                      const [productId, attributeId] = key.split(";");
                      const ref = combinationMap[attributeId] ?? productById[productId]?.reference ?? "Inconnu";
                      return (
                        <tr key={key}>
                          <td style={tdStyle}>{ref}</td>
                          <td style={tdStyle}>{value.expectedQty}</td>
                          <td style={tdStyle}>{value.realQty}</td>
                          <td style={{
                            ...tdStyle,
                            color: value.expectedQty - value.realQty > 0 ? "#c00" : "#080",
                            fontWeight: "600",
                          }}>
                            {value.expectedQty - value.realQty}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={validating}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={validating}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  border: "none",
                  background: "#007bff",
                  color: "#fff",
                  cursor: validating ? "not-allowed" : "pointer",
                }}
              >
                {validating ? "Validation..." : "Valider"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const thStyle = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #ddd",
  textAlign: "left",
};

const tdStyle = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #ddd",
};

export default LoginStock;