import { requestXml, postXml, fetchIdByFilter } from "./prestashopClient";
import { parseXmlToJson, getValue, ensureArray } from "../shared/xmlUtils";

const ressource = "customers";

// ─────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────

export const parseCustomer = (customer) => ({
    id:        getValue(customer.id),
    firstname: getValue(customer.firstname),
    lastname:  getValue(customer.lastname),
    email:     getValue(customer.email),
});

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchCustomerList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
    const customers = parseXmlToJson(xmlText)?.prestashop?.customers?.customer;
    return ensureArray(customers).map(parseCustomer);
};

export const fetchCustomerByEmail = async (email) => {
    const xmlText = await requestXml(`${ressource}?display=full&filter[email]=[${email}]`);
    const customers = parseXmlToJson(xmlText)?.prestashop?.customers?.customer;
    if (!customers) return null;

    const customerList = ensureArray(customers);
    return customerList.length > 0 ? parseCustomer(customerList[0]) : null;
};

export const fetchCustomerById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const customer = parseXmlToJson(xmlText)?.prestashop?.customer;
    return parseCustomer(customer);
};

// ─────────────────────────────────────────────
// Création
// ─────────────────────────────────────────────

/**
 * Crée le client s'il n'existe pas déjà (contrôle par email).
 * Retourne l'id existant ou celui du client nouvellement créé.
 */
export const ensureCustomer = async (row) => {
    const existingId = await fetchIdByFilter(ressource, "customer", "email", row.email);
    if (existingId) return existingId;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <customer>
    <passwd><![CDATA[${row.pwd}]]></passwd>
    <lastname><![CDATA[${row.nom}]]></lastname>
    <firstname><![CDATA[${row.nom}]]></firstname>
    <email><![CDATA[${row.email}]]></email>
    <active><![CDATA[1]]></active>
    <newsletter><![CDATA[0]]></newsletter>
    <id_default_group><![CDATA[3]]></id_default_group>
  </customer>
</prestashop>`;

    return postXml(ressource, xml);
};