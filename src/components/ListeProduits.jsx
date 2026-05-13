import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const ListeProduits = () => {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const webserviceUrl = "/prestashop-api";
  const webserviceKey = "BG8EDFE4NBE7AWS5EFC124F9UPNPWIT2";
  const parseXml = (xmlString) => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, "text/xml");
    const nodes = xml.querySelectorAll("product");
    return Array.from(nodes).map((node) => ({
      id: node.getAttribute("id"),
      href: node.getAttribute("xlink:href"),
    }));
  };

  const deleteProduct = (id) => {
    fetch(`${webserviceUrl}/api/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
      },
    })
      .then((resp) => {
        if (!resp.ok) {
          setError(`HTTP ${resp.status}`);
          throw new Error(`HTTP ${resp.status}`);
        }
        setProduits(produits.filter((p) => p.id !== id));
        return resp.text();
      })
      .catch((err) => {
        console.error(err.message);
        setError(err);
      });
  };

  const deleteAll = () => {
    Promise.all(produits.map((produit) => deleteProduct(produit.id))).catch(
      (err) => {
        console.error(err.message);
        setError(err);
      },
    );
  };

  useEffect(() => {
    fetch(`${webserviceUrl}/api/products`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
      },
    })
      .then((resp) => {
        if (!resp.ok) {
          setError(`HTTP ${resp.status}`);
          throw new Error(`HTTP ${resp.status}`);
        }
        return resp.text();
      })
      .then((xmlText) => {
        const data = parseXml(xmlText);
        // console.log(data);
        setProduits(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err.message);
        setError(err);
      });
    //La reponse est en xml  par ex :
    //     <?xml version="1.0" encoding="UTF-8"?>
    // <prestashop
    //   xmlns:xlink="http://www.w3.org/1999/xlink">
    //   <products>
    //     <product id="20" xlink:href="http://localhost:70/prestashop/api/products/20"/>
    //     <product id="2" xlink:href="http://localhost:70/prestashop/api/products/2"/>
    //     <product id="3" xlink:href="http://localhost:70/prestashop/api/products/3"/>
    //     <product id="4" xlink:href="http://localhost:70/prestashop/api/products/4"/>
    //     <product id="5" xlink:href="http://localhost:70/prestashop/api/products/5"/>
    //     <product id="6" xlink:href="http://localhost:70/prestashop/api/products/6"/>
    //     <product id="7" xlink:href="http://localhost:70/prestashop/api/products/7"/>
    //     <product id="8" xlink:href="http://localhost:70/prestashop/api/products/8"/>
    //     <product id="9" xlink:href="http://localhost:70/prestashop/api/products/9"/>
    //     <product id="10" xlink:href="http://localhost:70/prestashop/api/products/10"/>
    //     <product id="11" xlink:href="http://localhost:70/prestashop/api/products/11"/>
    //     <product id="12" xlink:href="http://localhost:70/prestashop/api/products/12"/>
    //     <product id="13" xlink:href="http://localhost:70/prestashop/api/products/13"/>
    //     <product id="14" xlink:href="http://localhost:70/prestashop/api/products/14"/>
    //     <product id="15" xlink:href="http://localhost:70/prestashop/api/products/15"/>
    //     <product id="16" xlink:href="http://localhost:70/prestashop/api/products/16"/>
    //     <product id="17" xlink:href="http://localhost:70/prestashop/api/products/17"/>
    //     <product id="18" xlink:href="http://localhost:70/prestashop/api/products/18"/>
    //     <product id="19" xlink:href="http://localhost:70/prestashop/api/products/19"/>
    //     <product id="21" xlink:href="http://localhost:70/prestashop/api/products/21"/>
    //     <product id="22" xlink:href="http://localhost:70/prestashop/api/products/22"/>
    //   </products>
    // </prestashop>
  }, []);
  if (error) return <div>Erreur : {error.message}</div>;
  if (loading) return <div>Chargement ... </div>;
  if (!loading && produits.length == 0) return <div>Aucun produit</div>;

  return (
    <div>
      <h1>Liste des Produits</h1>
      <br />
      <button onClick={deleteAll}> Tout supprimer</button>
      <table border={1}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Option1</th>
            <th>Option2</th>
          </tr>
        </thead>
        <tbody>
          {produits.map((produit) => (
            <tr key={produit.id}>
              <td>{produit.id}</td>
              <td>
                <Link to={`/produits/${produit.id}`}>Voir detail</Link>
              </td>
              <td>
                <button onClick={() => deleteProduct(produit.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListeProduits;
