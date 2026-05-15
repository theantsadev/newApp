import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteProductById,
  fetchProductList,
} from "../../services/productService";

const ListeProduits = () => {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDelete = async (id) => {
    try {
      await deleteProductById(id);
      setProduits((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await Promise.all(produits.map((p) => deleteProductById(p.id)));
      setProduits([]);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    let isActive = true;
    fetchProductList()
      .then((data) => {
        if (!isActive) return;
        setProduits(data);
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

  if (error) return <div>Erreur : {error.message}</div>;
  if (loading) return <div>Chargement ... </div>;
  if (!loading && produits.length === 0) return <div>Aucun produit</div>;

  return (
    <div>
      <h1>Liste des Produits</h1>
      <br />
      <button onClick={handleDeleteAll}>Tout supprimer</button>

      <div>
        {produits.map((produit) => (
          <div key={produit.id}>
            <h3>
              {produit.nom || "Sans nom"} (#{produit.id})
            </h3>
            <p>Prix : {produit.prix} EUR</p>
            <p>Reference : {produit.reference || "-"}</p>
            <p>Quantite : {produit.quantite}</p>
            {produit.image && (
              <img src={produit.image} alt={produit.nom || "Produit"} />
            )}
            <div>
              <Link to={`/frontoffice/produits/${produit.id}`}>
                Voir detail
              </Link>
              <button onClick={() => handleDelete(produit.id)}>
                Supprimer
              </button>
            </div>
            <hr />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListeProduits;
