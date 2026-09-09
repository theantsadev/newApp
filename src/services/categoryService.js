import { requestXml, deleteOne, postXml, fetchIdByFilter } from "./prestashopClient";
import { parseXmlToJson, getValue, buildLangXml, slugify, ensureArray } from "../shared/xmlUtils";

const ressource = "categories";

// ─────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────

export const parseCategory = (category) => {
  const products = category.associations?.products?.product;
  const productsList = ensureArray(products);

    return {
        id:          getValue(category.id),
        id_parent:   getValue(category.id_parent),
        level_depth: getValue(category.level_depth),
        nb_products: getValue(category.nb_products_recursive),
        active:      getValue(category.active),
        is_root:     getValue(category.is_root_category),
        position:    getValue(category.position),
        date_ajout:  getValue(category.date_add),
        date_modif:  getValue(category.date_upd),
        nom:         getValue(category.name?.language),
        description: getValue(category.description?.language),
        meta_titre:  getValue(category.meta_title?.language),
        product_ids: productsList.map((p) => Number(getValue(p.id))),
    };
};

// ─────────────────────────────────────────────
// Lecture (fetch)
// ─────────────────────────────────────────────

export const fetchCategoryList = async () => {
    const xmlText = await requestXml(`${ressource}?display=full`);
  const categories = parseXmlToJson(xmlText)?.prestashop?.categories?.category;
  const categoryList = ensureArray(categories);
    // La catégorie racine (id=1) est exclue car elle n'est pas exploitable métier
  return categoryList
        .filter((category) => category.id != 1)
        .map(parseCategory);
};

export const fetchCategoryById = async (id) => {
    const xmlText = await requestXml(`${ressource}/${id}`);
    const category = parseXmlToJson(xmlText)?.prestashop?.category;
    return parseCategory(category);
};

// ─────────────────────────────────────────────
// Création
// ─────────────────────────────────────────────

/**
 * Crée la catégorie si elle n'existe pas déjà (contrôle par nom puis par slug).
 * Retourne l'id existant ou celui de la catégorie nouvellement créée.
 */
export const ensureCategory = async (name, languageIds) => {
    const slug = slugify(name);

    const existingId =
        (await fetchIdByFilter(ressource, "category", "name", name)) ||
        (await fetchIdByFilter(ressource, "category", "link_rewrite", slug));
    if (existingId) return existingId;

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

    return postXml(ressource, xml);
};

// ─────────────────────────────────────────────
// Suppression
// ─────────────────────────────────────────────

export const deleteCategoryById = async (id) => deleteOne(ressource, id);