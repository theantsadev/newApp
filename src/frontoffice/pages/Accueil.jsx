import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCustomerList } from "../../services/customerService";
import { setStoredCustomer, getStoredCustomer } from "../../shared/customerAuthStorage";

const getAvatarColor = (name) => {
  const colors = [
    "#aa3bff", // purple
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#ec4899", // pink
    "#6366f1", // indigo
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const Accueil = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentCustomer(getStoredCustomer());

    fetchCustomerList()
      .then((data) => {
        // En cas de succès, on trie les clients par nom
        const sorted = [...data].sort((a, b) =>
          `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`)
        );
        setCustomers(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur récupération clients:", err);
        setError("Impossible de charger la liste des clients. Le serveur PrestaShop est peut-être inaccessible.");
        setLoading(false);
      });
  }, []);

  const handleSelectCustomer = (customer) => {
    setStoredCustomer(customer);
    navigate("/frontoffice/produits");
  };

  const handleSelectAnonymous = () => {
    const anonymousUser = {
      id: "anonymous",
      firstname: "Utilisateur",
      lastname: "Anonyme",
      email: "anonymous@example.com",
      isAnonymous: true,
    };
    setStoredCustomer(anonymousUser);
    navigate("/frontoffice/produits");
  };

  // Filtrer les clients par recherche
  const filteredCustomers = customers.filter((c) => {
    const fullName = `${c.firstname} ${c.lastname}`.toLowerCase();
    const email = c.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logoBadge}>🛒 E-Boutique</div>
        <h1 style={styles.title}>Portail de Connexion</h1>
        <p style={styles.subtitle}>
          Choisissez un compte utilisateur existant pour explorer la boutique ou connectez-vous de manière anonyme.
        </p>
      </header>

      {/* Raccourci de session active */}
      {currentCustomer && (
        <div style={styles.activeSessionBanner}>
          <div style={styles.activeSessionText}>
            <span>Session active : </span>
            <strong>
              {currentCustomer.isAnonymous
                ? "Utilisateur Anonyme"
                : `${currentCustomer.firstname} ${currentCustomer.lastname}`}
            </strong>
          </div>
          <button
            onClick={() => navigate("/frontoffice/produits")}
            style={styles.continueButton}
          >
            Accéder à la boutique →
          </button>
        </div>
      )}

      {/* Option utilisateur anonyme - Toujours disponible et mise en avant */}
      <section style={styles.anonymousSection}>
        <div style={styles.anonymousCard} onClick={handleSelectAnonymous}>
          <div style={styles.anonymousAvatar}>👤</div>
          <div style={styles.anonymousInfo}>
            <h3 style={styles.anonymousTitle}>Se connecter en tant qu'utilisateur anonyme</h3>
            <p style={styles.anonymousDesc}>
              Parcourez le catalogue et ajoutez des articles au panier sans créer de compte.
            </p>
          </div>
          <span style={styles.anonymousBadge}>Mode Invité</span>
        </div>
      </section>

      <div style={styles.separator}>
        <span style={styles.separatorText}>OU CHOISIR UN COMPTE CLIENT</span>
      </div>

      {/* Barre de recherche */}
      {!loading && !error && (
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Rechercher un utilisateur par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={styles.clearSearch}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Contenu principal */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement des clients existants depuis l'API...</p>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>⚠️ {error}</p>
          <p style={styles.errorHint}>
            Vous pouvez toujours tester l'application en utilisant le <strong>mode anonyme</strong> ci-dessus.
          </p>
          <button onClick={() => window.location.reload()} style={styles.retryButton}>
            Réessayer de charger
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredCustomers.length === 0 ? (
            <div style={styles.emptyState}>
              Aucun client ne correspond à votre recherche "{searchQuery}"
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const fullName = `${c.firstname} ${c.lastname}`;
              const avatarColor = getAvatarColor(fullName);
              return (
                <div
                  key={c.id}
                  style={styles.customerCard}
                  onClick={() => handleSelectCustomer(c)}
                >
                  <div style={{ ...styles.avatar, backgroundColor: avatarColor }}>
                    {c.firstname?.charAt(0).toUpperCase()}
                    {c.lastname?.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.cardInfo}>
                    <h3 style={styles.cardName}>{fullName}</h3>
                    <p style={styles.cardEmail}>{c.email}</p>
                  </div>
                  <span style={styles.cardId}>ID: #{c.id}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    fontFamily: "var(--sans)",
    color: "var(--text)",
    backgroundColor: "var(--bg)",
    maxWidth: "800px",
    margin: "0 auto",
    padding: "3rem 1.5rem",
    boxSizing: "border-box",
  },
  header: {
    textAlign: "center",
    marginBottom: "3rem",
  },
  logoBadge: {
    display: "inline-block",
    background: "var(--accent-bg)",
    border: "1px solid var(--accent-border)",
    color: "var(--accent)",
    fontWeight: "600",
    padding: "6px 16px",
    borderRadius: "30px",
    fontSize: "0.9rem",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "var(--text-h)",
    margin: "0 0 1rem",
    letterSpacing: "-1px",
  },
  subtitle: {
    fontSize: "1.05rem",
    lineHeight: "1.6",
    color: "var(--text)",
    maxWidth: "600px",
    margin: "0 auto",
  },
  activeSessionBanner: {
    background: "var(--accent-bg)",
    border: "1px solid var(--accent-border)",
    borderRadius: "12px",
    padding: "1rem 1.5rem",
    marginBottom: "2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  activeSessionText: {
    fontSize: "0.95rem",
    color: "var(--text-h)",
  },
  continueButton: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s, opacity 0.2s",
    "&:hover": {
      opacity: 0.9,
    },
  },
  anonymousSection: {
    marginBottom: "2rem",
  },
  anonymousCard: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.7)",
    border: "2px dashed var(--border)",
    borderRadius: "16px",
    padding: "1.5rem",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    boxShadow: "var(--shadow)",
    ":hover": {
      borderColor: "var(--accent)",
      transform: "translateY(-4px)",
      background: "var(--accent-bg)",
    },
  },
  anonymousAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "rgba(100, 116, 139, 0.1)",
    color: "var(--text-h)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    marginRight: "1.2rem",
    flexShrink: 0,
  },
  anonymousInfo: {
    flex: 1,
    textAlign: "left",
  },
  anonymousTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "var(--text-h)",
    margin: "0 0 4px",
  },
  anonymousDesc: {
    fontSize: "0.9rem",
    color: "var(--text)",
    margin: 0,
  },
  anonymousBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    background: "var(--border)",
    color: "var(--text)",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  separator: {
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    color: "var(--text)",
    fontSize: "0.8rem",
    fontWeight: "600",
    letterSpacing: "1.5px",
    margin: "2.5rem 0",
    opacity: 0.6,
  },
  separatorText: {
    padding: "0 15px",
    background: "var(--bg)",
  },
  searchContainer: {
    position: "relative",
    marginBottom: "1.5rem",
  },
  searchInput: {
    width: "100%",
    height: "48px",
    padding: "0 40px 0 16px",
    fontSize: "0.95rem",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    background: "var(--bg)",
    color: "var(--text-h)",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
  },
  clearSearch: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: "1.4rem",
    color: "var(--text)",
    cursor: "pointer",
    padding: 0,
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
  },
  customerCard: {
    display: "flex",
    alignItems: "center",
    padding: "1rem 1.2rem",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    cursor: "pointer",
    background: "var(--bg)",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
    ":hover": {
      transform: "translateX(6px)",
      borderColor: "var(--accent)",
      boxShadow: "var(--shadow)",
    },
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "0.9rem",
    marginRight: "1rem",
    flexShrink: 0,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  cardInfo: {
    flex: 1,
    textAlign: "left",
  },
  cardName: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "var(--text-h)",
    margin: "0 0 2px",
  },
  cardEmail: {
    fontSize: "0.85rem",
    color: "var(--text)",
    margin: 0,
  },
  cardId: {
    fontSize: "0.75rem",
    color: "var(--text)",
    background: "var(--code-bg)",
    padding: "4px 8px",
    borderRadius: "4px",
    fontWeight: "500",
  },
  emptyState: {
    padding: "2rem",
    textAlign: "center",
    color: "var(--text)",
    fontSize: "0.95rem",
    border: "1px dashed var(--border)",
    borderRadius: "12px",
  },
  loadingContainer: {
    padding: "4rem 2rem",
    textAlign: "center",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid var(--border)",
    borderTop: "3px solid var(--accent)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 1.5rem",
  },
  loadingText: {
    fontSize: "0.95rem",
    color: "var(--text)",
  },
  errorContainer: {
    padding: "2rem",
    background: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "16px",
    textAlign: "center",
    marginBottom: "2rem",
  },
  errorText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: "1rem",
    margin: "0 0 8px",
  },
  errorHint: {
    fontSize: "0.9rem",
    color: "var(--text)",
    margin: "0 0 1.5rem",
  },
  retryButton: {
    background: "var(--text-h)",
    color: "var(--bg)",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default Accueil;
