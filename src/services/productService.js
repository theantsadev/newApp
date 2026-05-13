import { requestXml, deleteOne, postXml } from "./prestashopClient";
import { parseXmlDoc } from "../shared/xmlUtils";

export const fetchProductList = async () => {
  const xmlText = await requestXml("products");
  const dom = parseXmlDoc(xmlText);
  return Array.from(dom.querySelectorAll("product")).map((node) => ({
    id: node.getAttribute("id"),
    href: node.getAttribute("xlink:href"),
  }));
};

export const fetchProductById = async (id) => requestXml(`products/${id}`);

export const deleteProductById = async (id) => deleteOne("products", id);

export const createProductFromXml = async (xmlText) =>
  postXml("products", xmlText);
