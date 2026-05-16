import { requestXml, deleteOne, postXml } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";

const CART_KEY = "prestashop_cart_key";
const ressource = "carts";

export const getStoredCart = () => localStorage.getItem(CART_KEY) || "";

export const setStoredCart = (cart) => {
    localStorage.setItem(CART_KEY, cart);
};

export const clearStoredCart = () => {
    localStorage.removeItem(CART_KEY);
};

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
        cart_row_ids: cartRowsList.map((cartRow) => ({
            id_product: getValue(cartRow.id_product),
            id_product_attribute: getValue(cartRow.id_product_attribute),
            id_address_delivery: getValue(cartRow.id_address_delivery),
            id_customization: getValue(cartRow.id_customization),
            quantity: getValue(cartRow.quantity),
        })),
    };
};

export const fetchCartList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
    const carts = parseXmlToJson(xmlText)?.prestashop?.carts?.cart || [];
    const response = [];

    carts.forEach((cart) => {
        response.push(parseCart(cart));
    });

    return response;
};

export const fetchCartById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const cart = parseXmlToJson(xmlText)?.prestashop?.cart;
    return parseCart(cart);
};

export const deleteCartById = async (id) => deleteOne(ressource, id);

export const createCartFromXml = async (xmlText) => postXml(ressource, xmlText);