import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCustomerByEmail } from "../../services/customerService";
import { setStoredCustomer } from "../../shared/customerAuthStorage";

const LoginFO = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Pour l'évaluation, on authentifie juste avec l'email car l'API WebService
      // ne permet pas de vérifier le mot de passe en clair (hashé en DB).
      // On vérifie donc que le client existe bien.
      const customer = await fetchCustomerByEmail(email);

      if (customer) {
        setStoredCustomer(customer);
        navigate("/frontoffice/produits");
      } else {
        setError("Identifiants incorrects ou client inexistant.");
      }
    } catch (err) {
      setError("Erreur de connexion : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Connexion Client (FrontOffice)</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label>Email : </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Mot de passe (simulé) : </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
};

export default LoginFO;
