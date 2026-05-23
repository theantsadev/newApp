import { requestXml, deleteOne, postXml, patchXml, fetchIdByFilter } from "./prestashopClient";
import { parseXmlToJson, getValue, buildLangXml } from "../shared/xmlUtils";

const ressource = "product_option_values";

// ─────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────

export const parseProductOptionValue = (v) => ({
    id:                getValue(v.id),
    id_product_option: getValue(v.id_attribute_group),
    name:              getValue(v.name?.language),
});

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchProductOptionValueList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
    const values = parseXmlToJson(xmlText)?.prestashop?.product_option_values?.product_option_value || [];
    const arr = Array.isArray(values) ? values : [values];
    return arr.map(parseProductOptionValue);
};

export const fetchProductOptionValueByIds = async (ids) => {
    const filter = ids.map((id) => `[${id}]`).join(",");
    const xmlText = await requestXml(`${ressource}?filter[id]=${filter}&display=full`);
    const values = parseXmlToJson(xmlText)?.prestashop?.product_option_values?.product_option_value || [];
    const arr = Array.isArray(values) ? values : [values];
    return arr.map(parseProductOptionValue);
};

export const fetchProductOptionValueById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const value = parseXmlToJson(xmlText)?.prestashop?.product_option_value;
    return parseProductOptionValue(value);
};

// ─────────────────────────────────────────────
// Création & mise à jour
// ─────────────────────────────────────────────

/**
 * Crée la valeur d'option si elle n'existe pas déjà (contrôle par nom).
 * Retourne l'id existant ou celui de la valeur nouvellement créée.
 */
export const ensureOptionValue = async (optionId, name, color, languageIds) => {
    const existingId = await fetchIdByFilter(ressource, "product_option_value", "name", name);
    if (existingId) return existingId;

    const colorTag = color ? `<color><![CDATA[${color}]]></color>` : "";
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product_option_value>
    <id_attribute_group><![CDATA[${optionId}]]></id_attribute_group>
    ${colorTag}
    <name>
      ${buildLangXml(languageIds, name)}
    </name>
  </product_option_value>
</prestashop>`;

    return postXml(ressource, xml);
};

export const patchProductOptionValueById = async (id, xmlText) => patchXml(`${ressource}/${id}`, xmlText);

// ─────────────────────────────────────────────
// Suppression
// ─────────────────────────────────────────────

export const deleteProductOptionValueById = async (id) => deleteOne(ressource, id);