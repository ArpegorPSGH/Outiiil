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

## Tests à effectuer
1.  **Test avec date sans année (passée) :**
    *   Créer un message sur le forum avec une date dans le passé de l'année en cours (par exemple, "15 mai à 10:00").
    *   Vérifier que la fonction `Utils.parseForumDate` extrait correctement la date en ajoutant l'année courante.
    *   Vérifier que la date extraite correspond bien au 15 mai de l'année en cours.

2.  **Test avec date sans année (future dans l'année passée) :**
    *   Créer un message sur le forum avec une date dans le futur de l'année en cours, mais qui était dans le passé de l'année précédente (par exemple, si nous sommes en juin 2025, utiliser "15 janvier à 10:00").
    *   Vérifier que la fonction `Utils.parseForumDate` extrait correctement la date en ajoutant l'année précédente.
    *   Vérifier que la date extraite correspond bien au 15 janvier de l'année précédente.

3.  **Test avec date avec année :**
    *   Créer un message sur le forum avec une date incluant l'année (par exemple, "15/05/2024 à 10:00").
    *   Vérifier que la fonction `Utils.parseForumDate` extrait correctement la date sans modifier l'année spécifiée.

4.  **Test avec espaces insécables :**
    *   Créer un message sur le forum avec une date contenant des espaces insécables (par exemple, "15&nbsp;mai à&nbsp;10:00").
    *   Vérifier que la fonction gère correctement ces espaces et extrait la date sans erreur ("Invalid date").

5.  **Vérifier l'utilisation dans `chargerCommande` :**
    *   S'assurer que la fonction `Utils.parseForumDate` est bien appelée dans `js/page/Forum.js` (`chargerCommande`) pour parser la date du premier message des sujets de commande.
    *   Vérifier que les dates affichées pour les commandes sur la page Commerce sont correctes, en tenant compte de la logique d'extraction des dates du forum.

## Avancement
La fonction `Utils.parseForumDate` a été implémentée dans `js/class/Utils.js`. Elle gère correctement l'ajout de l'année courante si elle est absente dans la chaîne de date du forum en se basant sur la dernière occurrence passée. Une correction a été apportée pour gérer les espaces insécables dans la chaîne de date, résolvant le problème d'affichage "Invalid date". Cette fonction est utilisée dans `js/page/Forum.js` (`chargerCommande`) pour extraire la date de création des commandes. La fonctionnalité est terminée et fonctionnelle.
