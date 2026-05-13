# React — Cours Complet + Exercices Corrigés

> Préparation évaluation — P16

---

## Table des matières

1. [Introduction à React](#1-introduction-à-react)
2. [JSX](#2-jsx)
3. [Composants](#3-composants)
4. [Props](#4-props)
5. [State & useState](#5-state--usestate)
6. [Événements](#6-événements)
7. [Rendu conditionnel](#7-rendu-conditionnel)
8. [Listes & map()](#8-listes--map)
9. [useEffect](#9-useeffect)
10. [Formulaires & contrôle](#10-formulaires--contrôle)
11. [Appels API (fetch)](#11-appels-api-fetch)
12. [React Router (navigation)](#12-react-router-navigation)
13. [Exercices pratiques corrigés](#13-exercices-pratiques-corrigés)

---

## 1. Introduction à React

### Qu'est-ce que React ?
React est une **bibliothèque JavaScript** développée par Meta pour créer des interfaces utilisateur. Il repose sur le concept de **composants réutilisables** et d'un **DOM virtuel** qui optimise les mises à jour de l'interface.

### Concepts clés à retenir
- **Composant** : bloc d'interface indépendant et réutilisable
- **State** : données internes d'un composant qui, si elles changent, provoquent un re-rendu
- **Props** : données transmises d'un composant parent à un composant enfant
- **Virtual DOM** : React compare l'ancien et le nouveau DOM pour ne mettre à jour que ce qui a changé

### Créer un projet React
```bash
# Avec Vite (recommandé)
npm create vite@latest mon-app -- --template react
cd mon-app
npm install
npm run dev

# Avec Create React App (plus ancien)
npx create-react-app mon-app
cd mon-app
npm start
```

### Structure d'un projet
```
mon-app/
├── src/
│   ├── App.jsx       ← composant racine
│   ├── main.jsx      ← point d'entrée
│   └── components/   ← vos composants
├── public/
└── package.json
```

---

## 2. JSX

### Définition
JSX (JavaScript XML) est une syntaxe qui permet d'écrire du HTML directement dans JavaScript. Ce n'est pas du HTML pur — il est transformé en appels `React.createElement()`.

### Règles importantes

| Règle | HTML classique | JSX |
|-------|---------------|-----|
| Classe CSS | `class="btn"` | `className="btn"` |
| Attribut label | `for="id"` | `htmlFor="id"` |
| Balises auto-fermantes | `<input>` | `<input />` |
| Un seul élément racine | ✗ pas de règle | ✓ obligatoire |
| Expressions JS | ✗ | `{expression}` |

### Exemples
```jsx
// ✅ Correct
function App() {
  const nom = "Andry";
  const age = 25;

  return (
    <div className="container">
      <h1>Bonjour {nom} !</h1>
      <p>Tu as {age} ans.</p>
      <p>Dans 10 ans : {age + 10} ans</p>
      <input type="text" placeholder="Saisir..." />
    </div>
  );
}

// ❌ Incorrect — deux éléments racine
function App() {
  return (
    <h1>Titre</h1>
    <p>Paragraphe</p>  // ERREUR
  );
}

// ✅ Solution — utiliser un Fragment
function App() {
  return (
    <>
      <h1>Titre</h1>
      <p>Paragraphe</p>
    </>
  );
}
```

---

## 3. Composants

### Composant fonctionnel (standard moderne)
```jsx
// Déclaration avec function
function Bonjour() {
  return <h1>Bonjour le monde !</h1>;
}

// Déclaration avec arrow function
const Bonjour = () => {
  return <h1>Bonjour le monde !</h1>;
};

// Utilisation dans un autre composant
function App() {
  return (
    <div>
      <Bonjour />
      <Bonjour />
    </div>
  );
}
```

### Règles des composants
- Le nom doit commencer par une **majuscule** (`Bonjour`, pas `bonjour`)
- Doit retourner du **JSX** (ou `null`)
- Un composant = un fichier `.jsx` (convention)

### Composition de composants
```jsx
// Card.jsx
function Card({ titre, contenu }) {
  return (
    <div className="card">
      <h2>{titre}</h2>
      <p>{contenu}</p>
    </div>
  );
}

// App.jsx
function App() {
  return (
    <div>
      <Card titre="Premier" contenu="Du contenu ici" />
      <Card titre="Deuxième" contenu="Autre contenu" />
    </div>
  );
}
```

---

## 4. Props

### Définition
Les **props** (propriétés) sont les paramètres passés à un composant depuis son parent. Elles sont en **lecture seule** — un composant ne doit jamais modifier ses propres props.

### Syntaxe de base
```jsx
// Composant qui reçoit des props
function Carte({ nom, email, age }) {
  return (
    <div>
      <h2>{nom}</h2>
      <p>Email : {email}</p>
      <p>Âge : {age}</p>
    </div>
  );
}

// Utilisation avec passage de props
function App() {
  return (
    <Carte
      nom="Andry"
      email="andry@yopmail.com"
      age={25}
    />
  );
}
```

### Props avec valeur par défaut
```jsx
function Bouton({ texte = "Cliquer", couleur = "blue" }) {
  return (
    <button style={{ backgroundColor: couleur }}>
      {texte}
    </button>
  );
}

// Utilisation
<Bouton />                          // "Cliquer", bleu
<Bouton texte="Envoyer" />          // "Envoyer", bleu
<Bouton texte="Annuler" couleur="red" /> // "Annuler", rouge
```

### Props spéciale : children
```jsx
function Boite({ children }) {
  return <div className="boite">{children}</div>;
}

// Utilisation
<Boite>
  <h1>Titre</h1>
  <p>N'importe quel contenu</p>
</Boite>
```

---

## 5. State & useState

### Définition
Le **state** est la mémoire interne d'un composant. Contrairement à une variable classique, modifier le state **déclenche un nouveau rendu** du composant.

### Syntaxe
```jsx
import { useState } from 'react';

function Compteur() {
  const [count, setCount] = useState(0); // 0 = valeur initiale

  return (
    <div>
      <p>Compte : {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
```

### Règles importantes
```jsx
// ❌ Ne JAMAIS modifier le state directement
const [liste, setListe] = useState([]);
liste.push("item");       // INCORRECT — pas de re-rendu !

// ✅ Toujours utiliser le setter
setListe([...liste, "item"]);  // CORRECT — crée un nouveau tableau

// ❌ Ne JAMAIS appeler useState conditionnellement
if (condition) {
  const [val, setVal] = useState(0); // INTERDIT
}
```

### State avec objet
```jsx
function Formulaire() {
  const [user, setUser] = useState({ nom: "", email: "" });

  const changerNom = (e) => {
    setUser({ ...user, nom: e.target.value }); // spread pour garder l'email
  };

  return (
    <input value={user.nom} onChange={changerNom} />
  );
}
```

### State avec tableau
```jsx
function ListeTaches() {
  const [taches, setTaches] = useState(["Tâche 1", "Tâche 2"]);

  // Ajouter
  const ajouter = () => setTaches([...taches, "Nouvelle tâche"]);

  // Supprimer (par index)
  const supprimer = (index) => {
    setTaches(taches.filter((_, i) => i !== index));
  };

  return (
    <ul>
      {taches.map((t, i) => (
        <li key={i}>
          {t}
          <button onClick={() => supprimer(i)}>X</button>
        </li>
      ))}
      <button onClick={ajouter}>Ajouter</button>
    </ul>
  );
}
```

---

## 6. Événements

### Syntaxe
En React, les événements s'écrivent en **camelCase** et prennent une **fonction** (pas une chaîne).

```jsx
// ❌ HTML classique
<button onclick="maFonction()">Cliquer</button>

// ✅ React
<button onClick={maFonction}>Cliquer</button>
<button onClick={() => maFonction()}>Cliquer</button>
```

### Événements courants

| Événement | Description |
|-----------|-------------|
| `onClick` | clic sur l'élément |
| `onChange` | changement de valeur (input) |
| `onSubmit` | soumission d'un formulaire |
| `onMouseEnter` | survol de la souris |
| `onKeyDown` | touche du clavier enfoncée |
| `onFocus` | focus sur un champ |
| `onBlur` | perte de focus |

### L'objet event
```jsx
function Champ() {
  const handleChange = (event) => {
    console.log(event.target.value); // valeur saisie
    console.log(event.target.name);  // nom du champ
  };

  return <input name="prenom" onChange={handleChange} />;
}
```

### Passer des arguments à un handler
```jsx
function Liste() {
  const items = ["a", "b", "c"];

  const handleClick = (item) => {
    alert(`Vous avez cliqué sur : ${item}`);
  };

  return (
    <ul>
      {items.map((item) => (
        <li key={item} onClick={() => handleClick(item)}>
          {item}
        </li>
      ))}
    </ul>
  );
}
```

---

## 7. Rendu conditionnel

### if classique
```jsx
function Message({ estConnecte }) {
  if (estConnecte) {
    return <p>Bienvenue !</p>;
  }
  return <p>Veuillez vous connecter.</p>;
}
```

### Opérateur ternaire (inline)
```jsx
function Statut({ actif }) {
  return (
    <span style={{ color: actif ? "green" : "red" }}>
      {actif ? "Actif" : "Inactif"}
    </span>
  );
}
```

### Opérateur && (afficher ou rien)
```jsx
function Alerte({ message }) {
  return (
    <div>
      {message && <p className="alerte">{message}</p>}
    </div>
  );
}

// Si message est "", null, undefined, false → rien n'est affiché
```

### Exemple complet
```jsx
function Dashboard({ user, loading, error }) {
  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error}</p>;
  if (!user) return <p>Aucun utilisateur</p>;

  return (
    <div>
      <h1>Bonjour {user.nom}</h1>
      {user.estAdmin && <button>Panneau Admin</button>}
    </div>
  );
}
```

---

## 8. Listes & map()

### Rendu d'une liste
```jsx
function ListeClients({ clients }) {
  return (
    <ul>
      {clients.map((client) => (
        <li key={client.id}>
          {client.nom} — {client.email}
        </li>
      ))}
    </ul>
  );
}

// Utilisation
const clients = [
  { id: 1, nom: "Andry", email: "andry@yopmail.com" },
  { id: 2, nom: "John", email: "john@test.com" },
];

<ListeClients clients={clients} />
```

### La prop `key` — règles
- Chaque élément d'une liste **doit** avoir une `key` unique
- Préférer l'**id** réel plutôt que l'index du tableau
- La `key` sert à React pour identifier les éléments lors des re-rendus

```jsx
// ✅ Bonne pratique — utiliser l'id
{items.map((item) => <li key={item.id}>{item.nom}</li>)}

// ⚠️ À éviter si la liste peut changer — utiliser l'index
{items.map((item, index) => <li key={index}>{item.nom}</li>)}
```

### Filtrer avant d'afficher
```jsx
function ListeActive({ items }) {
  return (
    <ul>
      {items
        .filter((item) => item.actif)
        .map((item) => (
          <li key={item.id}>{item.nom}</li>
        ))}
    </ul>
  );
}
```

---

## 9. useEffect

### Définition
`useEffect` permet d'exécuter du code **après le rendu** du composant. On l'utilise pour : les appels API, les abonnements, la manipulation du DOM, les timers.

### Syntaxe
```jsx
import { useEffect } from 'react';

useEffect(() => {
  // Code à exécuter
  return () => {
    // Cleanup (optionnel) — exécuté quand le composant est démonté
  };
}, [dépendances]); // tableau de dépendances
```

### Les 3 cas selon les dépendances

```jsx
// 1. Pas de tableau → s'exécute APRÈS CHAQUE rendu
useEffect(() => {
  console.log("Rendu !");
});

// 2. Tableau vide [] → s'exécute UNE SEULE FOIS (au montage)
useEffect(() => {
  console.log("Composant monté !");
}, []);

// 3. Tableau avec valeurs → s'exécute quand une valeur change
useEffect(() => {
  console.log(`userId a changé : ${userId}`);
}, [userId]);
```

### Exemple — chargement de données
```jsx
import { useState, useEffect } from 'react';

function ListeUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []); // [] → chargement une seule fois

  if (loading) return <p>Chargement...</p>;

  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

---

## 10. Formulaires & contrôle

### Composant contrôlé (controlled component)
La valeur du champ est **gérée par le state** React.

```jsx
function FormulaireContact() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); // empêche le rechargement de la page
    console.log({ nom, email, message });
    // Envoyer à l'API, etc.
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Votre nom"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button type="submit">Envoyer</button>
    </form>
  );
}
```

### Gestion avec un objet state (plusieurs champs)
```jsx
function FormulaireClient() {
  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value }); // mise à jour dynamique par name
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="nom" value={form.nom} onChange={handleChange} placeholder="Nom" />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />
      <input name="telephone" value={form.telephone} onChange={handleChange} placeholder="Téléphone" />
      <button type="submit">Créer</button>
    </form>
  );
}
```

### Select et checkbox
```jsx
function Options() {
  const [pays, setPays] = useState("FR");
  const [accepte, setAccepte] = useState(false);

  return (
    <form>
      {/* Select */}
      <select value={pays} onChange={(e) => setPays(e.target.value)}>
        <option value="FR">France</option>
        <option value="MG">Madagascar</option>
        <option value="US">États-Unis</option>
      </select>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={accepte}
        onChange={(e) => setAccepte(e.target.checked)}
      />
      <label>J'accepte les conditions</label>
    </form>
  );
}
```

---

## 11. Appels API (fetch)

### GET — Récupérer des données
```jsx
import { useState, useEffect } from 'react';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8080/api/customers")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur serveur");
        return res.json();
      })
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error}</p>;

  return (
    <ul>
      {customers.map((c) => (
        <li key={c.id}>{c.name} — {c.email}</li>
      ))}
    </ul>
  );
}
```

### POST — Créer une ressource
```jsx
const createCustomer = async (customerData) => {
  const response = await fetch("http://localhost:8080/api/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customerData),
  });

  if (!response.ok) throw new Error("Création échouée");
  return response.json();
};

// Dans un composant
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const newCustomer = await createCustomer({ name: "Andry", email: "andry@yopmail.com" });
    setCustomers([...customers, newCustomer]);
  } catch (err) {
    setError(err.message);
  }
};
```

### PUT — Modifier une ressource
```jsx
const updateCustomer = async (id, data) => {
  const res = await fetch(`http://localhost:8080/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};
```

### DELETE — Supprimer
```jsx
const deleteCustomer = async (id) => {
  await fetch(`http://localhost:8080/api/customers/${id}`, {
    method: "DELETE",
  });
  setCustomers(customers.filter((c) => c.id !== id));
};
```

---

## 12. React Router (navigation)

### Installation
```bash
npm install react-router-dom
```

### Configuration de base
```jsx
// main.jsx
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// App.jsx
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Import from './pages/Import';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/customers/:id" element={<CustomerDetail />} />
      <Route path="/import" element={<Import />} />
    </Routes>
  );
}
```

### Navigation avec Link
```jsx
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav>
      <Link to="/">Dashboard</Link>
      <Link to="/customers">Clients</Link>
      <Link to="/import">Import</Link>
      <button onClick={() => navigate(-1)}>Retour</button>
    </nav>
  );
}
```

### Récupérer les paramètres d'URL
```jsx
import { useParams } from 'react-router-dom';

function CustomerDetail() {
  const { id } = useParams(); // récupère :id de l'URL

  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8080/api/customers/${id}`)
      .then((res) => res.json())
      .then(setCustomer);
  }, [id]);

  if (!customer) return <p>Chargement...</p>;

  return <h1>{customer.name}</h1>;
}
```

---

## 13. Exercices pratiques corrigés

---

### Exercice 1 — Compteur simple

**Énoncé** : Créer un composant `Compteur` avec un affichage du compte, un bouton `+`, un bouton `-` et un bouton `Reset`. Le compte ne peut pas descendre en dessous de 0.

**Corrigé** :
```jsx
import { useState } from 'react';

function Compteur() {
  const [count, setCount] = useState(0);

  const incrementer = () => setCount(count + 1);
  const decrementer = () => {
    if (count > 0) setCount(count - 1);
  };
  const reset = () => setCount(0);

  return (
    <div>
      <h2>Compteur : {count}</h2>
      <button onClick={incrementer}>+</button>
      <button onClick={decrementer}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

export default Compteur;
```

---

### Exercice 2 — Liste de tâches (Todo List)

**Énoncé** : Créer une application Todo avec : ajout d'une tâche, suppression, et affichage du nombre de tâches restantes.

**Corrigé** :
```jsx
import { useState } from 'react';

function TodoList() {
  const [taches, setTaches] = useState([
    { id: 1, texte: "Apprendre React", fait: false },
  ]);
  const [input, setInput] = useState("");

  const ajouter = () => {
    if (!input.trim()) return; // ne pas ajouter si vide
    const nouvelle = { id: Date.now(), texte: input, fait: false };
    setTaches([...taches, nouvelle]);
    setInput("");
  };

  const supprimer = (id) => {
    setTaches(taches.filter((t) => t.id !== id));
  };

  const toggleFait = (id) => {
    setTaches(taches.map((t) =>
      t.id === id ? { ...t, fait: !t.fait } : t
    ));
  };

  const restantes = taches.filter((t) => !t.fait).length;

  return (
    <div>
      <h1>Todo List ({restantes} restante{restantes > 1 ? "s" : ""})</h1>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && ajouter()}
        placeholder="Nouvelle tâche..."
      />
      <button onClick={ajouter}>Ajouter</button>
      <ul>
        {taches.map((tache) => (
          <li key={tache.id}
            style={{ textDecoration: tache.fait ? "line-through" : "none" }}>
            <input
              type="checkbox"
              checked={tache.fait}
              onChange={() => toggleFait(tache.id)}
            />
            {tache.texte}
            <button onClick={() => supprimer(tache.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;
```

---

### Exercice 3 — Fetch API et affichage

**Énoncé** : Créer un composant qui charge une liste de customers depuis `http://localhost:8080/api/customers` et les affiche dans un tableau avec les colonnes : ID, Nom, Email, Pays. Gérer le chargement et les erreurs.

**Corrigé** :
```jsx
import { useState, useEffect } from 'react';

function TableauCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8080/api/customers")
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement des customers...</p>;
  if (error) return <p style={{ color: "red" }}>Erreur : {error}</p>;

  return (
    <div>
      <h2>Customers ({customers.length})</h2>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Pays</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.country}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableauCustomers;
```

---

### Exercice 4 — Formulaire d'import CSV (lié à votre évaluation)

**Énoncé** : Créer une page d'import avec plusieurs champs de fichier, un bouton "Importer", et validation des erreurs (montant négatif, format date incorrect).

**Corrigé** :
```jsx
import { useState } from 'react';

function ImportPage() {
  const [fichier1, setFichier1] = useState(null);
  const [fichier2, setFichier2] = useState(null);
  const [erreurs, setErreurs] = useState([]);
  const [succes, setSucces] = useState(false);

  const validerCSV = (texte, nomFichier) => {
    const lignes = texte.split("\n");
    const erreursLocales = [];

    lignes.forEach((ligne, index) => {
      if (index === 0) return; // ignorer l'en-tête

      const colonnes = ligne.split(",");
      if (colonnes.length < 2) return; // ignorer lignes vides

      // Vérifier montants négatifs (supposons colonne index 2 = montant)
      const montant = parseFloat(colonnes[2]);
      if (!isNaN(montant) && montant < 0) {
        erreursLocales.push(`Fichier "${nomFichier}", ligne ${index + 1} : montant négatif (${montant})`);
      }

      // Vérifier format date (supposons colonne index 3 = date, format YYYY-MM-DD)
      if (colonnes[3]) {
        const dateStr = colonnes[3].trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateStr && !dateRegex.test(dateStr)) {
          erreursLocales.push(`Fichier "${nomFichier}", ligne ${index + 1} : format de date invalide (${dateStr})`);
        }
      }
    });

    return erreursLocales;
  };

  const handleImport = async () => {
    setErreurs([]);
    setSucces(false);

    const toutesErreurs = [];

    // Valider fichier 1
    if (fichier1) {
      const texte = await fichier1.text();
      const errs = validerCSV(texte, fichier1.name);
      toutesErreurs.push(...errs);
    }

    // Valider fichier 2
    if (fichier2) {
      const texte = await fichier2.text();
      const errs = validerCSV(texte, fichier2.name);
      toutesErreurs.push(...errs);
    }

    if (toutesErreurs.length > 0) {
      setErreurs(toutesErreurs);
      return;
    }

    // Envoyer à l'API si pas d'erreurs
    const formData = new FormData();
    if (fichier1) formData.append("fichier1", fichier1);
    if (fichier2) formData.append("fichier2", fichier2);

    try {
      const res = await fetch("http://localhost:8080/api/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur import serveur");
      setSucces(true);
    } catch (err) {
      setErreurs([err.message]);
    }
  };

  return (
    <div>
      <h1>IMPORT</h1>

      <div>
        <label>Fichier 1 (customers) :</label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFichier1(e.target.files[0])}
        />
      </div>

      <div>
        <label>Fichier 2 (leads/tickets) :</label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFichier2(e.target.files[0])}
        />
      </div>

      <button onClick={handleImport}>Importer</button>

      {/* Affichage des erreurs */}
      {erreurs.length > 0 && (
        <div style={{ color: "red", marginTop: "10px" }}>
          <h3>Erreurs détectées :</h3>
          <ul>
            {erreurs.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Succès */}
      {succes && (
        <p style={{ color: "green" }}>Import réussi !</p>
      )}
    </div>
  );
}

export default ImportPage;
```

---

### Exercice 5 — Dashboard avec graphiques (lié à votre évaluation)

**Énoncé** : Créer un dashboard qui affiche des totaux cliquables. Au clic sur un total, afficher les détails.

**Corrigé** :
```jsx
import { useState, useEffect } from 'react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailType, setDetailType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les statistiques globales
    fetch("http://localhost:8080/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const voirDetails = (type) => {
    setDetailType(type);
    fetch(`http://localhost:8080/api/dashboard/${type}`)
      .then((res) => res.json())
      .then(setDetail);
  };

  const modifier = async (id, montant) => {
    await fetch(`http://localhost:8080/api/${detailType}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant }),
    });
    // Rafraîchir les détails
    voirDetails(detailType);
  };

  const supprimer = async (id) => {
    await fetch(`http://localhost:8080/api/${detailType}/${id}`, {
      method: "DELETE",
    });
    setDetail(detail.filter((item) => item.id !== id));
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Totaux cliquables */}
      <div style={{ display: "flex", gap: "20px" }}>
        <div
          onClick={() => voirDetails("campaigns")}
          style={{ cursor: "pointer", padding: "20px", border: "1px solid #ccc" }}
        >
          <h3>Total Campaigns</h3>
          <p style={{ fontSize: "2rem" }}>{stats?.totalCampaigns ?? 0}</p>
        </div>

        <div
          onClick={() => voirDetails("budgets")}
          style={{ cursor: "pointer", padding: "20px", border: "1px solid #ccc" }}
        >
          <h3>Total Budgets</h3>
          <p style={{ fontSize: "2rem" }}>{stats?.totalBudgets ?? "0 €"}</p>
        </div>

        <div
          onClick={() => voirDetails("expenses")}
          style={{ cursor: "pointer", padding: "20px", border: "1px solid #ccc" }}
        >
          <h3>Total Dépenses</h3>
          <p style={{ fontSize: "2rem" }}>{stats?.totalExpenses ?? "0 €"}</p>
        </div>
      </div>

      {/* Détails */}
      {detail && (
        <div>
          <h2>Détails — {detailType}</h2>
          <button onClick={() => setDetail(null)}>Fermer</button>
          <table border="1">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom/Description</th>
                <th>Montant</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {detail.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name || item.description}</td>
                  <td>{item.amount}</td>
                  <td>
                    <button onClick={() => {
                      const nouveau = prompt("Nouveau montant :", item.amount);
                      if (nouveau) modifier(item.id, parseFloat(nouveau));
                    }}>
                      Modifier
                    </button>
                    <button onClick={() => supprimer(item.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
```

---

### Exercice 6 — Bouton Dupliquer avec export fichier

**Énoncé** : Dans une liste de customers, ajouter un bouton "Dupliquer" qui génère un fichier JSON contenant les données du customer, ses leads et ses tickets.

**Corrigé** :
```jsx
function LigneCustomer({ customer }) {
  const dupliquer = async () => {
    // 1. Charger les données liées
    const [leads, tickets] = await Promise.all([
      fetch(`http://localhost:8080/api/customers/${customer.id}/leads`).then(r => r.json()),
      fetch(`http://localhost:8080/api/customers/${customer.id}/tickets`).then(r => r.json()),
    ]);

    // 2. Construire l'objet de données
    const donnees = {
      customer,
      leads,
      tickets,
    };

    // 3. Générer et télécharger le fichier JSON
    const blob = new Blob([JSON.stringify(donnees, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `customer_${customer.id}_export.json`;
    lien.click();
    URL.revokeObjectURL(url);
  };

  return (
    <tr>
      <td>{customer.id}</td>
      <td>{customer.name}</td>
      <td>{customer.email}</td>
      <td>
        <button onClick={dupliquer}>Dupliquer</button>
      </td>
    </tr>
  );
}
```

---

## Aide-mémoire rapide (Cheatsheet)

```jsx
// useState
const [valeur, setValeur] = useState(valeurInitiale);

// useEffect - une seule fois
useEffect(() => { /* code */ }, []);

// useEffect - quand dep change
useEffect(() => { /* code */ }, [dep]);

// Rendu conditionnel
{condition && <Composant />}
{condition ? <CompA /> : <CompB />}

// Liste
{items.map((item) => <li key={item.id}>{item.nom}</li>)}

// Événement avec paramètre
<button onClick={() => maFonc(item.id)}>Cliquer</button>

// Input contrôlé
<input value={val} onChange={(e) => setVal(e.target.value)} />

// Fetch GET
fetch(url).then(r => r.json()).then(data => setState(data));

// Fetch POST
fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
});

// Navigation React Router
<Link to="/page">Aller</Link>
const navigate = useNavigate();
navigate("/page");

// Paramètre URL
const { id } = useParams();
```

---

*Bon courage pour l'évaluation mardi ! 🚀*
