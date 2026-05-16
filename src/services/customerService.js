import { requestXml, deleteOne, postXml } from "./prestashopClient";
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
