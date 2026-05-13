import { useState } from "react";
import Papa from "papaparse";
import JSZip from "jszip";
import { getAuthHeader } from "../../config/prestashop";
import { requestXml, postXml } from "../../services/prestashopClient";
import { getTextContent, parseXmlDoc } from "../../shared/xmlUtils";

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

const toNumber = (value) => {
  if (value == null) return 0;
  const cleaned = String(value).replace("%", "").replace(",", ".").trim();
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toPercent = (value) => toNumber(value) / 100;

const toIsoDate = (value) => {
  if (!value) return "";
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

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
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState([]);

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

  const appendLog = (message) => {
    setImportLog((prev) => [...prev, message]);
  };

  const fetchIdByFilter = async (endpoint, tag, field, value) => {
    const xmlText = await requestXml(
      `${endpoint}?filter[${field}]=[${encodeURIComponent(value)}]&display=[id]`,
    );
    const dom = parseXmlDoc(xmlText);
    const node = dom.querySelector(tag);
    return node?.getAttribute("id") || "";
  };

  const fetchIdByFilters = async (endpoint, tag, filters) => {
    const query = Object.entries(filters)
      .map(
        ([key, value]) =>
          `filter[${key}]=[${encodeURIComponent(value)}]`,
      )
      .join("&");
    const xmlText = await requestXml(`${endpoint}?${query}&display=[id]`);
    const dom = parseXmlDoc(xmlText);
    const node = dom.querySelector(tag);
    return node?.getAttribute("id") || "";
  };

  const ensureTaxSetup = async (rate) => {
    const name = `TVA ${rate}%`;
    let taxId = await fetchIdByFilter("taxes", "tax", "name", name);
    if (!taxId) {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <tax>
    <rate><![CDATA[${rate}]]></rate>
    <active><![CDATA[1]]></active>
    <name>
      <language id="1"><![CDATA[${name}]]></language>
      <language id="2"><![CDATA[${name}]]></language>
    </name>
  </tax>
</prestashop>`;
      taxId = await postXml("taxes", xml);
    }

    const groupName = `TRG-${rate}`;
    let groupId = await fetchIdByFilter(
      "tax_rule_groups",
      "tax_rule_group",
      "name",
      groupName,
    );
    if (!groupId) {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <tax_rule_group>
    <name><![CDATA[${groupName}]]></name>
    <active><![CDATA[1]]></active>
  </tax_rule_group>
</prestashop>`;
      groupId = await postXml("tax_rule_groups", xml);
    }

    const existingRuleId = await fetchIdByFilters(
      "tax_rules",
      "tax_rule",
      { id_tax_rules_group: groupId, id_tax: taxId },
    );
    if (!existingRuleId) {
      const ruleXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <tax_rule>
    <id_tax_rules_group><![CDATA[${groupId}]]></id_tax_rules_group>
    <id_tax><![CDATA[${taxId}]]></id_tax>
    <id_country><![CDATA[8]]></id_country>
  </tax_rule>
</prestashop>`;
      await postXml("tax_rules", ruleXml);
    }

    return groupId;
  };

  const ensureCategory = async (name) => {
    let id = await fetchIdByFilter("categories", "category", "name", name);
    if (id) return id;

    const slug = slugify(name);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <category>
    <active><![CDATA[1]]></active>
    <id_parent><![CDATA[2]]></id_parent>
    <name>
      <language id="1"><![CDATA[${name}]]></language>
      <language id="2"><![CDATA[${name}]]></language>
    </name>
    <link_rewrite>
      <language id="1"><![CDATA[${slug}]]></language>
      <language id="2"><![CDATA[${slug}]]></language>
    </link_rewrite>
    <description>
      <language id="1"><![CDATA[${name}]]></language>
      <language id="2"><![CDATA[${name}]]></language>
    </description>
  </category>
</prestashop>`;

    id = await postXml("categories", xml);
    return id;
  };

  const ensureProduct = async (product, taxRuleGroupId, categoryId, type) => {
    let id = await fetchIdByFilter(
      "products",
      "product",
      "reference",
      product.reference,
    );
    if (id) return id;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product>
    <id_category_default><![CDATA[${categoryId}]]></id_category_default>
    <id_tax_rules_group><![CDATA[${taxRuleGroupId}]]></id_tax_rules_group>
    <id_shop_default><![CDATA[1]]></id_shop_default>
    <reference><![CDATA[${product.reference}]]></reference>
    <price><![CDATA[${product.priceHt.toFixed(2)}]]></price>
    <wholesale_price><![CDATA[${product.wholesaleHt.toFixed(2)}]]></wholesale_price>
    <available_date><![CDATA[${product.availableDate}]]></available_date>
    <active><![CDATA[1]]></active>
    <available_for_order><![CDATA[1]]></available_for_order>
    <product_type><![CDATA[${type}]]></product_type>
    <name>
      <language id="1"><![CDATA[${product.name}]]></language>
      <language id="2"><![CDATA[${product.name}]]></language>
    </name>
    <description>
      <language id="1"><![CDATA[${product.name}]]></language>
      <language id="2"><![CDATA[${product.name}]]></language>
    </description>
    <description_short>
      <language id="1"><![CDATA[${product.name}]]></language>
      <language id="2"><![CDATA[${product.name}]]></language>
    </description_short>
    <link_rewrite>
      <language id="1"><![CDATA[${slugify(product.name)}]]></language>
      <language id="2"><![CDATA[${slugify(product.name)}]]></language>
    </link_rewrite>
    <associations>
      <categories>
        <category><id><![CDATA[${categoryId}]]></id></category>
      </categories>
    </associations>
  </product>
</prestashop>`;

    id = await postXml("products", xml);
    return id;
  };

  const ensureOption = async (name, groupType, isColor) => {
    let id = await fetchIdByFilter(
      "product_options",
      "product_option",
      "name",
      name,
    );
    if (id) return id;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product_option>
    <is_color_group><![CDATA[${isColor ? 1 : 0}]]></is_color_group>
    <group_type><![CDATA[${groupType}]]></group_type>
    <name>
      <language id="1"><![CDATA[${name}]]></language>
      <language id="2"><![CDATA[${name}]]></language>
    </name>
    <public_name>
      <language id="1"><![CDATA[${name}]]></language>
      <language id="2"><![CDATA[${name}]]></language>
    </public_name>
  </product_option>
</prestashop>`;

    id = await postXml("product_options", xml);
    return id;
  };

  const ensureOptionValue = async (optionId, name, color) => {
    let id = await fetchIdByFilter(
      "product_option_values",
      "product_option_value",
      "name",
      name,
    );
    if (id) return id;

    const colorTag = color ? `<color><![CDATA[${color}]]></color>` : "";
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product_option_value>
    <id_attribute_group><![CDATA[${optionId}]]></id_attribute_group>
    ${colorTag}
    <name>
      <language id="1"><![CDATA[${name}]]></language>
      <language id="2"><![CDATA[${name}]]></language>
    </name>
  </product_option_value>
</prestashop>`;

    id = await postXml("product_option_values", xml);
    return id;
  };

  const createCombination = async (
    productId,
    optionValueId,
    reference,
    price,
  ) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <combination>
    <id_product><![CDATA[${productId}]]></id_product>
    <reference><![CDATA[${reference}]]></reference>
    <price><![CDATA[${price.toFixed(2)}]]></price>
    <minimal_quantity><![CDATA[1]]></minimal_quantity>
    <default_on><![CDATA[0]]></default_on>
    <associations>
      <product_option_values>
        <product_option_value><id><![CDATA[${optionValueId}]]></id></product_option_value>
      </product_option_values>
    </associations>
  </combination>
</prestashop>`;

    return postXml("combinations", xml);
  };

  const updateStock = async (productId, combinationId, quantity) => {
    const xmlText = await requestXml(
      `stock_availables?filter[id_product]=[${productId}]&filter[id_product_attribute]=[${combinationId}]&display=[id]`,
    );
    const dom = parseXmlDoc(xmlText);
    const stockId = dom.querySelector("stock_available")?.getAttribute("id");
    if (!stockId) return;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <stock_available>
    <id><![CDATA[${stockId}]]></id>
    <id_product><![CDATA[${productId}]]></id_product>
    <id_product_attribute><![CDATA[${combinationId}]]></id_product_attribute>
    <quantity><![CDATA[${quantity}]]></quantity>
    <depends_on_stock><![CDATA[0]]></depends_on_stock>
    <out_of_stock><![CDATA[1]]></out_of_stock>
  </stock_available>
</prestashop>`;

    await requestXml(`stock_availables/${stockId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/xml" },
      body: xml,
    });
  };

  const uploadProductImage = async (productId, file) => {
    const formData = new FormData();
    formData.append("image", file, file.name);

    const resp = await fetch(
      `/prestashop-api/api/images/products/${productId}`,
      {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
        },
        body: formData,
      },
    );

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || `HTTP ${resp.status}`);
    }
  };

  const parseAchat = (value) => {
    const entries = [];
    if (!value) return entries;
    const regex = /"([^"]+)";(\d+);"?([^"]*)"?/g;
    let match = regex.exec(value);
    while (match) {
      entries.push({
        reference: match[1],
        quantity: Number(match[2]),
        variant: match[3] || "",
      });
      match = regex.exec(value);
    }
    return entries;
  };

  const ensureCustomer = async (row) => {
    let id = await fetchIdByFilter("customers", "customer", "email", row.email);
    if (id) return id;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <customer>
    <passwd><![CDATA[${row.pwd}]]></passwd>
    <lastname><![CDATA[${row.nom}]]></lastname>
    <firstname><![CDATA[${row.nom}]]></firstname>
    <email><![CDATA[${row.email}]]></email>
    <active><![CDATA[1]]></active>
    <newsletter><![CDATA[0]]></newsletter>
    <id_default_group><![CDATA[3]]></id_default_group>
  </customer>
</prestashop>`;

    id = await postXml("customers", xml);
    return id;
  };

  const ensureAddress = async (customerId, row) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <address>
    <id_customer><![CDATA[${customerId}]]></id_customer>
    <id_country><![CDATA[8]]></id_country>
    <alias><![CDATA[domicile]]></alias>
    <lastname><![CDATA[${row.nom}]]></lastname>
    <firstname><![CDATA[${row.nom}]]></firstname>
    <address1><![CDATA[${row.adresse}]]></address1>
    <city><![CDATA[Antananarivo]]></city>
    <postcode><![CDATA[75000]]></postcode>
  </address>
</prestashop>`;

    return postXml("addresses", xml);
  };

  const createCart = async (customerId, addressId, items) => {
    const rowsXml = items
      .map(
        (item) => `
        <cart_row>
          <id_product><![CDATA[${item.productId}]]></id_product>
          <id_product_attribute><![CDATA[${item.attributeId}]]></id_product_attribute>
          <id_address_delivery><![CDATA[${addressId}]]></id_address_delivery>
          <id_customization><![CDATA[0]]></id_customization>
          <quantity><![CDATA[${item.quantity}]]></quantity>
        </cart_row>`,
      )
      .join("");

    const deliveryOption = `{"${addressId}":"1,"}`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <cart>
    <id_address_delivery><![CDATA[${addressId}]]></id_address_delivery>
    <id_address_invoice><![CDATA[${addressId}]]></id_address_invoice>
    <id_currency><![CDATA[1]]></id_currency>
    <id_customer><![CDATA[${customerId}]]></id_customer>
    <id_lang><![CDATA[1]]></id_lang>
    <id_shop><![CDATA[1]]></id_shop>
    <id_shop_group><![CDATA[1]]></id_shop_group>
    <id_carrier><![CDATA[1]]></id_carrier>
    <delivery_option><![CDATA[${deliveryOption}]]></delivery_option>
    <recyclable><![CDATA[0]]></recyclable>
    <gift><![CDATA[0]]></gift>
    <associations>
      <cart_rows>
        ${rowsXml}
      </cart_rows>
    </associations>
  </cart>
</prestashop>`;

    return postXml("carts", xml);
  };

  const createOrder = async (row, cartId, customerId, addressId, items) => {
    const stateMap = {
      "en attente paiement a la livraison": {
        stateId: 13,
        module: "ps_cashondelivery",
        payment: "Paiement comptant a la livraison (Cash on delivery)",
        valid: 0,
        paidReal: 0,
      },
      "paiement accepte": {
        stateId: 2,
        module: "ps_checkpayment",
        payment: "Paiement par cheque",
        valid: 1,
        paidReal: "TOTAL",
      },
      "erreur de paiement": {
        stateId: 8,
        module: "ps_cashondelivery",
        payment: "Paiement comptant a la livraison (Cash on delivery)",
        valid: 0,
        paidReal: 0,
      },
    };

    const normalizedEtat = normalizeText(row.etat);
    const stateConfig = stateMap[normalizedEtat];
    if (!stateConfig) {
      throw new Error(`Etat commande inconnu: ${row.etat}`);
    }

    const totals = items.reduce(
      (acc, item) => {
        acc.totalHt += item.unitPriceHt * item.quantity;
        acc.totalTtc += item.unitPriceTtc * item.quantity;
        return acc;
      },
      { totalHt: 0, totalTtc: 0 },
    );

    const orderRowsXml = items
      .map(
        (item) => `
        <order_row>
          <product_id><![CDATA[${item.productId}]]></product_id>
          <product_attribute_id><![CDATA[${item.attributeId}]]></product_attribute_id>
          <product_quantity><![CDATA[${item.quantity}]]></product_quantity>
          <product_name><![CDATA[${item.label}]]></product_name>
          <product_reference><![CDATA[${item.reference}]]></product_reference>
          <product_price><![CDATA[${item.unitPriceHt.toFixed(2)}]]></product_price>
          <unit_price_tax_incl><![CDATA[${item.unitPriceTtc.toFixed(2)}]]></unit_price_tax_incl>
          <unit_price_tax_excl><![CDATA[${item.unitPriceHt.toFixed(2)}]]></unit_price_tax_excl>
        </order_row>`,
      )
      .join("");

    const totalPaid = totals.totalTtc.toFixed(2);
    const totalPaidReal =
      stateConfig.paidReal === "TOTAL" ? totalPaid : stateConfig.paidReal;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order>
    <id_address_delivery><![CDATA[${addressId}]]></id_address_delivery>
    <id_address_invoice><![CDATA[${addressId}]]></id_address_invoice>
    <id_cart><![CDATA[${cartId}]]></id_cart>
    <id_currency><![CDATA[1]]></id_currency>
    <id_lang><![CDATA[1]]></id_lang>
    <id_customer><![CDATA[${customerId}]]></id_customer>
    <id_carrier><![CDATA[1]]></id_carrier>
    <module><![CDATA[${stateConfig.module}]]></module>
    <payment><![CDATA[${stateConfig.payment}]]></payment>
    <date_add><![CDATA[${toIsoDate(row.date)} 00:00:00]]></date_add>
    <valid><![CDATA[${stateConfig.valid}]]></valid>
    <total_paid><![CDATA[${totalPaid}]]></total_paid>
    <total_paid_tax_incl><![CDATA[${totalPaid}]]></total_paid_tax_incl>
    <total_paid_tax_excl><![CDATA[${totals.totalHt.toFixed(2)}]]></total_paid_tax_excl>
    <total_paid_real><![CDATA[${totalPaidReal}]]></total_paid_real>
    <total_products><![CDATA[${totals.totalHt.toFixed(2)}]]></total_products>
    <total_products_wt><![CDATA[${totalPaid}]]></total_products_wt>
    <total_shipping><![CDATA[0]]></total_shipping>
    <total_shipping_tax_incl><![CDATA[0]]></total_shipping_tax_incl>
    <total_shipping_tax_excl><![CDATA[0]]></total_shipping_tax_excl>
    <total_discounts><![CDATA[0]]></total_discounts>
    <total_discounts_tax_incl><![CDATA[0]]></total_discounts_tax_incl>
    <total_discounts_tax_excl><![CDATA[0]]></total_discounts_tax_excl>
    <total_wrapping><![CDATA[0]]></total_wrapping>
    <total_wrapping_tax_incl><![CDATA[0]]></total_wrapping_tax_incl>
    <total_wrapping_tax_excl><![CDATA[0]]></total_wrapping_tax_excl>
    <conversion_rate><![CDATA[1.000000]]></conversion_rate>
    <round_mode><![CDATA[2]]></round_mode>
    <round_type><![CDATA[1]]></round_type>
    <associations>
      <order_rows>
        ${orderRowsXml}
      </order_rows>
    </associations>
  </order>
</prestashop>`;

    const responseText = await requestXml("orders", {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xml,
    });

    const dom = parseXmlDoc(responseText);
    const orderId = getTextContent(dom, "order > id");
    const reference = getTextContent(dom, "order > reference");

    return { orderId, reference, stateId: stateConfig.stateId, totalPaid };
  };

  const createOrderHistory = async (orderId, stateId) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order_history>
    <id_order><![CDATA[${orderId}]]></id_order>
    <id_order_state><![CDATA[${stateId}]]></id_order_state>
    <id_employee><![CDATA[1]]></id_employee>
  </order_history>
</prestashop>`;

    await postXml("order_histories", xml);
  };

  const createOrderPayment = async (reference, amount) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order_payment>
    <order_reference><![CDATA[${reference}]]></order_reference>
    <id_currency><![CDATA[1]]></id_currency>
    <amount><![CDATA[${amount}]]></amount>
    <payment_method><![CDATA[Paiement par cheque]]></payment_method>
    <conversion_rate><![CDATA[1.000000]]></conversion_rate>
    <date_add><![CDATA[${new Date().toISOString().slice(0, 19).replace("T", " ")}]]></date_add>
  </order_payment>
</prestashop>`;

    await postXml("order_payments", xml);
  };

  const handleImport = async () => {
    if (!readyToImport || importing) return;

    setImporting(true);
    setImportLog([]);

    try {
      appendLog("Preparation des donnees...");

      const produitsData = parsed.produits;
      const declinaisonsData = parsed.declinaisons;
      const commandesData = parsed.commandes;

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
        const wholesaleTtc = toNumber(row.prix_achat);
        const wholesaleHt = wholesaleTtc / (1 + toPercent(row.Taxe));

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

      appendLog("Creation des taxes et groupes...");
      const taxGroupByRate = {};
      for (const product of Object.values(productsByRef)) {
        if (!taxGroupByRate[product.taxRate]) {
          taxGroupByRate[product.taxRate] = await ensureTaxSetup(
            product.taxRate,
          );
        }
      }

      appendLog("Creation des categories...");
      const categoryByName = {};
      for (const product of Object.values(productsByRef)) {
        if (!categoryByName[product.category]) {
          categoryByName[product.category] = await ensureCategory(
            product.category,
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
        );
        productIds[product.reference] = productId;
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
          );
        }

        const key = `${specificite}:${karazany}`;
        if (!optionValueIds[key]) {
          const colorMap = { fotsy: "#FFFFFF", mainty: "#000000" };
          optionValueIds[key] = await ensureOptionValue(
            optionIdByName[specificite],
            karazany,
            colorMap[karazany],
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
        await updateStock(productId, attributeId, quantity);
      }

      appendLog("Upload des images...");
      const zip = await JSZip.loadAsync(files.images);
      const imageEntries = Object.keys(zip.files).filter(
        (name) => !zip.files[name].dir,
      );

      for (const entry of imageEntries) {
        const ref = entry.split("/").pop().split(".")[0];
        const productId = productIds[ref];
        if (!productId) continue;
        const blob = await zip.files[entry].async("blob");
        const file = new File([blob], entry);
        await uploadProductImage(productId, file);
      }

      appendLog("Creation des commandes...");
      for (const row of commandesData) {
        const customerId = await ensureCustomer(row);
        const addressId = await ensureAddress(customerId, row);
        const achatItems = parseAchat(row.achat);

        const items = achatItems.map((item) => {
          const product = productsByRef[item.reference];
          const basePriceHt = product.priceHt;
          let supplement = 0;
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
              const priceTtc =
                toNumber(declRow.prix_vente_ttc) || product.priceTtc;
              const priceHt = priceTtc / (1 + toPercent(product.taxRate));
              supplement = priceHt - basePriceHt;
            }
            label = `${product.name} (variante : ${item.variant})`;
            ref = `${item.reference}-${item.variant}`;
          }

          const unitPriceHt = basePriceHt + supplement;
          const unitPriceTtc = unitPriceHt * (1 + toPercent(product.taxRate));

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

        const cartId = await createCart(customerId, addressId, items);
        const order = await createOrder(
          row,
          cartId,
          customerId,
          addressId,
          items,
        );
        await createOrderHistory(order.orderId, order.stateId);
        if (order.stateId === 2) {
          await createOrderPayment(order.reference, order.totalPaid);
        }
      }

      appendLog("Import termine.");
    } catch (err) {
      appendLog(`Erreur: ${err.message}`);
    } finally {
      setImporting(false);
    }
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
      <button
        disabled={!readyToImport || loading || importing}
        onClick={handleImport}
      >
        {importing ? "Import en cours..." : "Importer"}
      </button>

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
