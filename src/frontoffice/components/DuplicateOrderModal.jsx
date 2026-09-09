import { useState, useEffect } from "react";
import { fetchStockAvailable } from "../../services/stockService";

const DuplicateOrderModal = ({
  selectedOrder,
  quantity,
  onQuantityChange,
  onClose,
  onConfirm,
  enrichedCart,
}) => {
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [validating,setValidating] = useState(false);
  const [error, setError] = useState(null);

  // Charger les stocks pour chaque item
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);
        const stockMap = {};

        for (const item of enrichedCart) {
          const stock = await fetchStockAvailable(
            item.productId,
            item.attributeId
          );
          stockMap[`${item.productId}-${item.attributeId}`] = stock?.quantity ?? 0;
        }

        setStocks(stockMap);
      } catch (err) {
        setError(`Erreur lors du chargement des stocks : ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (enrichedCart && enrichedCart.length > 0) {
      fetchStocks();
    }
  }, [enrichedCart]);

  // Vérifier si tous les items ont suffisamment de stock
  const hasStockIssues = enrichedCart.some((item) => {
    const key = `${item.productId}-${item.attributeId}`;
    const availableStock = stocks[key] || 0;
    const requiredStock = item.quantity * quantity;
    return requiredStock > availableStock;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasStockIssues) {
      setValidating(true);
      await onConfirm();
      setValidating(false)
    }
  };

  if (!selectedOrder) return null;

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
      disabled={validating}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "1.5rem",
          minWidth: "400px",
          maxWidth: "90vw",
          maxHeight: "80vh",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          overflowY: "auto",
        }}
      >
        <h2>Dupliquer la commande #{selectedOrder.id}</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="quantity">Quantité</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            style={{
              display: "block",
              width: "100%",
              margin: "0.5rem 0 1rem",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />

          <h3>Articles</h3>
          {loading ? (
            <p>Chargement des stocks...</p>
          ) : error ? (
            <div
              style={{
                background: "#fee",
                border: "1px solid #fcc",
                color: "#c00",
                padding: "1rem",
                borderRadius: "4px",
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          ) : (
            <div style={{ marginBottom: "1rem" }}>
              {enrichedCart.map((item) => {
                const key = `${item.productId}-${item.attributeId}`;
                const availableStock = stocks[key] || 0;
                const requiredStock = item.quantity * quantity;
                const isInsufficient = requiredStock > availableStock;

                return (
                  <div
                    key={key}
                    style={{
                      border: isInsufficient ? "2px solid #f00" : "1px solid #ddd",
                      borderRadius: "4px",
                      padding: "0.75rem",
                      marginBottom: "0.75rem",
                      backgroundColor: isInsufficient ? "#fee" : "#f9f9f9",
                    }}
                  >
                    <div style={{ fontWeight: "600" }}>{item.label}</div>
                    <div style={{ fontSize: "0.9rem", color: "#666", margin: "0.5rem 0" }}>
                      Quantité : {item.quantity} × {quantity} = {requiredStock}
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        color: isInsufficient ? "#d00" : "#080",
                      }}
                    >
                      Stock disponible : {availableStock}
                      {isInsufficient && (
                        <span style={{ marginLeft: "0.5rem" }}>
                          ⚠️ Insuffisant ({requiredStock - availableStock} manquants)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasStockIssues && (
            <div
              style={{
                background: "#fee",
                border: "1px solid #fcc",
                color: "#c00",
                padding: "1rem",
                borderRadius: "4px",
                marginBottom: "1rem",
              }}
            >
              ❌ Le stock est insuffisant pour certains articles. Veuillez ajuster la
              quantité.
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
              }}
              disabled={validating}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={hasStockIssues || loading || validating}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                border: "none",
                background: hasStockIssues || loading ? "#ccc" : "#007bff",
                color: "#fff",
                cursor: hasStockIssues || loading ? "not-allowed" : "pointer",
              }}
            >
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DuplicateOrderModal;
