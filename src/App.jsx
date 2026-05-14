// App.jsx
import { Routes, Route } from "react-router-dom";
import ListeProduits from "./backoffice/pages/ListeProduits";
import Produit from "./frontoffice/pages/Produit";
import FormProduit from "./backoffice/pages/FormProduit";
import ImportCsv from "./backoffice/pages/ImportCsv";
import Login from "./backoffice/pages/Login";
import ResetData from "./backoffice/pages/ResetData";
import ImportData from "./backoffice/pages/ImportData";
import ProtectedRoute from "./shared/ProtectedRoute";

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
      <Route path="/produits/:id" element={<Produit />} />
      <Route
        path="/produits"
        element={
          <ProtectedRoute>
            <ListeProduits />
          </ProtectedRoute>
        }
      />
      <Route
        path="/produits/create"
        element={
          <ProtectedRoute>
            <FormProduit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/produits/import"
        element={
          <ProtectedRoute>
            <ImportCsv />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
