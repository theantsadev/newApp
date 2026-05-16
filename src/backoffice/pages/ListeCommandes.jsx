import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteOrderById,
  fetchOrderList,
  updateOrderState
} from "../../services/orderService";
import { fetchAllOrderStates } from "../../services/orderStateService";

const ListeCommandes = () => {
  const [stateMap, setStateMap] = useState({});
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleDelete = async (id) => {
    try {
      await deleteOrderById(id);
      setCommandes((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await Promise.all(commandes.map((p) => deleteOrderById(p.id)));
      setCommandes([]);
    } catch (err) {
      setError(err);
    }
  };

  const handleSelectChange = async (e, commande) => {
    try {
      await updateOrderState(commande.id, e.target.value);
      setSuccess("etat de commande mise à jour avec succes");
      setCommandes((prev) =>
        prev.map((c) =>
          c.id === commande.id ? { ...c, etatId: e.target.value } : c,
        ),
      );
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    let isActive = true;

    // ✅ async IIFE pour pouvoir utiliser await
    (async () => {
      try {
        const [states, data] = await Promise.all([
          fetchAllOrderStates(),
          fetchOrderList(), // ✅ plus besoin de passer stateMap
        ]);
        if (!isActive) return;
        setStateMap(states);
        setCommandes(data);
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

  if (error) return <div>Erreur : {error.message}</div>;
  if (loading) return <div>Chargement...</div>;
  if (!loading && commandes.length === 0) return <div>Aucune commande</div>;

  return (
    <div>
      {success && <div>{success}</div>}
      <h1>Liste des commandes</h1>
      <br />
      <button onClick={handleDeleteAll}>Tout supprimer</button>
      <table border={1}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Etat</th>
            <th>Option1</th>
            <th>Option2</th>
          </tr>
        </thead>
        <tbody>
          {commandes.map((commande) => (
            <tr key={commande.id}>
              <td>{commande.id}</td>
              <td>
                {/* ✅ select avec toutes les options depuis stateMap */}
                <select
                  defaultValue={commande.etatId || ""}
                  onChange={(e) => handleSelectChange(e, commande)}
                >
                  {Object.entries(stateMap).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <Link to={`/commandes/${commande.id}`}>Voir détail</Link>
              </td>
              <td>
                <button onClick={() => handleDelete(commande.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListeCommandes;
