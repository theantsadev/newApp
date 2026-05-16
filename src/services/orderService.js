import { requestXml, patchXml, deleteOne, postXml } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";

const ressource = "orders";

export const parseOrder = (order) => ({
  id: getValue(order.id),
  id_customer: getValue(order.id_customer),
  current_state: getValue(order.current_state),
  reference: getValue(order.reference),
  payment: getValue(order.payment),
  module: getValue(order.module),
  total_paid: getValue(order.total_paid),
  date_add: getValue(order.date_add),
  date_upd: getValue(order.date_upd),
});

export const fetchOrderList = async () => {
  const xmlText = await requestXml(`${ressource}?display=full`);
  const orders = parseXmlToJson(xmlText)?.prestashop?.orders?.order || [];
  const response = [];

  orders.forEach((order) => {
    response.push(parseOrder(order));
  });

  return response;
};

export const updateOrderState = async (id, newStateId) => {
  const xmlText = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order>
    <id>${id}</id>
    <current_state>${Number(newStateId)}</current_state>
  </order>
</prestashop>`;
  return patchXml(`${ressource}/${id}`, xmlText);
};

export const fetchOrderById = async (id) => {
  const xmlText = await requestXml(`${ressource}/${id}`);
  const order = parseXmlToJson(xmlText)?.prestashop?.order;
  return parseOrder(order);
};

export const deleteOrderById = async (id) => deleteOne(ressource, id);

export const createOrderFromXml = async (xmlText) =>
  postXml(ressource, xmlText);