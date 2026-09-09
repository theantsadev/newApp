# Application e-commerce PrestaShop

Application web React permettant de gérer un catalogue PrestaShop et de proposer une expérience d'achat côté client. Le projet comprend un front-office pour les clients et un back-office destiné à l'administration des données et au suivi de l'activité.

## Objectif

Simplifier la gestion d'une boutique PrestaShop en centralisant l'import de données, le suivi des commandes et la gestion des stocks dans une interface web moderne.

## Fonctionnalités clés

- **Front-office client** : consultation du catalogue, détail produit, panier, passage de commande et historique des commandes.
- **Back-office sécurisé** : authentification administrateur, tableau de bord et consultation des commandes avec filtres par période et état.
- **Import de données** : lecture de fichiers CSV pour les produits, déclinaisons, images et commandes, avec validation des colonnes, formats et valeurs avant import.
- **Synchronisation PrestaShop** : création ou mise à jour des catégories, produits, options, combinaisons, clients, adresses, paniers et commandes via l'API Webservice XML.
- **Gestion du stock** : ajustement des quantités pour les produits et leurs déclinaisons, avec historique des mouvements et suivi journalier.
- **Statistiques** : synthèse des commandes et des montants HT/TTC, filtrable par période.

## Résultat

Le projet aboutit à une application fonctionnelle de gestion e-commerce, capable de transformer des fichiers de données en ressources PrestaShop exploitables et de couvrir les principaux parcours de vente et d'administration. Il met également en pratique la séparation front-office / back-office, la gestion des accès et l'intégration avec une API externe.

## Technologies utilisées

- **React 19** et **React DOM**
- **React Router** pour la navigation et les routes protégées
- **Vite** pour le développement et le build
- **JavaScript (ES modules)** et **ESLint**
- **PrestaShop Webservice API** avec échanges XML
- **fast-xml-parser** pour le traitement XML
- **Papa Parse** pour l'analyse des fichiers CSV
- **JSZip** pour la gestion des archives d'import
- **SheetJS (xlsx)** pour le traitement de données tabulaires
- **Fetch API** pour les appels réseau

## Installation

```bash
npm install
npm run dev
```

L'application nécessite une instance PrestaShop accessible et configurée dans `src/config/prestashop.js`.

Scripts disponibles :

```bash
npm run dev      # lancer le serveur de développement
npm run build    # générer le build de production
npm run lint     # vérifier le code avec ESLint
npm run preview  # prévisualiser le build
```
