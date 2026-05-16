import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProductById } from "../../services/productService";
import { fetchCombinationsByProduct } from "../../services/combinationService";
import { fetchProductOptionList } from "../../services/productOptionService";
import { fetchProductOptionValueList } from "../../services/productOptionValueService";
import { getStoredCart, setStoredCart } from "../../services/cartService";
import { fetchTaxRate } from "../../services/taxService";

const Produit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [produit, setProduit] = useState(null);
  const [combinations, setCombinations] = useState([]);
  const [optionsWithValues, setOptionsWithValues] = useState([]);
  const [selectedValues, setSelectedValues] = useState({});
  const [selectedCombination, setSelectedCombination] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [taxRate, setTaxRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ useEffect 1 — chargement initial
  useEffect(() => {
    Promise.all([
      fetchProductById(id),
      fetchCombinationsByProduct(id),
      fetchProductOptionList(),
      fetchProductOptionValueList(),
    ])
      .then(
        async ([
          produit,
          combinations,
          productOptionList,
          productOptionValueList,
        ]) => {
          setProduit(produit);
          setCombinations(combinations);
          
          if (produit?.id_tax_rules_group) {
            const rate = await fetchTaxRate(produit.id_tax_rules_group);
            setTaxRate(rate);
          }

          if (combinations.length > 0) {
            const prodValueIds = produit.option_value_ids;

            const joined = productOptionList
              .map((option) => ({
                ...option,
                valeurs: productOptionValueList
                  .filter(
                    (val) =>
                      Number(val.id_product_option) === Number(option.id),
                  )
                  .filter((val) => prodValueIds.includes(Number(val.id))),
              }))
              .filter((opt) => opt.valeurs.length > 0);
            console.log("options avec valeurs", joined);
            setOptionsWithValues(joined);

            // Sélection par défaut
            const defaultCombo = combinations.find(
              (c) => Number(c.id) === Number(produit.id_declinaison),
            );
            if (defaultCombo) {
              const defaultSelected = {};
              productOptionValueList.forEach((ov) => {
                if (
                  defaultCombo.option_value_ids
                    .map(Number)
                    .includes(Number(ov.id))
                ) {
                  defaultSelected[ov.id_product_option] = Number(ov.id);
                }
              });
              setSelectedValues(defaultSelected);
              setSelectedCombination(defaultCombo);
            }
          }

          setLoading(false);
        },
      )
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [id]);

  // ✅ useEffect 2 — recalcul combinaison quand selectedValues change
  useEffect(() => {
    if (!combinations || combinations.length === 0) return;
    const selVals = Object.values(selectedValues).map(Number);
    if (selVals.length === 0) {
      setSelectedCombination(null);
      return;
    }
    const match = combinations.find((combo) =>
      selVals.every((vid) => combo.option_value_ids.map(Number).includes(vid)),
    );
    setSelectedCombination(match || null);
  }, [selectedValues, combinations]);

  // ✅ return conditionnels APRÈS tous les hooks
  if (error) return <div>Erreur : {error.message}</div>;
  if (loading) return <div>Chargement ...</div>;

  const handleSelectChange = (optionId, valueId) => {
    setSelectedValues((prev) => ({ ...prev, [optionId]: Number(valueId) }));
  };

  const addToCart = (e) => {
    e.preventDefault();
    const cart = JSON.parse(getStoredCart() || "[]");
    const existingIndex = cart.findIndex(
      (item) => item.id_product === produit.id && item.id_product_attribute === (selectedCombination?.id ?? 0)
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity = Number(cart[existingIndex].quantity) + Number(quantity);
    } else {
      cart.push({
        id_product: produit.id,
        id_product_attribute: selectedCombination?.id ?? 0,
        quantity,
        nom: produit.nom,
        prix: prixAffiche,
        reference: referenceAffichee,
      });
    }
    setStoredCart(JSON.stringify(cart));
    alert("Produit ajouté au panier !");
  };

  const prixHT = selectedCombination
    ? (Number(produit.prix) + Number(selectedCombination.prix))
    : Number(produit.prix);
  const prixTTC = prixHT * (1 + taxRate / 100);
  const prixAffiche = prixTTC.toFixed(2);

  const referenceAffichee =
    selectedCombination?.reference || produit?.reference || "-";

  return (
    <div>
      <h1>Produit #{produit.id}</h1>

      <form onSubmit={addToCart}>
        {optionsWithValues.map((opt) => (
          <div key={opt.id} style={{ marginBottom: 8 }}>
            <label style={{ marginRight: 8 }}>
              {opt.name || `Option ${opt.id}`}
            </label>
            {opt.valeurs.some((v) => v.color) ? (
              <div style={{ display: "flex", gap: 8 }}>
                {opt.valeurs.map((val) => (
                  <button
                    key={val.id}
                    type="button"
                    onClick={() => handleSelectChange(opt.id, val.id)}
                    title={val.name}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: val.color,
                      border:
                        selectedValues[opt.id] === Number(val.id)
                          ? "3px solid #333"
                          : "2px solid #ccc",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            ) : (
              <select
                value={selectedValues[opt.id] ?? ""}
                onChange={(e) => handleSelectChange(opt.id, e.target.value)}
              >
                {opt.valeurs.map((val) => (
                  <option key={val.id} value={val.id}>
                    {val.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}

        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <button type="submit">Ajouter au panier</button>
      </form>

      <table border={1}>
        <tbody>
          <tr>
            <th>Image</th>
            <td>
              <img src={produit.image} alt="Sans image" />
            </td>
          </tr>
          <tr>
            <th>Nom</th>
            <td>{produit.nom || "Sans nom"}</td>
          </tr>
          <tr>
            <th>Prix TTC</th>
            <td>{prixAffiche} EUR</td>
          </tr>
          <tr>
            <th>Prix HT</th>
            <td>{prixHT.toFixed(2)} EUR</td>
          </tr>
          <tr>
            <th>TVA</th>
            <td>{taxRate}%</td>
          </tr>
          <tr>
            <th>Reference</th>
            <td>{referenceAffichee}</td>
          </tr>
          <tr>
            <th>Quantite</th>
            <td>{produit.quantite}</td>
          </tr>
          <tr>
            <th>Condition</th>
            <td>{produit.condition}</td>
          </tr>
          <tr>
            <th>Actif</th>
            <td>{produit.actif === 1 ? "Oui" : "Non"}</td>
          </tr>
          <tr>
            <th>Ajoute le</th>
            <td>{produit.date_ajout}</td>
          </tr>
          <tr>
            <th>Description</th>
            <td>{produit.description || "-"}</td>
          </tr>
        </tbody>
      </table>

      <button onClick={() => navigate(-1)}>
        Retourner a la page precedente
      </button>
    </div>
  );
};

export default Produit;
