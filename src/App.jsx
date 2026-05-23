// App.jsx
import { Routes, Route } from "react-router-dom";
import Accueil from "./frontoffice/pages/Accueil";
import FrontOfficeLayout from "./frontoffice/components/FrontOfficeLayout";
import ListeProduits from "./frontoffice/pages/ListeProduits";
import Produit from "./frontoffice/pages/Produit";
import Login from "./backoffice/pages/Login";
import ResetData from "./backoffice/pages/ResetData";
import ImportData from "./backoffice/pages/ImportData";
import ProtectedRoute from "./shared/ProtectedRoute";
import ListeCommandes from "./backoffice/pages/ListeCommandes";
import Panier from "./frontoffice/pages/Panier";
import Commande from "./frontoffice/pages/Commande";
import Commandes from "./frontoffice/pages/Commandes";
import LoginFO from "./frontoffice/pages/LoginFO";
import ProtectedRouteFO from "./shared/ProtectedRouteFO";
import Dashboard from "./backoffice/pages/Dashboard";
import StockManager from "./backoffice/pages/StockManager";
import StatistiquesParCategorie from "./backoffice/pages/StatistiquesParCategorie";
import BackOfficeLayout from "./backoffice/components/BackOfficeLayout";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="/backoffice/login" element={<Login />} />

      {/* Backoffice routes wrapped in protected layout */}
      <Route element={
        <ProtectedRoute>
          <BackOfficeLayout />
        </ProtectedRoute>
      }>
        <Route path="/backoffice/reset-data" element={<ResetData />} />
        <Route path="/backoffice/import-data" element={<ImportData />} />
        <Route path="/backoffice/commandes" element={<ListeCommandes />} />
        <Route path="/backoffice/statistiques" element={<StatistiquesParCategorie />} />
        <Route path="/backoffice/dashboard" element={<Dashboard />} />
        <Route path="/backoffice/stock" element={<StockManager />} />
      </Route>
      <Route path="/frontoffice/login" element={<LoginFO />} />

      {/* FrontOffice store routes wrapped in layout */}
      <Route element={<FrontOfficeLayout />}>
        <Route path="/frontoffice/produits" element={<ListeProduits />} />
        <Route path="/frontoffice/produits/:id" element={<Produit />} />
        <Route
          path="/frontoffice/panier"
          element={
            <ProtectedRouteFO>
              <Panier />
            </ProtectedRouteFO>
          }
        />
        <Route
          path="/frontoffice/commande"
          element={
            <ProtectedRouteFO>
              <Commande />
            </ProtectedRouteFO>
          }
        />
        <Route
          path="/frontoffice/commandes"
          element={
            <ProtectedRouteFO>
              <Commandes />
            </ProtectedRouteFO>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
