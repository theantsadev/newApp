import { useEffect, useState } from "react";
import { fetchOrdersByCustomerId } from "../../services/orderService";
import { fetchOrderStateList } from "../../services/orderStateService";
import { useNavigate } from "react-router-dom";
import {
  getStoredCustomer,
  clearStoredCustomer,
} from "../../shared/customerAuthStorage";
import { fetchCartById } from "../../services/cartService";
import {
  enrichCartItems,
  processOrderCreation,
} from "../../services/checkoutService";
import { fetchAddressesByCustomerId } from "../../services/addressService";
import DuplicateOrderModal from "../components/DuplicateOrderModal";

const Commandes = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [states, setStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState(null);
  const [enrichedCart, setEnrichedCart] = useState([]);

  const reloadOrdersForCustomer = async (customerId) => {
    const orderList = await fetchOrdersByCustomerId(customerId);
    const myOrders = orderList.sort(
      (a, b) => new Date(b.date_add) - new Date(a.date_add),
    );
    setOrders(myOrders);
  };

  const openModal = async (order) => {
    const currentQuantity = 1;
    setError(null);

    try {
      const cart = await fetchCartById(order.id_cart);
      const rows = Array.isArray(cart?.cart_row_ids) ? cart.cart_row_ids : [];
      const scaledRows = rows.map((row) => ({
        ...row,
        quantity: Number(row.quantity) * currentQuantity,
      }));

      const items = await enrichCartItems(scaledRows);
      console.log("enrichedCart sample:", JSON.stringify(items[0], null, 2));
      setSelectedOrder(order);
      setQuantity(currentQuantity);
      setEnrichedCart(items);

    } catch (err) {
      setError(err.message || "Impossible de preparer la duplication.");
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setQuantity(1);
    setEnrichedCart([]);
  };

  const handleDuplicateSubmit = async () => {
    if (!selectedOrder || !customer || !address) {
      setError("Informations manquantes pour dupliquer la commande.");
      return;
    }

    try {
      setError(null);


      const cartItems = enrichedCart.map((item) => ({
        ...item,
        quantity: Number(item.quantity) * Number(quantity),
      }));

      await processOrderCreation({
        customer,
        addressId: address.id,
        cartItems,
        orderStateLabel: "livré",
      });

      await reloadOrdersForCustomer(customer.id);
      closeModal();
    } catch (err) {
      setError(err.message || "Erreur lors de la duplication de la commande.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const storedCustomer = getStoredCustomer();

      if (!storedCustomer) {
        navigate("/frontoffice/login");
        return;
      }

      setCustomer(storedCustomer);

      if (storedCustomer.isAnonymous) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [orderList, stateList, addresses] = await Promise.all([
          fetchOrdersByCustomerId(storedCustomer.id),
          fetchOrderStateList(),
          fetchAddressesByCustomerId(storedCustomer.id),
        ]);

        const myOrders = orderList.sort(
          (a, b) => new Date(b.date_add) - new Date(a.date_add),
        );

        const stateMap = Object.fromEntries(
          stateList.map((state) => [state.id, state.name]),
        );

        setOrders(myOrders);
        setStates(stateMap);
        setAddress(addresses[0] || null);
      } catch (err) {
        setError(err.message || "Erreur lors du chargement des commandes.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);



  return (
    <div>
      {selectedOrder && (
        <DuplicateOrderModal
          selectedOrder={selectedOrder}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onClose={closeModal}
          onConfirm={handleDuplicateSubmit}
          enrichedCart={enrichedCart}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h1>Mes commandes</h1>
      </div>

      {loading && <p>Chargement...</p>}
      {!loading && error && <p style={{ color: "#c00" }}>{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p>Vous n'avez passe aucune commande pour le moment.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Reference</th>
              <th>Date</th>
              <th>Total Paid</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Option</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.reference}</td>
                <td>{new Date(order.date_add).toLocaleString()}</td>
                <td>{Number(order.total_paid || 0).toFixed(2)}</td>
                <td>{order.payment}</td>
                <td>{states[order.current_state] || "Etat " + order.current_state}</td>
                <td>
                  <button onClick={() => openModal(order)}>Duplicate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Commandes;
