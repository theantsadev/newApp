import { requestXml } from "./prestashopClient";
import { parseXmlToJson, getValue, ensureArray } from "../shared/xmlUtils";

const ressource = "order_states";

// ─────────────────────────────────────────────
// Configuration & constantes
// ─────────────────────────────────────────────

const ORDER_STATE_CONFIG_BY_LABEL = {
  "en attente paiement a la livraison": {
    stateId: "13",
    module: "ps_cashondelivery",
    payment: "Paiement comptant a la livraison (Cash on delivery)",
    valid: 0,
    paidReal: 0,
  },
  "paiement accepte": {
    stateId: "2",
    module: "ps_cashondelivery",
    payment: "Paiement comptant a la livraison (Cash on delivery)",
    valid: 1,
    paidReal: "TOTAL",
  },
  "paiement effectue": {
    stateId: "2",
    module: "ps_cashondelivery",
    payment: "Paiement comptant a la livraison (Cash on delivery)",
    valid: 1,
    paidReal: "TOTAL",
  },
  "erreur de paiement": {
    stateId: "8",
    module: "ps_cashondelivery",
    payment: "Paiement comptant a la livraison (Cash on delivery)",
    valid: 0,
    paidReal: 0,
  },
  "livre": {
    stateId: "5",
    module: "ps_cashondelivery",
    payment: "Paiement comptant a la livraison (Cash on delivery)",
    valid: 1,
    paidReal: "TOTAL",
  },
  "annule": {
    stateId: "6",
    module: "ps_cashondelivery",
    payment: "Paiement comptant a la livraison (Cash on delivery)",
    valid: 0,
    paidReal: 0,
  },
};

export const MANAGED_ORDER_STATE_IDS = ["2", "5", "6", "11"];

export const MANAGED_STATE_LABELS = {
  cart: "Dans le panier",
  "2": "Paiement accepte",
  "11": "Paiement accepte",
  "5": "Livre",
  "6": "Annule",
};

// ─────────────────────────────────────────────
// Helpers de normalisation
// ─────────────────────────────────────────────

export const normalizeOrderStateLabel = (value) => {
  if (value == null) return "";
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
};

export const isCartOrderStateLabel = (value) => {
  const normalized = normalizeOrderStateLabel(value);
  return !normalized || normalized === "dans le panier";
};

export const getOrderStateConfigFromLabel = (value) => {
  const normalized = normalizeOrderStateLabel(value);
  return ORDER_STATE_CONFIG_BY_LABEL[normalized] || null;
};

// ─────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────

export const parseOrderState = (orderState) => ({
  id: getValue(orderState.id),
  name: getValue(orderState.name?.language),
});

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchOrderStateList = async () => {
  const xmlText = await requestXml(`${ressource}?display=full`);
  const orderStates = parseXmlToJson(xmlText)?.prestashop?.order_states?.order_state;
  return ensureArray(orderStates).map(parseOrderState);
};

export const fetchOrderStateById = async (id) => {
  const xmlText = await requestXml(`${ressource}/${id}`);
  const orderState = parseXmlToJson(xmlText)?.prestashop?.order_state;
  return parseOrderState(orderState);
};

/** Retourne un dictionnaire { id → name } pour tous les états de commande. */
export const fetchAllOrderStates = async () => {
  const orderStates = await fetchOrderStateList();
  return Object.fromEntries(orderStates.map((os) => [os.id, os.name]));
};