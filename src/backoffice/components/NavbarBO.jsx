import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearStoredApiKey } from "../../shared/authStorage";



const NavbarBO = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStoredApiKey();
    navigate("/backoffice/login");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.navContainer}>
        <div style={styles.navBrand}>
          <span style={{ fontSize: "1.4rem" }}>⚙️</span>
          <span style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.5px" }}>Backoffice</span>
        </div>
        <div style={styles.navLinks}>
          <Link to="/backoffice/dashboard" style={{...styles.navLink, ...(location.pathname === "/backoffice/dashboard" ? styles.activeNavLink : {})}}>Tableau de bord</Link>
          <Link to="/backoffice/commandes" style={{...styles.navLink, ...(location.pathname === "/backoffice/commandes" ? styles.activeNavLink : {})}}>Commandes</Link>
          <Link to="/backoffice/statistiques" style={{...styles.navLink, ...(location.pathname === "/backoffice/statistiques" ? styles.activeNavLink : {})}}>Statistiques</Link>
          <Link to="/backoffice/stock" style={{...styles.navLink, ...(location.pathname === "/backoffice/stock" ? styles.activeNavLink : {})}}>Gestion du Stock</Link>
          <Link to="/backoffice/import-data" style={{...styles.navLink, ...(location.pathname === "/backoffice/import-data" ? styles.activeNavLink : {})}}>Import Données</Link>
          <Link to="/backoffice/reset-data" style={{...styles.navLink, ...(location.pathname === "/backoffice/reset-data" ? styles.activeNavLink : {})}}>Réinitialiser</Link>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    width: "100%",
  },
  navContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.8rem 1.5rem",
    boxSizing: "border-box",
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "700",
    fontSize: "1.2rem",
    color: "#0f172a",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  navLink: {
    textDecoration: "none",
    color: "#64748b",
    fontSize: "0.9rem",
    fontWeight: "500",
    padding: "6px 12px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  activeNavLink: {
    color: "#3b82f6",
    background: "#eff6ff",
    fontWeight: "600",
  },
  logoutButton: {
    background: "transparent",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
};

export default NavbarBO;
