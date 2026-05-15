import { requestXml, deleteOne, postXml } from "./prestashopClient";
import { XMLParser } from "fast-xml-parser";

const getValue = (field) => {
    if (field == null) return "";
    if (typeof field !== "object") return field;
    return field["#text"] || "";
};

const parseXml = (xmlString) => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseTagValue: true,
        trimValues: true,
    });

    const json = parser.parse(xmlString);
    const products = json?.prestashop?.products?.product || [];
    return Array.isArray(products) ? products : [products];
};

export const fetchProductList = async () => {
    const xmlText = await requestXml("products?display=full");
    const products = parseXml(xmlText);
    const response = [];
    products.forEach((product) => {
        const image = product.associations?.images?.image;
        const imageNode = Array.isArray(image) ? image[0] : image;
        response.push({
            id: getValue(product.id),
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
        });
    });
    return response;
};

export const fetchProductById = async (id) => requestXml(`products/${id}`);

export const deleteProductById = async (id) => deleteOne("products", id);

export const createProductFromXml = async (xmlText) =>
    postXml("products", xmlText);
