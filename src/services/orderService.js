import { requestXml, patchXml, deleteOne, postXml } from "./prestashopClient";
import { parseXmlToJson, getValue, parseXmlDoc, getTextContent } from "../shared/xmlUtils";
import { getOrderStateConfigFromLabel } from "./orderStateService";

const ressource = "orders";

// ─────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────

export const parseOrder = (order) => {
  const rows = order.associations?.order_rows?.order_row;
  const rowsList = Array.isArray(rows) ? rows : rows ? [rows] : [];

  return {
    id: getValue(order.id),
    id_cart: getValue(order.id_cart),
    id_customer: getValue(order.id_customer),
    current_state: getValue(order.current_state),
    reference: getValue(order.reference),
    payment: getValue(order.payment),
    module: getValue(order.module),
    total_paid: getValue(order.total_paid),
    total_paid_tax_excl: getValue(order.total_paid_tax_excl),
    date_add: getValue(order.date_add),
    date_upd: getValue(order.date_upd),
    order_rows: rowsList.map((row) => ({
      product_id: getValue(row.product_id),
      product_attribute_id: getValue(row.product_attribute_id),
      product_quantity: Number(getValue(row.product_quantity) || 0),
      unit_price_tax_excl: Number(getValue(row.unit_price_tax_excl) || 0),
      unit_price_tax_incl: Number(getValue(row.unit_price_tax_incl) || 0),
    })),
  };
};

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchOrderList = async () => {
  const xmlText = await requestXml(`${ressource}?display=full`);
  const orders = parseXmlToJson(xmlText)?.prestashop?.orders?.order || [];
  return orders.map(parseOrder);
};

export const fetchOrderById = async (id) => {
  const xmlText = await requestXml(`${ressource}/${id}`);
  const order = parseXmlToJson(xmlText)?.prestashop?.order;
  return parseOrder(order);
};

// ─────────────────────────────────────────────
// Création
// ─────────────────────────────────────────────

export const createOrder = async (row, cartId, customerId, addressId, items) => {
  const stateConfig = getOrderStateConfigFromLabel(row.etat);
  if (!stateConfig) throw new Error(`Etat commande inconnu: ${row.etat}`);

  const totals = items.reduce(
    (acc, item) => {
      const unitPriceHt = item.prixHT || item.unitPriceHt || 0;
      const unitPriceTtc = item.prix || item.unitPriceTtc || 0;
      acc.totalHt += unitPriceHt * item.quantity;
      acc.totalTtc += unitPriceTtc * item.quantity;
      return acc;
    },
    { totalHt: 0, totalTtc: 0 },
  );

  const totalPaid = totals.totalTtc.toFixed(4);
  const totalPaidReal = stateConfig.paidReal === "TOTAL" ? totalPaid : stateConfig.paidReal;

  const isFinalState = stateConfig.stateId === "5" || stateConfig.stateId === "6";
  const initialStateId = isFinalState ? "2" : stateConfig.stateId;
  const initialValid = isFinalState ? 1 : stateConfig.valid;
  const initialPaidReal = isFinalState ? totalPaid : totalPaidReal;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order>
    <id_address_delivery><![CDATA[${addressId}]]></id_address_delivery>
    <id_address_invoice><![CDATA[${addressId}]]></id_address_invoice>
    <id_cart><![CDATA[${cartId}]]></id_cart>
    <id_currency><![CDATA[1]]></id_currency>
    <id_lang><![CDATA[1]]></id_lang>
    <id_customer><![CDATA[${customerId}]]></id_customer>
    <id_carrier><![CDATA[1]]></id_carrier>
    <current_state><![CDATA[${initialStateId}]]></current_state>
    <module><![CDATA[${stateConfig.module}]]></module>
    <payment><![CDATA[${stateConfig.payment}]]></payment>
    <valid><![CDATA[${initialValid}]]></valid>
    <total_paid><![CDATA[${totalPaid}]]></total_paid>
    <total_paid_tax_incl><![CDATA[${totalPaid}]]></total_paid_tax_incl>
    <total_paid_tax_excl><![CDATA[${totals.totalHt.toFixed(4)}]]></total_paid_tax_excl>
    <total_paid_real><![CDATA[${initialPaidReal}]]></total_paid_real>
    <total_products><![CDATA[${totals.totalHt.toFixed(4)}]]></total_products>
    <total_products_wt><![CDATA[${totalPaid}]]></total_products_wt>
    <total_shipping><![CDATA[0]]></total_shipping>
    <total_shipping_tax_incl><![CDATA[0]]></total_shipping_tax_incl>
    <total_shipping_tax_excl><![CDATA[0]]></total_shipping_tax_excl>
    <total_discounts><![CDATA[0]]></total_discounts>
    <total_discounts_tax_incl><![CDATA[0]]></total_discounts_tax_incl>
    <total_discounts_tax_excl><![CDATA[0]]></total_discounts_tax_excl>
    <total_wrapping><![CDATA[0]]></total_wrapping>
    <total_wrapping_tax_incl><![CDATA[0]]></total_wrapping_tax_incl>
    <total_wrapping_tax_excl><![CDATA[0]]></total_wrapping_tax_excl>
    <conversion_rate><![CDATA[1.000000]]></conversion_rate>
    <round_mode><![CDATA[2]]></round_mode>
    <round_type><![CDATA[1]]></round_type>
  </order>
</prestashop>`;

  const orderId = await postXml(ressource, xml);

  return { orderId, stateId: stateConfig.stateId, totalPaid };
};

// ─────────────────────────────────────────────
// Mise à jour
// ─────────────────────────────────────────────

export const updateOrderState = async (id, newStateId) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order>
    <id>${id}</id>
    <current_state>${Number(newStateId)}</current_state>
  </order>
</prestashop>`;
  return patchXml(`${ressource}/${id}`, xml);
};

export const updateOrderStateWithMovement = async (orderId, newStateId, dateAdd = null) => {
  const dateStr = dateAdd || new Date().toISOString().replace("T", " ").substring(0, 19);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order_state_update>
    <id_order><![CDATA[${orderId}]]></id_order>
    <id_order_state><![CDATA[${Number(newStateId)}]]></id_order_state>
    <date_add><![CDATA[${dateStr}]]></date_add>
  </order_state_update>
</prestashop>`;
  return postXml("order_state_update", xml);
};

export const updateOrderDate = async (id, date) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order>
    <id><![CDATA[${id}]]></id>
    <date_add><![CDATA[${date} 00:00:00]]></date_add>
  </order>
</prestashop>`;
  return patchXml(ressource, xml);
};

export const updateOrderHistoryDate = async (id, date) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order_history>
    <id><![CDATA[${id}]]></id>
    <date_add><![CDATA[${date} 00:00:00]]></date_add>
  </order_history>
</prestashop>`;
  return patchXml("order_histories", xml);
};

export const updatePaymentDate = async (id, date) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order_payment>
    <id><![CDATA[${id}]]></id>
    <date_add><![CDATA[${date} 00:00:00]]></date_add>
  </order_payment>
</prestashop>`;
  return patchXml("order_payments", xml);
};

// ─────────────────────────────────────────────
// Suppression
// ─────────────────────────────────────────────

export const deleteOrderById = async (id) => deleteOne(ressource, id);