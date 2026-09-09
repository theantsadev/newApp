# Dupliquer une commande avec une modal (React)

Ce document explique la logique du bouton "Dupliquer" et le role d'une modal (composant enfant) pour apprendre a structurer le code proprement.

## Objectif du bouton "Dupliquer"

Quand on clique sur "Dupliquer" :

1. On affiche une modal.
2. L'utilisateur saisit une quantite.
3. On multiplie les quantites de chaque ligne de commande.
4. On cree une nouvelle commande si le stock est suffisant.

## Le role du composant parent

Le parent (ex: `Commandes.jsx`) :

- gere l'etat global (`selectedOrder`, `quantity`, `enrichedCart`, `error`).
- declenche le chargement des donnees au clic.
- lance la creation de commande.

Exemple simplifie :

```jsx
const [selectedOrder, setSelectedOrder] = useState(null);
const [quantity, setQuantity] = useState(1);
const [enrichedCart, setEnrichedCart] = useState([]);

const openModal = async (order) => {
  const cart = await fetchCartById(order.id_cart);
  const rows = cart.cart_row_ids.map((row) => ({
    ...row,
    quantity: Number(row.quantity) * 1,
  }));
  const items = await enrichCartItems(rows);
  setSelectedOrder(order);
  setQuantity(1);
  setEnrichedCart(items);
};

const handleDuplicateSubmit = async () => {
  const cartItems = enrichedCart.map((item) => ({
    ...item,
    quantity: Number(item.quantity) * Number(quantity),
  }));

  await processOrderCreation({
    customer,
    addressId: address.id,
    cartItems,
    orderStateLabel: "livre",
  });
};
```

## Le role du composant enfant (modal)

La modal est un composant enfant. Elle :

- affiche les infos.
- permet la saisie de la quantite.
- renvoie les actions au parent via des props.

Exemple de contrat parent/enfant :

```jsx
<DuplicateOrderModal
  selectedOrder={selectedOrder}
  quantity={quantity}
  onQuantityChange={setQuantity}
  onClose={closeModal}
  onConfirm={handleDuplicateSubmit}
  enrichedCart={enrichedCart}
/>
```

La modal ne cree pas la commande elle-meme : elle delegue au parent.

## Pourquoi une modal ?

- l'utilisateur reste sur la page.
- on isole l'action "dupliquer" sans casser la navigation.
- on garde un flux simple (ouvrir, saisir, valider, fermer).

## Controle du stock

La logique correcte est de verifier le stock au moment de la creation, pas dans l'UI :

- l'UI ne fait que preparer les quantites.
- le service de creation (`processOrderCreation`) doit refuser si le stock est insuffisant.

## Ce qu'il faut retenir

- Parent = logique metier et etat global.
- Modal = UI + saisie utilisateur.
- Props descendantes, callbacks remontants.
- Multiplication des quantites avant la creation.
- Controle du stock au moment de la creation.
