# Evaluation J1 \- 11 mai 26 \- P17

## J0

[Evaluation J0 - 05 mai 2026 - P17](https://docs.google.com/document/d/1I3FlmH-9922t6q9fZo1nBU-ZiNaqJVDeOye4HoWMm_k/edit?usp=drive_link)

## 

## Jour 1 : 11/05/2026

NewAPP

1. Backoffice ( avec login/mdp , mettre par defaut sur le formulaire )  
   1. il faut protéger les pages du back office  
   2. créer une page avec un bouton pour réinitialiser les données  
   3. créer la page pour importer les 4 fichiers   
      1. 3 fichiers csv pour le contenu [import-data-mai-26](https://docs.google.com/spreadsheets/d/1edpSD6drVAr886oYXbmUApC8QEAcsxtLgttcrUeK8oY/edit?usp=sharing)	   
         1. csv modifié ce 11/05 à 13:15 , voir couleur rouge  
      2. 1 fichier zip pour les images :  [images.zip](https://drive.google.com/file/d/1OAqmtaJZ3jlrOtFbR4hwt0tsfr0pTT1a/view?usp=sharing)   
   4. page pour afficher les commandes et modifier l’état  
      1. paiement effectué  
      2. annulé  
2. FrontOffice  
   1. créer la page d’accueil pour afficher les produits  
      1. avec fiche produit  
   2. faire marcher le workflow d’achat  
      1. gestion de panier  
      2. validation commande  
         1. avec uniquement le choix “paiement à la livraison”  
         2. pas de frais de livraison  
   3. état de “mes commandes”

ExistingApp

1. s’assurer que   
   1. Toutes les données importées sont visibles quelque part dans le backoffice de prestashop.  
   2. Que la modification des données aient un impact sur la NewAPP

Note ce 12/05 : utiliser France comme Pays, et Euro comme devise

Note : Créer uniquement les pages demandées, pas de menu ni affichage non demandé

## Jour 2 : 12/05/2026

NewAPP

1. Backoffice  
   1. Voici les état des commandes existants que nous allons utiliser (data import modifié)  
      1. dans le panier (tsy mbola ao anaty commande fa cart)  
      2. paiement effecuté  
      3. annulé  
   2. Tableau de bord  
      1. Par jour  
         1. nb de commande  
         2. montant  
      2. Total général  
   3. Ny  import 1 ihany ny déclinaison, fa tsisy combinaison   
2. Frontoffice  
   1. Changer le page d’accueil par défaut, par une page qui affiche la liste des utilisateurs existants. On peut choisir avec quel utilisateur on veut se connecter  
      1. rajouter une option “utilisateur anonyme”   
   2. mettre une marque sur les produits ( voir date\_availability\_produit)  
      1. HOT : pour les produits sorties 1j avant  
      2. NEW : pour les produits sorties 1 semaines avant  
   3. implémenter une recherche multicritère par produit  
      1. nom  
      2. catégorie  
      3. intervalle de prix

## Jour 3 : 15/05/2026

NewAPP

3. Backoffice  
   1. Vérifier les erreurs suivants dans l’import  
      1. Nom de colonne non conforme  
      2. format de date différente de DD/MM/YYYY  
      3. montant positif  
   2. rajouter une page qui permet d’ajouter en stock les produits  
   3. rajouter un tableau sur l’évolution du stock journalier d’un produit  
      1. mahazo micréer endpoint 1 (1 ihany ) ianareo ao am prestashop hiantsoana an’ilay code  
         StockAvailable::updateQuantity($idProduct, 0, $delta)  
      2.   
4. FrontOffice  
   1. Afficher la quantité en stock disponible sur la fiche produit

