# GUI gestion des droits

## Objectifs
Ajouter une fonctionalité de gestion des droits dans une boîte du dock.

## Fonctionnement Détaillé
- Boite invisible hors administration
- Ne plus créer un paramètre droit à la volée mais utiliser celui existant
- Lorsque seule une liste de valeurs est possible pour un paramètre, trouver un moyen de l'y attacher
- Attacher au paramètre s'il est modifiable ou non
- Créer une fonction générique qui déterminera si le paramètre est à modifier ou non et si oui le type d'affichage à mettre :
    - String : champ texte
    - Num : champ numérique avec incrémentateur entier
    - Boolean : tickbox
    - Liste de valeurs : dropdown
- Créer une fonction objet qui retournera directement la ligne de tableau modifiable?
- Une ligne par Joueur et une colonne par paramètre
- Le paramètre pseudo n'est pas modifiable
- Les paramètres de droits par fonctionnalité sont modifiables avec une liste dropdown des droits existants
- Modifier la gestion des versions pour que si une mise à jour du gestionnaire de droits est nécessaire et qu'elle échoue, si elle vient de cette fonctionnalité, le gestionnaire de versions la bloque (return false), comme pour les objets classiques. Cependant, si elle ne vient pas de cette fonctionnalité, l'échec de la mise à jour ne doit pas être bloquant (return true).
- Déplacer les fonctions de création et mise à jour des sujets de rafraîchir vers cette fonctionnalité (à effectuer systématiquement)

## Plan d'Implémentation

## Tests à effectuer

## Avancement