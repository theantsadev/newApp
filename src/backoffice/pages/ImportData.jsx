import { useState } from "react";

const ImportData = () => {
  const [files, setFiles] = useState({
    produits: null,
    declinaisons: null,
    commandes: null,
    images: null,
  });

  const handleFileChange = (key) => (event) => {
    const file = event.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  return (
    <div>
      <h1>Import Data</h1>
      <p>Importer 3 fichiers CSV + 1 ZIP d'images.</p>

      <div>
        <label htmlFor="csv-produits">CSV Produits/Categories</label>
        <br />
        <input
          id="csv-produits"
          type="file"
          accept=".csv"
          onChange={handleFileChange("produits")}
        />
      </div>

      <div>
        <label htmlFor="csv-declinaisons">CSV Declinaisons/Stocks</label>
        <br />
        <input
          id="csv-declinaisons"
          type="file"
          accept=".csv"
          onChange={handleFileChange("declinaisons")}
        />
      </div>

      <div>
        <label htmlFor="csv-commandes">CSV Commandes</label>
        <br />
        <input
          id="csv-commandes"
          type="file"
          accept=".csv"
          onChange={handleFileChange("commandes")}
        />
      </div>

      <div>
        <label htmlFor="zip-images">ZIP Images</label>
        <br />
        <input
          id="zip-images"
          type="file"
          accept=".zip"
          onChange={handleFileChange("images")}
        />
      </div>

      <br />
      <button disabled>Importer</button>

      <div>
        <p>Fichiers selectionnes :</p>
        <ul>
          <li>Produits/Categories : {files.produits?.name || "-"}</li>
          <li>Declinaisons/Stocks : {files.declinaisons?.name || "-"}</li>
          <li>Commandes : {files.commandes?.name || "-"}</li>
          <li>Images ZIP : {files.images?.name || "-"}</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportData;
