import { requestXml, deleteOne, postXml, patchXml } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";
import { fetchOrderList } from "./orderService";

const CART_KEY = "prestashop_cart_key";
const ressource = "carts";

// ─────────────────────────────────────────────
// Stockage local (localStorage)
// ─────────────────────────────────────────────

export const getStoredCart = () => localStorage.getItem(CART_KEY) || "";
export const setStoredCart = (cart) => localStorage.setItem(CART_KEY, cart);
export const clearStoredCart = () => localStorage.removeItem(CART_KEY);

// ─────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────

export const parseCart = (cart) => {
  const cartRows = cart?.associations?.cart_rows?.cart_row;
  const cartRowsList = Array.isArray(cartRows)
    ? cartRows
    : cartRows
      ? [cartRows]
      : [];

  return {
    id: getValue(cart.id),
    id_address_delivery: getValue(cart.id_address_delivery),
    id_address_invoice: getValue(cart.id_address_invoice),
    id_currency: getValue(cart.id_currency),
    id_customer: getValue(cart.id_customer),
    id_guest: getValue(cart.id_guest),
    id_lang: getValue(cart.id_lang),
    id_shop_group: getValue(cart.id_shop_group),
    id_shop: getValue(cart.id_shop),
    id_carrier: getValue(cart.id_carrier),
    recyclable: getValue(cart.recyclable),
    gift: getValue(cart.gift),
    gift_message: getValue(cart.gift_message),
    mobile_theme: getValue(cart.mobile_theme),
    delivery_option: getValue(cart.delivery_option),
    secure_key: getValue(cart.secure_key),
    allow_seperated_package: getValue(cart.allow_seperated_package),
    date_add: getValue(cart.date_add),
    date_upd: getValue(cart.date_upd),
    cart_row_ids: cartRowsList.map((row) => ({
      id_product: getValue(row.id_product),
      id_product_attribute: getValue(row.id_product_attribute),
      id_address_delivery: getValue(row.id_address_delivery),
      id_customization: getValue(row.id_customization),
      quantity: getValue(row.quantity),
    })),
  };
};

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchCartList = async () => {
  const xmlText = await requestXml(`${ressource}?display=full`);
  const carts = parseXmlToJson(xmlText)?.prestashop?.carts?.cart || [];
  return carts.map(parseCart);
};

/** Retourne uniquement les paniers sans commande associée. */
export const fetchUnlinkedCartList = async () => {
  const [cartList, orderList] = await Promise.all([fetchCartList(), fetchOrderList()]);
  const linkedCartIds = new Set(
    orderList.map((order) => String(order.id_cart)).filter(Boolean),
  );
  return cartList.filter((cart) => !linkedCartIds.has(String(cart.id)));
};

export const fetchCartById = async (id) => {
  const xmlText = await requestXml(`${ressource}/${id}`);
  const cart = parseXmlToJson(xmlText)?.prestashop?.cart;
  return parseCart(cart);
};

// ─────────────────────────────────────────────
// Création & mise à jour
// ─────────────────────────────────────────────

export const createCart = async (customerId, addressId, items) => {
  const rowsXml = items.map((item) => {
    const id_product = item.productId || item.id_product;
    const id_product_attribute = item.attributeId || item.id_product_attribute;
    `
      <cart_row>
        <id_product><![CDATA[${id_product}]]></id_product>
        <id_product_attribute><![CDATA[${id_product_attribute}]]></id_product_attribute>
        <id_address_delivery><![CDATA[${addressId}]]></id_address_delivery>
        <id_customization><![CDATA[0]]></id_customization>
        <quantity><![CDATA[${item.quantity}]]></quantity>
      </cart_row>`}).join("");

  const deliveryOption = `{"${addressId}":"1,"}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <cart>
    <id_address_delivery><![CDATA[${addressId}]]></id_address_delivery>
    <id_address_invoice><![CDATA[${addressId}]]></id_address_invoice>
    <id_currency><![CDATA[1]]></id_currency>
    <id_customer><![CDATA[${customerId}]]></id_customer>
    <id_lang><![CDATA[1]]></id_lang>
    <id_shop><![CDATA[1]]></id_shop>
    <id_shop_group><![CDATA[1]]></id_shop_group>
    <id_carrier><![CDATA[1]]></id_carrier>
    <delivery_option><![CDATA[${deliveryOption}]]></delivery_option>
    <recyclable><![CDATA[0]]></recyclable>
    <gift><![CDATA[0]]></gift>
    <associations>
      <cart_rows>
        ${rowsXml}
      </cart_rows>
    </associations>
  </cart>
</prestashop>`;

  return postXml(ressource, xml);
};

export const updateCartDate = async (id, date) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <cart>
    <id><![CDATA[${id}]]></id>
    <date_add><![CDATA[${date} 00:00:00]]></date_add>
  </cart>
</prestashop>`;

  return patchXml(ressource, xml);
};

// ─────────────────────────────────────────────
// Suppression
// ─────────────────────────────────────────────

export const deleteCartById = async (id) => deleteOne(ressource, id);