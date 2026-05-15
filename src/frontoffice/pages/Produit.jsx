import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { XMLParser } from "fast-xml-parser";
import { fetchProductById } from "../../services/productService";

const Produit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getValue = (field) => {
    if (field == null) return "";
    if (typeof field !== "object") return field;
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
      image: getValue(product.associations?.images?.image["@_xlink:href"]),
      description: getValue(product.description?.language),
      description_courte: getValue(product.description_short?.language),
      meta_titre: getValue(product.meta_title?.language),
    };
  };

  useEffect(() => {
    fetchProductById(id)
      .then((xmlText) => {
        const data = parseXml(xmlText);
        setProduit(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [id]);

  if (error) return <div>Erreur : {error.message}</div>;
  if (loading) return <div>Chargement ...</div>;

  return (
    <div>
      <h1>Produit #{produit.id}</h1>

      <table border={1}>
        <tbody>
          <tr>
            <th>Image</th>
            <td>
              <img src={produit.image} alt="Sans image" srcset="" />
            </td>
          </tr>
          <tr>
            <th>Nom</th>
            <td>{produit.nom || "Sans nom"}</td>
          </tr>

          <tr>
            <th>Prix</th>
            <td>{produit.prix} EUR</td>
          </tr>

          <tr>
            <th>Reference</th>
            <td>{produit.reference || "-"}</td>
          </tr>

          <tr>
            <th>Quantite</th>
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
            <th>Ajoute le</th>
            <td>{produit.date_ajout}</td>
          </tr>

          <tr>
            <th>Description</th>
            <td>{produit.description || "-"}</td>
          </tr>
        </tbody>
      </table>

      <button onClick={() => navigate(-1)}>
        Retourner a la page precedente
      </button>
    </div>
  );
};

export default Produit;
