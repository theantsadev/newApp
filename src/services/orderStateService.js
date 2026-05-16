import { requestXml } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";

const ressource = "order_states";

export const parseOrderState = (orderState) => ({
  id: getValue(orderState.id),
  name: getValue(orderState.name?.language),
});

export const fetchOrderStateList = async () => {
  const xmlText = await requestXml(`${ressource}?display=full`);
  const orderStates =
    parseXmlToJson(xmlText)?.prestashop?.order_states?.order_state || [];
  const response = [];

  orderStates.forEach((orderState) => {
    response.push(parseOrderState(orderState));
  });

  return response;
};

export const fetchOrderStateById = async (id) => {
  const xmlText = await requestXml(`${ressource}/${id}`);
  const orderState = parseXmlToJson(xmlText)?.prestashop?.order_state;
  return parseOrderState(orderState);
};

export const fetchAllOrderStates = async () => {
  const orderStates = await fetchOrderStateList();
  return Object.fromEntries(orderStates.map((orderState) => [orderState.id, orderState.name]));
};