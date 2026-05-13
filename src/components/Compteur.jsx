// Énoncé : Créer un composant Compteur avec un affichage du compte, un bouton +, un bouton - et
// un bouton Reset. Le compte ne peut pas descendre en dessous de 0.
import { useState } from "react";

const Compteur = () => {
  const [compte, setCompte] = useState(0);
  const incrementer = () => setCompte(compte + 1);

  const decrementer = () => {
    if (compte >= 1) setCompte(compte - 1);
  };

  const reset = () => {
    setCompte(0);
  };

  return (
    <div>
      <p>Le nombre de compte est : {compte}</p>
      <button onClick={incrementer}>+</button>
      <button onClick={decrementer}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};

export default Compteur;
