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

## Avancement
Une logique a été ajoutée dans le gestionnaire d'événements du bouton "lancer le convoi" dans `js/page/Commerce.js` pour détecter si les quantités de matériaux et de nourriture sont toutes deux à zéro et afficher un message d'erreur toast si c'est le cas, empêchant ainsi la création de convois nuls. La méthode `estValide` dans `js/class/Commande.js` a été modifiée pour bloquer la création de commandes si la quantité totale de nourriture ET la quantité totale de matériaux demandés sont inférieures ou égales à zéro. La fonctionnalité est terminée et fonctionnelle.
