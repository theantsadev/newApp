# useEffect dans ListeCommandes.jsx

Ce bloc utilise `useEffect` pour lancer un chargement initial (au montage du composant) et nettoyer correctement les effets si le composant se demonte avant la fin des appels.

## La syntaxe en bref

```jsx
useEffect(() => {
  let isActive = true;

  (async () => {
    try {
      const [states, data, cartList, customerList] = await Promise.all([
        fetchAllOrderStates(),
        fetchOrderList(),
        fetchUnlinkedCartList(),
        fetchCustomerList(),
      ]);
      if (!isActive) return;
      setStateMap(states);
      setCommandes(data);
      setCarts(cartList);
      setCustomers(toCustomerMap(customerList));
    } catch (err) {
      if (!isActive) return;
      setError(err);
    } finally {
      if (isActive) setLoading(false);
    }
  })();

  return () => {
    isActive = false;
  };
}, []);
```

## Explication pas a pas

- `useEffect(() => { ... }, [])` : l'effet s'exectue une seule fois, au montage du composant. Le tableau de dependances vide indique qu'il n'y a pas de valeurs a surveiller.
- `let isActive = true;` : drapeau local pour savoir si le composant est encore monte quand les requetes asynchrones se terminent.
- `(async () => { ... })();` : IIFE asynchrone. `useEffect` ne peut pas recevoir directement une fonction `async`, donc on encapsule la logique asynchrone dans une fonction auto-invoquee.
- `Promise.all([...])` : lance les requetes en parallele pour gagner du temps. Toutes doivent reussir pour continuer.
- `if (!isActive) return;` : evite d'appeler `setState` si le composant est deja demonte (ce qui provoquerait un warning et une fuite potentielle).
- `return () => { isActive = false; }` : fonction de nettoyage. React l'appelle au demontage du composant; on desactive alors les mises a jour d'etat.

## Interet concret dans ce composant

- Charger les donnees une fois (et uniquement une fois) pour initialiser l'interface.
- Eviter des mises a jour d'etat sur un composant qui n'est plus affiche.
- Recuperer plusieurs ressources en parallele pour un chargement plus rapide.

## Variante moderne (optionnelle)

Dans des projets modernes, on peut aussi utiliser un `AbortController` pour annuler les requetes fetch, mais ici le drapeau `isActive` suffit pour eviter les mises a jour d'etat apres demontage.
