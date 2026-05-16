import { requestXml, deleteOne, postXml, patchXml } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";

const ressource = "combinations";

export const parseCombination = (combination) => {
    const optionValues =
        combination.associations?.product_option_values?.product_option_value;
    const optionValuesList = Array.isArray(optionValues)
        ? optionValues
        : optionValues
            ? [optionValues]
            : [];

    return {
        id: getValue(combination.id),
        id_product: getValue(combination.id_product),
        ean13: getValue(combination.ean13),
        mpn: getValue(combination.mpn),
        reference: getValue(combination.reference),
        supplier_reference: getValue(combination.supplier_reference),
        prix: getValue(combination.price),
        quantite_minimale: getValue(combination.minimal_quantity),
        option_value_ids: optionValuesList.map((optionValue) => getValue(optionValue.id)),
    };
};

// combinationService.js
export const fetchCombinationsByProduct = async (productId) => {
    const xmlText = await requestXml(
        `combinations?filter[id_product]=[${productId}]&display=full`
    );
    const items = parseXmlToJson(xmlText)?.prestashop?.combinations?.combination || [];
    const arr = Array.isArray(items) ? items : [items];
    return arr.map(parseCombination);
};

export const fetchCombinationList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
    const combinations = parseXmlToJson(xmlText)?.prestashop?.combinations?.combination || [];
    const response = [];

    combinations.forEach((combination) => {
        response.push(parseCombination(combination));
    });

    return response;
};

export const fetchCombinationById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const combination = parseXmlToJson(xmlText)?.prestashop?.combination;
    return parseCombination(combination);
};

export const deleteCombinationById = async (id) => deleteOne(ressource, id);

export const createCombinationFromXml = async (xmlText) =>
    postXml(ressource, xmlText);

export const patchCombinationById = async (id, xmlText) =>
    patchXml(`${ressource}/${id}`, xmlText);
