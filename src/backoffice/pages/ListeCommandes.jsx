import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteOrderById,
  fetchOrderList,
  updateOrderState,
  updateOrderStateWithMovement,
} from "../../services/orderService";
import {
  fetchAllOrderStates,
  MANAGED_ORDER_STATE_IDS,
  MANAGED_STATE_LABELS,
} from "../../services/orderStateService";
import { deleteCartById, fetchUnlinkedCartList } from "../../services/cartService";
import { fetchCustomerList, fetchCustomerById } from "../../services/customerService";
import { fetchAddressesByCustomerId } from "../../services/addressService";
import { processOrderCreation, enrichCartItems } from "../../services/checkoutService";
import { runWithConcurrency } from "../../shared/concurrency";


// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_STATUS_FILTERS = ["cart", ...MANAGED_ORDER_STATE_IDS];

const BADGE_STYLES = {
  cart: { backgroundColor: "#fef3c7", color: "#92400e" },
  2: { backgroundColor: "#e3f2fd", color: "#0d47a1" },
  11: { backgroundColor: "#e3f2fd", color: "#0d47a1" },
  5: { backgroundColor: "#e8f5e9", color: "#1b5e20" },
  6: { backgroundColor: "#ffebee", color: "#b71c1c" },
  default: { backgroundColor: "#f5f5f5", color: "#616161" },
};

const STATE_NEEDS_MOVEMENT = ["5", "6"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getBadgeStyle = (state) =>
  BADGE_STYLES[String(state)] ?? BADGE_STYLES.default;

const toCustomerMap = (customerList) =>
  Object.fromEntries(
    customerList.map((c) => [c.id, `${c.firstname} ${c.lastname}`.trim()]),
  );

const toOrderItem = (commande) => {
  const lineCount = commande.order_rows.length;
  const itemCount = commande.order_rows.reduce(
    (sum, row) => sum + (row.product_quantity || 0),
    0,
  );
  return {
    type: "order",
    id: commande.id,
    reference: commande.reference || "N/A",
    payment: commande.payment || "-",
    totalPaid: commande.total_paid,
    totalPaidTaxExcl: commande.total_paid_tax_excl,
    current_state: String(commande.current_state),
    statusKey: String(commande.current_state),
    date: commande.date_add,
    customerId: commande.id_customer,
    lineCount,
    itemCount,
  };
};

const toCartItem = (cart) => {
  const lineCount = cart.cart_row_ids.length;
  const itemCount = cart.cart_row_ids.reduce(
    (sum, row) => sum + Number(row.quantity || 0),
    0,
  );
  return {
    type: "cart",
    id: cart.id,
    reference: "Panier",
    payment: "-",
    totalPaid: null,
    totalPaidTaxExcl: null,
    current_state: "cart",
    statusKey: "cart",
    date: cart.date_add,
    customerId: cart.id_customer,
    lineCount,
    itemCount,
    rawCart: cart,
  };
};

const sortByDateDesc = (a, b) => {
  const dateA = a.date ? new Date(a.date) : new Date(0);
  const dateB = b.date ? new Date(b.date) : new Date(0);
  return dateB - dateA;
};

const applyFilters = (items, statusFilters, dateFrom, dateTo) =>
  items.filter((item) => {
    if (!statusFilters.includes(item.statusKey)) return false;
    if (!item.date) return true;

    const itemDate = new Date(item.date);

    if (dateFrom && itemDate < new Date(dateFrom)) return false;

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (itemDate > toDate) return false;
    }

    return true;
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ message }) {
  return <div style={styles.toast}>{message}</div>;
}

function PageHeader({
  commandesCount,
  cartsCount,
  onDeleteAllOrders,
  onDeleteAllCarts,
}) {
  return (
    <div style={styles.header}>
      <div>
        <h1 style={styles.title}>Gestion des commandes</h1>
        <p style={styles.subtitle}>
          Consultez, modifiez et gérez les états des commandes de votre
          boutique.
        </p>
      </div>
      <div style={styles.headerActions}>
        {commandesCount > 0 && (
          <button style={styles.btnDangerAll} onClick={onDeleteAllOrders}>
            Supprimer toutes les commandes ({commandesCount})
          </button>
        )}
        {cartsCount > 0 && (
          <button style={styles.btnDangerSoft} onClick={onDeleteAllCarts}>
            Supprimer tous les paniers ({cartsCount})
          </button>
        )}
      </div>
    </div>
  );
}

function StatusFilters({ statusFilters, stateMap, onToggle }) {
  return (
    <div style={styles.filterGroup}>
      <span style={styles.filterLabel}>Statuts geres</span>
      <div style={styles.filterList}>
        {DEFAULT_STATUS_FILTERS.map((key) => {
          const label =
            key === "cart"
              ? MANAGED_STATE_LABELS.cart
              : (stateMap[key] ?? MANAGED_STATE_LABELS[key] ?? `Etat ${key}`);
          return (
            <label key={key} style={styles.filterItem}>
              <input
                type="checkbox"
                checked={statusFilters.includes(key)}
                onChange={() => onToggle(key)}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function DateFilters({ dateFrom, dateTo, onFromChange, onToChange }) {
  return (
    <div style={styles.filterGroup}>
      <span style={styles.filterLabel}>Date de commande</span>
      <div style={styles.dateInputs}>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onFromChange(e.target.value)}
          style={styles.dateInput}
        />
        <span style={styles.dateSeparator}>à</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onToChange(e.target.value)}
          style={styles.dateInput}
        />
      </div>
    </div>
  );
}

function FilterBar({
  statusFilters,
  stateMap,
  dateFrom,
  dateTo,
  resultCount,
  onToggleStatus,
  onFromChange,
  onToChange,
}) {
  return (
    <div style={styles.filters}>
      <StatusFilters
        statusFilters={statusFilters}
        stateMap={stateMap}
        onToggle={onToggleStatus}
      />
      <DateFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onFromChange={onFromChange}
        onToChange={onToChange}
      />
      <div style={styles.filterSummary}>
        <span>{resultCount} resultat(s)</span>
      </div>
    </div>
  );
}

function StatusCell({ item, stateMap, onStateChange }) {
  const label =
    item.statusKey === "cart"
      ? MANAGED_STATE_LABELS.cart
      : (stateMap[item.statusKey] ??
        MANAGED_STATE_LABELS[item.statusKey] ??
        `Etat ${item.statusKey}`);

  return (
    <td style={styles.td}>
      <span style={{ ...styles.badge, ...getBadgeStyle(item.statusKey) }}>
        {label}
      </span>
      {item.type === "order" && (
        <select
          style={{ ...styles.select, marginTop: "0.4rem", width: "100%" }}
          value={item.current_state || ""}
          onChange={(e) => onStateChange(item.id, e.target.value)}
        >
          {Object.entries(stateMap)
            .filter(([id]) => MANAGED_ORDER_STATE_IDS.includes(id))
            .map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
        </select>
      )}
    </td>
  );
}

function OrderActions({ item, onStateChange, onDelete }) {
  return (
    <div style={styles.actionGroup}>
      {item.current_state !== "6" && (
        <button
          style={styles.btnActionCancel}
          onClick={() => onStateChange(item.id, "6")}
          title="Annuler la commande et retourner le stock"
        >
          Annuler
        </button>
      )}
      {item.current_state !== "5" && (
        <button
          style={styles.btnActionDeliver}
          onClick={() => onStateChange(item.id, "5")}
          title="Livrer la commande et sortir le stock"
        >
          Livrer
        </button>
      )}
      <Link style={styles.btnDetail} to={`/commandes/${item.id}`}>
        Détails
      </Link>
      <button style={styles.btnDelete} onClick={() => onDelete(item.id)}>
        Supprimer
      </button>
    </div>
  );
}

function CartActions({ item, onDeleteCart, onPayCart }) {
  return (
    <div style={styles.actionGroup}>
      <button style={styles.btnActionDeliver} onClick={() => onPayCart(item)}>
        Payer
      </button>
      <button style={styles.btnDelete} onClick={() => onDeleteCart(item.id)}>
        Supprimer panier
      </button>
    </div>
  );
}

function CommandeRow({
  item,
  stateMap,
  customers,
  onStateChange,
  onDelete,
  onDeleteCart,
  onPayCart,
}) {
  const customerName = item.customerId
    ? (customers[item.customerId] ?? `Client #${item.customerId}`)
    : "Client inconnu";

  const Actions =
    item.type === "order" ? (
      <OrderActions
        item={item}
        onStateChange={onStateChange}
        onDelete={onDelete}
      />
    ) : (
      <CartActions item={item} onDeleteCart={onDeleteCart} onPayCart={onPayCart} />
    );

  return (
    <tr key={`${item.type}-${item.id}`} style={styles.row}>
      <td style={styles.tdId}>#{item.id}</td>
      <td style={styles.td}>
        {item.date ? new Date(item.date).toLocaleString() : "-"}
      </td>
      <td style={styles.td}>{customerName}</td>
      <td style={styles.td}>
        <div style={styles.ref}>{item.reference}</div>
        <div style={styles.paymentMethod}>{item.payment}</div>
      </td>
      <td style={styles.td}>{item.lineCount}</td>
      <td style={styles.td}>{item.itemCount}</td>
      <td style={styles.tdAmount}>
        {item.totalPaidTaxExcl != null
          ? `${(parseFloat(item.totalPaidTaxExcl) || 0).toFixed(2)} €`
          : "-"}
      </td>
      <td style={styles.tdAmountBold}>
        {item.totalPaid != null
          ? `${(parseFloat(item.totalPaid) || 0).toFixed(2)} €`
          : "-"}
      </td>
      <StatusCell
        item={item}
        stateMap={stateMap}
        onStateChange={onStateChange}
      />
      <td style={styles.tdActions}>{Actions}</td>
    </tr>
  );
}

function CommandeTable({
  items,
  stateMap,
  customers,
  onStateChange,
  onDelete,
  onDeleteCart,
  onPayCart,
}) {
  return (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Client</th>
            <th style={styles.th}>Référence / Paiement</th>
            <th style={styles.th}>Lignes</th>
            <th style={styles.th}>Articles</th>
            <th style={styles.th}>Total HT</th>
            <th style={styles.th}>Total TTC</th>
            <th style={styles.th}>État actuel</th>
            <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <CommandeRow
              key={`${item.type}-${item.id}`}
              item={item}
              stateMap={stateMap}
              customers={customers}
              onStateChange={onStateChange}
              onDelete={onDelete}
              onDeleteCart={onDeleteCart}
              onPayCart={onPayCart}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const ListeCommandes = () => {
  const [stateMap, setStateMap] = useState({});
  const [commandes, setCommandes] = useState([]);
  const [carts, setCarts] = useState([]);
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [statusFilters, setStatusFilters] = useState(DEFAULT_STATUS_FILTERS);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette commande ?"))
      return;
    try {
      await deleteOrderById(id);
      setCommandes((prev) => prev.filter((p) => p.id !== id));
      showSuccess("Commande supprimée avec succès");
    } catch (err) {
      setError(err);
    }
  };

  const handleDeleteAllOrders = async () => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer TOUTES les commandes ?",
      )
    )
      return;
    try {
      await runWithConcurrency(commandes, (p) => deleteOrderById(p.id));
      setCommandes([]);
      showSuccess("Toutes les commandes ont été supprimées");
    } catch (err) {
      setError(err);
    }
  };

  const handleDeleteCart = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce panier ?"))
      return;
    try {
      await deleteCartById(id);
      setCarts((prev) => prev.filter((c) => c.id !== id));
      showSuccess("Panier supprimé avec succès");
    } catch (err) {
      setError(err);
    }
  };

  const handleDeleteAllCarts = async () => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer TOUS les paniers ?")
    )
      return;
    try {
      await runWithConcurrency(carts, (c) => deleteCartById(c.id));
      setCarts([]);
      showSuccess("Tous les paniers ont été supprimés");
    } catch (err) {
      setError(err);
    }
  };

  const handlePayCart = async (cartItem) => {
    if (!window.confirm("Convertir ce panier en commande ?")) return;
    try {
      const customer = await fetchCustomerById(cartItem.customerId);
      const addresses = await fetchAddressesByCustomerId(customer.id);

      let addressId = cartItem.rawCart.id_address_delivery;
      if (!addressId || String(addressId) === "0") {
        if (addresses.length > 0) {
          addressId = addresses[0].id;
        } else {
          throw new Error("Impossible de valider: Le client n'a aucune adresse.");
        }
      }

      const enrichedItems = await enrichCartItems(cartItem.rawCart.cart_row_ids);

      await processOrderCreation({
        customer,
        addressId,
        cartItems: enrichedItems,
        existingCartId: cartItem.rawCart.id,
      });

      showSuccess("Panier converti en commande avec succès !");

      // Refresh list
      const [data, cartList] = await Promise.all([
        fetchOrderList(),
        fetchUnlinkedCartList(),
      ]);
      setCommandes(data);
      setCarts(cartList);
    } catch (err) {
      setError(err);
    }
  };

  const handleStateChange = async (commandeId, targetStateId) => {
    try {
      if (STATE_NEEDS_MOVEMENT.includes(targetStateId)) {
        await updateOrderStateWithMovement(commandeId, targetStateId);
      } else {
        await updateOrderState(commandeId, targetStateId);
      }
      const label = stateMap[targetStateId] ?? targetStateId;
      showSuccess(`État de la commande #${commandeId} mis à jour : ${label}`);
      setCommandes((prev) =>
        prev.map((c) =>
          c.id === commandeId ? { ...c, current_state: targetStateId } : c,
        ),
      );
    } catch (err) {
      setError(err);
    }
  };

  const toggleStatusFilter = (key) => {
    setStatusFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

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

  if (error) return <div style={styles.error}>Erreur : {error.message}</div>;
  if (loading) return <div style={styles.loading}>Chargement...</div>;

  const orderItems = commandes
    .filter((c) => MANAGED_ORDER_STATE_IDS.includes(String(c.current_state)))
    .map(toOrderItem);

  const cartItems = carts.map(toCartItem);

  const allItems = [...orderItems, ...cartItems].sort(sortByDateDesc);

  const filteredItems = applyFilters(allItems, statusFilters, dateFrom, dateTo);

  return (
    <div style={styles.container}>
      {success && <Toast message={success} />}

      <PageHeader
        commandesCount={commandes.length}
        cartsCount={carts.length}
        onDeleteAllOrders={handleDeleteAllOrders}
        onDeleteAllCarts={handleDeleteAllCarts}
      />

      <FilterBar
        statusFilters={statusFilters}
        stateMap={stateMap}
        dateFrom={dateFrom}
        dateTo={dateTo}
        resultCount={filteredItems.length}
        onToggleStatus={toggleStatusFilter}
        onFromChange={setDateFrom}
        onToChange={setDateTo}
      />

      {filteredItems.length === 0 && (
        <div style={styles.emptyState}>
          <p>Aucun resultat pour les filtres selectionnes.</p>
        </div>
      )}

      {filteredItems.length > 0 && (
        <CommandeTable
          items={filteredItems}
          stateMap={stateMap}
          customers={customers}
          onStateChange={handleStateChange}
          onDelete={handleDelete}
          onDeleteCart={handleDeleteCart}
          onPayCart={handlePayCart}
        />
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
    color: "#2c3e50",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    borderBottom: "1px solid #ecf0f1",
    paddingBottom: "1.5rem",
  },
  headerActions: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "600",
    color: "#1a252f",
    margin: "0 0 0.5rem 0",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#7f8c8d",
    margin: 0,
  },
  btnDangerAll: {
    padding: "0.6rem 1.2rem",
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  btnDangerSoft: {
    padding: "0.6rem 1.2rem",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1rem",
    padding: "1rem",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    marginBottom: "1.5rem",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  filterLabel: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  filterList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  filterItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.9rem",
    color: "#1e293b",
  },
  dateInputs: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  dateInput: {
    padding: "0.4rem 0.6rem",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    fontSize: "0.85rem",
  },
  dateSeparator: {
    color: "#64748b",
    fontSize: "0.85rem",
  },
  filterSummary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    fontWeight: "600",
    color: "#0f172a",
  },
  loading: {
    padding: "4rem",
    textAlign: "center",
    fontSize: "1.2rem",
    color: "#7f8c8d",
  },
  error: {
    padding: "2rem",
    backgroundColor: "#fdf2f2",
    color: "#ec5353",
    borderRadius: "8px",
    border: "1px solid #fde2e2",
    margin: "2rem auto",
    maxWidth: "600px",
  },
  emptyState: {
    padding: "4rem",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    border: "1px dashed #bdc3c7",
    color: "#7f8c8d",
    fontSize: "1.1rem",
  },
  tableWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow:
      "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.95rem",
  },
  th: {
    textAlign: "left",
    padding: "0.75rem 0.6rem",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontWeight: "600",
    borderBottom: "2px solid #e2e8f0",
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  row: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background-color 0.2s",
  },
  tdId: {
    padding: "0.75rem 0.6rem",
    fontWeight: "bold",
    color: "#64748b",
  },
  td: {
    padding: "0.75rem 0.6rem",
    verticalAlign: "middle",
  },
  tdAmount: {
    padding: "0.75rem 0.6rem",
    fontFamily: "monospace",
    color: "#334155",
    fontWeight: "500",
  },
  tdAmountBold: {
    padding: "0.75rem 0.6rem",
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#0f172a",
  },
  tdActions: {
    padding: "0.75rem 0.6rem",
    verticalAlign: "middle",
  },
  ref: {
    fontWeight: "600",
    color: "#334155",
  },
  paymentMethod: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "0.2rem",
  },
  badge: {
    display: "inline-block",
    padding: "0.25rem 0.6rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  select: {
    padding: "0.4rem 0.8rem",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    fontSize: "0.85rem",
    color: "#1e293b",
    outline: "none",
    cursor: "pointer",
    minWidth: "140px",
  },
  actionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    alignItems: "stretch",
  },
  btnActionCancel: {
    padding: "0.4rem 0.8rem",
    backgroundColor: "#fee2e2",
    color: "#ef4444",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  btnActionDeliver: {
    padding: "0.4rem 0.8rem",
    backgroundColor: "#dcfce7",
    color: "#22c55e",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  btnDetail: {
    padding: "0.4rem 0.8rem",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    textDecoration: "none",
    fontSize: "0.8rem",
    fontWeight: "600",
    textAlign: "center",
  },
  btnDelete: {
    padding: "0.4rem 0.8rem",
    backgroundColor: "#fff1f2",
    color: "#f43f5e",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  toast: {
    position: "fixed",
    top: "20px",
    right: "20px",
    backgroundColor: "#1e293b",
    color: "#fff",
    padding: "1rem 1.5rem",
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
    zIndex: 9999,
    fontSize: "0.9rem",
    fontWeight: "500",
  },
};

export default ListeCommandes;
