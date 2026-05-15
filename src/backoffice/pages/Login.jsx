import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PRESTASHOP_API_KEY } from "../../config/prestashop";
import {
  isAuthenticated,
  setStoredApiKey,
  verifyApiKey,
} from "../../shared/authStorage";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [apiKey, setApiKey] = useState(PRESTASHOP_API_KEY);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/frontoffice/produits", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);

    const cleaned = apiKey.trim();

    if (!cleaned) {
      setError("Cle requise.");
      return;
    }

    if (!verifyApiKey(cleaned)) {
      setError("Cle invalide.");
      return;
    }

    setStoredApiKey(cleaned);
    const redirectTo = location.state?.from?.pathname || "frontoffice/produits";
    navigate(redirectTo, { replace: true });
  };

  return (
    <div>
      <h1>Login backoffice</h1>
      <p>Entrez la cle API PrestaShop.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="apiKey">Cle API</label>
        <br />
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          autoComplete="off"
        />
        <br />
        <button type="submit">Se connecter</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Login;
