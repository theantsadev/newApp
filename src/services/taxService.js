import { requestXml, postXml, fetchIdByFilter, fetchIdByFilters } from "./prestashopClient";
import { parseXmlToJson, getValue, buildLangXml, ensureArray } from "../shared/xmlUtils";

// ─────────────────────────────────────────────
// Configuration & constantes
// ─────────────────────────────────────────────

export const getTaxConfig = (rate) => {
    const key = Number(rate).toFixed(4);
    return { taxName: `TVA ${key}%`, groupName: `TRG-${key}` };
};

// ─────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────

const parseTax = (tax) => ({
    id:   getValue(tax.id),
    rate: Number(getValue(tax.rate)) || 0,
    name: getValue(tax.name?.language),
});

const parseTaxRule = (rule) => ({
    id:                 getValue(rule.id),
    id_tax_rules_group: getValue(rule.id_tax_rules_group),
    id_tax:             getValue(rule.id_tax),
    id_country:         getValue(rule.id_country),
});

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchTaxRate = async (idTaxRulesGroup) => {
    if (!idTaxRulesGroup || Number(idTaxRulesGroup) === 0) return 0;

    try {
        const rulesXml = await requestXml(`tax_rules?display=full&filter[id_tax_rules_group]=${idTaxRulesGroup}`);
        const rules = parseXmlToJson(rulesXml)?.prestashop?.tax_rules?.tax_rule;
        const first = ensureArray(rules)[0];
        const idTax = first ? parseTaxRule(first).id_tax : null;
        if (!idTax) return 0;

        const taxXml = await requestXml(`taxes/${idTax}`);
        const tax = parseXmlToJson(taxXml)?.prestashop?.tax;
        return tax ? parseTax(tax).rate : 0;
    } catch (err) {
        console.error("Error fetching tax rate:", err);
        return 0;
    }
};

// ─────────────────────────────────────────────
// Création
// ─────────────────────────────────────────────

const ensureTax = async (taxName, rate, languageIds) => {
    const existingId = await fetchIdByFilter("taxes", "tax", "name", taxName);
    if (existingId) return existingId;

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
    return postXml("taxes", xml);
};

const ensureTaxRuleGroup = async (groupName) => {
    const existingId = await fetchIdByFilter("tax_rule_groups", "tax_rule_group", "name", groupName);
    if (existingId) return existingId;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <tax_rule_group>
    <name><![CDATA[${groupName}]]></name>
    <active><![CDATA[1]]></active>
  </tax_rule_group>
</prestashop>`;
    return postXml("tax_rule_groups", xml);
};

const ensureTaxRule = async (groupId, taxId) => {
    const existingId = await fetchIdByFilters("tax_rules", "tax_rule", {
        id_tax_rules_group: groupId,
        id_tax:             taxId,
        id_country:         8,
    });
    if (existingId) return existingId;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <tax_rule>
    <id_tax_rules_group><![CDATA[${groupId}]]></id_tax_rules_group>
    <id_tax><![CDATA[${taxId}]]></id_tax>
    <id_country><![CDATA[8]]></id_country>
  </tax_rule>
</prestashop>`;
    return postXml("tax_rules", xml);
};

/**
 * Crée la taxe, le groupe de règles et la règle associée si inexistants.
 * Retourne l'id du groupe de règles de taxe (tax_rule_group).
 */
export const ensureTaxSetup = async (rate, languageIds) => {
    const { taxName, groupName } = getTaxConfig(rate);
    const taxId   = await ensureTax(taxName, rate, languageIds);
    const groupId = await ensureTaxRuleGroup(groupName);
    await ensureTaxRule(groupId, taxId);
    return groupId;
};