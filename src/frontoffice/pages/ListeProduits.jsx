import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteProductById,
  fetchProductList,
  getMarque,
} from "../../services/productService";
import { fetchTaxRate } from "../../services/taxService";
// Ajoute cet import en haut du fichier
import { fetchCategoryList } from "../../services/categoryService";
import AuthorizedImage from "../components/AuthorizedImage";
import { verifyApiKey } from "../../shared/authStorage";
import LoginStock from "../components/LoginStock";

// --- Fonctions utilitaires ---

const toPrice = (value) => Number.parseFloat(value || 0) || 0;

const formatEuro = (value) => {
  return (
    toPrice(value).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
};

const normalize = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim();
};


// Récupère toutes les catégories uniques depuis la liste de produits
const getCategoriesUniques = (produits) => {
  const categories = produits.map((p) => p.categorie || "Sans catégorie");
  return [...new Set(categories)].sort();
};

// --- Logique de filtrage ---

const applyFilter = (produits, filtre) => {
  return produits.filter((produit) => {
    const nom = normalize(produit.nom);
    const categorie = normalize(produit.categorie || "Sans catégorie");
    const prix = toPrice(produit.prixTTC);

    const matchNom = !filtre.nom || nom.includes(normalize(filtre.nom));

    const matchCategorie =
      !filtre.categorie || categorie === normalize(filtre.categorie);

    const matchPrixMin = !filtre.prix_min || prix >= toPrice(filtre.prix_min);

    const matchPrixMax = !filtre.prix_max || prix <= toPrice(filtre.prix_max);

    return matchNom && matchCategorie && matchPrixMin && matchPrixMax;
  });
};

// --- Composants secondaires ---

function LoadingState() {
  return (
    <div style={styles.centered}>
      <p style={styles.stateText}>Chargement...</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ ...styles.centered, ...styles.errorBox }}>
      <p style={styles.stateText}>Erreur : {message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.centered}>
      <p style={styles.stateText}>Aucun produit trouvé pour ces critères.</p>
    </div>
  );
}

function FilterForm({ filtre, categories, onFilter, onSubmit, onReset }) {
  return (
    <form onSubmit={onSubmit} style={styles.filterForm}>
      <div style={styles.filterGroup}>
        <label htmlFor="nom" style={styles.label}>
          Nom
        </label>
        <input
          type="text"
          id="nom"
          name="nom"
          value={filtre.nom}
          onChange={onFilter}
          placeholder="Rechercher un nom..."
          style={{ ...styles.input, width: 180 }}
        />
      </div>

      <div style={styles.filterGroup}>
        <label htmlFor="categorie" style={styles.label}>
          Catégorie
        </label>
        <select
          id="categorie"
          name="categorie"
          value={filtre.categorie}
          onChange={onFilter}
          style={{ ...styles.input, width: 160 }}
        >
          <option value="">Toutes</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.filterGroup}>
        <label htmlFor="prix_min" style={styles.label}>
          Prix TTC min (€)
        </label>
        <input
          type="number"
          id="prix_min"
          name="prix_min"
          value={filtre.prix_min}
          onChange={onFilter}
          placeholder="0"
          min="0"
          step="0.01"
          style={{ ...styles.input, width: 100 }}
        />
      </div>

      <div style={styles.filterGroup}>
        <label htmlFor="prix_max" style={styles.label}>
          Prix TTC max (€)
        </label>
        <input
          type="number"
          id="prix_max"
          name="prix_max"
          value={filtre.prix_max}
          onChange={onFilter}
          placeholder="∞"
          min="0"
          step="0.01"
          style={{ ...styles.input, width: 100 }}
        />
      </div>

      <button type="submit" style={styles.button}>
        Rechercher
      </button>

      <button type="button" onClick={onReset} style={styles.buttonSecondary}>
        Réinitialiser
      </button>
    </form>
  );
}

function ResultCount({ filtered, total }) {
  return (
    <p style={styles.resultCount}>
      {filtered} produit{filtered > 1 ? "s" : ""} affiché
      {filtered > 1 ? "s" : ""}
      {filtered < total && ` (sur ${total})`}
    </p>
  );
}

function ProduitCard({ produit, onDelete }) {
  const marque = getMarque(produit.date_disponibilite);
  return (
    <div style={styles.card}>
      {produit.image && (
        <AuthorizedImage
          src={produit.image}
          alt={produit.nom || "Produit"}
          style={styles.image}
        />
      )}
      <div style={styles.cardBody}>
        <h3 style={styles.cardTitle}>
          {produit.nom || "Sans nom"}{" "}
          <span style={styles.cardId}>#{produit.id}</span>
          {marque && (
            <span style={marque === "HOT" ? styles.badgeHot : styles.badgeNew}>
              {marque}
            </span>
          )}
        </h3>
        <p style={styles.cardDetail}>
          Prix : {formatEuro(produit.prixTTC)} TTC
        </p>
        <p style={styles.cardDetail}>Référence : {produit.reference || "—"}</p>
        <p style={styles.cardDetail}>Quantité : {produit.quantite}</p>
        <p style={styles.cardDetail}>Catégorie : {produit.categorie || "—"}</p>
        <div style={styles.cardActions}>
          <Link to={`/frontoffice/produits/${produit.id}`} style={styles.link}>
            Voir détail
          </Link>
          <button
            onClick={() => onDelete(produit.id)}
            style={styles.buttonDanger}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Composant principal ---

const FILTRE_VIDE = {
  nom: "",
  categorie: "",
  prix_min: "",
  prix_max: "",
};

const ListeProduits = () => {
  const [produits, setProduits] = useState([]); // données brutes
  const [filtered, setFiltered] = useState([]); // données affichées
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtre, setFiltre] = useState(FILTRE_VIDE);
  const [canOpenPopup, setCanOpenPopup] = useState(false);

  // Chargement initial
  useEffect(() => {
    let isActive = true;

    fetchProductList()
      .then(async (data) => {
        if (!isActive) return;

        // 1. Calcul des taxes (déjà présent)
        const productsWithTaxes = await Promise.all(
          data.map(async (p) => {
            const rate = await fetchTaxRate(p.id_tax_rules_group);
            p.prixTTC = (Number(p.prix) * (1 + rate / 100)).toFixed(2);
            return p;
          }),
        );

        // 2. Récupère les catégories et les associe à chaque produit
        const categories = await fetchCategoryList();

        const productsWithCategory = productsWithTaxes.map((p) => {
          const categorie = categories.find((cat) =>
            cat.product_ids.includes(Number(p.id)),
          );
          p.categorie = categorie ? categorie.nom : "Sans catégorie";
          return p;
        });

        if (!isActive) return;

        setProduits(productsWithCategory);
        setFiltered(productsWithCategory);
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
  // Mise à jour d'un champ du filtre
  const handleFilter = (event) => {
    const { name, value } = event.target;
    setFiltre({ ...filtre, [name]: value });
  };

  // Application du filtre
  const handleSubmit = (event) => {
    event.preventDefault();
    setFiltered(applyFilter(produits, filtre));
  };

  // Réinitialisation
  const handleReset = () => {
    setFiltre(FILTRE_VIDE);
    setFiltered(produits);
  };

  // Suppression d'un produit
  const handleDelete = async (id) => {
    try {
      await deleteProductById(id);
      const updated = produits.filter((p) => p.id !== id);
      setProduits(updated);
      setFiltered(applyFilter(updated, filtre)); // réapplique le filtre en cours
    } catch (err) {
      setError(err);
    }
  };

  // Suppression de tous les produits
  const handleDeleteAll = async () => {
    try {
      await Promise.all(produits.map((p) => deleteProductById(p.id)));
      setProduits([]);
      setFiltered([]);
    } catch (err) {
      setError(err);
    }
  };

  const closeModal = () => {
    setCanOpenPopup(false);
  };


  const handleRemoveStock = async () => {
    const mdp = prompt("Entrer le mot de passe admin");
    if (!mdp) {
      setError({ message: "Clé requise." });
      return;
    }

    if (!verifyApiKey(mdp)) {
      setError({ message: "Clé invalide." });
      return;
    }

    setCanOpenPopup(true);

  };

  const categories = getCategoriesUniques(produits);

  // --- Rendu ---

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Liste des produits</h1>
        <button onClick={handleDeleteAll} style={styles.buttonDanger}>
          Tout supprimer
        </button>
        <button onClick={handleRemoveStock} style={styles.buttonDanger}>
          Remove stock
        </button>
      </div>

      {canOpenPopup && (
        <LoginStock
          canOpenPopup={canOpenPopup}
          onClose={closeModal}

        />
      )}

      <FilterForm
        filtre={filtre}
        categories={categories}
        onFilter={handleFilter}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />

      <ResultCount filtered={filtered.length} total={produits.length} />

      {filtered.length === 0 && <EmptyState />}

      {filtered.length > 0 && (
        <div style={styles.list}>
          {filtered.map((produit) => (
            <ProduitCard
              key={produit.id}
              produit={produit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Styles ---

const styles = {
  page: {
    padding: "2rem",
    fontFamily: "sans-serif",
    maxWidth: 900,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    margin: 0,
  },
  filterForm: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: "1rem",
    flexWrap: "wrap",
    padding: "1rem",
    background: "#f9f9f9",
    borderRadius: 8,
    border: "1px solid #e0e0e0",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: "#666",
  },
  input: {
    height: 36,
    padding: "0 10px",
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 6,
  },
  button: {
    height: 36,
    padding: "0 18px",
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 6,
    cursor: "pointer",
    background: "#fff",
  },
  buttonSecondary: {
    height: 36,
    padding: "0 14px",
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 6,
    cursor: "pointer",
    background: "#fff",
    color: "#666",
  },
  buttonDanger: {
    height: 34,
    padding: "0 14px",
    fontSize: 13,
    border: "1px solid #ffd0d0",
    borderRadius: 6,
    cursor: "pointer",
    background: "#fff5f5",
    color: "#c00",
  },
  resultCount: {
    fontSize: 13,
    color: "#888",
    marginBottom: "1rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  card: {
    display: "flex",
    gap: 16,
    padding: "1rem",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    background: "#fff",
  },
  image: {
    width: 80,
    height: 80,
    objectFit: "cover",
    borderRadius: 6,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 500,
    margin: "0 0 8px",
  },
  cardId: {
    fontWeight: 400,
    color: "#aaa",
    fontSize: 13,
  },
  cardDetail: {
    fontSize: 13,
    color: "#555",
    margin: "2px 0",
  },
  cardActions: {
    display: "flex",
    gap: 12,
    marginTop: 10,
    alignItems: "center",
  },
  link: {
    fontSize: 13,
    color: "#0066cc",
  },
  centered: {
    display: "flex",
    justifyContent: "center",
    padding: "3rem",
  },
  stateText: {
    color: "#666",
    fontSize: 15,
  },
  errorBox: {
    background: "#fff5f5",
    borderRadius: 8,
    border: "1px solid #ffd0d0",
  },
  badgeHot: {
    background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "700",
    textTransform: "uppercase",
    marginLeft: "8px",
    display: "inline-block",
    boxShadow: "0 2px 4px rgba(255, 75, 43, 0.3)",
  },
  badgeNew: {
    background: "linear-gradient(135deg, #11998e, #38ef7d)",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "700",
    textTransform: "uppercase",
    marginLeft: "8px",
    display: "inline-block",
    boxShadow: "0 2px 4px rgba(56, 239, 125, 0.3)",
  },
};

export default ListeProduits;
