import { XMLParser, XMLBuilder } from "fast-xml-parser";

export const parseXmlDoc = (xmlText) =>
  new DOMParser().parseFromString(xmlText, "text/xml");

export const getTextContent = (dom, selector) =>
  dom.querySelector(selector)?.textContent?.trim() || "";


/* =========================
   Utilitaires partagés (une seule fois)
========================= */

export const getValue = (field) => {
  if (field == null) return "";
  if (typeof field !== "object") return field;
  return field["#text"] || "";
};

const parserConfig = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: true,
  trimValues: true,
};

export const parseXmlToJson = (xmlString) => {
  const parser = new XMLParser(parserConfig);
  return parser.parse(xmlString);
};

export const buildXmlFromJson = (json) => {
  const builder = new XMLBuilder({ ...parserConfig, format: true });
  return builder.build(json);
};

export const buildLangXml = (languageIds, value) =>
  languageIds
    .map((id) => `<language id="${id}"><![CDATA[${value}]]></language>`)
    .join("");

export const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");