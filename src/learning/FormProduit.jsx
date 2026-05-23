import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProductFromXml } from "../services/productService";

const FormProduit = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeLang, setActiveLang] = useState(1);

  const [form, setForm] = useState({
    reference: "",
    supplier_reference: "",
    ean13: "",
    mpn: "",
    product_type: "standard",
    location: "",
    id_manufacturer: "1",
    id_supplier: "1",
    id_category_default: "1",
    width: "",
    height: "",
    depth: "",
    weight: "",
    minimal_quantity: "1",
    price: "",
    wholesale_price: "",
    unit_price: "",
    active: true,
    available_for_order: true,
    online_only: false,
    on_sale: false,
    name_1: "",
    name_2: "",
    description_1: "",
    description_2: "",
    description_short_1: "",
    description_short_2: "",
    meta_description_1: "",
    meta_description_2: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const buildXml = () => {
    const cdata = (val) => `<![CDATA[${val || ""}]]>`;
    const ml = (field) =>
      `<${field}><language id="1">${cdata(form[field + "_1"])}</language><language id="2">${cdata(form[field + "_2"])}</language></${field}>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
<product>
  <id_manufacturer>${cdata(form.id_manufacturer)}</id_manufacturer>
  <id_supplier>${cdata(form.id_supplier)}</id_supplier>
  <id_category_default>${cdata(form.id_category_default)}</id_category_default>
  <id_tax_rules_group>${cdata("1")}</id_tax_rules_group>
  <id_shop_default>${cdata("1")}</id_shop_default>
  <reference>${cdata(form.reference)}</reference>
  <supplier_reference>${cdata(form.supplier_reference)}</supplier_reference>
  <ean13>${cdata(form.ean13)}</ean13>
  <mpn>${cdata(form.mpn)}</mpn>
  <product_type>${cdata(form.product_type)}</product_type>
  <location>${cdata(form.location)}</location>
  <width>${cdata(form.width || "0")}</width>
  <height>${cdata(form.height || "0")}</height>
  <depth>${cdata(form.depth || "0")}</depth>
  <weight>${cdata(form.weight || "0")}</weight>
  <minimal_quantity>${cdata(form.minimal_quantity || "1")}</minimal_quantity>
  <price>${cdata(form.price || "0")}</price>
  <wholesale_price>${cdata(form.wholesale_price || "0")}</wholesale_price>
  <unit_price>${cdata(form.unit_price || "0")}</unit_price>
  <active>${cdata(form.active ? "1" : "0")}</active>
  <available_for_order>${cdata(form.available_for_order ? "1" : "0")}</available_for_order>
  <online_only>${cdata(form.online_only ? "1" : "0")}</online_only>
  <on_sale>${cdata(form.on_sale ? "1" : "0")}</on_sale>
  <state>${cdata("1")}</state>
  <cache_is_pack>${cdata("0")}</cache_is_pack>
  <is_virtual>${cdata("0")}</is_virtual>
  ${ml("name")}
  ${ml("description")}
  ${ml("description_short")}
  ${ml("meta_description")}
  <meta_keywords><language id="1">${cdata("")}</language><language id="2">${cdata("")}</language></meta_keywords>
  <meta_title><language id="1">${cdata("")}</language><language id="2">${cdata("")}</language></meta_title>
  <link_rewrite><language id="1">${cdata("")}</language><language id="2">${cdata("")}</language></link_rewrite>
  <associations>
    <categories>
      <category><id>${cdata(form.id_category_default)}</id></category>
    </categories>
  </associations>
</product>
</prestashop>`;
  };

  const handleSubmit = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const xml = buildXml();

    createProductFromXml(xml)
      .then((id) => {
        setSuccess(`Produit cree avec succes - ID : ${id}`);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  };

  const handleReset = () => {
    setForm({
      reference: "",
      supplier_reference: "",
      ean13: "",
      mpn: "",
      product_type: "standard",
      location: "",
      id_manufacturer: "1",
      id_supplier: "1",
      id_category_default: "1",
      width: "",
      height: "",
      depth: "",
      weight: "",
      minimal_quantity: "1",
      price: "",
      wholesale_price: "",
      unit_price: "",
      active: true,
      available_for_order: true,
      online_only: false,
      on_sale: false,
      name_1: "",
      name_2: "",
      description_1: "",
      description_2: "",
      description_short_1: "",
      description_short_2: "",
      meta_description_1: "",
      meta_description_2: "",
    });
    setError(null);
    setSuccess(null);
  };

  if (loading) return <div>Envoi en cours...</div>;

  return (
    <div>
      <h1>Creer un produit</h1>

      {error && <div style={{ color: "red" }}>Erreur : {error.message}</div>}
      {success && <div style={{ color: "green" }}>{success}</div>}

      <h2>Informations generales</h2>
      <table border={1}>
        <tbody>
          <tr>
            <th>Reference</th>
            <td>
              <input
                name="reference"
                value={form.reference}
                onChange={handleChange}
              />
            </td>
          </tr>
          <tr>
            <th>Reference fournisseur</th>
            <td>
              <input
                name="supplier_reference"
                value={form.supplier_reference}
                onChange={handleChange}
              />
            </td>
          </tr>
          <tr>
            <th>EAN13</th>
            <td>
              <input
                name="ean13"
                value={form.ean13}
                onChange={handleChange}
                maxLength={13}
              />
            </td>
          </tr>
          <tr>
            <th>MPN</th>
            <td>
              <input name="mpn" value={form.mpn} onChange={handleChange} />
            </td>
          </tr>
          <tr>
            <th>Type</th>
            <td>
              <select
                name="product_type"
                value={form.product_type}
                onChange={handleChange}
              >
                <option value="standard">Standard</option>
                <option value="pack">Pack</option>
                <option value="virtual">Virtuel</option>
              </select>
            </td>
          </tr>
          <tr>
            <th>ID Fabricant</th>
            <td>
              <input
                type="number"
                name="id_manufacturer"
                value={form.id_manufacturer}
                onChange={handleChange}
                min="0"
              />
            </td>
          </tr>
          <tr>
            <th>ID Fournisseur</th>
            <td>
              <input
                type="number"
                name="id_supplier"
                value={form.id_supplier}
                onChange={handleChange}
                min="0"
              />
            </td>
          </tr>
          <tr>
            <th>ID Categorie defaut</th>
            <td>
              <input
                type="number"
                name="id_category_default"
                value={form.id_category_default}
                onChange={handleChange}
                min="0"
              />
            </td>
          </tr>
          <tr>
            <th>Emplacement</th>
            <td>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Contenu multilingue</h2>
      <div>
        <button onClick={() => setActiveLang(1)} disabled={activeLang === 1}>
          FR
        </button>
        <button onClick={() => setActiveLang(2)} disabled={activeLang === 2}>
          EN
        </button>
      </div>
      <table border={1}>
        <tbody>
          <tr>
            <th>Nom</th>
            <td>
              <input
                name={`name_${activeLang}`}
                value={form[`name_${activeLang}`]}
                onChange={handleChange}
              />
            </td>
          </tr>
          <tr>
            <th>Description</th>
            <td>
              <textarea
                name={`description_${activeLang}`}
                value={form[`description_${activeLang}`]}
                onChange={handleChange}
              />
            </td>
          </tr>
          <tr>
            <th>Description courte</th>
            <td>
              <textarea
                name={`description_short_${activeLang}`}
                value={form[`description_short_${activeLang}`]}
                onChange={handleChange}
              />
            </td>
          </tr>
          <tr>
            <th>Meta description</th>
            <td>
              <input
                name={`meta_description_${activeLang}`}
                value={form[`meta_description_${activeLang}`]}
                onChange={handleChange}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Prix & stock</h2>
      <table border={1}>
        <tbody>
          <tr>
            <th>Prix HT (EUR)</th>
            <td>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </td>
          </tr>
          <tr>
            <th>Prix grossiste (EUR)</th>
            <td>
              <input
                type="number"
                name="wholesale_price"
                value={form.wholesale_price}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </td>
          </tr>
          <tr>
            <th>Prix unitaire (EUR)</th>
            <td>
              <input
                type="number"
                name="unit_price"
                value={form.unit_price}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </td>
          </tr>
          <tr>
            <th>Quantite minimale</th>
            <td>
              <input
                type="number"
                name="minimal_quantity"
                value={form.minimal_quantity}
                onChange={handleChange}
                min="1"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Dimensions & poids</h2>
      <table border={1}>
        <tbody>
          <tr>
            <th>Largeur (cm)</th>
            <td>
              <input
                type="number"
                name="width"
                value={form.width}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </td>
          </tr>
          <tr>
            <th>Hauteur (cm)</th>
            <td>
              <input
                type="number"
                name="height"
                value={form.height}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </td>
          </tr>
          <tr>
            <th>Profondeur (cm)</th>
            <td>
              <input
                type="number"
                name="depth"
                value={form.depth}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </td>
          </tr>
          <tr>
            <th>Poids (kg)</th>
            <td>
              <input
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Options</h2>
      <table border={1}>
        <tbody>
          <tr>
            <th>Actif</th>
            <td>
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
            </td>
          </tr>
          <tr>
            <th>Disponible a la commande</th>
            <td>
              <input
                type="checkbox"
                name="available_for_order"
                checked={form.available_for_order}
                onChange={handleChange}
              />
            </td>
          </tr>
          <tr>
            <th>En ligne uniquement</th>
            <td>
              <input
                type="checkbox"
                name="online_only"
                checked={form.online_only}
                onChange={handleChange}
              />
            </td>
          </tr>
          <tr>
            <th>En vente</th>
            <td>
              <input
                type="checkbox"
                name="on_sale"
                checked={form.on_sale}
                onChange={handleChange}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <br />
      <button onClick={handleReset}>Reinitialiser</button>
      <button onClick={handleSubmit}>Creer le produit</button>
      <button onClick={() => navigate(-1)}>
        Retourner a la page precedente
      </button>
    </div>
  );
};

export default FormProduit;
