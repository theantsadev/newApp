import { requestXml, deleteOne, postXml } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";

const ressource = "categories";

// --- Parsing ---

export const parseCategory = (category) => {
    const products = category.associations?.products?.product;
    const productsList = Array.isArray(products)
        ? products
        : products
            ? [products]
            : [];

    return {
        id: getValue(category.id),
        id_parent: getValue(category.id_parent),
        level_depth: getValue(category.level_depth),
        nb_products: getValue(category.nb_products_recursive),
        active: getValue(category.active),
        is_root: getValue(category.is_root_category),
        position: getValue(category.position),
        date_ajout: getValue(category.date_add),
        date_modif: getValue(category.date_upd),
        nom: getValue(category.name?.language),
        description: getValue(category.description?.language),
        meta_titre: getValue(category.meta_title?.language),
        product_ids: productsList.map((p) => Number(getValue(p.id))),
    };
};

// --- Services ---

export const fetchCategoryList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
    const categories =
        parseXmlToJson(xmlText)?.prestashop?.categories?.category || [];

    const response = [];
    categories.forEach((category) => {
        response.push(parseCategory(category));
    });
    return response;
};

export const fetchCategoryById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const category = parseXmlToJson(xmlText)?.prestashop?.category;
    return parseCategory(category);
};

export const deleteCategoryById = async (id) => deleteOne(ressource, id);

export const createCategoryFromXml = async (xmlText) =>
    postXml(ressource, xmlText);