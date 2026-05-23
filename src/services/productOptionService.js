import { requestXml, deleteOne, postXml, patchXml, fetchIdByFilter } from "./prestashopClient";
import { parseXmlToJson, getValue, buildLangXml } from "../shared/xmlUtils";

const ressource = "product_options";

export const parseProductOption = (opt) => ({
  id: getValue(opt.id),
  name: getValue(opt.name?.language),
  public_name: getValue(opt.public_name?.language),
  type: getValue(opt.group_type),
});

export const fetchProductOptionList = async () => {
  const xmlText = await requestXml(`${ressource}?display=full`);
  const options = parseXmlToJson(xmlText)?.prestashop?.product_options?.product_option || [];
  const arr = Array.isArray(options) ? options : [options];
  return arr.map(parseProductOption);
};

export const fetchProductOptionByIds = async (ids) => {
  const filter = ids.map((id) => `[${id}]`).join(",");
  const xmlText = await requestXml(`${ressource}?filter[id]=${filter}&display=full`);
  const options = parseXmlToJson(xmlText)?.prestashop?.product_options?.product_option || [];
  const arr = Array.isArray(options) ? options : [options];
  return arr.map(parseProductOption);
};

export const fetchProductOptionById = async (id) => {
  const xmlText = await requestXml(`${ressource}/${id}`);
  const option = parseXmlToJson(xmlText)?.prestashop?.product_option;
  return parseProductOption(option);
};

export const deleteProductOptionById = async (id) => deleteOne(ressource, id);

export const createProductOptionFromXml = async (xmlText) => postXml(ressource, xmlText);

export const patchProductOptionById = async (id, xmlText) => patchXml(`${ressource}/${id}`, xmlText);

export const ensureOption = async (name, groupType, isColor, languageIds) => {
  let id = await fetchIdByFilter(
    ressource,
    "product_option",
    "name",
    name,
  );
  if (id) return id;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product_option>
    <is_color_group><![CDATA[${isColor ? 1 : 0}]]></is_color_group>
    <group_type><![CDATA[${groupType}]]></group_type>
    <name>
      ${buildLangXml(languageIds, name)}
    </name>
    <public_name>
      ${buildLangXml(languageIds, name)}
    </public_name>
  </product_option>
</prestashop>`;

  id = await postXml(ressource, xml);
  return id;
};
