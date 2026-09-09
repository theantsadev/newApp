import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStoredCart,
  clearStoredCart,
  calculateCartTotals,
} from "../../services/cartService";
import { getStoredCustomer } from "../../shared/customerAuthStorage";
import { fetchAddressesByCustomerId } from "../../services/addressService";
import { processOrderCreation } from "../../services/checkoutService";

const Commande = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [address, setAddress] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInfo = async () => {
      const storedCustomer = getStoredCustomer();
      if (!storedCustomer) {
        navigate("/frontoffice/login");
        return;
      }
      setCustomer(storedCustomer);
      if (storedCustomer.isAnonymous) {
        return;
      }
      try {
        const addresses = await fetchAddressesByCustomerId(storedCustomer.id);
        if (addresses.length > 0) {
          setAddress(addresses[0]);
        }
      } catch (err) {
        console.error("Erreur récupération adresse:", err);
      }
    };
    fetchInfo();

    const storedCart = getStoredCart();
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    } else {
      navigate("/frontoffice/panier");
    }
  }, [navigate]);

  const { totalTtc } = calculateCartTotals(cart);
  const totalPrix = totalTtc.toFixed(2);

  const handleValidation = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!customer) throw new Error("Client non authentifié.");
      if (customer.isAnonymous) throw new Error("Les commandes ne sont pas autorisées pour les utilisateurs anonymes.");
      if (!address) throw new Error("Aucune adresse trouvée pour ce client.");

      const result = await processOrderCreation({
        customer,
        addressId: address.id,
        cartItems: cart,
        existingCartId: null,
      });

      // 3. Succès
      clearStoredCart();
      alert("Commande validée avec succès ! (ID: " + result.orderId + ")");
      navigate("/frontoffice/commandes");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (customer?.isAnonymous) {
    return (
      <div style={{ padding: "2rem", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--code-bg)", textAlign: "center", margin: "2rem auto", maxWidth: "600px" }}>
        <h2 style={{ color: "#d97706", marginTop: 0 }}>⚠️ Commande Impossible</h2>
        <p style={{ margin: "1rem 0", color: "var(--text-h)" }}>Vous êtes connecté en tant qu'<strong>utilisateur anonyme</strong>.</p>
        <p style={{ margin: "1rem 0", color: "var(--text)" }}>Pour finaliser une commande et spécifier l'adresse de livraison, vous devez utiliser un compte client.</p>
        <button onClick={() => navigate("/")} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "1rem" }}>
          Choisir un compte client
        </button>
      </div>
    );
  }

  if (cart.length === 0) return <div>Redirection...</div>;

  return (
    <div>
      <h1>Récapitulatif de Commande</h1>

      <h2>Vos articles</h2>
      <ul>
        {cart.map((item, index) => (
          <li key={index}>
            <strong>{item.label}</strong> - {item.quantity} x {Number(item.unitPriceTtc).toFixed(2)} EUR
          </li>
        ))}
      </ul>

      <h3>Sous-total : {totalPrix} EUR</h3>
      <h3>Frais de livraison : 0.00 EUR</h3>
      <h2>Total à payer : {totalPrix} EUR</h2>

      <div
        style={{ margin: "20px 0", padding: "10px", border: "1px solid #ccc" }}
      >
        <h3>Moyen de paiement</h3>
        <label>
          <input type="radio" checked readOnly />
          Paiement à la livraison (seul choix disponible)
        </label>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={handleValidation} disabled={loading}>
        {loading ? "Validation en cours..." : "Valider la commande"}
      </button>
      <br />
      <br />
      <button onClick={() => navigate("/frontoffice/panier")}>
        Retour au panier
      </button>
    </div>
  );
};

export default Commande;
