# Lecon complete React: modal, navigation, useEffect, API propre

Ce document est une lecon complete (pas un resume) pour maitriser les points
suivants:
- bases React et JSX
- useState et useEffect
- navigation avec arguments (React Router)
- creation et gestion d une modal
- appels API propres (sequence vs parallele)

---

## 1) Rappels solides sur React

### 1.1 Composants
Un composant est une fonction qui retourne du JSX. Le nom commence par une
majuscule.

```jsx
function UserCard({ name, email }) {
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}
```

### 1.2 JSX (syntaxe)
- `className` au lieu de `class`
- `htmlFor` au lieu de `for`
- un seul parent JSX
- expressions JS entre `{}`

### 1.3 Props
Les props sont des donnees du parent vers l enfant. Elles sont en lecture seule.

```jsx
function Greeting({ name }) {
  return <p>Bonjour {name}</p>;
}
```

### 1.4 State (useState)
Le state declenche un re-render quand il change. Ne jamais le modifier
 directement.

```jsx
const [count, setCount] = useState(0);
setCount(count + 1);
```

---

## 2) useEffect en detail

### 2.1 Pourquoi useEffect
On l utilise pour:
- fetch API
- timers
- abonnements
- synchroniser un effet externe

### 2.2 Regle
`useEffect` est execute apres le rendu. Les dependances controlent quand l effet
se relance.

```jsx
useEffect(() => {
  // effet
}, [dependencies]);
```

### 2.3 Chargement au montage
Pattern propre pour charger une seule fois et eviter setState apres demontage.

```jsx
useEffect(() => {
  let active = true;

  (async () => {
    const data = await fetchData();
    if (active) setData(data);
  })();

  return () => {
    active = false;
  };
}, []);
```

### 2.4 Relancer quand une valeur change

```jsx
useEffect(() => {
  if (!customerId) return;
  fetchCustomer(customerId).then(setCustomer);
}, [customerId]);
```

### 2.5 Erreurs frequentes
- Boucle infinie: effet qui depend d un state qu il modifie sans controle
- Dependances manquantes (l effet ne se relance pas quand il devrait)

---

## 3) Appels API propres (sans fetch imbrique sale)

### 3.1 Principe
- Si B depend de A, faire A puis B (sequence)
- Si A et B sont independants, faire en parallele

```js
// Sequence (dependance)
const cart = await fetchCartById(id);
const items = await enrichCartItems(cart.items);

// Parallele (independant)
const [orders, customers] = await Promise.all([
  fetchOrders(),
  fetchCustomers(),
]);
```

### 3.2 Separer UI et logique metier
L UI appelle une fonction de service. La logique complexe reste dans `services/`.

```js
// services/orderService.js
export async function duplicateOrder(orderId, quantity) {
  // logique metier ici
}
```

---

## 4) Creer une modal propre

### 4.1 Pattern standard
Le parent controle `isOpen`. La modal est un composant UI simple.

```jsx
function Parent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Ouvrir</button>
      {isOpen && <Modal onClose={() => setIsOpen(false)} />}
    </>
  );
}
```

### 4.2 Modal avec overlay et stopPropagation

```jsx
function Modal({ onClose, onConfirm, loading }) {
  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
        <button onClick={onClose}>Annuler</button>
        <button onClick={onConfirm} disabled={loading}>Valider</button>
      </div>
    </div>
  );
}
```

### 4.3 Regle
La modal ne doit pas faire de fetch. Le parent fetch et passe les donnees.

---

## 5) Navigation avec arguments (React Router)

### 5.1 Passer un id dans l URL

```jsx
<Link to={`/orders/${order.id}`}>Details</Link>
```

```js
const { id } = useParams();
```

### 5.2 Passer des infos temporaires via state

```jsx
navigate(`/orders/${order.id}`, {
  state: { source: "liste", label: order.reference }
});
```

```js
const location = useLocation();
const source = location.state?.source;
```

### 5.3 Regle pratique
- Donnees critiques: URL
- Donnees temporaires: state

---

## 6) Exemple complet: duplication propre (flow)

### 6.1 Parent: ouverture de modal

```js
const openModal = (order) => {
  setSelectedOrder(order);
  setQuantity(1);
  setModalOpen(true);
};
```

### 6.2 Service: duplication

```js
export async function duplicateOrder(order, quantity) {
  const cart = await fetchCartById(order.id_cart);
  const items = await enrichCartItems(cart.cart_row_ids);

  const newItems = items.map((item) => ({
    ...item,
    quantity: item.quantity * quantity,
  }));

  const customer = await fetchCustomerById(order.customerId);
  const addresses = await fetchAddressesByCustomerId(customer.id);

  if (!addresses.length) {
    throw new Error("Pas d adresse disponible");
  }

  return processOrderCreation({
    customer,
    addressId: addresses[0].id,
    cartItems: newItems,
    orderStateLabel: "paiement accepte",
  });
}
```

### 6.3 Parent: validation

```js
const handleConfirm = async () => {
  setLoading(true);
  try {
    await duplicateOrder(selectedOrder, quantity);
    setModalOpen(false);
  } finally {
    setLoading(false);
  }
};
```

---

## 7) Check-list avant de coder
- Ai-je separe UI et logique metier ?
- Mes appels API sont-ils paralleles quand possible ?
- Ma modal est-elle simple et controlee par le parent ?
- useEffect est-il propre (dependances + nettoyage) ?
- Ai-je un loader et une gestion d erreur ?

---

## 8) Docs utiles
- React Learn: https://react.dev/learn
- useEffect: https://react.dev/reference/react/useEffect
- React Router: https://reactrouter.com/en/main
- Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- Promise.all: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
- PrestaShop Webservice: https://devdocs.prestashop-project.org/8/webservice/
- PrestaShop API overview: https://devdocs.prestashop-project.org/8/webservice/tutorials/intro/
