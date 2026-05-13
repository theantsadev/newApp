import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { XMLParser } from "fast-xml-parser";

const Produit = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const webserviceUrl = "/prestashop-api";
  const webserviceKey = "BG8EDFE4NBE7AWS5EFC124F9UPNPWIT2";

  const getValue = (field) => {
    if (field == null) return "";

    // Si c'est déjà une valeur simple
    if (typeof field !== "object") {
      return field;
    }

    // Si fast-xml-parser retourne un objet XML
    return field["#text"] || "";
  };

  const parseXml = (xmlString) => {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseTagValue: true,
      trimValues: true,
    });

    const json = parser.parse(xmlString);

    const product = json.prestashop.product;
    console.log(product);

    return {
      id: getValue(product.id),
      prix: getValue(product.price),
      reference: getValue(product.reference),
      quantite: getValue(product.quantity),
      poids: getValue(product.weight),
      actif: getValue(product.active),
      condition: getValue(product.condition),
      date_ajout: getValue(product.date_add),

      nom: getValue(product.name?.language),
      description: getValue(product.description?.language),
      description_courte: getValue(product.description_short?.language),
      meta_titre: getValue(product.meta_title?.language),
    };
  };

  useEffect(() => {
    fetch(`${webserviceUrl}/api/products/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
      },
    })
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        return resp.text();
      })
      .then((xmlText) => {
        console.log(xmlText);

        const data = parseXml(xmlText);

        console.log(data);

        setProduit(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);

        setError(err);
        setLoading(false);
      });
  }, [id]);

  if (error) {
    return <div>Erreur : {error.message}</div>;
  }

  if (loading) {
    return <div>Chargement ...</div>;
  }

  return (
    <div>
      <h1>Produit #{produit.id}</h1>

      <table border={1}>
        <tbody>
          <tr>
            <th>Nom</th>
            <td>{produit.nom || "Sans nom"}</td>
          </tr>

          <tr>
            <th>Prix</th>
            <td>{produit.prix} €</td>
          </tr>

          <tr>
            <th>Référence</th>
            <td>{produit.reference || "—"}</td>
          </tr>

          <tr>
            <th>Quantité</th>
            <td>{produit.quantite}</td>
          </tr>

          <tr>
            <th>Condition</th>
            <td>{produit.condition}</td>
          </tr>

          <tr>
            <th>Actif</th>
            <td>{produit.actif === 1 ? "Oui" : "Non"}</td>
          </tr>

          <tr>
            <th>Ajouté le</th>
            <td>{produit.date_ajout}</td>
          </tr>

          <tr>
            <th>Description</th>
            <td>{produit.description || "—"}</td>
          </tr>
        </tbody>
      </table>

      <button onClick={() => navigate(-1)}>
        Retourner à la page précédente
      </button>
    </div>
  );
};

export default Produit;
