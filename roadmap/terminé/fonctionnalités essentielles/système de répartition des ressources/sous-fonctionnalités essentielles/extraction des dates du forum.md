# Extraction des dates du forum

## Objectifs
S'assurer que la date extraite est toujours correcte, même lorsque l'année n'est pas précisée.

## Fonctionnement Détaillé
Lorsque l'année n'est pas précisée, il faut considérer qu'il s'agit implicitement de celle correspondant à la dernière occurence passée de la combinaison jour/mois donnée.

## Plan d'Implémentation
1.  Créer une fonction `parseForumDate` dans `js/class/Utils.js`.
2.  Cette fonction doit prendre en entrée la chaîne de date extraite du forum.
3.  Implémenter la logique pour gérer le cas où l'année n'est pas précisée, en considérant la dernière occurrence passée de la combinaison jour/mois.
4.  Ajouter une gestion spécifique pour les espaces insécables qui peuvent être présents dans la chaîne de date.
5.  Utiliser cette fonction dans la méthode `chargerCommande` de `js/page/Forum.js` pour parser la date de création du premier message de chaque sujet de commande.

## Avancement
La fonction `Utils.parseForumDate` a été implémentée dans `js/class/Utils.js`. Elle gère correctement l'ajout de l'année courante si elle est absente dans la chaîne de date du forum en se basant sur la dernière occurrence passée. Une correction a été apportée pour gérer les espaces insécables dans la chaîne de date, résolvant le problème d'affichage "Invalid date". Cette fonction est utilisée dans `js/page/Forum.js` (`chargerCommande`) pour extraire la date de création des commandes. La fonctionnalité est terminée et fonctionnelle.
