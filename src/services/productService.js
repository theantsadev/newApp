import { requestXml, deleteOne, postXml } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";
const ressource = "products";

export const parseProduct = (product) => {
    const image = product.associations?.images?.image;
    const optionValues =
        product.associations?.product_option_values?.product_option_value;
    const optionValuesList = Array.isArray(optionValues)
        ? optionValues
        : optionValues
            ? [optionValues]
            : [];

    const imageNode = Array.isArray(image) ? image[0] : image;
    return {
        id: getValue(product.id),
        id_tax_rules_group: getValue(product.id_tax_rules_group),
        id_declinaison: getValue(product.id_default_combination),
        date_disponibilite: getValue(product.available_date),
        prix: getValue(product.price),
        reference: getValue(product.reference),
        quantite: getValue(product.quantity),
        poids: getValue(product.weight),
        actif: getValue(product.active),
        condition: getValue(product.condition),
        date_ajout: getValue(product.date_add),
        nom: getValue(product.name?.language),
        image: getValue(imageNode?.["@_xlink:href"]),
        description: getValue(product.description?.language),
        description_courte: getValue(product.description_short?.language),
        meta_titre: getValue(product.meta_title?.language),
        option_value_ids: optionValuesList.map((optionValue) => Number(getValue(optionValue.id))),
    };
}

export const getMarque = (date_disponibilite) => {
    if (!date_disponibilite || date_disponibilite === "0000-00-00") return null;
    
    try {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const today = new Date(todayStr + "T00:00:00");
        
        const dispo = new Date(date_disponibilite.split(" ")[0] + "T00:00:00");
        
        if (isNaN(today.getTime()) || isNaN(dispo.getTime())) return null;
        
        const diffTime = today.getTime() - dispo.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return "HOT";
        if (diffDays === 7) return "NEW";
    } catch (e) {
        console.error("Erreur calcul marque:", e);
    }
    return null;
}


export const fetchProductList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
    const products = parseXmlToJson(xmlText)?.prestashop?.products?.product || [];
    const response = [];
    products.forEach((product) => {
        response.push(parseProduct(product));
    });
    return response;
};

// productService.js — le service retourne directement l'objet propre
export const fetchProductById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const product = parseXmlToJson(xmlText)?.prestashop?.product;
    return parseProduct(product); // ← parsing fait ICI
};

export const deleteProductById = async (id) => deleteOne(ressource, id);

export const createProductFromXml = async (xmlText) =>
    postXml(ressource, xmlText);
