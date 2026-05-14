import { useState } from "react";

const TodoList = () => {
  const [taches, setTaches] = useState([
    { titre: "T1", action: "Faire la lessive", duree: 4 },
  ]);

  const [nouvelleTache, setNouvelleTache] = useState({
    titre: "",
    action: "",
    duree: 0,
  });

  const getColorByDuree = (duree) => (duree >= 5 ? "red" : "blue");

  const ajouterTache = () => setTaches([...taches, nouvelleTache]);
  const enleverTache = (indice) =>
    setTaches(taches.filter((tache, i) => i !== indice));

  const handleSubmit = (e) => {
    e.preventDefault();
    ajouterTache();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNouvelleTache({ ...nouvelleTache, [name]: value });
  };

  return (
    <div>
      <p>Nombres de taches restantes : {taches.length}</p>
      <ul>
        {taches.map((tache, indice) => (
          <div key={indice}>
            <li style={{ color: getColorByDuree(tache.duree) }}>
              Titre : {tache.titre} - Action : {tache.action} - Duree :{" "}
              {tache.duree}
            </li>
            <button onClick={() => enleverTache(indice)}>Enlever</button>
          </div>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input type="text" name="titre" onChange={handleChange} />
        <input type="text" name="action" onChange={handleChange} />
        <input type="number" name="duree" min={0} onChange={handleChange} />
        <button type="submit">Ajouter une tache</button>
      </form>
    </div>
  );
};

export default TodoList;
