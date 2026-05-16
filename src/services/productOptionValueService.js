import { requestXml, deleteOne, postXml, patchXml } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";

const ressource = "product_option_values";

export const parseProductOptionValue = (v) => ({
    id: getValue(v.id),
    id_product_option: getValue(v.id_attribute_group),
    name: getValue(v.name?.language),
});

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
}

export const fetchProductOptionValueById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const value = parseXmlToJson(xmlText)?.prestashop?.product_option_value;
    return parseProductOptionValue(value);
};

export const deleteProductOptionValueById = async (id) => deleteOne(ressource, id);

export const createProductOptionValueFromXml = async (xmlText) => postXml(ressource, xmlText);

export const patchProductOptionValueById = async (id, xmlText) => patchXml(`${ressource}/${id}`, xmlText);
