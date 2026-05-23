import { requestXml, deleteOne, postXml, fetchIdByFilter } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";

const ressource = "customers";

export const parseCustomer = (customer) => ({
  id: getValue(customer.id),
  firstname: getValue(customer.firstname),
  lastname: getValue(customer.lastname),
  email: getValue(customer.email),
});

export const fetchCustomerList = async () => {
  const xmlText = await requestXml(`${ressource}?display=full`);
  const customers = parseXmlToJson(xmlText)?.prestashop?.customers?.customer || [];
  const response = [];
  customers.forEach((customer) => {
    response.push(parseCustomer(customer));
  });
  return response;
};

export const fetchCustomerByEmail = async (email) => {
  const xmlText = await requestXml(`${ressource}?display=full&filter[email]=[${email}]`);
  const customers = parseXmlToJson(xmlText)?.prestashop?.customers?.customer;

  if (!customers) return null;

  const customerList = Array.isArray(customers) ? customers : [customers];
  if (customerList.length > 0) {
    return parseCustomer(customerList[0]);
  }
  return null;
};

export const fetchCustomerById = async (id) => {
  const xmlText = await requestXml(`${ressource}/${id}`);
  const customer = parseXmlToJson(xmlText)?.prestashop?.customer;
  return parseCustomer(customer);
};

export const ensureCustomer = async (row) => {
  let id = await fetchIdByFilter(ressource, "customer", "email", row.email);
  if (id) return id;

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

  id = await postXml(ressource, xml);
  return id;
};
