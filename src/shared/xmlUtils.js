export const parseXmlDoc = (xmlText) =>
  new DOMParser().parseFromString(xmlText, "text/xml");

export const getTextContent = (dom, selector) =>
  dom.querySelector(selector)?.textContent?.trim() || "";
