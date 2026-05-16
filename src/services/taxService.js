import { requestXml } from "./prestashopClient";
import { parseXmlToJson, getValue } from "../shared/xmlUtils";

export const fetchTaxRate = async (idTaxRulesGroup) => {
  if (!idTaxRulesGroup || Number(idTaxRulesGroup) === 0) return 0;
  try {
    // Fetch tax rules for this group
    const rulesXml = await requestXml(`tax_rules?display=full&filter[id_tax_rules_group]=${idTaxRulesGroup}`);
    const rules = parseXmlToJson(rulesXml)?.prestashop?.tax_rules?.tax_rule;

    let idTax = null;
    if (Array.isArray(rules)) {
      if (rules.length > 0) idTax = getValue(rules[0].id_tax);
    } else if (rules) {
      idTax = getValue(rules.id_tax);
    }

    if (!idTax) return 0;

    // Fetch the specific tax rate
    const taxXml = await requestXml(`taxes/${idTax}`);
    const tax = parseXmlToJson(taxXml)?.prestashop?.tax;
    const rate = getValue(tax?.rate);

    return Number(rate) || 0;
  } catch (err) {
    console.error("Error fetching tax rate:", err);
    return 0; // Default to 0% if fails
  }
};
