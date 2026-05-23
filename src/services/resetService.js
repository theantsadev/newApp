import { deleteOne, getAllIds } from "./prestashopClient";

// ─────────────────────────────────────────────
// Configuration & constantes
// ─────────────────────────────────────────────

export const RESET_RESOURCES = [
    { key: "order_histories",       label: "Historique commandes",  endpoint: "order_histories",       tag: "order_history"        },
    { key: "order_payments",        label: "Paiements commandes",   endpoint: "order_payments",        tag: "order_payment"        },
    { key: "orders",                label: "Commandes",             endpoint: "orders",                tag: "order"                },
    { key: "carts",                 label: "Paniers",               endpoint: "carts",                 tag: "cart"                 },
    { key: "addresses",             label: "Adresses",              endpoint: "addresses",             tag: "address"              },
    { key: "customers",             label: "Clients",               endpoint: "customers",             tag: "customer"             },
    { key: "combinations",          label: "Declinaisons",          endpoint: "combinations",          tag: "combination"          },
    { key: "product_option_values", label: "Valeurs options",       endpoint: "product_option_values", tag: "product_option_value" },
    { key: "product_options",       label: "Options",               endpoint: "product_options",       tag: "product_option"       },
    { key: "product_images",        label: "Images produits",       endpoint: "images/products",       tag: "product"              },
    { key: "products",              label: "Produits",              endpoint: "products",              tag: "product"              },
    { key: "categories",            label: "Categories",            endpoint: "categories",            tag: "category"             },
    { key: "tax_rules",             label: "Regles de taxes",       endpoint: "tax_rules",             tag: "tax_rule"             },
    { key: "tax_rule_groups",       label: "Groupes de taxes",      endpoint: "tax_rule_groups",       tag: "tax_rule_group"       },
    { key: "taxes",                 label: "Taxes",                 endpoint: "taxes",                 tag: "tax"                  },
];

// ─────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────

const fetchIdsForResource = async (resource) => {
    // Les images produits s'obtiennent via l'endpoint products, pas images/products
    const endpoint = resource.key === "product_images" ? "products" : resource.endpoint;
    let ids = await getAllIds(endpoint, resource.tag);

    // La catégorie racine (id=1) ne doit jamais être supprimée
    if (resource.key === "categories") {
        ids = ids.filter((id) => id !== "1");
    }

    return ids;
};

// ─────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────

export const resetResources = async (selectionKeys, options = {}) => {
    const onProgress = options.onProgress;
    const report = {};

    const orderedSelection = RESET_RESOURCES.filter((r) => selectionKeys.includes(r.key));

    for (const resource of orderedSelection) {
        report[resource.key] = { label: resource.label, succes: 0, erreurs: [] };

        try {
            const ids = await fetchIdsForResource(resource);

            if (ids.length === 0) {
                if (onProgress) onProgress(resource.key, 100);
                continue;
            }

            for (const [index, id] of ids.entries()) {
                try {
                    await deleteOne(resource.endpoint, id);
                    report[resource.key].succes++;
                } catch (err) {
                    report[resource.key].erreurs.push(`${id} : ${err.message}`);
                }

                if (onProgress) {
                    onProgress(resource.key, Math.round(((index + 1) / ids.length) * 100));
                }
            }
        } catch (err) {
            report[resource.key].erreurs.push(`GET : ${err.message}`);
        }
    }

    return report;
};