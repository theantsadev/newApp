import { PRESTASHOP_BASE_URL, getAuthHeader } from "../config/prestashop";
import { getTextContent, parseXmlDoc } from "../shared/xmlUtils";

const buildUrl = (path) => `${PRESTASHOP_BASE_URL}/api/${path}`;

const extractErrorMessage = (xmlText) => {
  if (!xmlText) return "";
  const dom = parseXmlDoc(xmlText);
  return dom.querySelector("message")?.textContent?.trim() || "";
};

export const requestXml = async (path, options = {}) => {
  const resp = await fetch(buildUrl(path), {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      ...(options.headers || {}),
    },
  });

  const xmlText = await resp.text();

  if (!resp.ok) {
    const message = extractErrorMessage(xmlText);
    const fallback = xmlText ? ` - ${xmlText.slice(0, 200)}` : "";
    const suffix = message ? ` - ${message}` : fallback;
    throw new Error(`HTTP ${resp.status}${suffix}`);
  }

  return xmlText;
};

export const getAllIds = async (endpoint, tag) => {
  const xmlText = await requestXml(endpoint);
  const dom = parseXmlDoc(xmlText);
  return Array.from(dom.querySelectorAll(tag))
    .map((node) => node.getAttribute("id"))
    .filter(Boolean);
};

export const deleteOne = async (endpoint, id) => {
  await requestXml(`${endpoint}/${id}`, { method: "DELETE" });
};


export const patchXml = async (endpoint, xmlText) => {
  const responseText = await requestXml(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/xml" },
    body: xmlText,
  });

  const dom = parseXmlDoc(responseText);
  return getTextContent(dom, "id") || "?";
};

export const postXml = async (endpoint, xmlText) => {
  const responseText = await requestXml(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xmlText,
  });

  const dom = parseXmlDoc(responseText);
  return getTextContent(dom, "id") || "?";
};

export const fetchIdByFilter = async (endpoint, tag, field, value) => {
  const xmlText = await requestXml(
    `${endpoint}?filter[${field}]=[${encodeURIComponent(value)}]&display=[id]`,
  );
  const dom = parseXmlDoc(xmlText);
  const node = dom.querySelector(tag);
  return node?.querySelector("id")?.textContent?.trim() || "";
};

export const fetchIdByFilters = async (endpoint, tag, filters) => {
  const query = Object.entries(filters)
    .map(([key, value]) => `filter[${key}]=[${encodeURIComponent(value)}]`)
    .join("&");
  const xmlText = await requestXml(`${endpoint}?${query}&display=[id]`);
  const dom = parseXmlDoc(xmlText);
  const node = dom.querySelector(tag);
  return node?.querySelector("id")?.textContent?.trim() || "";
};

export const fetchLanguageIds = async () => {
  const xmlText = await requestXml("languages");
  const dom = parseXmlDoc(xmlText);
  const ids = Array.from(dom.querySelectorAll("language"))
    .map((node) => node.getAttribute("id"))
    .filter(Boolean);
  return ids.length > 0 ? ids : ["1"];
};
