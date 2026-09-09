/**
 * Exécute une liste de tâches asynchrones avec une concurrence maximale.
 * Évite de saturer le pool de connexions HTTP du navigateur (limite ~6 par domaine).
 *
 * @template T, R
 * @param {T[]} items - Liste des éléments à traiter
 * @param {(item: T, index: number) => Promise<R>} fn - Fonction async à appliquer
 * @param {number} [concurrency=5] - Nombre max de requêtes simultanées
 * @returns {Promise<R[]>} - Résultats dans le même ordre que items
 */
export const runWithConcurrency = async (items, fn, concurrency = 5) => {
  const results = new Array(items.length);
  let index = 0;

  const worker = async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current], current);
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );

  await Promise.all(workers);
  return results;
};
