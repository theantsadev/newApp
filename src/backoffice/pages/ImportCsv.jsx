import { useState, useRef } from "react";
import Papa from "papaparse";
import { deleteOne, getAllIds, postXml } from "../../services/prestashopClient";

const RESSOURCES = [
  {
    label: "Produits",
    endpoint: "products",
    tag: "product",
    mapping: (row) => ({
      reference: row.reference || "",
      supplier_reference: row.supplier_reference || "",
      ean13: row.ean13 || "",
      mpn: row.mpn || "",
      product_type: row.product_type || "standard",
      location: row.location || "",
      id_manufacturer: row.id_manufacturer || "1",
      id_supplier: row.id_supplier || "1",
      id_category_default: row.id_category_default || "1",
      width: row.width || "0",
      height: row.height || "0",
      depth: row.depth || "0",
      weight: row.weight || "0",
      minimal_quantity: row.minimal_quantity || "1",
      price: row.price || "0",
      wholesale_price: row.wholesale_price || "0",
      unit_price: row.unit_price || "0",
      active: row.active || "1",
      available_for_order: row.available_for_order || "1",
      on_sale: row.on_sale || "0",
      online_only: row.online_only || "0",
      name_1: row.name_fr || row.name_1 || "",
      name_2: row.name_en || row.name_2 || "",
      description_1: row.description_fr || row.description_1 || "",
      description_2: row.description_en || row.description_2 || "",
      description_short_1:
        row.description_short_fr || row.description_short_1 || "",
      description_short_2:
        row.description_short_en || row.description_short_2 || "",
      meta_description_1:
        row.meta_description_fr || row.meta_description_1 || "",
      meta_description_2:
        row.meta_description_en || row.meta_description_2 || "",
    }),
    buildXml: (fields) => {
      const c = (v) => `<![CDATA[${v}]]>`;
      const ml = (name) =>
        `<${name}><language id="1">${c(fields[name + "_1"])}</language><language id="2">${c(fields[name + "_2"])}</language></${name}>`;
      return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
<product>
  <id_manufacturer>${c(fields.id_manufacturer)}</id_manufacturer>
  <id_supplier>${c(fields.id_supplier)}</id_supplier>
  <id_category_default>${c(fields.id_category_default)}</id_category_default>
  <id_tax_rules_group>${c("1")}</id_tax_rules_group>
  <id_shop_default>${c("1")}</id_shop_default>
  <reference>${c(fields.reference)}</reference>
  <supplier_reference>${c(fields.supplier_reference)}</supplier_reference>
  <ean13>${c(fields.ean13)}</ean13>
  <mpn>${c(fields.mpn)}</mpn>
  <product_type>${c(fields.product_type)}</product_type>
  <location>${c(fields.location)}</location>
  <width>${c(fields.width)}</width>
  <height>${c(fields.height)}</height>
  <depth>${c(fields.depth)}</depth>
  <weight>${c(fields.weight)}</weight>
  <minimal_quantity>${c(fields.minimal_quantity)}</minimal_quantity>
  <price>${c(fields.price)}</price>
  <wholesale_price>${c(fields.wholesale_price)}</wholesale_price>
  <unit_price>${c(fields.unit_price)}</unit_price>
  <active>${c(fields.active)}</active>
  <available_for_order>${c(fields.available_for_order)}</available_for_order>
  <online_only>${c(fields.online_only)}</online_only>
  <on_sale>${c(fields.on_sale)}</on_sale>
  <state>${c("1")}</state>
  <cache_is_pack>${c("0")}</cache_is_pack>
  <is_virtual>${c("0")}</is_virtual>
  ${ml("name")}
  ${ml("description")}
  ${ml("description_short")}
  ${ml("meta_description")}
  <meta_keywords><language id="1">${c("")}</language><language id="2">${c("")}</language></meta_keywords>
  <meta_title><language id="1">${c("")}</language><language id="2">${c("")}</language></meta_title>
  <link_rewrite><language id="1">${c("")}</language><language id="2">${c("")}</language></link_rewrite>
  <associations>
    <categories>
      <category><id>${c(fields.id_category_default)}</id></category>
    </categories>
  </associations>
</product>
</prestashop>`;
    },
  },
  {
    label: "Categories",
    endpoint: "categories",
    tag: "category",
    mapping: (row) => ({
      id_parent: row["Parent category"] || "2",
      active: row["Active (0/1)"] || "1",
      name_1: row["Name *"] || "",
      name_2: row["Name *"] || "",
      description_1: row["Description"] || "",
      description_2: row["Description"] || "",
      link_rewrite_1: row["URL rewritten"] || "",
      link_rewrite_2: row["URL rewritten"] || "",
    }),
    buildXml: (fields) => {
      const c = (v) => `<![CDATA[${v}]]>`;
      const slugify = (str) =>
        str
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

      return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
<category>
  <id_parent>${c(fields.id_parent)}</id_parent>
  <active>${c(fields.active)}</active>
  <name>
    <language id="1">${c(fields.name_1)}</language>
    <language id="2">${c(fields.name_2)}</language>
  </name>
  <description>
    <language id="1">${c(fields.description_1)}</language>
    <language id="2">${c(fields.description_2)}</language>
  </description>
  <link_rewrite>
    <language id="1">${c(fields.link_rewrite_1 || slugify(fields.name_1))}</language>
    <language id="2">${c(fields.link_rewrite_2 || slugify(fields.name_2))}</language>
  </link_rewrite>
</category>
</prestashop>`;
    },
  },
];

const ImportCsv = () => {
  const fileRef = useRef();

  const [onglet, setOnglet] = useState("import");
  const [endpointSelectionne, setEndpointSelectionne] = useState(
    RESSOURCES[0].endpoint,
  );
  const [lignes, setLignes] = useState([]);
  const [progression, setProgression] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [rapport, setRapport] = useState(null);

  const [selectionReinit, setSelectionReinit] = useState([]);
  const [progressionReinit, setProgressionReinit] = useState({});
  const [rapportReinit, setRapportReinit] = useState(null);

  const handleCsv = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRapport(null);
    setProgression(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => setLignes(result.data),
    });
  };

  const handleImport = async () => {
    const ressource = RESSOURCES.find(
      (r) => r.endpoint === endpointSelectionne,
    );
    setEnCours(true);
    setRapport(null);
    setProgression(0);

    const succes = [];
    const erreurs = [];

    for (const [index, row] of lignes.entries()) {
      try {
        const fields = ressource.mapping(row);
        const xml = ressource.buildXml(fields);
        const id = await postXml(ressource.endpoint, xml);
        succes.push({ index: index + 1, id });
      } catch (err) {
        erreurs.push({ index: index + 1, ligne: row, erreur: err.message });
      }
      setProgression(Math.round(((index + 1) / lignes.length) * 100));
    }

    setRapport({ succes, erreurs });
    setEnCours(false);
  };

  const toggleReinit = (endpoint) => {
    setSelectionReinit((prev) =>
      prev.includes(endpoint)
        ? prev.filter((e) => e !== endpoint)
        : [...prev, endpoint],
    );
  };

  const handleReinit = async () => {
    setEnCours(true);
    setRapportReinit(null);
    setProgressionReinit({});

    const rapport = {};

    for (const endpoint of selectionReinit) {
      const ressource = RESSOURCES.find((r) => r.endpoint === endpoint);
      rapport[endpoint] = { succes: 0, erreurs: [] };

      try {
        const ids = await getAllIds(endpoint, ressource.tag);

        for (const [i, id] of ids.entries()) {
          try {
            await deleteOne(endpoint, id);
            rapport[endpoint].succes++;
          } catch (err) {
            rapport[endpoint].erreurs.push({ id, erreur: err.message });
          }
          setProgressionReinit((prev) => ({
            ...prev,
            [endpoint]: Math.round(((i + 1) / ids.length) * 100),
          }));
        }
      } catch (err) {
        rapport[endpoint].erreurs.push({ id: "GET", erreur: err.message });
      }
    }

    setRapportReinit(rapport);
    setEnCours(false);
  };

  const ressourceActive = RESSOURCES.find(
    (r) => r.endpoint === endpointSelectionne,
  );

  return (
    <div>
      <h1>Gestion des donnees PrestaShop</h1>

      <div>
        <button
          onClick={() => setOnglet("import")}
          disabled={onglet === "import"}
        >
          Import CSV
        </button>
        <button
          onClick={() => setOnglet("reinit")}
          disabled={onglet === "reinit"}
        >
          Reinitialisation
        </button>
      </div>

      <hr />

      {onglet === "import" && (
        <div>
          <h2>Import CSV</h2>

          <div>
            <label>Ressource cible : </label>
            <select
              value={endpointSelectionne}
              onChange={(e) => {
                setEndpointSelectionne(e.target.value);
                setLignes([]);
                setRapport(null);
                setProgression(0);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              {RESSOURCES.map((r) => (
                <option key={r.endpoint} value={r.endpoint}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <br />

          <details>
            <summary>
              Colonnes CSV attendues pour "{ressourceActive.label}"
            </summary>
            <ul>
              {Object.keys(ressourceActive.mapping({})).map((col) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          </details>

          <br />

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleCsv}
            disabled={enCours}
          />

          {lignes.length > 0 && (
            <div>
              <p>
                {lignes.length} ligne{lignes.length > 1 ? "s" : ""} detectee
                {lignes.length > 1 ? "s" : ""}
              </p>
              <details>
                <summary>
                  Apercu ({Math.min(3, lignes.length)} premieres lignes)
                </summary>
                <table border={1}>
                  <thead>
                    <tr>
                      {Object.keys(lignes[0]).map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.slice(0, 3).map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>

              <br />
              <button onClick={handleImport} disabled={enCours}>
                {enCours
                  ? `Import en cours... ${progression}%`
                  : `Importer ${lignes.length} ligne(s)`}
              </button>
            </div>
          )}

          {enCours && (
            <div>
              <progress
                value={progression}
                max={100}
                style={{ width: "100%" }}
              />
              <span>{progression}%</span>
            </div>
          )}

          {rapport && (
            <div>
              <h3>Rapport d'import</h3>
              <p style={{ color: "green" }}>OK {rapport.succes.length} succes</p>
              <p style={{ color: "red" }}>KO {rapport.erreurs.length} erreur(s)</p>

              {rapport.erreurs.length > 0 && (
                <details>
                  <summary>Voir les erreurs</summary>
                  <table border={1}>
                    <thead>
                      <tr>
                        <th>Ligne</th>
                        <th>Erreur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rapport.erreurs.map((e, i) => (
                        <tr key={i}>
                          <td>{e.index}</td>
                          <td>{e.erreur}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {onglet === "reinit" && (
        <div>
          <h2>Reinitialisation des donnees</h2>
          <p style={{ color: "red" }}>
            Attention : cette action supprime definitivement toutes les
            entrees selectionnees.
          </p>

          <table border={1}>
            <thead>
              <tr>
                <th>Selection</th>
                <th>Ressource</th>
                <th>Progression</th>
              </tr>
            </thead>
            <tbody>
              {RESSOURCES.map((r) => (
                <tr key={r.endpoint}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectionReinit.includes(r.endpoint)}
                      onChange={() => toggleReinit(r.endpoint)}
                      disabled={enCours}
                    />
                  </td>
                  <td>{r.label}</td>
                  <td>
                    {progressionReinit[r.endpoint] !== undefined && (
                      <progress
                        value={progressionReinit[r.endpoint]}
                        max={100}
                        style={{ width: "100px" }}
                      />
                    )}
                    {progressionReinit[r.endpoint] !== undefined &&
                      ` ${progressionReinit[r.endpoint]}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <br />
          <button
            onClick={handleReinit}
            disabled={enCours || selectionReinit.length === 0}
            style={{ color: "red" }}
          >
            {enCours
              ? "Reinitialisation en cours..."
              : `Reinitialiser (${selectionReinit.length} ressource(s) selectionnee(s))`}
          </button>

          {rapportReinit && (
            <div>
              <h3>Rapport de reinitialisation</h3>
              <table border={1}>
                <thead>
                  <tr>
                    <th>Ressource</th>
                    <th>Supprimes</th>
                    <th>Erreurs</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(rapportReinit).map(([endpoint, r]) => {
                    const ressource = RESSOURCES.find(
                      (res) => res.endpoint === endpoint,
                    );
                    return (
                      <tr key={endpoint}>
                        <td>{ressource?.label}</td>
                        <td style={{ color: "green" }}>OK {r.succes}</td>
                        <td
                          style={{
                            color: r.erreurs.length > 0 ? "red" : "inherit",
                          }}
                        >
                          {r.erreurs.length > 0
                            ? r.erreurs
                                .map((e) => `${e.id} : ${e.erreur}`)
                                .join(", ")
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportCsv;
