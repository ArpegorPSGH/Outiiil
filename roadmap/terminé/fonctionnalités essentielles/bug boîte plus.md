# Bug boîte plus

## Objectifs
Corriger divers bugs liés à la boîte plus.

## Fonctionnement Détaillé
- Les pontes ne sont plus enregistrées/annulées
- La date de fin prévue de la ponte n'est plus affichée
- Les constructions ne sont plus enregistrées/annulées
- Les recherches ne sont plus enregistrées/annulées
- Les chasses ne sont plus enregistrées/annulées
- Les attaques ne sont plus enregistrées/annulées
- Les convois annulés restent affichés
- Les listes de pontes/chasses/attaques/convois doivent être enregistrées dès qu'elles changent, même si leur longueur reste identique

## Plan d'Implémentation
1.  **Correction de l'affichage de la date de fin de ponte dans `Reine.js`**:
    *   Ajout d'une vérification de nullité pour le résultat de `Utils.roundMinute` avant d'appeler `.format()`.
    *   Ajout de logs de débogage pour la chaîne de date extraite et le résultat de `Utils.roundMinute`.
2.  **Tester la correction de l'affichage de la date de fin de ponte.**
3.  **Examiner pourquoi les pontes ne sont plus enregistrées/annulées.**
4.  **Examiner pourquoi les constructions ne sont plus enregistrées.**
5.  **Vérifier le comportement pour les recherches, chasses et attaques.**
6.  **Examiner pourquoi les convois annulés restent affichés.**

## Tests à effectuer
- Vérifier que la date de fin de ponte s'affiche correctement sur la page Reine.
- Vérifier qu'aucune erreur `Cannot read properties of null (reading 'format')` n'apparaît dans la console.
- Lancer une ponte/chasse/attaque/convoi avec l'extension activée, la désactiver, annuler ce qui a été lancé, en relancer une différente, réactiver l'extension, vérifier que la mise à jour est effectuée.

## Avancement
- Pontes fonctionnelles
- Constructions fonctionnelles
- Recherches fonctionnelles
- Chasses fonctionnelles
- Attaques fonctionnelles
- Convois fonctionnels
- Listes de pontes/chasses/attaques/convois enregistrées dès qu'elles changent
- Correction initiale de l'affichage de la date de fin de ponte dans `Reine.js` avec ajout de logs.

