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
      <button type="submit" style={styles.button}>
        Afficher
      </button>
    </form>
  );
}

function SummaryCards({ totalCommandes, totalTtc, totalHt }) {
  return (
    <div style={styles.cardGrid}>
      <div style={styles.card}>
        <p style={styles.cardLabel}>Commandes</p>
        <p style={styles.cardValue}>{totalCommandes}</p>
      </div>
      <div style={styles.card}>
        <p style={styles.cardLabel}>Total TTC</p>
        <p style={styles.cardValue}>{formatEuro(totalTtc)}</p>
      </div>
      <div style={styles.card}>
        <p style={styles.cardLabel}>Total HT</p>
        <p style={styles.cardValue}>{formatEuro(totalHt)}</p>
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
  });

  const toDateOnly = (value) => {
    return String(value).split(" ")[0]; // "2026-05-17 14:30:00" → "2026-05-17"
  };

  // 1. Crée cette fonction en dehors de useEffect
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
  useEffect(() => {
    fetchOrderList()
      .then((data) => {
        setCommandes(data);
        setFiltered(applyFilter(data, filtre)); // ← ici, filtre au lieu de data brut
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

  // Calcul des stats par jour
  const buildDailyStats = () => {
    const rows = {};

    filtered.forEach((commande) => {
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
  };

  const dailyStats = buildDailyStats();

  const totalTtc = filtered.reduce((sum, c) => sum + toAmount(c.total_paid), 0);
  const totalHt = filtered.reduce(
    (sum, c) => sum + toAmount(c.total_paid_tax_excl),
    0,
  );

  // --- Rendu ---

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Tableau de bord</h1>

      <FilterForm
        filtre={filtre}
        onFilter={handleFilter}
        onSubmit={handleSubmit}
      />

      {filtered.length === 0 && <EmptyState />}

      {filtered.length > 0 && (
        <>
          <SummaryCards
            totalCommandes={filtered.length}
            totalTtc={totalTtc}
            totalHt={totalHt}
          />
          <DailyTable
            dailyStats={dailyStats}
            totalCommandes={filtered.length}
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
    padding: "2rem",
    fontFamily: "sans-serif",
    maxWidth: 900,
    margin: "0 auto",
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    marginBottom: "1.5rem",
  },
  filterForm: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: "#666",
  },
  input: {
    height: 36,
    padding: "0 10px",
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 6,
  },
  button: {
    height: 36,
    padding: "0 18px",
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 6,
    cursor: "pointer",
    background: "#fff",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: "1.5rem",
  },
  card: {
    background: "#f5f5f5",
    borderRadius: 8,
    padding: "1rem",
  },
  cardLabel: {
    fontSize: 12,
    color: "#888",
    margin: "0 0 6px",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 500,
    margin: 0,
  },
  tableWrapper: {
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "10px 16px",
    background: "#f5f5f5",
    fontWeight: 500,
    fontSize: 12,
    color: "#666",
    borderBottom: "1px solid #e0e0e0",
  },
  td: {
    padding: "10px 16px",
    borderBottom: "1px solid #f0f0f0",
    color: "#333",
  },
  tdFooter: {
    padding: "10px 16px",
    fontWeight: 500,
    color: "#111",
    borderTop: "2px solid #e0e0e0",
  },
  row: {},
  footerRow: {
    background: "#fafafa",
  },
  centered: {
    display: "flex",
    justifyContent: "center",
    padding: "3rem",
  },
  stateText: {
    color: "#666",
    fontSize: 15,
  },
  errorBox: {
    background: "#fff5f5",
    borderRadius: 8,
    border: "1px solid #ffd0d0",
  },
};

export default Dashboard;
