import { useState, useEffect } from "react";
import Papa from "papaparse";
import JSZip from "jszip";
import { requestXml, fetchLanguageIds, fetchIdByFilter } from "../../services/prestashopClient";
import { getTextContent, parseXmlDoc } from "../../shared/xmlUtils";
import { resetResources } from "../../services/resetService";
import { ensureTaxSetup } from "../../services/taxService";
import { ensureCategory } from "../../services/categoryService";
import { ensureProduct, uploadProductImage } from "../../services/productService";
import { ensureOption } from "../../services/productOptionService";
import { ensureOptionValue } from "../../services/productOptionValueService";
import { createCombination } from "../../services/combinationService";
import { updateStock } from "../../services/stockService";
import { ensureCustomer } from "../../services/customerService";
import { ensureAddress } from "../../services/addressService";
import { createCart, updateCartDate } from "../../services/cartService";
import { createOrder, updateOrderDate, updatePaymentDate, updateOrderStateWithMovement } from "../../services/orderService";
import { isCartOrderStateLabel } from "../../services/orderStateService";

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

const DATE_FIELDS = {
  produits: ["date_availability_produit"],
  commandes: ["date"],
};

const POSITIVE_FIELDS = {
  produits: ["prix_ttc", "prix_achat", "Taxe"],
  declinaisons: ["prix_vente_ttc", "stock_initial"],
  commandes: [],
};

const RESET_KEYS = [
  "order_histories",
  "order_payments",
  "orders",
  "carts",
  "addresses",
  "customers",
  "stock_availables",
  "combinations",
  "product_option_values",
  "product_options",
  "product_images",
  "products",
  "categories",
  "tax_rules",
  "tax_rule_groups",
  "taxes",
];

const formatMissing = (headers, required) =>
  required.filter((col) => !headers.includes(col));

const toNumber = (value) => {
  if (value == null) return 0;
  const cleaned = String(value).replace("%", "").replace(",", ".").trim();
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toPercent = (value) => toNumber(value) / 100;

const calcPriceHt = (priceTtc, taxRate) => {
  const ttc = toNumber(priceTtc);
  const rate = toPercent(taxRate); // déjà /100
  return Math.round((ttc / (1 + rate)) * 100) / 100; // arrondi bancaire 2 décimales
};

const isValidDmyDate = (value) => {
  if (!value) return false;
  const match = /^\d{2}\/\d{2}\/\d{4}$/.test(value);
  if (!match) return false;

  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const toIsoDate = (value) => {
  if (!value) return "";
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

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
    produits: [],
    declinaisons: [],
    commandes: [],
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState([]);
  const [delimiter, setDelimiter] = useState("");
  const [imagesNonImportees, setImagesNonImportees] = useState(false);

  const validateRows = (key, rows) => {
    const rowErrors = [];
    const dateFields = DATE_FIELDS[key] || [];
    const positiveFields = POSITIVE_FIELDS[key] || [];

    rows.forEach((row, index) => {
      const lineNumber = index + 2;

      dateFields.forEach((field) => {
        const value = row[field];
        if (value && !isValidDmyDate(value)) {
          rowErrors.push(
            `Ligne ${lineNumber} : ${field} doit etre au format DD/MM/YYYY`,
          );
        }
      });

      positiveFields.forEach((field) => {
        const value = row[field];
        if (key === "declinaisons" && field === "prix_vente_ttc") {
          // Pour declinaisons, prix_vente_ttc peut être vide ou 0 (comportement par défaut)
          if (value === "" || value == null || toNumber(value) === 0) {
            return;
          }
        }
        if (value === "" || value == null) {
          rowErrors.push(
            `Ligne ${lineNumber} : ${field} doit etre un montant positif`,
          );
          return;
        }
        if (toNumber(value) <= 0) {
          rowErrors.push(
            `Ligne ${lineNumber} : ${field} doit etre un montant positif`,
          );
        }
      });
    });

    return rowErrors;
  };

  const parseCsvFile = (key, file) => {
    if (!file) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, [key]: [] }));

    //Recuperation des colonnes requises pour chaque ressource ou clé
    const required = REQUIRED_HEADERS[key] || [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: delimiter || undefined,
      transformHeader: (header) => {
        const lowerIncoming = String(header || "")
          .toLowerCase()
          .trim();
        const matchedRequired = required.find(
          (reqHeader) =>
            String(reqHeader || "")
              .toLowerCase()
              .trim() === lowerIncoming,
        );
        return matchedRequired || header;
      },
      complete: (result) => {
        const headers = result.meta.fields || [];
        const missing = formatMissing(headers, required);
        const unexpected = headers.filter((col) => !required.includes(col));
        const headerErrors = [];

        if (missing.length > 0) {
          headerErrors.push(`Colonnes manquantes: ${missing.join(", ")}`);
        }

        if (unexpected.length > 0) {
          headerErrors.push(`Colonnes non conformes: ${unexpected.join(", ")}`);
        }

        if (headerErrors.length > 0) {
          setErrors((prev) => ({ ...prev, [key]: headerErrors }));
          setParsed((prev) => ({ ...prev, [key]: [] }));
          setLoading(false);
          return;
        }

        const rows = result.data || [];
        const rowErrors = validateRows(key, rows);

        setErrors((prev) => ({ ...prev, [key]: rowErrors }));
        setParsed((prev) => ({ ...prev, [key]: rows }));
        setLoading(false);
      },
      error: (err) => {
        setErrors((prev) => ({ ...prev, [key]: [err.message] }));
        setParsed((prev) => ({ ...prev, [key]: [] }));
        setLoading(false);
      },
    });
  };

  const parseZipFile = async (file) => {
    // Verifie si le fichier existe
    if (!file) return;

    setLoading(true);

    // Initialisation des erreurs et des images parsées à vide avant de lancer le parsing du ZIP
    setErrors((prev) => ({ ...prev, images: [] }));

    try {

      // Chargement du fichier ZIP avec JSZip
      const zip = await JSZip.loadAsync(file);

      // zip.files est un objet avec comme clés les chemins des fichiers dans le ZIP, et comme valeurs des objets représentant les fichiers  
      // Recupere des chemins dans le ZIP utilisé comme clé pour avoir le vrai fichier plus tard, en filtrant pour ne garder que les fichiers (pas les dossiers) qui ne sont pas dans __MACOSX et qui ne commencent pas par ._ (fichiers cachés créés par macOS)    
      const entries = Object.keys(zip.files).filter(
        (name) => !zip.files[name].dir && !name.includes("__MACOSX") && !name.split("/").pop().startsWith("._")
      );

      //Verifie si on a trouvé des fichiers valides dans le ZIP, sinon affiche une erreur et met à jour le state des images parsées à vide
      if (entries.length === 0) {
        setErrors((prev) => ({
          ...prev,
          images: ["Le ZIP ne contient aucun fichier image valide."],
        }));
        setParsed((prev) => ({ ...prev, images: [] }));
      } else {
        setErrors((prev) => ({ ...prev, images: [] }));

        //On ne stocke que les clés pour plus de performance et repérage facile lors de l'import, le vrai fichier sera récupéré au moment de l'upload avec zip.file(entry).async("blob")
        setParsed((prev) => ({ ...prev, images: entries }));
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        images: ["ZIP invalide."],
      }));
      setParsed((prev) => ({ ...prev, images: [] }));
    } finally {
      setLoading(false);
    }
  };

  // Fonction qui met à jour le state des fichiers sélectionnés et lance le parsing du CSV ou du ZIP
  const handleFileChange = (key) => (event) => {

    //Récuperation du fichier sélectionné, ou null si aucun
    const file = event.target.files?.[0] || null;

    // On recupere l'objet dans le state et on met à jour la clé correspondante avec le nouveau fichier
    // ex :  key: produits,value :  file,
    setFiles((prev) => ({ ...prev, [key]: file }));

    // Gestion du parsing de l'image
    if (key === "images") {
      parseZipFile(file);
      return;
    }

    // Pour les autres types de fichiers, on lance le parsing du CSV
    parseCsvFile(key, file);
  };

  useEffect(() => {
    if (files.produits) parseCsvFile("produits", files.produits);
    if (files.declinaisons) parseCsvFile("declinaisons", files.declinaisons);
    if (files.commandes) parseCsvFile("commandes", files.commandes);
  }, [delimiter]);

  const hasErrors = Object.values(errors).some(
    (items) => items && items.length > 0,
  );
  const readyToImport =
    files.produits && files.declinaisons && files.commandes && !hasErrors;

  const appendLog = (message) => {
    setImportLog((prev) => [...prev, message]);
  };



  const parseAchat = (value) => {
    const entries = [];
    if (!value) return entries;
    const regex = /"([^"]+)";(\d+);"?([^"]*)"?/g;
    let match = regex.exec(value);
    while (match) {
      const entry = {
        reference: match[1],
        quantity: Number(match[2]),
        variant: match[3] || "",
      };
      const index = entries.findIndex((ent) => ent.reference === entry.reference && ent.variant === entry.variant);
      if (index !== -1) {
        entries[index].quantity += entry.quantity
      }
      else {
        entries.push(entry);
      }
      match = regex.exec(value);
    }
    return entries;
  };



  const handleImport = async () => {
    if (!readyToImport || importing) return;
    if (hasErrors) {
      appendLog("Import annule: erreurs de validation detectees.");
      return;
    }

    setImporting(true);
    setImportLog([]);

    try {
      appendLog("Preparation des donnees...");


      const produitsData = parsed.produits;
      const declinaisonsData = parsed.declinaisons;
      const commandesData = parsed.commandes;


      // date_availability_produit	nom	reference	prix_ttc	Taxe	categorie	prix_achat


      const productsByRef = {};
      const productHasCombi = {};

      declinaisonsData.forEach((row) => {
        const reference = row.reference;
        const karazany = row.karazany;
        if (reference && karazany) {
          productHasCombi[reference] = true;
        }
      });

      produitsData.forEach((row) => {
        const taxRate = toNumber(row.Taxe);
        const priceTtc = toNumber(row.prix_ttc);
        const priceHt = priceTtc / (1 + toPercent(row.Taxe));
        const wholesaleHt = toNumber(row.prix_achat);

        productsByRef[row.reference] = {
          name: row.nom,
          reference: row.reference,
          category: row.categorie,
          taxRate,
          priceTtc,
          priceHt,
          wholesaleHt,
          availableDate: toIsoDate(row.date_availability_produit),
        };
      });

      const languageIds = await fetchLanguageIds();
      appendLog(`Langues detectees: ${languageIds.join(", ")}`);

      appendLog("Creation des taxes et groupes...");
      const taxGroupByRate = {};
      for (const product of Object.values(productsByRef)) {
        if (!taxGroupByRate[product.taxRate]) {
          taxGroupByRate[product.taxRate] = await ensureTaxSetup(
            product.taxRate,
            languageIds,
          );
          appendLog(
            `Taxe ${product.taxRate}% configuree (ID Groupe: ${taxGroupByRate[product.taxRate]})`,
          );
        }
      }

      appendLog("Creation des categories...");
      const categoryByName = {};
      for (const product of Object.values(productsByRef)) {
        if (!categoryByName[product.category]) {
          categoryByName[product.category] = await ensureCategory(
            product.category,
            languageIds,
          );
          appendLog(
            `Categorie inseree: ${product.category} (ID: ${categoryByName[product.category]})`,
          );
        }
      }

      appendLog("Creation des produits...");
      const productIds = {};
      for (const product of Object.values(productsByRef)) {
        const type = productHasCombi[product.reference]
          ? "combinations"
          : "standard";
        const productId = await ensureProduct(
          product,
          taxGroupByRate[product.taxRate],
          categoryByName[product.category],
          type,
          languageIds,
        );
        productIds[product.reference] = productId;
        appendLog(`Produit insere: ${product.reference} (ID: ${productId})`);
      }

      appendLog("Creation des options et valeurs...");
      const optionIdByName = {};
      const optionValueIds = {};
      for (const row of declinaisonsData) {
        const specificite = row["specificité"] || row.specificite || "";
        const karazany = row.karazany || "";
        if (!specificite || !karazany) continue;

        if (!optionIdByName[specificite]) {
          const isColor = specificite === "couleur";
          optionIdByName[specificite] = await ensureOption(
            specificite,
            isColor ? "color" : "select",
            isColor,
            languageIds,
          );
          appendLog(
            `Option inseree: ${specificite} (ID: ${optionIdByName[specificite]})`,
          );
        }

        const key = `${specificite}:${karazany}`;
        if (!optionValueIds[key]) {
          const colorMap = { fotsy: "#FFFFFF", mainty: "#000000" };
          optionValueIds[key] = await ensureOptionValue(
            optionIdByName[specificite],
            karazany,
            colorMap[karazany],
            languageIds,
          );
          appendLog(
            `Valeur d'option inseree: ${karazany} (ID: ${optionValueIds[key]})`,
          );
        }
      }

      appendLog("Creation des declinaisons...");
      const combinationIds = {};
      for (const row of declinaisonsData) {
        const reference = row.reference;
        const specificite = row["specificité"] || row.specificite || "";
        const karazany = row.karazany || "";
        if (!reference || !specificite || !karazany) continue;

        const product = productsByRef[reference];
        const priceTtc = toNumber(row.prix_vente_ttc) || product.priceTtc;
        const priceHt = priceTtc / (1 + toPercent(product.taxRate));
        const supplement = priceHt - product.priceHt;
        const optionValueId = optionValueIds[`${specificite}:${karazany}`];
        const combRef = `${reference}-${karazany}`;

        const combId = await createCombination(
          productIds[reference],
          optionValueId,
          combRef,
          supplement,
        );
        combinationIds[combRef] = combId;
        appendLog(`Declinaison inseree: ${combRef} (ID: ${combId})`);
      }

      appendLog("Mise a jour des stocks...");
      for (const row of declinaisonsData) {
        const reference = row.reference;
        if (!reference) continue;
        const karazany = row.karazany || "";
        const quantity = Number(row.stock_initial || 0);
        const productId = productIds[reference];
        const attributeId = karazany
          ? combinationIds[`${reference}-${karazany}`]
          : 0;
        const product = productsByRef[reference];
        const dateAdd =
          product?.availableDate ||
          toIsoDate(row.date_availability_produit) ||
          new Date().toISOString().split("T")[0];

        await updateStock(productId, attributeId, quantity, dateAdd);
        appendLog(
          `Stock mis a jour: Produit ${productId}, Attribut ${attributeId}, Quantite ${quantity}`,
        );
      }

      appendLog("Upload des images...");
      if (!imagesNonImportees && files.images) {
        const zip = await JSZip.loadAsync(files.images);
        const imageEntries = Object.keys(zip.files).filter(
          (name) => !zip.files[name].dir,
        );

        for (const entry of imageEntries) {
          const ref = entry.split("/").pop().split(".")[0];
          const productId = productIds[ref];
          if (!productId) {
            appendLog(
              `Avertissement: image ${entry} ignorée (aucun produit correspondant à la référence ${ref})`,
            );
            continue;
          }
          try {
            const blob = await zip.files[entry].async("blob");
            const file = new File([blob], entry);
            await uploadProductImage(productId, file);
          } catch (imgErr) {
            appendLog(
              `Avertissement: Impossible d'uploader l'image pour ${ref} - ${imgErr.message}`,
            );
          }
        }
      } else {
        appendLog("Aucun ZIP d'images fourni, etape ignoree.");
      }

      appendLog("Creation des commandes...");
      for (const row of commandesData) {
        const customerId = await ensureCustomer(row);
        appendLog(`Client recupere/cree: ${row.email} (ID: ${customerId})`);
        const addressId = await ensureAddress(customerId, row);
        appendLog(
          `Adresse creee/associee pour le client ${customerId} (ID: ${addressId})`,
        );

        const achatItems = parseAchat(row.achat);

        const items = achatItems.map((item) => {
          const product = productsByRef[item.reference];
          const basePriceHt = calcPriceHt(product.priceTtc, product.taxRate);
          let unitPriceTtc = product.priceTtc;
          let unitPriceHt = basePriceHt;
          let attributeId = 0;
          let label = product.name;
          let ref = item.reference;

          if (item.variant) {
            const combRef = `${item.reference}-${item.variant}`;
            attributeId = combinationIds[combRef];
            const declRow = declinaisonsData.find(
              (d) =>
                d.reference === item.reference && d.karazany === item.variant,
            );
            if (declRow) {
              unitPriceTtc =
                toNumber(declRow.prix_vente_ttc) || product.priceTtc;
              unitPriceHt = calcPriceHt(unitPriceTtc, product.taxRate);
            }
            label = `${product.name} (variante : ${item.variant})`;
            ref = `${item.reference}-${item.variant}`;
          }

          unitPriceHt = Math.round(unitPriceHt * 100) / 100;
          unitPriceTtc = Math.round(unitPriceTtc * 100) / 100;

          return {
            productId: productIds[item.reference],
            attributeId,
            quantity: item.quantity,
            unitPriceHt,
            unitPriceTtc,
            reference: ref,
            label,
          };
        });

        const date = toIsoDate(row.date);
        const cartId = await createCart(customerId, addressId, items);
        appendLog(
          `Panier (Cart) cree: ID ${cartId} pour le client ${customerId}`,
        );

        await updateCartDate(cartId, date);

        if (!isCartOrderStateLabel(row.etat)) {
          const order = await createOrder(
            row,
            cartId,
            customerId,
            addressId,
            items,
          );
          const reference = await requestXml(
            `orders/${order.orderId}?display=[reference]`,
          ).then((text) => {
            const dom = parseXmlDoc(text);
            return getTextContent(dom, "order > reference");
          });

          appendLog(
            `Commande creee: ${reference} (ID: ${order.orderId}, Etat initial: ${order.stateId})`,
          );

          const orderPaymentId = await fetchIdByFilter(
            "order_payments",
            "order_payment",
            "order_reference",
            reference,
          );
          await updateOrderDate(order.orderId, date);
          await updateOrderStateWithMovement(
            order.orderId,
            order.stateId,
            date + " 00:00:00",
          );

          if (orderPaymentId) {
            await updatePaymentDate(orderPaymentId, date);
          } else {
            appendLog(`Aucun paiement trouve pour la commande ${reference}`);
          }
        } else {
          appendLog(
            `La ligne du panier ${cartId} reste à l'état "${row.etat}" (aucune commande générée)`,
          );
        }

        // order_history et order_payment sont gérés automatiquement par PrestaShop
        // grâce à l'ajout de <current_state> et <total_paid_real> lors du POST.
      }

      appendLog("Import termine.");
    } catch (err) {
      appendLog(`Erreur: ${err.message}`);
      appendLog("Rollback: reinitialisation des ressources...");

      try {
        await resetResources(RESET_KEYS, {
          onProgress: (key, value) => appendLog(`Rollback ${key} ${value}%`),
        });
        appendLog("Rollback termine.");
      } catch (resetErr) {
        appendLog(`Rollback erreur: ${resetErr.message}`);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      style={{
        padding: "2.5rem",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "2.2rem",
          fontWeight: "700",
          color: "#0f172a",
          margin: "0 0 0.5rem 0",
          letterSpacing: "-0.5px",
        }}
      >
        Import Data
      </h1>
      <p style={{ fontSize: "1.5rem", color: "#64748b", margin: "0 0 2rem 0" }}>
        Importer 3 fichiers CSV + 1 ZIP d'images.
      </p>

      {/* Option de séparateur CSV */}
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="csv-delimiter">Séparateur CSV : </label>
        <select
          id="csv-delimiter"
          value={delimiter}
          onChange={(e) => setDelimiter(e.target.value)}
        >
          <option value="">Détection automatique</option>
          <option value=",">Virgule (,)</option>
          <option value=";">Point-virgule (;)</option>
        </select>
      </div>

      {/* Input pour Produits/Categories (CSV)  */}
      <div>
        <label htmlFor="csv-produits">CSV Produits/Categories</label>
        <br />
        <input
          id="csv-produits"
          type="file"
          accept=".csv"
          // OnChange attend une fonction avec un arg mais pas une valeur de fonction 
          onChange={handleFileChange("produits")}
        />
      </div>

      {/* Input pour Declinaisons/Stocks (CSV) */}
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

      {/* Input pour Commandes (CSV) */}
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

      {/* Input pour Images (ZIP) */}
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

      {/* Checkbox pour ne pas importer les images */}
      <input
        type="checkbox"
        checked={imagesNonImportees}
        onChange={(e) => setImagesNonImportees(e.target.checked)}
      />
      <label>Ne pas importer les images</label>

      <br />

      {/* Bouton qui declenche l'import */}
      <button
        disabled={!readyToImport || loading || importing}
        onClick={handleImport}
      >
        {importing ? "Import en cours..." : "Importer"}
      </button>

      {/*  Resumé des fichiers selectionnés */}
      <div>
        <p>Fichiers selectionnes :</p>
        <ul>
          <li>Produits/Categories : {files.produits?.name || "-"}</li>
          <li>Declinaisons/Stocks : {files.declinaisons?.name || "-"}</li>
          <li>Commandes : {files.commandes?.name || "-"}</li>
          <li>Images ZIP : {files.images?.name || "-"}</li>
        </ul>
      </div>

      {/*  Etape de validation de chaque fichier */}
      <div>
        <h3>Validation</h3>
        <ul>
          <li>
            Produits/Categories :{" "}
            {errors.produits.length > 0
              ? `${errors.produits.length} erreur(s)`
              : "OK"}
          </li>
          <li>
            Declinaisons/Stocks :{" "}
            {errors.declinaisons.length > 0
              ? `${errors.declinaisons.length} erreur(s)`
              : "OK"}
          </li>
          <li>
            Commandes :{" "}
            {errors.commandes.length > 0
              ? `${errors.commandes.length} erreur(s)`
              : "OK"}
          </li>
          <li>
            Images ZIP :{" "}
            {errors.images.length > 0
              ? `${errors.images.length} erreur(s)`
              : "OK"}
          </li>
        </ul>

        {(errors.produits.length > 0 ||
          errors.declinaisons.length > 0 ||
          errors.commandes.length > 0 ||
          errors.images.length > 0) && (
            <details>
              <summary>Details des erreurs</summary>
              <ul>
                {errors.produits.map((item, index) => (
                  <li key={`produits-${index}`}>Produits: {item}</li>
                ))}
                {errors.declinaisons.map((item, index) => (
                  <li key={`declinaisons-${index}`}>Declinaisons: {item}</li>
                ))}
                {errors.commandes.map((item, index) => (
                  <li key={`commandes-${index}`}>Commandes: {item}</li>
                ))}
                {errors.images.map((item, index) => (
                  <li key={`images-${index}`}>Images: {item}</li>
                ))}
              </ul>
            </details>
          )}
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

      {/* Log de l'import pour le suivi  */}
      <div>
        <h3>Log import</h3>
        <ul>
          {importLog.map((line, index) => (
            <li key={`${line}-${index}`}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ImportData;
