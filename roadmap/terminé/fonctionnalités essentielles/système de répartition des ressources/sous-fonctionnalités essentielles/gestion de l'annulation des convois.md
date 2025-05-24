# Gestion de l'annulation des convois

## Objectifs
Répercuter l'annulation d'un convoi par un joueur sur les données de la commande sur le forum, sans que cela ne crée de dysfonctionnement avec les autres fonctionnalités utilisant ces données.

## Fonctionnement Détaillé
Lorsque le système détecte une annulation de convoi (c'est-à-dire qu'un convoi attendu n'est plus présent sur la page Commerce), il doit :
1.  Identifier le groupe de convois concerné (expéditeur, destinataire, quantités, date d'arrivée).
2.  Vérifier si un convoi négatif correspondant (annulation) a déjà été posté sur le forum pour ce groupe.
3.  Si un convoi négatif existe déjà pour ce groupe, ne pas poster de nouveau message d'annulation.
4.  Si aucun convoi négatif correspondant n'existe, poster un message de convoi négatif sur le forum pour enregistrer l'annulation.
5.  Mettre à jour la quantité livrée de la commande associée en mémoire (décrémenter la quantité livrée).
6.  Si la commande était "Terminée" et que la quantité livrée redevient inférieure à la quantité demandée suite à l'annulation, repasser son statut en "En cours".

## Plan d'Implémentation

1.  **Modification de `gererAnnulationsConvois` dans `js/page/Commerce.js`:**
    *   **Ajustement du groupement des convois du forum (`groupesForum`) :**
        *   La construction des clés pour `groupesForum` utilise désormais les valeurs *absolues* des quantités de nourriture et de matériaux (`absNourriture`, `absMateriaux`). Cela permet de regrouper les convois positifs et leurs annulations (convois négatifs) sous la même clé.
        *   Le `count_forum` pour chaque groupe est incrémenté si le convoi est positif, et décrémenté si le convoi est négatif. Ainsi, `count_forum` représente le solde net des convois pour cette clé spécifique sur le forum.
        *   Les propriétés `absNourriture`, `absMateriaux`, `destinataire`, `dateArrivee`, et `idCommande` sont stockées dans l'objet du groupe pour faciliter la création des messages d'annulation.
    *   **Comparaison des Groupes et Identification des Annulations :**
        *   La logique de comparaison `if (countForum > countPage)` reste la même. `countForum` étant le solde net, si ce solde est supérieur au nombre de convois actifs sur la page (`countPage`), cela signifie qu'il y a un excédent de convois "attendus" (positifs nets) qui ne sont pas sur la page, et donc des annulations doivent être enregistrées.
        *   Le `nombreAnnulations` est calculé comme `countForum - countPage`.
        *   Les quantités de nourriture et de matériaux pour l'annulation sont récupérées à partir des propriétés `absNourriture` et `absMateriaux` stockées dans l'objet `forumGroup`.
    *   **Traitement des Annulations :**
        *   Pour chaque annulation identifiée, un objet `Convoi` est créé avec les quantités négatives (en utilisant les quantités positives du convoi original, puis en les rendant négatives).
        *   Le message d'annulation est ensuite posté sur le forum via `this._utilitaire.envoyerMessage`.
    *   **Sauvegarde de l'état de la commande :**
        *   Après la décrémentation des quantités livrées et la mise à jour du statut de la commande en mémoire, l'état de la commande est sauvegardé sur le forum via `this._utilitaire.modifierSujet`.

## Tests à Effectuer
1.  **Scénario 1: Annulation simple d'un convoi.**
    *   Lancer un convoi.
    *   Annuler ce convoi depuis le jeu.
    *   Vérifier qu'un seul message de convoi négatif est posté sur le forum pour la commande correspondante.
    *   Vérifier que la quantité livrée de la commande est correctement décrémentée *et que ce changement est persistant après rechargement de la page*.
    *   Vérifier que si la commande était terminée, son statut repasse en "En cours" *et que ce changement est persistant après rechargement de la page*.
2.  **Scénario 2: Annulation multiple de convois identiques.**
    *   Lancer deux convois identiques (même destinataire, mêmes quantités, même date d'arrivée).
    *   Annuler un des deux convois depuis le jeu.
    *   Vérifier qu'un seul message de convoi négatif est posté sur le forum.
    *   Vérifier que la quantité livrée est décrémentée d'une seule fois la quantité du convoi.
    *   Annuler le deuxième convoi identique depuis le jeu.
    *   Vérifier qu'un deuxième message de convoi négatif est posté.
    *   Vérifier que la quantité livrée est décrémentée une deuxième fois.
3.  **Scénario 3: Convoi négatif déjà présent sur le forum.**
    *   Lancer un convoi.
    *   Manuellement, ajouter un message de convoi négatif correspondant sur le forum (simulant une annulation déjà enregistrée).
    *   Annuler le convoi depuis le jeu.
    *   Vérifier qu'aucun nouveau message de convoi négatif n'est posté, car l'annulation est déjà prise en compte par le solde net.
4.  **Scénario 4: Pas d'annulation.**
    *   Lancer des convois et ne rien annuler.
    *   Vérifier qu'aucun message d'annulation n'est posté et que les commandes sont correctement mises à jour.

## Avancement
- La logique de groupement des convois du forum dans `js/page/Commerce.js` a été modifiée pour prendre en compte les convois négatifs et calculer un solde net (`count_forum`).
- L'identification des annulations utilise désormais les quantités absolues stockées dans le groupe pour la création des messages d'annulation.
- La logique de traitement des annulations a été ajustée pour utiliser ces nouvelles propriétés.
- La sauvegarde de l'état de la commande sur le forum après décrémentation des quantités livrées et mise à jour du statut a été implémentée.
- **Correction du bug "Commande avec ID non trouvée pour traiter l'annulation" :** La fonction `chargerCommande` dans `js/page/Forum.js` a été modifiée pour inclure le chargement des commandes `Terminée`. Cela permet à la logique d'annulation dans `js/page/Commerce.js` de trouver et de traiter correctement les annulations pour les commandes qui étaient déjà terminées.
- **Implémentation et validation des tests :** La fonctionnalité est entièrement implémentée et les tests définis ont été validés avec succès.
