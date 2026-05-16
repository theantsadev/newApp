import { useState } from "react";
import {
  deleteOne,
  getAllIds,
  requestXml,
} from "../../services/prestashopClient";
import { parseXmlDoc } from "../../shared/xmlUtils";

const RESET_RESOURCES = [
  {
    key: "order_histories",
    label: "Historique commandes",
    endpoint: "order_histories",
    tag: "order_history",
  },
  {
    key: "order_payments",
    label: "Paiements commandes",
    endpoint: "order_payments",
    tag: "order_payment",
  },
  { key: "orders", label: "Commandes", endpoint: "orders", tag: "order" },
  { key: "carts", label: "Paniers", endpoint: "carts", tag: "cart" },
  {
    key: "addresses",
    label: "Adresses",
    endpoint: "addresses",
    tag: "address",
  },
  {
    key: "customers",
    label: "Clients",
    endpoint: "customers",
    tag: "customer",
  },
  {
    key: "stock_availables",
    label: "Stocks",
    endpoint: "stock_availables",
    tag: "stock_available",
  },
  {
    key: "combinations",
    label: "Declinaisons",
    endpoint: "combinations",
    tag: "combination",
  },
  {
    key: "product_option_values",
    label: "Valeurs options",
    endpoint: "product_option_values",
    tag: "product_option_value",
  },
  {
    key: "product_options",
    label: "Options",
    endpoint: "product_options",
    tag: "product_option",
  },
  {
    key: "product_images",
    label: "Images produits",
    endpoint: "images/products",
    tag: "product",
  },
  { key: "products", label: "Produits", endpoint: "products", tag: "product" },
  {
    key: "categories",
    label: "Categories",
    endpoint: "categories",
    tag: "category",
  },
  {
    key: "tax_rules",
    label: "Regles de taxes",
    endpoint: "tax_rules",
    tag: "tax_rule",
  },
  {
    key: "tax_rule_groups",
    label: "Groupes de taxes",
    endpoint: "tax_rule_groups",
    tag: "tax_rule_group",
  },
  { key: "taxes", label: "Taxes", endpoint: "taxes", tag: "tax" },
];

const ResetData = () => {
  const [selection, setSelection] = useState(
    RESET_RESOURCES.map((resource) => resource.key),
  );
  const [enCours, setEnCours] = useState(false);
  const [progression, setProgression] = useState({});
  const [rapport, setRapport] = useState(null);

  const toggleSelection = (key) => {
    setSelection((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const selectAll = () => {
    setSelection(RESET_RESOURCES.map((resource) => resource.key));
  };

  const clearAll = () => {
    setSelection([]);
  };

  const handleReset = async () => {
    setRapport(null);

    if (selection.length === 0) return;

    const confirmed = window.confirm(
      "Confirmer la suppression des ressources selectionnees ?",
    );

    if (!confirmed) return;

    const orderedSelection = RESET_RESOURCES.filter((resource) =>
      selection.includes(resource.key),
    );

    setEnCours(true);
    setProgression({});

    const rapportFinal = {};

    for (const resource of orderedSelection) {
      rapportFinal[resource.key] = {
        label: resource.label,
        succes: 0,
        erreurs: [],
      };

      try {
        const ids =
          resource.key === "product_images"
            ? await getAllIds("products", resource.tag)
            : await getAllIds(resource.endpoint, resource.tag);

        if (ids.length === 0) {
          setProgression((prev) => ({ ...prev, [resource.key]: 100 }));
          continue;
        }

        for (const [index, id] of ids.entries()) {
          try {
            if (resource.key === "stock_availables") {
              const xmlText = await requestXml(`stock_availables/${id}`);
              const dom = parseXmlDoc(xmlText);
              const stock = dom.querySelector("stock_available");
              const productId = stock
                ?.querySelector("id_product")
                ?.textContent.trim();
              const attributeId = stock
                ?.querySelector("id_product_attribute")
                ?.textContent.trim();

              const updateXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <stock_available>
    <id><![CDATA[${id}]]></id>
    <id_product><![CDATA[${productId}]]></id_product>
    <id_product_attribute><![CDATA[${attributeId}]]></id_product_attribute>
    <quantity><![CDATA[0]]></quantity>
    <depends_on_stock><![CDATA[0]]></depends_on_stock>
    <out_of_stock><![CDATA[1]]></out_of_stock>
  </stock_available>
</prestashop>`;

              await requestXml(`stock_availables/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/xml" },
                body: updateXml,
              });
            } else {
              await deleteOne(resource.endpoint, id);
            }

            rapportFinal[resource.key].succes++;
          } catch (err) {
            rapportFinal[resource.key].erreurs.push(`${id} : ${err.message}`);
          }

          setProgression((prev) => ({
            ...prev,
            [resource.key]: Math.round(((index + 1) / ids.length) * 100),
          }));
        }
      } catch (err) {
        rapportFinal[resource.key].erreurs.push(`GET : ${err.message}`);
      }
    }

    setRapport(rapportFinal);
    setEnCours(false);
  };

  return (
    <div>
      <h1>Reset Data</h1>
      <p>Cette page permet de reinitialiser les donnees PrestaShop.</p>

      <div>
        <button onClick={selectAll} disabled={enCours}>
          Tout selectionner
        </button>
        <button onClick={clearAll} disabled={enCours}>
          Tout deselectionner
        </button>
      </div>

      <table border={1}>
        <thead>
          <tr>
            <th>Selection</th>
            <th>Ordre</th>
            <th>Ressource</th>
            <th>Progression</th>
          </tr>
        </thead>
        <tbody>
          {RESET_RESOURCES.map((resource, index) => (
            <tr key={resource.key}>
              <td>
                <input
                  type="checkbox"
                  checked={selection.includes(resource.key)}
                  onChange={() => toggleSelection(resource.key)}
                  disabled={enCours}
                />
              </td>
              <td>{index + 1}</td>
              <td>{resource.label}</td>
              <td>
                {progression[resource.key] !== undefined && (
                  <span>{progression[resource.key]}%</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />
      <button
        onClick={handleReset}
        disabled={selection.length === 0 || enCours}
        style={{ color: "red" }}
      >
        {enCours ? "Reinitialisation en cours..." : "Reinitialiser"}
      </button>

      {rapport && (
        <div>
          <h3>Rapport de reinitialisation</h3>
          {Object.values(rapport).map((item) => (
            <div key={item.label}>
              <strong>{item.label}</strong>
              <div>Supprimes : {item.succes}</div>
              {item.erreurs.length > 0 && (
                <div style={{ color: "red" }}>{item.erreurs.join(", ")}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResetData;
