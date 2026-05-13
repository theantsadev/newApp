import { useState } from "react";

const RESET_RESOURCES = [
  { key: "order_histories", label: "Historique commandes" },
  { key: "order_payments", label: "Paiements commandes" },
  { key: "orders", label: "Commandes" },
  { key: "carts", label: "Paniers" },
  { key: "addresses", label: "Adresses" },
  { key: "customers", label: "Clients" },
  { key: "stock_availables", label: "Stocks" },
  { key: "combinations", label: "Declinaisons" },
  { key: "product_option_values", label: "Valeurs options" },
  { key: "product_options", label: "Options" },
  { key: "products", label: "Produits" },
  { key: "categories", label: "Categories" },
  { key: "tax_rules", label: "Regles de taxes" },
  { key: "tax_rule_groups", label: "Groupes de taxes" },
  { key: "taxes", label: "Taxes" },
];

const ResetData = () => {
  const [selection, setSelection] = useState(
    RESET_RESOURCES.map((resource) => resource.key),
  );
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

  const handleReset = () => {
    setRapport(null);

    if (selection.length === 0) return;

    const confirmed = window.confirm(
      "Confirmer la suppression des ressources selectionnees ?",
    );

    if (!confirmed) return;

    const orderedSelection = RESET_RESOURCES.filter((resource) =>
      selection.includes(resource.key),
    );

    setRapport({
      total: orderedSelection.length,
      resources: orderedSelection.map((resource) => resource.label),
    });
  };

  return (
    <div>
      <h1>Reset Data</h1>
      <p>Cette page permet de reinitialiser les donnees PrestaShop.</p>

      <div>
        <button onClick={selectAll}>Tout selectionner</button>
        <button onClick={clearAll}>Tout deselectionner</button>
      </div>

      <table border={1}>
        <thead>
          <tr>
            <th>Selection</th>
            <th>Ordre</th>
            <th>Ressource</th>
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
                />
              </td>
              <td>{index + 1}</td>
              <td>{resource.label}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />
      <button onClick={handleReset} disabled={selection.length === 0}>
        Reinitialiser
      </button>

      {rapport && (
        <div>
          <h3>Apercu suppression</h3>
          <p>{rapport.total} ressource(s) seront traitees.</p>
          <ul>
            {rapport.resources.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResetData;
