import { useEffect, useState } from "react";
import { fetchOrderList } from "../../services/orderService";

// --- Fonctions utilitaires ---

const toAmount = (value) => Number.parseFloat(value || 0) || 0;

const getDayKey = (value) => {
  if (!value) return "";
  return String(value).split(" ")[0];
};

const formatEuro = (value) => {
  return (
    value.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
};

// --- Composants secondaires ---

function LoadingState() {
  return (
    <div style={styles.centered}>
      <p style={styles.stateText}>Chargement...</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ ...styles.centered, ...styles.errorBox }}>
      <p style={styles.stateText}>Erreur : {message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.centered}>
      <p style={styles.stateText}>
        Aucune commande trouvée pour cette période.
      </p>
    </div>
  );
}

function FilterForm({ filtre, onFilter, onSubmit }) {
  return (
    <form onSubmit={onSubmit} style={styles.filterForm}>
      <div style={styles.filterGroup}>
        <label htmlFor="date_min" style={styles.label}>
          Du
        </label>
        <input
          type="date"
          id="date_min"
          name="date_min"
          value={filtre.date_min}
          onChange={onFilter}
          style={styles.input}
        />
      </div>
      <div style={styles.filterGroup}>
        <label htmlFor="date_max" style={styles.label}>
          Au
        </label>
        <input
          type="date"
          id="date_max"
          name="date_max"
          value={filtre.date_max}
          onChange={onFilter}
          style={styles.input}
        />
      </div>
      <div style={styles.filterGroup}>
        <label htmlFor="state_filter" style={styles.label}>
          États
        </label>
        <select
          id="state_filter"
          name="state_filter"
          value={filtre.state_filter}
          onChange={onFilter}
          style={styles.input}
        >
          <option value="exclude-cancelled">Sans annulées (défaut)</option>
          <option value="all">Inclure les annulées</option>
        </select>
      </div>
      <button type="submit" style={styles.button}>
        Afficher
      </button>
    </form>
  );
}

function SummaryCards({
  title,
  tone = "blue",
  totalCommandes,
  totalTtc,
  totalHt,
}) {
  const accent =
    tone === "teal"
      ? { borderLeft: "5px solid #14b8a6" }
      : tone === "violet"
        ? { borderLeft: "5px solid #8b5cf6" }
        : { borderLeft: "5px solid #3b82f6" };

  return (
    <div style={styles.summaryBlock}>
      <div style={styles.summaryHeader}>
        <h2 style={styles.summaryTitle}>{title}</h2>
      </div>
      <div style={styles.cardGrid}>
        <div style={{ ...styles.card, ...accent }}>
          <p style={styles.cardLabel}>Commandes</p>
          <p style={styles.cardValue}>{totalCommandes}</p>
        </div>
        <div style={{ ...styles.card, ...accent }}>
          <p style={styles.cardLabel}>Total TTC</p>
          <p style={styles.cardValue}>{formatEuro(totalTtc)}</p>
        </div>
        <div style={{ ...styles.card, ...accent }}>
          <p style={styles.cardLabel}>Total HT</p>
          <p style={styles.cardValue}>{formatEuro(totalHt)}</p>
        </div>
      </div>
    </div>
  );
}

function DailyTable({ dailyStats, totalCommandes, totalTtc, totalHt }) {
  return (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Nb commandes</th>
            <th style={styles.th}>Total TTC</th>
            <th style={styles.th}>Total HT</th>
          </tr>
        </thead>
        <tbody>
          {dailyStats.map((row) => (
            <tr key={row.date} style={styles.row}>
              <td style={styles.td}>{row.date}</td>
              <td style={styles.td}>{row.count}</td>
              <td style={styles.td}>{formatEuro(row.totalTtc)}</td>
              <td style={styles.td}>{formatEuro(row.totalHt)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={styles.footerRow}>
            <td style={styles.tdFooter}>Total général</td>
            <td style={styles.tdFooter}>{totalCommandes}</td>
            <td style={styles.tdFooter}>{formatEuro(totalTtc)}</td>
            <td style={styles.tdFooter}>{formatEuro(totalHt)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// --- Composant principal ---

const Dashboard = () => {
  const [commandes, setCommandes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtre, setFiltre] = useState({
    date_min: new Date().toISOString().split("T")[0],
    date_max: "",
    state_filter: "exclude-cancelled",
  });

  const toDateOnly = (value) => {
    return String(value).split(" ")[0]; // "2026-05-17 14:30:00" → "2026-05-17"
  };

  // 1. Crée cette fonction en dehors de useEffect
  const applyStateFilter = (data, currentFiltre) => {
    return data.filter((commande) => {
      const state = String(commande.current_state || "");

      return (
        currentFiltre.state_filter === "all" ||
        state === "2" ||
        state === "5" ||
        state === "11"
      );
    });
  };

  const applyFilter = (data, currentFiltre) => {
    return data.filter((commande) => {
      const dateCommande = toDateOnly(commande.date_add); // "2026-05-17"

      const apresMin =
        !currentFiltre.date_min || currentFiltre.date_min <= dateCommande;
      const avantMax =
        !currentFiltre.date_max || dateCommande <= currentFiltre.date_max;

      return apresMin && avantMax;
    });
  };

  // Chargement initial
  // 2. Dans le useEffect, remplace setFiltered(data) par :
  // Chargement initial
  useEffect(() => {
    fetchOrderList()
      .then((data) => {
        setCommandes(data);

        // ✅ Date la plus ancienne parmi les commandes
        const dates = data
          .map((c) => toDateOnly(c.date_add))
          .filter(Boolean)
          .sort();
        const oldest = dates[0] || new Date().toISOString().split("T")[0];

        const defaultFiltre = {
          date_min: oldest,
          date_max: "",
          state_filter: "exclude-cancelled",
        };

        setFiltre(defaultFiltre);
        setFiltered(applyFilter(data, defaultFiltre));
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  // Mise à jour du filtre
  const handleFilter = (event) => {
    const { name, value } = event.target;
    setFiltre({ ...filtre, [name]: value });
  };

  // Application du filtre
  // 3. Dans handleSubmit, réutilise la même fonction :
  const handleSubmit = (event) => {
    event.preventDefault();
    setFiltered(applyFilter(commandes, filtre));
  };

  const filteredByState = applyStateFilter(filtered, filtre);
  const displayedOrders = filteredByState;

  const dailyStats = (() => {
    const rows = {};

    displayedOrders.forEach((commande) => {
      const dayKey = getDayKey(commande.date_add) || "Sans date";

      if (!rows[dayKey]) {
        rows[dayKey] = { date: dayKey, count: 0, totalTtc: 0, totalHt: 0 };
      }

      rows[dayKey].count += 1;
      rows[dayKey].totalTtc += toAmount(commande.total_paid);
      rows[dayKey].totalHt += toAmount(commande.total_paid_tax_excl);
    });

    return Object.values(rows).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  })();

  const totalTtc = filteredByState.reduce(
    (sum, c) => sum + toAmount(c.total_paid),
    0,
  );
  const totalHt = filteredByState.reduce(
    (sum, c) => sum + toAmount(c.total_paid_tax_excl),
    0,
  );
  const commandesGlobal = applyStateFilter(commandes, filtre);
  const totalTtcGlobal = commandesGlobal.reduce(
    (sum, c) => sum + toAmount(c.total_paid),
    0,
  );
  const totalHtGlobal = commandesGlobal.reduce(
    (sum, c) => sum + toAmount(c.total_paid_tax_excl),
    0,
  );
  const totalCommandesGlobal = commandesGlobal.length;

  const totalCommandes = displayedOrders.length;

  // --- Rendu ---

  return (
    <div style={styles.page}>
      <div style={styles.headerSection}>
        <h1 style={styles.title}>Tableau de bord</h1>
        <p style={styles.subtitle}>
          Suivez les performances de vente, le chiffre d'affaires et le nombre
          total de commandes de votre boutique.
        </p>
      </div>

      {/* ✅ Résumé global EN HAUT */}
      {commandes.length > 0 && (
        <SummaryCards
          title="Résumé global"
          tone="teal"
          totalCommandes={totalCommandesGlobal}
          totalTtc={totalTtcGlobal}
          totalHt={totalHtGlobal}
        />
      )}

      {/* Filtre ensuite */}
      <div style={styles.filterCard}>
        <FilterForm
          filtre={filtre}
          onFilter={handleFilter}
          onSubmit={handleSubmit}
        />
      </div>

      {displayedOrders.length === 0 && <EmptyState />}

      {/* Vue filtrée + tableau en bas */}
      {displayedOrders.length > 0 && (
        <>
          <SummaryCards
            title="Vue filtrée"
            tone="blue"
            totalCommandes={totalCommandes}
            totalTtc={totalTtc}
            totalHt={totalHt}
          />
          <DailyTable
            dailyStats={dailyStats}
            totalCommandes={totalCommandes}
            totalTtc={totalTtc}
            totalHt={totalHt}
          />
        </>
      )}
    </div>
  );
};

// --- Styles ---

const styles = {
  page: {
    padding: "2.5rem",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    maxWidth: "1000px",
    margin: "0 auto",
    color: "#1e293b",
  },
  headerSection: {
    marginBottom: "2rem",
    textAlign: "left",
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 0.5rem 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    margin: 0,
  },
  filterCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 4px 15px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.01)",
    border: "1px solid #e2e8f0",
    marginBottom: "2rem",
  },
  filterForm: {
    display: "flex",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    height: 40,
    padding: "0 12px",
    fontSize: "0.95rem",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    backgroundColor: "#fff",
    color: "#1e293b",
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    height: 40,
    padding: "0 24px",
    fontSize: "0.95rem",
    fontWeight: "600",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    background: "#3b82f6",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)",
    transition: "all 0.2s",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
    marginBottom: "2.5rem",
  },
  summaryBlock: {
    marginBottom: "2.5rem",
  },
  summaryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.85rem",
  },
  summaryTitle: {
    margin: 0,
    fontSize: "1.05rem",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.01em",
  },
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "1.75rem",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
    borderLeft: "5px solid #3b82f6",
  },
  cardLabel: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: "0 0 6px",
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.03em",
  },
  tableWrapper: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.95rem",
  },
  th: {
    textAlign: "left",
    padding: "1.1rem 1.5rem",
    background: "#f8fafc",
    fontWeight: "600",
    fontSize: "0.8rem",
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  td: {
    padding: "1.1rem 1.5rem",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
  },
  tdFooter: {
    padding: "1.2rem 1.5rem",
    fontWeight: "700",
    color: "#0f172a",
    borderTop: "2.5px solid #e2e8f0",
  },
  row: {
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#f8fafc",
    },
  },
  footerRow: {
    background: "#f8fafc",
  },
  centered: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "4rem 2rem",
  },
  stateText: {
    color: "#64748b",
    fontSize: "1.1rem",
    fontWeight: "500",
  },
  errorBox: {
    background: "#fef2f2",
    borderRadius: 12,
    border: "1px solid #fee2e2",
    color: "#991b1b",
  },
};

export default Dashboard;
