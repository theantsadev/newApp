| Ligne | Catégorie | Module | Page | Description tâche | Type | Qui | Estimation | Temps passé | Reste à faire | Avancement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Backoffice | Gestion Login | Login | Créer le formulaire Login (champs login/mdp pré-remplis par défaut) | Affichage | ETU003327 | 5  | 5  | 0  |  |
| 2 | Backoffice | Gestion Login | Login | Fonction de vérification login/mdp (logique JS) | Métier | ETU003327 | 10  | 10  | 0  |  |
| 3 | Backoffice | Gestion Login | Login | Appel de la fonction login lors de la soumission du formulaire | Intégration | ETU003327 | 5  | 5  | 0  |  |
| 4 | Backoffice | Gestion Login | Login | Protection des pages du backoffice (redirect si non authentifié) | Métier | ETU003327 | 15  | 15  | 0  |  |
| 5 | Backoffice | Reset Data | Reset | Créer la page Reset avec un bouton de réinitETU003327lisation | Affichage | ETU003327 | 5  | 5  | 0  |  |
| 6 | Backoffice | Reset Data | Reset | Logique de réinitETU003327lisation (quelles données effacer, confirmation) | Métier | ETU003327 | 30  | 30  | 0  |  |
| 7 | Backoffice | Reset Data | Reset | Appel API Prestashop pour supprimer/réinitETU003327liser les données | Intégration | ETU003327 | 10  | 10  | 0  |  |
| 8 | Backoffice | Import Data | Import | Créer la page Import avec 4 champs fichier (3 CSV + 1 ZIP) | Affichage | ETU003327 | 30  | 30  | 0  |  |
| 9 | Backoffice | Import Data | Import | Parsing/validation des fichiers CSV et ZIP côté client | Métier | ETU003327 | 30  | 30  | 0  |  |
| 10 | Backoffice | Import Data | Import | Envoi des données parsées vers l'API Prestashop (XML) | Intégration | ETU003327 | 10  | 10  | 0  |  |
| 11 | Backoffice | Commandes | Commandes | Créer la page tableau des commandes avec boutons d'action | Affichage | ETU003327 | 15  | 15  | 0  |  |
| 12 | Backoffice | Commandes | Commandes | Logique de changement d'état (paiement effectué / annulé) | Métier | ETU003327 | 15  | 15  | 0  |  |
| 13 | Backoffice | Commandes | Commandes | Appel API pour récupérer les commandes et modifier leur état | Intégration | ETU003327 | 20  | 20  | 0  |  |
| 14 | FrontOffice | Accueil Produits | Accueil | Créer la page d'accueil avec la grille/liste de produits | Affichage | ETU003327 | 20  | 20  | 0  |  |
| 15 | FrontOffice | Accueil Produits | Accueil | Appel API Prestashop pour récupérer la liste des produits | Intégration | ETU003327 | 15  | 15  | 0  |  |
| 16 | FrontOffice | Produit | Produit | Créer la page fiche produit (détails, image, prix) | Affichage | ETU003327 | 20  | 20  | 0  |  |
| 17 | FrontOffice | Produit | Produit | Appel API Prestashop pour récupérer un produit par ID | Intégration | ETU003327 | 10  | 10  | 0  |  |
| 18 | FrontOffice | Panier | Panier | Créer la page Panier (liste articles, quantités, total) | Affichage | ETU003327 | 15  | 15  | 0  |  |
| 19 | FrontOffice | Panier | Panier | Logique d'ajout/suppression/modification quantité dans le panier | Métier | ETU003327 | 20  | 20  | 0  |  |
| 20 | FrontOffice | Commande | Commande | Créer la page récapitulatif/validation de commande | Affichage | ETU003327 | 15  | 15  | 0  |  |
| 21 | FrontOffice | Commande | Commande | Logique de validation (choix "paiement à la livraison" uniquement) | Métier | ETU003327 | 10  | 10  | 0  |  |
| 22 | FrontOffice | Commande | Commande | Appel API Prestashop pour créer la commande | Intégration | ETU003327 | 30  | 30  | 0  |  |
| 23 | FrontOffice | Commande | Commande | Pas de frais de livraison (frais = 0) | Métier | ETU003327 | 5  | 5  | 0  |  |
| 24 | FrontOffice | Commandes | Commandes | Créer la page "Mes commandes" avec le statut de chaque commande | Affichage | ETU003327 | 15  | 15  | 0  |  |
| 25 | FrontOffice | Commandes | Commandes | Appel API Prestashop pour récupérer les commandes du client | Intégration | ETU003327 | 15  | 15  | 0  |  |
| 26 | Backoffice | Commandes | Commandes | Gérer les états des commandes (dont l'exclusion des paniers) | Affichage | ETU003327 | 15 | 15 | 0 |  |
| 27 | Backoffice | Import Data | Import | Logique d'exclusion des paniers non-commandés lors de l'import | Métier | ETU003327 | 20 | 20 | 0 |  |
| 28 | Backoffice | Import Data | Import | Intégrer l'exclusion de l'état "dans le panier" pour créer uniquement des carts | Intégration | ETU003327 | 15 | 15 | 0 |  |
| 29 | Backoffice | Dashboard | Dashboard | Concevoir la page de tableau de bord moderne et responsive | Affichage | ETU003327 | 30 | 30 | 0 |  |
| 30 | Backoffice | Dashboard | Dashboard | Implémenter le calcul de statistiques journalières (nombre, montant HT/TTC) et totaux | Métier | ETU003327 | 25 | 25 | 0 |  |
| 31 | Backoffice | Dashboard | Dashboard | Intégrer la récupération de commandes PrestaShop et le filtre par dates | Intégration | ETU003327 | 20 | 20 | 0 |  |
| 32 | Backoffice | Import Data | Import | Limiter l'import à une seule déclinaison sans combinaisons complexes | Métier | ETU003327 | 10 | 10 | 0 |  |
| 33 | FrontOffice | Accueil | Accueil | Créer la page d'accueil d'authentification listant les clients et l'anonyme | Affichage | ETU003327 | 25 | 25 | 0 |  |
| 34 | FrontOffice | Accueil | Accueil | Logique métier de session client / mode invité anonyme | Métier | ETU003327 | 15 | 15 | 0 |  |
| 35 | FrontOffice | Accueil | Accueil | Intégrer la récupération des clients et la persistance de session active | Intégration | ETU003327 | 15 | 15 | 0 |  |
| 36 | FrontOffice | Produit | ListeProduits | Logique de calcul du statut temporel du produit (HOT / NEW) | Métier | ETU003327 | 15 | 15 | 0 |  |
| 37 | FrontOffice | Produit | ListeProduits | Intégrer et afficher des badges visuels premium (HOT / NEW) sur le catalogue | Affichage | ETU003327 | 15 | 15 | 0 |  |
| 38 | FrontOffice | Produit | ListeProduits | Concevoir le formulaire de recherche multi-critères (nom, catégorie, prix) | Affichage | ETU003327 | 20 | 20 | 0 |  |
| 39 | FrontOffice | Produit | ListeProduits | Logique métier de filtrage multi-critère en temps réel côté client | Métier | ETU003327 | 20 | 20 | 0 |  |
| 40 | FrontOffice | Produit | ListeProduits | Intégrer les catégories dynamiques PrestaShop dans le sélecteur du filtre | Intégration | ETU003327 | 15 | 15 | 0 |  |
| 41 | Backoffice | Dashboard | Dashboard | Séparer visuellement le résumé global et la vue filtrée du tableau de bord | Affichage | ETU003327 | 15 | 15 | 0 | fait |
| 42 | Backoffice | Dashboard | Dashboard | Ajouter les totaux globaux (TTC, HT) en excluant les commandes annulées par défaut | Métier | ETU003327 | 20 | 20 | 0 | fait |
| 43 | Backoffice | Statistiques | StatistiquesParCategorie | Corriger le calcul de la quantité en stock pour les produits ayant plusieurs variantes | Métier | ETU003327 | 25 | 25 | 0 | fait |
| 44 | Backoffice | Statistiques | StatistiquesParCategorie | Ajouter l'exclusion des commandes annulées dans les statistiques et ajouter les totaux | Intégration | ETU003327 | 20 | 20 | 0 | fait |
| 45 | Backoffice | Import Data | Import | Rendre l'import des images (fichier ZIP) non obligatoire lors de l'intégration des csv | Métier | ETU003327 | 10 | 10 | 0 | fait |

