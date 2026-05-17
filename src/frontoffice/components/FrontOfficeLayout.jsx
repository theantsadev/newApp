import { Outlet } from "react-router-dom";
import NavbarFO from "./NavbarFO";

const FrontOfficeLayout = () => {
  return (
    <div style={styles.layout}>
      <NavbarFO />
      <main style={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

const styles = {
  layout: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    width: "100%",
  },
  mainContent: {
    flex: 1,
    padding: "2rem 1.5rem",
    maxWidth: "1126px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
    textAlign: "left", // Reset global center text-align inside pages
  },
};

export default FrontOfficeLayout;
