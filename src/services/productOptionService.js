import { requestXml, deleteOne, postXml, patchXml } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";

const ressource = "product_options";

export const parseProductOption = (opt) => ({
    id: getValue(opt.id),
    name: getValue(opt.name?.language),
    public_name: getValue(opt.public_name?.language),
    type: getValue(opt.group_type),
});

export const fetchProductOptionList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
    const options = parseXmlToJson(xmlText)?.prestashop?.product_options?.product_option || [];
    const arr = Array.isArray(options) ? options : [options];
    return arr.map(parseProductOption);
};

export const fetchProductOptionByIds = async (ids) => {
    const filter = ids.map((id) => `[${id}]`).join(",");
    const xmlText = await requestXml(`${ressource}?filter[id]=${filter}&display=full`);
    const options = parseXmlToJson(xmlText)?.prestashop?.product_options?.product_option || [];
    const arr = Array.isArray(options) ? options : [options];
    return arr.map(parseProductOption);
};

export const fetchProductOptionById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const option = parseXmlToJson(xmlText)?.prestashop?.product_option;
    return parseProductOption(option);
};

export const deleteProductOptionById = async (id) => deleteOne(ressource, id);

export const createProductOptionFromXml = async (xmlText) => postXml(ressource, xmlText);

export const patchProductOptionById = async (id, xmlText) => patchXml(`${ressource}/${id}`, xmlText);
