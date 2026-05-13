// App.jsx
import { Routes, Route } from "react-router-dom";
import ListeProduits from "./backoffice/pages/ListeProduits";
import Produit from "./frontoffice/pages/Produit";
import FormProduit from "./backoffice/pages/FormProduit";
import ImportCsv from "./backoffice/pages/ImportCsv";
import Login from "./backoffice/pages/Login";

function App() {
  return (
    <Routes>
      <Route path="/backoffice/login" element={<Login />} />
      <Route path="/produits/:id" element={<Produit />} />
      <Route path="/produits" element={<ListeProduits />} />
      <Route path="/produits/create" element={<FormProduit />} />
      <Route path="/produits/import" element={<ImportCsv />} />
    </Routes>
  );
}

export default App;
