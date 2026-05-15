// App.jsx
import { Routes, Route } from "react-router-dom";
import ListeProduits from "./frontoffice/pages/ListeProduits";
import Produit from "./frontoffice/pages/Produit";
import FormProduit from "./backoffice/pages/FormProduit";
import ImportCsv from "./backoffice/pages/ImportCsv";
import Login from "./backoffice/pages/Login";
import ResetData from "./backoffice/pages/ResetData";
import ImportData from "./backoffice/pages/ImportData";
import ProtectedRoute from "./shared/ProtectedRoute";
import ListeCommandes from "./backoffice/pages/ListeCommandes";

function App() {
  return (
    <Routes>
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
      <Route path="/frontoffice/produits" element={<ListeProduits />} />
      <Route path="/frontoffice/produits/:id" element={<Produit />} />
    </Routes>
  );
}

export default App;
