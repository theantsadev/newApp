import { createCart, createCartFromXml } from "./cartService";
import { createOrder, createOrderFromXml } from "./orderService";
import { fetchProductById } from "./productService";
import { fetchCombinationsByProduct } from "./combinationService";
import { fetchTaxRate } from "./taxService";

/**
 * Calcule le total d'un panier et le convertit en commande.
 * Peut créer un panier depuis zéro (cas FrontOffice) ou utiliser un existant (cas BackOffice).
 */
export const processOrderCreation = async ({
  customer,
  addressId,
  cartItems,
  existingCartId = null,
  orderStateLabel = "paiement accepté",
}) => {
  if (!customer) throw new Error("Client non défini.");
  if (customer.isAnonymous)
    throw new Error(
      "Les commandes ne sont pas autorisées pour les utilisateurs anonymes.",
    );
  if (!addressId || String(addressId) === "0")
    throw new Error("Aucune adresse valide spécifiée pour la commande.");

  // Enrichir le panier si les détails de prix ne sont pas déjà présents
  const enrichedCart = await Promise.all(
    cartItems.map(async (item) => {
      if (item.prixHT != null && item.taxRate != null) {
        return item;
      }

      const product = await fetchProductById(item.id_product);
      let prixHT = Number(product.prix || 0);

      if (Number(item.id_product_attribute) > 0) {
        const combinations = await fetchCombinationsByProduct(item.id_product);
        const combo = combinations.find(
          (c) => Number(c.id) === Number(item.id_product_attribute),
        );
        if (combo) {
          prixHT += Number(combo.prix || 0);
        }
      }

      let taxRate = 0;
      if (product.id_tax_rules_group) {
        taxRate = await fetchTaxRate(product.id_tax_rules_group);
      }

      return {
        ...item,
        prixHT,
        taxRate,
      };
    }),
  );

  // Logique stricte de calcul extraite de Commande.jsx
  const totalsByTax = enrichedCart.reduce((acc, item) => {
    const tax = Number(item.taxRate) || 0;
    const ht = Number(item.prixHT) || Number(item.prix) / (1 + tax / 100);
    if (!acc[tax]) acc[tax] = 0;
    acc[tax] += ht * Number(item.quantity);
    return acc;
  }, {});

  let totalTtc = 0;
  for (const tax in totalsByTax) {
    totalTtc += totalsByTax[tax] * (1 + Number(tax) / 100);
  }
  const totalPrix = totalTtc.toFixed(2);

  let cartId = existingCartId;

  // Création du panier si on vient du FrontOffice
  if (!cartId) {
    cartId = await createCart(customer.id, addressId, enrichedCart);
    if (!cartId || cartId === "?") {
      throw new Error("Erreur lors de la création du panier Prestashop.");
    }
  }


  const row = { etat: orderStateLabel };
  const orderResult = await createOrder(row, cartId, customer.id, addressId, enrichedCart);
  const orderId = orderResult?.orderId;
  if (!orderId || orderId === "?") {
    throw new Error("Erreur lors de la création de la commande Prestashop.");
  }

  return { orderId, cartId, totalPrix, stateId: orderResult.stateId };
};
