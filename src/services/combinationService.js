import { requestXml, deleteOne, postXml, patchXml } from "./prestashopClient";
import { parseXmlToJson, getValue, ensureArray } from "../shared/xmlUtils";

const ressource = "combinations";

// ─────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────

export const parseCombination = (combination) => {
    const optionValues =
        combination.associations?.product_option_values?.product_option_value;
    const optionValuesList = ensureArray(optionValues);

    return {
        id:                 getValue(combination.id),
        id_product:         getValue(combination.id_product),
        ean13:              getValue(combination.ean13),
        mpn:                getValue(combination.mpn),
        reference:          getValue(combination.reference),
        supplier_reference: getValue(combination.supplier_reference),
        prix:               getValue(combination.price),
        quantite_minimale:  getValue(combination.minimal_quantity),
        option_value_ids:   optionValuesList.map((ov) => getValue(ov.id)),
    };
};

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchCombinationList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
    const combinations = parseXmlToJson(xmlText)?.prestashop?.combinations?.combination;
    return ensureArray(combinations).map(parseCombination);
};

export const fetchAllCombinations = async () => {
  const combinations = await fetchCombinationList();
  return Object.fromEntries(combinations.map((os) => [os.id, os.reference]));
};

export const fetchCombinationsByProduct = async (productId) => {
    const xmlText = await requestXml(`${ressource}?filter[id_product]=[${productId}]&display=full`);
    const items = parseXmlToJson(xmlText)?.prestashop?.combinations?.combination;
    return ensureArray(items).map(parseCombination);
};

export const fetchCombinationById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const combination = parseXmlToJson(xmlText)?.prestashop?.combination;
    return parseCombination(combination);
};

// ─────────────────────────────────────────────
// Création & mise à jour
// ─────────────────────────────────────────────

export const createCombination = async (productId, optionValueId, reference, price) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <combination>
    <id_product><![CDATA[${productId}]]></id_product>
    <reference><![CDATA[${reference}]]></reference>
    <price><![CDATA[${price.toFixed(4)}]]></price>
    <minimal_quantity><![CDATA[1]]></minimal_quantity>
    <default_on><![CDATA[0]]></default_on>
    <associations>
      <product_option_values>
        <product_option_value><id><![CDATA[${optionValueId}]]></id></product_option_value>
      </product_option_values>
    </associations>
  </combination>
</prestashop>`;

    return postXml(ressource, xml);
};

export const patchCombinationById = async (id, xmlText) => patchXml(`${ressource}/${id}`, xmlText);

// ─────────────────────────────────────────────
// Suppression
// ─────────────────────────────────────────────

export const deleteCombinationById = async (id) => deleteOne(ressource, id);