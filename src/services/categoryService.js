import { requestXml, deleteOne, postXml, fetchIdByFilter } from "./prestashopClient";
import { parseXmlToJson, getValue, buildLangXml, slugify } from "../shared/xmlUtils";

const ressource = "categories";

// --- Parsing ---

export const parseCategory = (category) => {
    const products = category.associations?.products?.product;
    const productsList = Array.isArray(products)
        ? products
        : products
            ? [products]
            : [];

    return {
        id: getValue(category.id),
        id_parent: getValue(category.id_parent),
        level_depth: getValue(category.level_depth),
        nb_products: getValue(category.nb_products_recursive),
        active: getValue(category.active),
        is_root: getValue(category.is_root_category),
        position: getValue(category.position),
        date_ajout: getValue(category.date_add),
        date_modif: getValue(category.date_upd),
        nom: getValue(category.name?.language),
        description: getValue(category.description?.language),
        meta_titre: getValue(category.meta_title?.language),
        product_ids: productsList.map((p) => Number(getValue(p.id))),
    };
};

// --- Services ---

export const fetchCategoryList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
    const categories =
        parseXmlToJson(xmlText)?.prestashop?.categories?.category || [];

    const response = [];
    categories.forEach((category) => {
        if (category.id!=1) {
            response.push(parseCategory(category))
        }
    });
    return response;
};

export const fetchCategoryById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const category = parseXmlToJson(xmlText)?.prestashop?.category;
    return parseCategory(category);
};

export const deleteCategoryById = async (id) => deleteOne(ressource, id);

export const createCategoryFromXml = async (xmlText) =>
    postXml(ressource, xmlText);

export const ensureCategory = async (name, languageIds) => {
  const slug = slugify(name);
  let id = await fetchIdByFilter(ressource, "category", "name", name);
  if (id) return id;

  id = await fetchIdByFilter(ressource, "category", "link_rewrite", slug);
  if (id) return id;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <category>
    <active><![CDATA[1]]></active>
    <id_shop_default><![CDATA[1]]></id_shop_default>
    <id_parent><![CDATA[1]]></id_parent>
    <name>
      ${buildLangXml(languageIds, name)}
    </name>
    <link_rewrite>
      ${buildLangXml(languageIds, slug)}
    </link_rewrite>
    <description>
      ${buildLangXml(languageIds, name)}
    </description>
  </category>
</prestashop>`;

  id = await postXml(ressource, xml);
  return id;
};