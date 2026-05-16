import {
  getStoredCart,
  setStoredCart,
  clearStoredCart,
} from "../../services/cartService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Panier = () => {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  const getItemKey = (item) => `${item.id_product}_${item.id_product_attribute}`;

  useEffect(() => {
    const storedCart = getStoredCart();
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  // Helper : mettre à jour state + localStorage en même temps
  const updateCart = (newCart) => {
    setCart(newCart);
    setStoredCart(JSON.stringify(newCart));
  };

  const removeItem = (item) => {
    const newCart = cart.filter((obj) => getItemKey(obj) !== getItemKey(item));
    updateCart(newCart);
  };

  const increaseItemQuantity = (item) => {
    const newCart = cart.map((obj) =>
      getItemKey(obj) === getItemKey(item)
        ? { ...obj, quantity: Number(obj.quantity) + 1 }
        : obj,
    );
    updateCart(newCart);
  };

  const decreaseItemQuantity = (item) => {
    const found = cart.find((obj) => getItemKey(obj) === getItemKey(item));
    if (!found) return;

    if (Number(found.quantity) <= 1) {
      removeItem(item);
      return;
    }

    const newCart = cart.map((obj) =>
      getItemKey(obj) === getItemKey(item)
        ? { ...obj, quantity: Number(obj.quantity) - 1 }
        : obj,
    );
    updateCart(newCart);
  };

  const totalPrix = cart
    .reduce((acc, item) => acc + Number(item.prix) * Number(item.quantity), 0)
    .toFixed(2);

  return (
    <div>
      <h1>Panier</h1>
      {cart.length === 0 ? (
        <p>Votre panier est vide.</p>
      ) : (
        <>
          <ul>
            {cart.map((item) => (
              <li key={getItemKey(item)}>
                <strong>{item.nom}</strong> ({item.reference}) - {item.quantity} x{" "}
                {item.prix} EUR
                <button onClick={() => decreaseItemQuantity(item)}>-</button>
                <button onClick={() => increaseItemQuantity(item)}>+</button>
                <button onClick={() => removeItem(item)}>Enlever</button>
              </li>
            ))}
          </ul>
          <p>Total : {totalPrix} EUR</p>
          <button onClick={() => updateCart([])}>Vider le panier</button>
          <button onClick={() => navigate("/frontoffice/commande")}>Passer la commande</button>
        </>
      )}
    </div>
  );
};

export default Panier;
