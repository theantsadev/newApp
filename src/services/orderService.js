import { requestXml, patchXml, deleteOne, postXml } from "./prestashopClient";
import { parseXmlDoc, getTextContent } from "../shared/xmlUtils";

export const fetchAllOrderStates = async () => {
  const xmlText = await requestXml("order_states?display=full");
  const dom = parseXmlDoc(xmlText);
  const map = {};
  dom.querySelectorAll("order_state").forEach((node) => {
    const id = getTextContent(node, "id");
    const name = node.querySelector("name language")?.textContent?.trim() || "";
    map[id] = name;
  });
  return map; // { "1": "En attente", "2": "Paiement accepté", ... }
};

export const fetchOrderList = async () => {
  const ordersXml = await requestXml("orders?display=full")


  const dom = parseXmlDoc(ordersXml);
  // orderService.js
  return Array.from(dom.querySelectorAll("order")).map((node) => ({
    id: getTextContent(node, "id"),
    etatId: getTextContent(node, "current_state"),
  }));
};

export const updateOrderState = async (id, newStateId) => {
  const xmlText = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order>
    <id>${id}</id>
    <current_state>${Number(newStateId)}</current_state>
  </order>
</prestashop>`;
  return patchXml(`orders/${id}`, xmlText);
};

export const fetchOrderById = async (id) => requestXml(`orders/${id}`);

export const deleteOrderById = async (id) => deleteOne("orders", id);

export const createOrderFromXml = async (xmlText) =>
  postXml("orders", xmlText);