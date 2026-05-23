import { requestXml, postXml, fetchIdByFilter, fetchIdByFilters } from "./prestashopClient";
import { parseXmlToJson, getValue, buildLangXml } from "../shared/xmlUtils";

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

const TAX_CONFIG = {
  11.65: { taxName: "TVA FR 11.65%", groupName: "TRG1" },
  "5.60": { taxName: "TVA FR 5.6%", groupName: "TRG2" },
};

export const getTaxConfig = (rate) => {
  const key = Number(rate).toFixed(4);
  return (
    TAX_CONFIG[key] || {
      taxName: `TVA ${key}%`,
      groupName: `TRG-${key}`,
    }
  );
};

export const ensureTaxSetup = async (rate, languageIds) => {
  const { taxName, groupName } = getTaxConfig(rate);
  let taxId = await fetchIdByFilter("taxes", "tax", "name", taxName);
  if (!taxId) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <tax>
    <rate><![CDATA[${rate}]]></rate>
    <active><![CDATA[1]]></active>
    <name>
      ${buildLangXml(languageIds, taxName)}
    </name>
  </tax>
</prestashop>`;
    taxId = await postXml("taxes", xml);
  }

  let groupId = await fetchIdByFilter(
    "tax_rule_groups",
    "tax_rule_group",
    "name",
    groupName,
  );
  if (!groupId) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <tax_rule_group>
    <name><![CDATA[${groupName}]]></name>
    <active><![CDATA[1]]></active>
  </tax_rule_group>
</prestashop>`;
    groupId = await postXml("tax_rule_groups", xml);
  }

  const existingRuleId = await fetchIdByFilters("tax_rules", "tax_rule", {
    id_tax_rules_group: groupId,
    id_tax: taxId,
    id_country: 8,
  });
  if (!existingRuleId) {
    const ruleXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <tax_rule>
    <id_tax_rules_group><![CDATA[${groupId}]]></id_tax_rules_group>
    <id_tax><![CDATA[${taxId}]]></id_tax>
    <id_country><![CDATA[8]]></id_country>
  </tax_rule>
</prestashop>`;
    await postXml("tax_rules", ruleXml);
  }

  return groupId;
};
