import { useEffect, useState } from "react";

const ListeClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8080/api/customers")
      .then((resp) => {
        if (!resp.ok) throw new Error(`Erreur ${resp.statusText}`);
        return resp.json();
      })
      .then((data) => {
        setClients(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  if (error) return <div>Erreur : {error.message}</div>;
  if (loading) return <div>Chargement ... </div>;
  if (!loading && clients.length === 0) return <div>Aucun client</div>;

  return (
    <div>
      <h1>Liste des clients</h1>
      <br />
      <table border={1}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Pays</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.id}</td>
              <td>{client.nom}</td>
              <td>{client.email}</td>
              <td>{client.pays}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListeClients;
