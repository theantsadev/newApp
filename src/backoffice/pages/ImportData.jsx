import { useState } from "react";
import Papa from "papaparse";
import JSZip from "jszip";

const REQUIRED_HEADERS = {
  produits: [
    "date_availability_produit",
    "nom",
    "reference",
    "prix_ttc",
    "Taxe",
    "categorie",
    "prix_achat",
  ],
  declinaisons: [
    "reference",
    "specificité",
    "karazany",
    "stock_initial",
    "prix_vente_ttc",
  ],
  commandes: ["date", "nom", "email", "pwd", "adresse", "achat", "etat"],
};

const formatMissing = (headers, required) =>
  required.filter((col) => !headers.includes(col));

const ImportData = () => {
  const [files, setFiles] = useState({
    produits: null,
    declinaisons: null,
    commandes: null,
    images: null,
  });
  const [parsed, setParsed] = useState({
    produits: [],
    declinaisons: [],
    commandes: [],
    images: [],
  });
  const [errors, setErrors] = useState({
    produits: null,
    declinaisons: null,
    commandes: null,
    images: null,
  });
  const [loading, setLoading] = useState(false);

  const parseCsvFile = (key, file) => {
    if (!file) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, [key]: null }));

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields || [];
        const required = REQUIRED_HEADERS[key] || [];
        const missing = formatMissing(headers, required);

        if (missing.length > 0) {
          setErrors((prev) => ({
            ...prev,
            [key]: `Colonnes manquantes: ${missing.join(", ")}`,
          }));
          setParsed((prev) => ({ ...prev, [key]: [] }));
        } else {
          setParsed((prev) => ({ ...prev, [key]: result.data }));
        }

        setLoading(false);
      },
      error: (err) => {
        setErrors((prev) => ({ ...prev, [key]: err.message }));
        setParsed((prev) => ({ ...prev, [key]: [] }));
        setLoading(false);
      },
    });
  };

  const parseZipFile = async (file) => {
    if (!file) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, images: null }));

    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.keys(zip.files).filter(
        (name) => !zip.files[name].dir,
      );

      if (entries.length === 0) {
        setErrors((prev) => ({
          ...prev,
          images: "Le ZIP ne contient aucun fichier.",
        }));
        setParsed((prev) => ({ ...prev, images: [] }));
      } else {
        setParsed((prev) => ({ ...prev, images: entries }));
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        images: "ZIP invalide.",
      }));
      setParsed((prev) => ({ ...prev, images: [] }));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (key) => (event) => {
    const file = event.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [key]: file }));

    if (key === "images") {
      parseZipFile(file);
      return;
    }

    parseCsvFile(key, file);
  };

  const hasErrors = Object.values(errors).some(Boolean);
  const readyToImport =
    files.produits &&
    files.declinaisons &&
    files.commandes &&
    files.images &&
    !hasErrors;

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
      <button disabled={!readyToImport || loading}>Importer</button>

      <div>
        <p>Fichiers selectionnes :</p>
        <ul>
          <li>Produits/Categories : {files.produits?.name || "-"}</li>
          <li>Declinaisons/Stocks : {files.declinaisons?.name || "-"}</li>
          <li>Commandes : {files.commandes?.name || "-"}</li>
          <li>Images ZIP : {files.images?.name || "-"}</li>
        </ul>
      </div>

      <div>
        <h3>Validation</h3>
        <ul>
          <li>Produits/Categories : {errors.produits || "OK"}</li>
          <li>Declinaisons/Stocks : {errors.declinaisons || "OK"}</li>
          <li>Commandes : {errors.commandes || "OK"}</li>
          <li>Images ZIP : {errors.images || "OK"}</li>
        </ul>
      </div>

      <div>
        <h3>Apercu</h3>
        <ul>
          <li>Produits/Categories : {parsed.produits.length} lignes</li>
          <li>Declinaisons/Stocks : {parsed.declinaisons.length} lignes</li>
          <li>Commandes : {parsed.commandes.length} lignes</li>
          <li>Images : {parsed.images.length} fichiers</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportData;
