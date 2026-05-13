// App.jsx
import { Routes, Route } from "react-router-dom";
import ListeProduits from "./components/ListeProduits";
import Produit  from "./components/Produit";
import FormProduit from "./components/FormProduit";
import ImportCsv from "./components/ImportCSV";

function App() {
  return (
    <Routes>
      <Route path="/produits" element={<ListeProduits />} />
      <Route path="/produits/:id" element={<Produit  />} />
      <Route path="/produits/create" element={<FormProduit />} />
      <Route path="/produits/import" element={<ImportCsv />} />
      
    </Routes>
  );
}

export default App;
