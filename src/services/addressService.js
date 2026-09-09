import { requestXml, postXml } from "./prestashopClient";
import { parseXmlToJson, getValue, ensureArray } from "../shared/xmlUtils";

const ressource = "addresses";

// ─────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────

export const parseAddress = (address) => ({
    id:           getValue(address.id),
    id_customer:  getValue(address.id_customer),
    id_country:   getValue(address.id_country),
    alias:        getValue(address.alias),
    lastname:     getValue(address.lastname),
    firstname:    getValue(address.firstname),
    address1:     getValue(address.address1),
    address2:     getValue(address.address2),
    postcode:     getValue(address.postcode),
    city:         getValue(address.city),
    phone:        getValue(address.phone),
    phone_mobile: getValue(address.phone_mobile),
});

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchAddressesByCustomerId = async (idCustomer) => {
    const xmlText = await requestXml(`${ressource}?display=full&filter[id_customer]=[${idCustomer}]`);
    const addresses = parseXmlToJson(xmlText)?.prestashop?.addresses?.address;
    if (!addresses) return [];

  const addressList = ensureArray(addresses);
    return addressList.map(parseAddress);
};

// ─────────────────────────────────────────────
// Création
// ─────────────────────────────────────────────

/**
 * Crée une adresse pour le client donné.
 * Note : pas de contrôle d'existence — une nouvelle adresse est toujours créée.
 */
export const ensureAddress = async (customerId, row) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <address>
    <id_customer><![CDATA[${customerId}]]></id_customer>
    <id_country><![CDATA[8]]></id_country>
    <alias><![CDATA[domicile]]></alias>
    <lastname><![CDATA[${row.nom}]]></lastname>
    <firstname><![CDATA[${row.nom}]]></firstname>
    <address1><![CDATA[${row.adresse}]]></address1>
    <city><![CDATA[Antananarivo]]></city>
    <postcode><![CDATA[75000]]></postcode>
  </address>
</prestashop>`;

    return postXml(ressource, xml);
};