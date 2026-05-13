import { useState } from "react";
import { PRESTASHOP_API_KEY } from "../../config/prestashop";

const Login = () => {
  const [apiKey, setApiKey] = useState(PRESTASHOP_API_KEY);
  const [error, setError] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);
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
