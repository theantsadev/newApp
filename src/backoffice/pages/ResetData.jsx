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
  return (
    <div>
      <h1>Reset Data</h1>
      <p>Cette page permet de reinitialiser les donnees PrestaShop.</p>

      <table border={1}>
        <thead>
          <tr>
            <th>Ordre</th>
            <th>Ressource</th>
          </tr>
        </thead>
        <tbody>
          {RESET_RESOURCES.map((resource, index) => (
            <tr key={resource.key}>
              <td>{index + 1}</td>
              <td>{resource.label}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />
      <button disabled>Reinitialiser</button>
    </div>
  );
};

export default ResetData;
