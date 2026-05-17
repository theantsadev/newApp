import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getStoredCustomer, clearStoredCustomer } from "../../shared/customerAuthStorage";
import { getStoredCart } from "../../services/cartService";

const NavbarFO = () => {
  const [customer, setCustomer] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to update customer and cart count from local storage
  const updateStatus = () => {
    setCustomer(getStoredCustomer());
    try {
      const cartData = getStoredCart();
      const cart = cartData ? JSON.parse(cartData) : [];
      const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      setCartCount(count);
    } catch (e) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateStatus();

    // Listen to storage changes (e.g. from other tabs/actions)
    window.addEventListener("storage", updateStatus);
    
    // Also set up a small interval or custom event listener for immediate updates
    const interval = setInterval(updateStatus, 1000);

    return () => {
      window.removeEventListener("storage", updateStatus);
      clearInterval(interval);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    clearStoredCustomer();
    navigate("/");
  };

  const isAnonymous = customer?.isAnonymous;

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        {/* Logo / Brand */}
        <Link to="/frontoffice/produits" style={styles.brand}>
          <span style={styles.brandIcon}>🛍️</span>
          <span style={styles.brandText}>E-Boutique</span>
        </Link>

        {/* Links */}
        <div style={styles.navLinks}>
          <Link
            to="/frontoffice/produits"
            style={{
              ...styles.navLink,
              ...(location.pathname.startsWith("/frontoffice/produits") ? styles.activeLink : {}),
            }}
          >
            Boutique
          </Link>
          <Link
            to="/frontoffice/panier"
            style={{
              ...styles.navLink,
              ...(location.pathname === "/frontoffice/panier" ? styles.activeLink : {}),
            }}
          >
            Panier
            {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
          </Link>
          {!isAnonymous && (
            <Link
              to="/frontoffice/commandes"
              style={{
                ...styles.navLink,
                ...(location.pathname === "/frontoffice/commandes" ? styles.activeLink : {}),
              }}
            >
              Mes Commandes
            </Link>
          )}
        </div>

        {/* User Actions */}
        <div style={styles.userSection}>
          {customer ? (
            <div style={styles.profileContainer}>
              {isAnonymous ? (
                <div style={styles.anonymousBadge}>
                  <span style={{ marginRight: 4 }}>👤</span> Mode Anonyme
                </div>
              ) : (
                <div style={styles.userGreeting}>
                  <span style={styles.avatarCircle}>
                    {customer.firstname?.charAt(0).toUpperCase()}
                    {customer.lastname?.charAt(0).toUpperCase()}
                  </span>
                  <span style={styles.userName}>
                    {customer.firstname} {customer.lastname}
                  </span>
                </div>
              )}
              <button onClick={handleLogout} style={styles.logoutButton}>
                {isAnonymous ? "Se connecter" : "Changer d'utilisateur"}
              </button>
            </div>
          ) : (
            <button onClick={() => navigate("/")} style={styles.loginButton}>
              Se connecter
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--border)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    transition: "background 0.3s, border-color 0.3s",
  },
  navContainer: {
    maxWidth: "1126px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.8rem 1.5rem",
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    color: "var(--text-h)",
    fontWeight: "bold",
    fontSize: "1.2rem",
  },
  brandIcon: {
    fontSize: "1.4rem",
  },
  brandText: {
    fontFamily: "var(--sans)",
    letterSpacing: "-0.5px",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  navLink: {
    textDecoration: "none",
    color: "var(--text)",
    fontSize: "0.95rem",
    fontWeight: "500",
    padding: "6px 12px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  activeLink: {
    color: "var(--accent)",
    background: "var(--accent-bg)",
  },
  cartBadge: {
    background: "var(--accent)",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: "bold",
    borderRadius: "10px",
    padding: "2px 6px",
    minWidth: "12px",
    textAlign: "center",
    lineHeight: "1",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
  },
  profileContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  anonymousBadge: {
    background: "rgba(100, 116, 139, 0.1)",
    border: "1px solid rgba(100, 116, 139, 0.2)",
    color: "var(--text)",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
  },
  userGreeting: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  avatarCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "var(--accent)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: "bold",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  userName: {
    fontSize: "0.85rem",
    color: "var(--text-h)",
    fontWeight: "500",
  },
  logoutButton: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text)",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
    outline: "none",
  },
  loginButton: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    padding: "6px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
};

export default NavbarFO;
