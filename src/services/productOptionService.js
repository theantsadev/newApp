import { requestXml, deleteOne, postXml, patchXml, fetchIdByFilter } from "./prestashopClient";
import { parseXmlToJson, getValue, buildLangXml, ensureArray } from "../shared/xmlUtils";

const ressource = "product_options";

// ─────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────

export const parseProductOption = (opt) => ({
    id:          getValue(opt.id),
    name:        getValue(opt.name?.language),
    public_name: getValue(opt.public_name?.language),
    type:        getValue(opt.group_type),
});

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchProductOptionList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
  const options = parseXmlToJson(xmlText)?.prestashop?.product_options?.product_option;
  return ensureArray(options).map(parseProductOption);
};

export const fetchProductOptionByIds = async (ids) => {
    const filter = ids.map((id) => `[${id}]`).join(",");
    const xmlText = await requestXml(`${ressource}?filter[id]=${filter}&display=full`);
  const options = parseXmlToJson(xmlText)?.prestashop?.product_options?.product_option;
  return ensureArray(options).map(parseProductOption);
};

export const fetchProductOptionById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const option = parseXmlToJson(xmlText)?.prestashop?.product_option;
    return parseProductOption(option);
};

// ─────────────────────────────────────────────
// Création & mise à jour
// ─────────────────────────────────────────────

/**
 * Crée l'option si elle n'existe pas déjà (contrôle par nom).
 * Retourne l'id existant ou celui de l'option nouvellement créée.
 */
export const ensureOption = async (name, groupType, isColor, languageIds) => {
    const existingId = await fetchIdByFilter(ressource, "product_option", "name", name);
    if (existingId) return existingId;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product_option>
    <is_color_group><![CDATA[${isColor ? 1 : 0}]]></is_color_group>
    <group_type><![CDATA[${groupType}]]></group_type>
    <name>
      ${buildLangXml(languageIds, name)}
    </name>
    <public_name>
      ${buildLangXml(languageIds, name)}
    </public_name>
  </product_option>
</prestashop>`;

    return postXml(ressource, xml);
};

export const patchProductOptionById = async (id, xmlText) => patchXml(`${ressource}/${id}`, xmlText);

// ─────────────────────────────────────────────
// Suppression
// ─────────────────────────────────────────────

export const deleteProductOptionById = async (id) => deleteOne(ressource, id);