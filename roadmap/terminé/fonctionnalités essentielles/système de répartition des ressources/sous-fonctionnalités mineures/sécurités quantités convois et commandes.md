# Sécurités quantités convois et commandes

## Objectifs
Eviter d'avoir des convois/commandes nulles qui pollueraient le système.

## Fonctionnement Détaillé
Ne pas enregistrer les convois de 0 et étendre le blocage des commandes négatives aux valeurs simultanément nulles.

## Plan d'Implémentation
1.  Modifier le gestionnaire d'événements du bouton "lancer le convoi" sur la page Commerce (`js/page/Commerce.js`).
2.  Ajouter une vérification pour s'assurer que la quantité de nourriture ou de matériaux du convoi est supérieure à zéro avant de procéder.
3.  Si les deux quantités sont nulles, afficher un message d'erreur (par exemple, un toast) et annuler l'opération.
4.  Modifier la méthode `estValide` dans la classe `Commande` (`js/class/Commande.js`).
5.  Ajouter une condition pour bloquer la création ou la modification d'une commande si la quantité totale de nourriture demandée ET la quantité totale de matériaux demandés sont inférieures ou égales à zéro.

## Tests à effectuer
1.  **Test de création de convoi nul :**
    *   Sur la page Commerce, tenter de lancer un convoi avec 0 nourriture et 0 matériaux.
    *   Vérifier qu'un message d'erreur s'affiche (toast).
    *   Vérifier qu'aucun convoi n'est créé.

2.  **Test de création de convoi avec une quantité non nulle :**
    *   Tenter de lancer un convoi avec une quantité de nourriture > 0 et matériaux = 0.
    *   Tenter de lancer un convoi avec une quantité de nourriture = 0 et matériaux > 0.
    *   Tenter de lancer un convoi avec des quantités de nourriture > 0 et matériaux > 0.
    *   Vérifier que ces convois sont créés sans message d'erreur.

3.  **Test de création de commande nulle ou négative :**
    *   Tenter de créer une nouvelle commande avec une quantité totale de nourriture <= 0 et une quantité totale de matériaux <= 0.
    *   Vérifier que la création de la commande est bloquée.

4.  **Test de modification de commande nulle ou négative :**
    *   Tenter de modifier une commande existante pour que sa quantité totale de nourriture <= 0 et sa quantité totale de matériaux <= 0.
    *   Vérifier que la modification de la commande est bloquée.

5.  **Test de création/modification de commande avec au moins une quantité positive :**
    *   Tenter de créer ou modifier une commande avec une quantité totale de nourriture > 0 et matériaux <= 0.
    *   Tenter de créer ou modifier une commande avec une quantité totale de nourriture <= 0 et matériaux > 0.
    *   Tenter de créer ou modifier une commande avec des quantités totales de nourriture > 0 et matériaux > 0.
    *   Vérifier que ces commandes sont créées ou modifiées sans blocage.

## Avancement
Une logique a été ajoutée dans le gestionnaire d'événements du bouton "lancer le convoi" dans `js/page/Commerce.js` pour détecter si les quantités de matériaux et de nourriture sont toutes deux à zéro et afficher un message d'erreur toast si c'est le cas, empêchant ainsi la création de convois nuls. La méthode `estValide` dans `js/class/Commande.js` a été modifiée pour bloquer la création de commandes si la quantité totale de nourriture ET la quantité totale de matériaux demandés sont inférieures ou égales à zéro. La fonctionnalité est terminée et fonctionnelle.
