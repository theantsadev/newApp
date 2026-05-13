import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PRESTASHOP_API_KEY } from "../../config/prestashop";
import { setStoredApiKey, verifyApiKey } from "../../shared/authStorage";

const Login = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(PRESTASHOP_API_KEY);
  const [error, setError] = useState(null);

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
    navigate("/produits", { replace: true });
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
