import { useState } from "react";
import {
  RESET_RESOURCES,
  resetResources,
} from "../../services/resetService";

const ResetData = () => {
  const [selection, setSelection] = useState(
    RESET_RESOURCES.map((resource) => resource.key),
  );
  const [enCours, setEnCours] = useState(false);
  const [progression, setProgression] = useState({});
  const [rapport, setRapport] = useState(null);

  const toggleSelection = (key) => {
    setSelection((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const selectAll = () => {
    setSelection(RESET_RESOURCES.map((resource) => resource.key));
  };

  const clearAll = () => {
    setSelection([]);
  };

  const handleReset = async () => {
    setRapport(null);

    if (selection.length === 0) return;

    const confirmed = window.confirm(
      "Confirmer la suppression des ressources selectionnees ?",
    );

    if (!confirmed) return;

    setEnCours(true);
    setProgression({});

    const rapportFinal = await resetResources(selection, {
      onProgress: (key, value) =>
        setProgression((prev) => ({ ...prev, [key]: value })),
    });

    setRapport(rapportFinal);
    setEnCours(false);
  };

  return (

    <div style={styles.container}>
      <div style={styles.headerSection}>
        <h1 style={styles.title}>Réinitialisation des données</h1>
        <p style={styles.subtitle}>Sélectionnez et supprimez en toute sécurité les ressources de votre boutique PrestaShop.</p>
      </div>

      <div style={styles.card}>
        <div style={styles.actionBar}>
          <button style={styles.btnSecondary} onClick={selectAll} disabled={enCours}>
            Tout Sélectionner
          </button>
          <button style={styles.btnSecondary} onClick={clearAll} disabled={enCours}>
            Tout Désélectionner
          </button>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Sélection</th>
                <th style={styles.th}>Ordre</th>
                <th style={styles.th}>Ressource</th>
                <th style={styles.thRight}>Progression</th>
              </tr>
            </thead>
            <tbody>
              {RESET_RESOURCES.map((resource, index) => (
                <tr key={resource.key} style={styles.tr}>
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={selection.includes(resource.key)}
                      onChange={() => toggleSelection(resource.key)}
                      disabled={enCours}
                      style={styles.checkbox}
                    />
                  </td>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={{ ...styles.td, fontWeight: "600", color: "#1e293b" }}>{resource.label}</td>
                  <td style={styles.tdRight}>
                    {progression[resource.key] !== undefined ? (
                      <span style={{
                        ...styles.progressionBadge,
                        color: progression[resource.key] === 100 ? "#10b981" : "#3b82f6",
                        backgroundColor: progression[resource.key] === 100 ? "#ecfdf5" : "#eff6ff",
                      }}>
                        {progression[resource.key]}%
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.actionSection}>
          <button
            onClick={handleReset}
            disabled={selection.length === 0 || enCours}
            style={{
              ...styles.btnDanger,
              ...((selection.length === 0 || enCours) ? styles.btnDangerDisabled : {})
            }}
          >
            {enCours ? (
              <>
                <span style={styles.spinnerSmall}></span>
                Réinitialisation en cours...
              </>
            ) : (
              <>
                <span>🔥</span> Réinitialiser la sélection
              </>
            )}
          </button>
        </div>
      </div>

      {rapport && (
        <div style={{ ...styles.card, marginTop: "2rem", borderLeft: "5px solid #10b981" }}>
          <h3 style={styles.cardTitle}>✨ Rapport de Réinitialisation</h3>
          <div style={styles.reportGrid}>
            {Object.values(rapport).map((item) => (
              <div key={item.label} style={styles.reportItem}>
                <span style={styles.reportLabel}>{item.label}</span>
                <span style={styles.reportCount}>Supprimés : <strong>{item.succes}</strong></span>
                {item.erreurs.length > 0 && (
                  <div style={styles.reportErrors}>
                    {item.erreurs.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "2.5rem",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    maxWidth: "800px",
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "2rem",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02)",
    border: "1px solid #e2e8f0",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 1.5rem 0",
  },
  actionBar: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "1.5rem",
  },
  btnSecondary: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    color: "#475569",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#f8fafc",
      borderColor: "#94a3b8",
    }
  },
  btnDanger: {
    padding: "0.85rem 1.75rem",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#dc2626",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
  },
  btnDangerDisabled: {
    backgroundColor: "#e2e8f0",
    color: "#94a3b8",
    cursor: "not-allowed",
    boxShadow: "none",
    opacity: 0.6,
  },
  tableWrapper: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    marginBottom: "2rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.95rem",
    textAlign: "left",
  },
  th: {
    padding: "0.85rem 1.25rem",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontWeight: "600",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  thRight: {
    padding: "0.85rem 1.25rem",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontWeight: "600",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    textAlign: "right",
  },
  td: {
    padding: "0.85rem 1.25rem",
    borderBottom: "1px solid #f1f5f9",
    color: "#64748b",
  },
  tdRight: {
    padding: "0.85rem 1.25rem",
    borderBottom: "1px solid #f1f5f9",
    textAlign: "right",
  },
  tr: {
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#f8fafc",
    }
  },
  checkbox: {
    width: "16px",
    height: "16px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    cursor: "pointer",
  },
  progressionBadge: {
    padding: "0.25rem 0.5rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "700",
  },
  actionSection: {
    textAlign: "right",
  },
  reportGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  reportItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #f1f5f9",
  },
  reportLabel: {
    fontWeight: "600",
    color: "#1e293b",
  },
  reportCount: {
    fontSize: "0.9rem",
    color: "#475569",
  },
  reportErrors: {
    color: "#dc2626",
    fontSize: "0.85rem",
    marginTop: "0.25rem",
  },
  spinnerSmall: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    display: "inline-block",
  },
};

export default ResetData;
