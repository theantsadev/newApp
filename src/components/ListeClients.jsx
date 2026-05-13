// Énoncé : Créer un composant qui charge une liste de customers depuis http://localhost:8080/api/customers
// et les affiche dans un tableau avec les colonnes : ID, Nom, Email, Pays. Gérer le chargement et les erreurs.

import { useEffect, useState } from "react";

const ListeClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetch("http://localhost:8080/api/customers")
      .then((resp) => {
        if (!resp.ok) throw new Error("Erreur" + resp.statusText);
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
  if (!loading && clients.length == 0) return <div>Aucun client</div>;

  return (
    <div>
      <h1>Liste des clients</h1>
      <br />
      <table border={1}>
        <tr>
          <td>ID</td>
          <td>Nom</td>
          <td>Email</td>
          <td>Pays</td>
        </tr>

        {clients.map((client) => (
          <tr>
            <td> {client.id}</td>
            <td> {client.nom}</td>
            <td> {client.email}</td>
            <td> {client.pays}</td>
          </tr>
        ))}
      </table>
    </div>
  );
};

export default ListeClients;
