// App.jsx
import { Routes, Route } from "react-router-dom";
import Accueil from "./frontoffice/pages/Accueil";
import FrontOfficeLayout from "./frontoffice/components/FrontOfficeLayout";
import ListeProduits from "./frontoffice/pages/ListeProduits";
import Produit from "./frontoffice/pages/Produit";
import FormProduit from "./backoffice/pages/FormProduit";
import ImportCsv from "./backoffice/pages/ImportCsv";
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="/backoffice/login" element={<Login />} />
      <Route
        path="/backoffice/reset-data"
        element={
          <ProtectedRoute>
            <ResetData />
          </ProtectedRoute>
        }
      />
      <Route
        path="/backoffice/import-data"
        element={
          <ProtectedRoute>
            <ImportData />
          </ProtectedRoute>
        }
      />
      <Route
        path="/backoffice/commandes"
        element={
          <ProtectedRoute>
            <ListeCommandes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/backoffice/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
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
