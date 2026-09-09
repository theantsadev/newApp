import { createCart, calculateCartTotals, updateCartDate } from "./cartService";
import { createOrder, updateOrderDate, updatePaymentDate, updateOrderStateWithMovement } from "./orderService";
import { fetchProductById } from "./productService";
import { fetchCombinationsByProduct } from "./combinationService";
import { fetchTaxRate } from "./taxService";
import { isCartOrderStateLabel } from "./orderStateService";
import { requestXml, fetchIdByFilter } from "./prestashopClient";
import { parseXmlDoc, getTextContent } from "../shared/xmlUtils";
import { runWithConcurrency } from "../shared/concurrency";

/**
 * Enrichit une liste d'articles de panier avec les prix HT/TTC, la référence et le libellé.
 * Si un article possède déjà unitPriceHt et unitPriceTtc, ils sont conservés tels quels.
 * Sinon, les données sont récupérées depuis l'API (produit, combinaison, taxe).
 */
export const enrichCartItems = async (cartItems) =>
  runWithConcurrency(
    cartItems,
    async (item) => {
      const productId = item.productId || item.id_product;
      const attributeId = item.attributeId || item.id_product_attribute;

      if (item.unitPriceHt != null && item.unitPriceTtc != null) {
        return {
          productId,
          attributeId,
          quantity: Number(item.quantity),
          unitPriceHt: Number(item.unitPriceHt),
          unitPriceTtc: Number(item.unitPriceTtc),
          reference: item.reference || "-",
          label: item.label || "",
        };
      }

      const product = await fetchProductById(productId);
      let prixHT = Number(product.prix || 0);
      let comboRef = "";

      if (Number(attributeId) > 0) {
        const combinations = await fetchCombinationsByProduct(productId);
        const combo = combinations.find(
          (c) => Number(c.id) === Number(attributeId),
        );
        if (combo) {
          prixHT += Number(combo.prix || 0);
          comboRef = combo.reference || "";
        }
      }

      let taxRate = 0;
      if (product.id_tax_rules_group) {
        taxRate = await fetchTaxRate(product.id_tax_rules_group);
      }

      const unitPriceHt = Math.round(prixHT * 100) / 100;
      const unitPriceTtc =
        Math.round(prixHT * (1 + taxRate / 100) * 100) / 100;

      let label = product.nom;
      if (comboRef) {
        label += ` (variante : ${comboRef})`;
      }

      return {
        productId,
        attributeId,
        quantity: Number(item.quantity),
        unitPriceHt,
        unitPriceTtc,
        taxRate,
        reference: comboRef || product.reference || "-",
        label,
      };
    },
  );

/**
 * Calcule le total d'un panier et le convertit en commande si nécessaire.
 * Gère également la mise à jour des dates pour l'import de données historiques.
 */
export const processOrderCreation = async ({
  customer,
  addressId,
  cartItems,
  existingCartId = null,
  orderStateLabel = "paiement accepté",
  date = null,
  callback,
}) => {
  if (!customer) throw new Error("Client non défini.");
  if (customer.isAnonymous)
    throw new Error(
      "Les commandes ne sont pas autorisées pour les utilisateurs anonymes.",
    );
  if (!addressId || String(addressId) === "0")
    throw new Error("Aucune adresse valide spécifiée pour la commande.");

  const enrichedCart = cartItems;



  let cartId = existingCartId;
  let dateTmp = date ? date : new Date().toISOString().split("T")[0]; // Format "YYYY-MM-DD"

  // Création du panier si non existant
  if (!cartId) {
    cartId = await createCart(customer.id, addressId, enrichedCart);
    if (!cartId || cartId === "?") {
      throw new Error("Erreur lors de la création du panier Prestashop.");
    }
    else {
      callback?.(
        `Panier (Cart) cree: ID ${cartId} pour le client ${customer.id}`,
      );
    }
  }

  // Mise à jour de la date du panier si date d'import passée
  if (dateTmp) {
    await updateCartDate(cartId, dateTmp);
  }

  let orderId = null;
  let stateId = null;
  let reference = "";
  let paymentFound = false;

  // Si l'état n'est pas un simple état panier, on génère la commande
  if (!isCartOrderStateLabel(orderStateLabel)) {
    const row = { etat: orderStateLabel };
    const orderResult = await createOrder(row, cartId, customer.id, addressId, enrichedCart);
    orderId = orderResult?.orderId;
    stateId = orderResult?.stateId;
    if (!orderId || orderId === "?") {
      throw new Error("Erreur lors de la création de la commande Prestashop.");
    }



    // Récupérer la référence de la commande
    reference = await requestXml(`orders/${orderId}?display=[reference]`).then((text) => {
      const dom = parseXmlDoc(text);
      return getTextContent(dom, "order > reference");
    });

    // Mises à jour des dates pour l'import de données historiques
    if (dateTmp) {
      const orderPaymentId = await fetchIdByFilter(
        "order_payments",
        "order_payment",
        "order_reference",
        reference,
      );
      await updateOrderDate(orderId, dateTmp);
      await updateOrderStateWithMovement(
        orderId,
        stateId,
        dateTmp + " 00:00:00",
      );
      console.log(`Order ${orderId} created with state "${orderStateLabel}" and reference "${reference}". Dates updated to ${dateTmp}.`);


      if (orderPaymentId) {
        await updatePaymentDate(orderPaymentId, dateTmp);
        paymentFound = true;
      }
      if (paymentFound) {
        callback?.(
          `Commande creee: ${reference} (ID: ${orderId}, Etat initial: ${stateId})`,
        );
      }
    }
  }
  else {
    callback?.(
      `La ligne du panier ${cartId} reste à l'état "${orderStateLabel}" (aucune commande générée)`,
    );
  }

  return { orderId, cartId, stateId, reference, paymentFound };
};
