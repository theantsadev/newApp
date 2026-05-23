import { requestXml, deleteOne, postXml, fetchIdByFilter } from "./prestashopClient";
import { parseXmlToJson, getValue, buildLangXml, slugify } from "../shared/xmlUtils";
import { getAuthHeader } from "../config/prestashop";

const ressource = "products";

// ─────────────────────────────────────────────
// Parsing & helpers
// ─────────────────────────────────────────────

export const parseProduct = (product) => {
    const image = product.associations?.images?.image;
    const imageNode = Array.isArray(image) ? image[0] : image;

    const optionValues =
        product.associations?.product_option_values?.product_option_value;
    const optionValuesList = Array.isArray(optionValues)
        ? optionValues
        : optionValues
            ? [optionValues]
            : [];

    return {
        id:                   getValue(product.id),
        id_category_default:  getValue(product.id_category_default),
        id_tax_rules_group:   getValue(product.id_tax_rules_group),
        id_declinaison:       getValue(product.id_default_combination),
        prix:                 getValue(product.price),
        prix_achat:           getValue(product.wholesale_price),
        reference:            getValue(product.reference),
        quantite:             getValue(product.quantity),
        poids:                getValue(product.weight),
        actif:                getValue(product.active),
        condition:            getValue(product.condition),
        date_ajout:           getValue(product.date_add),
        date_disponibilite:   getValue(product.available_date),
        nom:                  getValue(product.name?.language),
        description:          getValue(product.description?.language),
        description_courte:   getValue(product.description_short?.language),
        meta_titre:           getValue(product.meta_title?.language),
        image:                getValue(imageNode?.["@_xlink:href"]),
        option_value_ids:     optionValuesList.map((ov) => Number(getValue(ov.id))),
    };
};

/**
 * Retourne un label promotionnel basé sur la date de disponibilité :
 * - "HOT" si le produit est disponible depuis 1 jour
 * - "NEW" si le produit est disponible depuis 7 jours
 */
export const getMarque = (date_disponibilite) => {
    if (!date_disponibilite || date_disponibilite === "0000-00-00") return null;

    try {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const today = new Date(`${todayStr}T00:00:00`);
        const dispo = new Date(`${date_disponibilite.split(" ")[0]}T00:00:00`);

        if (isNaN(today.getTime()) || isNaN(dispo.getTime())) return null;

        const diffDays = Math.round((today - dispo) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return "HOT";
        if (diffDays === 7) return "NEW";
    } catch (e) {
        console.error("Erreur calcul marque:", e);
    }

    return null;
};

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchProductList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
    const products = parseXmlToJson(xmlText)?.prestashop?.products?.product || [];
    return products.map(parseProduct);
};

export const fetchProductById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const product = parseXmlToJson(xmlText)?.prestashop?.product;
    return parseProduct(product);
};

// ─────────────────────────────────────────────
// Création & mise à jour
// ─────────────────────────────────────────────

/**
 * Crée le produit s'il n'existe pas déjà (contrôle par référence).
 * Retourne l'id existant ou celui du produit nouvellement créé.
 */
export const ensureProduct = async (product, taxRuleGroupId, categoryId, type, languageIds) => {
    const existingId = await fetchIdByFilter(ressource, "product", "reference", product.reference);
    if (existingId) return existingId;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product>
    <id_category_default><![CDATA[${categoryId}]]></id_category_default>
    <id_tax_rules_group><![CDATA[${taxRuleGroupId}]]></id_tax_rules_group>
    <id_shop_default><![CDATA[1]]></id_shop_default>
    <state><![CDATA[1]]></state>
    <show_price><![CDATA[1]]></show_price>
    <reference><![CDATA[${product.reference}]]></reference>
    <price><![CDATA[${product.priceHt.toFixed(4)}]]></price>
    <wholesale_price><![CDATA[${product.wholesaleHt.toFixed(4)}]]></wholesale_price>
    <available_date><![CDATA[${product.availableDate}]]></available_date>
    <active><![CDATA[1]]></active>
    <available_for_order><![CDATA[1]]></available_for_order>
    <product_type><![CDATA[${type}]]></product_type>
    <name>
      ${buildLangXml(languageIds, product.name)}
    </name>
    <description>
      ${buildLangXml(languageIds, product.name)}
    </description>
    <description_short>
      ${buildLangXml(languageIds, product.name)}
    </description_short>
    <link_rewrite>
      ${buildLangXml(languageIds, slugify(product.name))}
    </link_rewrite>
    <associations>
      <categories>
        <category><id><![CDATA[${categoryId}]]></id></category>
      </categories>
    </associations>
  </product>
</prestashop>`;

    return postXml(ressource, xml);
};

export const uploadProductImage = async (productId, file) => {
    const formData = new FormData();
    formData.append("image", file, file.name);

    const resp = await fetch(`/prestashop-api/api/images/products/${productId}`, {
        method: "POST",
        headers: { Authorization: getAuthHeader() },
        body: formData,
    });

    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `HTTP ${resp.status}`);
    }
};

// ─────────────────────────────────────────────
// Suppression
// ─────────────────────────────────────────────

export const deleteProductById = async (id) => deleteOne(ressource, id);