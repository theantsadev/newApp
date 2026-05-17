import {
  getStoredCart,
  setStoredCart,
  clearStoredCart,
} from "../../services/cartService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredCustomer } from "../../shared/customerAuthStorage";

const Panier = () => {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const navigate = useNavigate();

  const getItemKey = (item) => `${item.id_product}_${item.id_product_attribute}`;

  useEffect(() => {
    setCustomer(getStoredCustomer());
    const storedCart = getStoredCart();
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  // Helper : mettre à jour state + localStorage en même temps
  const updateCart = (newCart) => {
    setCart(newCart);
    setStoredCart(JSON.stringify(newCart));
  };

  const removeItem = (item) => {
    const newCart = cart.filter((obj) => getItemKey(obj) !== getItemKey(item));
    updateCart(newCart);
  };

  const increaseItemQuantity = (item) => {
    const newCart = cart.map((obj) =>
      getItemKey(obj) === getItemKey(item)
        ? { ...obj, quantity: Number(obj.quantity) + 1 }
        : obj,
    );
    updateCart(newCart);
  };

  const decreaseItemQuantity = (item) => {
    const found = cart.find((obj) => getItemKey(obj) === getItemKey(item));
    if (!found) return;

    if (Number(found.quantity) <= 1) {
      removeItem(item);
      return;
    }

    const newCart = cart.map((obj) =>
      getItemKey(obj) === getItemKey(item)
        ? { ...obj, quantity: Number(obj.quantity) - 1 }
        : obj,
    );
    updateCart(newCart);
  };

  const totalsByTax = cart.reduce((acc, item) => {
    const tax = Number(item.taxRate) || 0;
    const ht = Number(item.prixHT) || (Number(item.prix) / (1 + tax / 100));
    if (!acc[tax]) acc[tax] = 0;
    acc[tax] += ht * Number(item.quantity);
    return acc;
  }, {});

  let totalTtc = 0;
  for (const tax in totalsByTax) {
    totalTtc += totalsByTax[tax] * (1 + Number(tax) / 100);
  }
  const totalPrix = totalTtc.toFixed(2);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Votre Panier</h1>
      
      {cart.length === 0 ? (
        <div style={styles.emptyContainer}>
          <p style={styles.emptyText}>Votre panier est vide pour le moment.</p>
          <button onClick={() => navigate("/frontoffice/produits")} style={styles.shopButton}>
            Continuer mes achats
          </button>
        </div>
      ) : (
        <div style={styles.cartContent}>
          <ul style={styles.list}>
            {cart.map((item) => (
              <li key={getItemKey(item)} style={styles.card}>
                <div style={styles.itemInfo}>
                  <strong style={styles.itemName}>{item.nom}</strong>
                  <span style={styles.itemRef}>Réf: {item.reference || "—"}</span>
                </div>
                
                <div style={styles.itemPrice}>
                  {Number(item.prix).toFixed(2)} EUR
                </div>

                <div style={styles.quantityControls}>
                  <button onClick={() => decreaseItemQuantity(item)} style={styles.qtyBtn}>-</button>
                  <span style={styles.qtyCount}>{item.quantity}</span>
                  <button onClick={() => increaseItemQuantity(item)} style={styles.qtyBtn}>+</button>
                </div>

                <button onClick={() => removeItem(item)} style={styles.removeBtn}>
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
          
          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span>Total :</span>
              <strong style={styles.totalPrice}>{totalPrix} EUR</strong>
            </div>
            
            <div style={styles.actions}>
              <button onClick={() => updateCart([])} style={styles.clearBtn}>
                Vider le panier
              </button>

              {customer?.isAnonymous ? (
                <div style={styles.anonymousWarning}>
                  <p style={styles.warningText}>
                    ⚠️ Vous êtes actuellement en mode <strong>Anonyme</strong>. Un compte client est requis pour passer une commande.
                  </p>
                  <button onClick={() => navigate("/")} style={styles.loginBtn}>
                    Choisir un client pour commander
                  </button>
                </div>
              ) : (
                <button onClick={() => navigate("/frontoffice/commande")} style={styles.checkoutBtn}>
                  Passer la commande
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "1rem 0",
  },
  title: {
    fontSize: "2rem",
    color: "var(--text-h)",
    marginBottom: "1.5rem",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "10px",
  },
  emptyContainer: {
    padding: "3rem 1rem",
    textAlign: "center",
    border: "1px dashed var(--border)",
    borderRadius: "12px",
  },
  emptyText: {
    fontSize: "1.1rem",
    color: "var(--text)",
    marginBottom: "1.5rem",
  },
  shopButton: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  cartContent: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.2rem",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    background: "var(--bg)",
    gap: "1rem",
    flexWrap: "wrap",
  },
  itemInfo: {
    flex: 2,
    display: "flex",
    flexDirection: "column",
    minWidth: "150px",
  },
  itemName: {
    fontSize: "1rem",
    color: "var(--text-h)",
  },
  itemRef: {
    fontSize: "0.8rem",
    color: "var(--text)",
    marginTop: "2px",
  },
  itemPrice: {
    flex: 1,
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "var(--text-h)",
    textAlign: "right",
    minWidth: "80px",
  },
  quantityControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "var(--code-bg)",
    padding: "4px 8px",
    borderRadius: "8px",
  },
  qtyBtn: {
    width: "28px",
    height: "28px",
    background: "#fff",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    fontWeight: "bold",
    color: "var(--text-h)",
  },
  qtyCount: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "var(--text-h)",
    minWidth: "20px",
    textAlign: "center",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#ef4444",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    padding: "4px 8px",
  },
  summaryBox: {
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "1.5rem",
    background: "var(--code-bg)",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "1.1rem",
    color: "var(--text-h)",
    marginBottom: "1.5rem",
  },
  totalPrice: {
    fontSize: "1.4rem",
    color: "var(--accent)",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  clearBtn: {
    background: "transparent",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },
  checkoutBtn: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    padding: "10px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "600",
    boxShadow: "0 4px 6px var(--accent-bg)",
  },
  anonymousWarning: {
    background: "rgba(245, 158, 11, 0.05)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    borderRadius: "10px",
    padding: "1rem",
    flex: "1",
    minWidth: "250px",
    textAlign: "right",
  },
  warningText: {
    fontSize: "0.85rem",
    color: "#d97706",
    lineHeight: "1.5",
    margin: "0 0 12px",
    textAlign: "left",
  },
  loginBtn: {
    background: "#d97706",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
};

export default Panier;
