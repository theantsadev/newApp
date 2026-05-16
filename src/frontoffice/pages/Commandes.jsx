import { useEffect, useState } from "react";
import { fetchOrderList } from "../../services/orderService";
import { fetchOrderStateList } from "../../services/orderStateService";
import { useNavigate } from "react-router-dom";
import { getStoredCustomer, clearStoredCustomer } from "../../shared/customerAuthStorage";

const Commandes = () => {
  const [orders, setOrders] = useState([]);
  const [states, setStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCustomer = getStoredCustomer();
    console.log(storedCustomer);
    if (!storedCustomer) {
      navigate("/frontoffice/login");
      return;
    }
    setCustomer(storedCustomer);
    console.log(customer);
    

    Promise.all([fetchOrderList(), fetchOrderStateList()])
      .then(([orderList, stateList]) => {
        // Filtrer pour le client authentifié
        const myOrders = orderList.filter(
          (o) => Number(o.id_customer) === Number(storedCustomer.id)
        );


        // Trier du plus récent au plus ancien
        myOrders.sort((a, b) => new Date(b.date_add) - new Date(a.date_add));

        setOrders(myOrders);

        const statesMap = {};
        stateList.forEach((s) => {
          statesMap[s.id] = s.name;
        });
        setStates(statesMap);

        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Chargement de vos commandes...</div>;
  if (error) return <div>Erreur : {error.message}</div>;

  const handleLogout = () => {
    clearStoredCustomer();
    navigate("/frontoffice/login");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Mes Commandes</h1>
        <div>
          <span>Connecté en tant que : {customer?.firstname} {customer?.lastname} </span>
          <button onClick={handleLogout}>Se déconnecter</button>
        </div>
      </div>
      {orders.length === 0 ? (
        <p>Vous n'avez passé aucune commande pour le moment.</p>
      ) : (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Référence</th>
              <th>Date</th>
              <th>Total Payé</th>
              <th>Paiement</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.reference}</td>
                <td>{new Date(o.date_add).toLocaleString()}</td>
                <td>{Number(o.total_paid).toFixed(2)} EUR</td>
                <td>{o.payment}</td>
                <td>{states[o.current_state] || `État ${o.current_state}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <br />
      <button onClick={() => navigate("/frontoffice/produits")}>
        Retour à la boutique
      </button>
    </div>
  );
};

export default Commandes;
