# Corrections

## Objectifs
Corriger l'orthographe de divers affichages.

## Fonctionnement Détaillé
1. Saisissez les identifiants des sujets de votre utilitaire -> Saisissez les identifiants des sections de votre utilitaire
2. Corriger orthographe Commandes + Membres
3. la mise à jour c’est correctement effectuée -> La mise à jour s’est correctement effectuée.
4. Renommer boutons « copy » en « copier »
5. Prioritè du rang -> Priorité du rang

## Plan d'Implémentation
1.  Identifier et modifier la chaîne de texte "Saisissez les identifiants des sujets de votre utilitaire" pour la remplacer par "Saisissez les identifiants des sections de votre utilitaire" dans les fichiers concernés (probablement `js/boite/Parametres.js`).
2.  Identifier et corriger l'orthographe des termes "Commandes" et "Membres" si nécessaire dans les affichages de l'extension (titres, libellés, noms de colonnes). Cela inclut le renommage des colonnes "Echéance" en "Échéance" et "Status" en "Statut" dans le tableau des commandes (`js/page/Commerce.js`), et le renommage de la colonne "Etat" en "État" dans le tableau des membres de l'alliance (`js/page/Alliance.js`).
3.  Identifier et modifier la chaîne de texte "la mise à jour c’est correctement effectuée" pour la remplacer par "La mise à jour s’est correctement effectuée." dans les messages de notification (probablement `js/page/Forum.js`).
4.  Identifier les boutons avec le texte "copy" et modifier leur texte pour "copier".
5.  Identifier et modifier la chaîne de texte "Prioritè du rang" pour la remplacer par "Priorité du rang" dans le fichier concerné (probablement `js/boite/Rang.js`).

## Tests à effectuer
1. Vérifier que le texte "Saisissez les identifiants des sujets de votre utilitaire" est remplacé par "Saisissez les identifiants des sections de votre utilitaire" dans les paramètres de l'utilitaire.
2. Vérifier que l'orthographe des termes "Commandes" et "Membres" est correcte dans l'interface. S'assurer notamment que les en-têtes de colonnes dans le tableau des commandes sur la page Commerce sont "Échéance" et "Statut", et que l'en-tête de colonne "Etat" sur la page Alliance est "État".
3. Vérifier que le message de notification "la mise à jour c’est correctement effectuée" est remplacé par "La mise à jour s’est correctement effectuée." lors d'une mise à jour réussie.
4. Vérifier que les boutons avec le texte "copy" sont maintenant libellés "copier".
5. Vérifier que le texte "Prioritè du rang" est remplacé par "Priorité du rang".

## Avancement
Les points 1 et 2 du plan d'implémentation sont terminés et fonctionnels.
- Le texte "Saisissez les identifiants des sujets de votre utilitaire" a été remplacé par "Saisissez les identifiants des sections de votre utilitaire".
- L'orthographe des termes liés aux commandes et aux membres a été corrigée, notamment le renommage des colonnes "Echéance" en "Échéance", "Status" en "Statut" (page Commerce) et "Etat" en "État" (page Alliance).

Les points 3, 4 et 5 restent à faire.
