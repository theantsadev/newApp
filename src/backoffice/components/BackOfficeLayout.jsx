import { Outlet } from "react-router-dom";
import NavbarBO from "./NavbarBO";

const BackOfficeLayout = () => {
  return (
    <div style={styles.layout}>
      <NavbarBO />
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
    backgroundColor: "#fafcff",
  },
  mainContent: {
    flex: 1,
    width: "100%",
    boxSizing: "border-box",
  },
};

export default BackOfficeLayout;
