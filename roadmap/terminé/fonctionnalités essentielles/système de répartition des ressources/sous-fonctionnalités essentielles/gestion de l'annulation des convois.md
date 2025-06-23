# Gestion de l'annulation des convois

## Objectifs
Répercuter l'annulation d'un convoi par un joueur sur les données de la commande sur le forum, sans que cela ne crée de dysfonctionnement avec les autres fonctionnalités utilisant ces données.

## Fonctionnement Détaillé
Lorsqu'un joueur clique sur "Lancer le convoi" :
1.  Le clic est bloqué, les données du convoi sont enregistrées dans le localStorage sans que le convoi ne soit posté sur le forum, et la page est rechargée.
2.  Au rechargement de la page, si des données de convoi sont enregistrées dans le localStorage, les ids d'annulation des convois de la page sont récupérés et enregistrés dans le localStorage, et le clic est forwardé. 
3. Au rechargement de la page, si des ids d'annulation et des données de convoi sont enregistrés, les ids d'annulation des convois de la page actuelle sont récupérés.
4. L'id d'annulation présent après rechargement mais pas avant l'envoi ainsi que les données du convoi sont utilisées pour créer un objet convoi et le poster sur le forum.
5. Les ids d'annulation et données du convoi sont effacées quoi qu'il arrive.

Lorsque le joueur clique sur le lien d'annulation d'un convoi sur la page Commerce, le système doit :
1.  Empêcher le comportement par défaut du lien (navigation).
2.  Extraire l'ID d'annulation du convoi annulé à partir de l'URL du lien ou des éléments DOM environnants et l'enregistrer dans le localStorage, puis recharger la page (sans le paramètre d'annulation dans l'URL).
3.  Au rechargement de la page, si un id d'annulation est enregistré dans le localStorage, récupérer les ids d'annulation des convois de la page, et si l'id d'annulation enregistré est présent, forwarder le clic d'annulation et poursuivre le traitement, sinon s'arrêter là.
4. Dans tous les cas, effacer l'id d'annulation.
5.  Charger les convois en cours. Trouver parmi le convoi annulé à l'aide de l'id d'annulation.
6.  Créer un objet `Convoi` avec des quantités négatives correspondant au convoi annulé.
7.  Utiliser `this._utilitaire.envoyerMessage` pour poster le convoi négatif sur le forum, pour la commande associée au convoi annulé, enregistrant ainsi l'annulation.
8.  Mettre à jour la quantité livrée de la commande associée en mémoire (décrémenter la quantité livrée).
9.  Si la commande était "Terminée" et que la quantité livrée redevient inférieure à la quantité demandée suite à l'annulation, repasser son statut en "En cours".
10.  Sauvegarder l'état mis à jour de la commande sur le forum via `this._utilitaire.modifierSujet`.

## Plan d'Implémentation

1.  **Gestion du lancement de convoi (première étape : interception et rechargement) :**
    *   **Tâche 1.1 :** Dans la méthode `formulaireConvoi()` de `js/page/Commerce.js`, localiser le gestionnaire d'événements `click` du bouton d'envoi du convoi (`$("input[name='convoi']").click(...)`).
    *   **Tâche 1.2 :** Au début de ce gestionnaire, ajouter `e.preventDefault();` pour empêcher la soumission immédiate du formulaire par le jeu.
    *   **Tâche 1.3 :** Extraire toutes les données nécessaires à la création d'un objet `Convoi` (expéditeur, destinataire, nourriture, matériaux, ID commande, date d'arrivée calculée).
    *   **Tâche 1.4 :** Stocker ces données du convoi dans `localStorage` sous la clé `outiiil_convoi_a_poster`.
    *   **Tâche 1.5 :** Recharger la page `commerce.php` (ex: `window.location.href = "commerce.php";`).

2.  **Traitement du convoi après le premier rechargement (suite au lancement) :**
    *   **Tâche 2.1 :** Dans la méthode `_traiterConvoiApresEnvoiJeu()` de `js/page/Commerce.js` (appelée au rechargement de la page), vérifier la présence de `outiiil_convoi_a_poster` dans `localStorage`.
    *   **Tâche 2.2 :** Si ces données sont présentes :
        *   Récupérer les données du convoi depuis `outiiil_convoi_a_poster`.
        *   **Tâche 2.2.1 :** Compléter les champs du formulaire de convoi (`#pseudo_convoi`, `#nbNourriture`, `#nbMateriaux`, `#o_idCommande`) avec les données récupérées.
        *   Récupérer les IDs d'annulation des convois *actuellement affichés* sur la page (`this.getConvoiAnnulationIds()`).
        *   Stocker ces IDs dans `localStorage` sous la clé `outiiil_ids_annulation_apres_rechargement_initial`.
        *   **Tâche 2.2.2 :** Simuler un clic sur le bouton "Lancer le convoi" du formulaire pour que le jeu traite l'envoi du convoi. Cela entraînera un *second* rechargement de la page.
        *   Ne pas effacer les clés `outiiil_convoi_a_poster`, `outiiil_ids_annulation_apres_rechargement_initial` du `localStorage` à ce stade.

3.  **Finalisation du traitement du convoi après le second rechargement (suite au forward du clic) :**
    *   **Tâche 3.1 :** Dans la méthode `_traiterConvoiApresEnvoiJeu()` (lors du second rechargement), vérifier la présence de `outiiil_convoi_a_poster` et `outiiil_ids_annulation_apres_rechargement_initial` dans `localStorage`.
    *   **Tâche 3.2 :** Si les deux sont présents :
        *   Récupérer les IDs d'annulation des convois *après ce second rechargement* (`this.getConvoiAnnulationIds()`).
        *   Comparer avec `outiiil_ids_annulation_apres_rechargement_initial` pour identifier le nouvel ID d'annulation généré par le jeu pour le convoi qui vient d'être lancé.
        *   Créer un objet `Convoi` en utilisant les données stockées dans `outiiil_convoi_a_poster` et le nouvel ID d'annulation.
        *   Appeler `this._utilitaire.envoyerMessage` pour poster ce convoi sur le forum, en l'associant à la commande.
        *   Mettre à jour la quantité livrée de l'objet `Commande` en mémoire (incrémenter la quantité livrée).
        *   Si la commande était "En cours" et que la quantité livrée atteint la quantité demandée, repasser son statut en "Terminée".
        *   Appeler `this._utilitaire.modifierSujet` pour sauvegarder l'état mis à jour de la commande sur le forum.
    *   **Tâche 3.3 :** Dans tous les cas (que le traitement ait réussi ou non), effacer `outiiil_convoi_a_poster`, et `outiiil_ids_annulation_apres_rechargement_initial` du `localStorage`.

4.  **Mise en place de l'interception du clic d'annulation :**
    *   **Tâche 4.1 :** Dans la méthode `_attacherListenersAnnulationConvoi()` de `js/page/Commerce.js`, s'assurer que le gestionnaire d'événements `click` attaché à chaque lien d'annulation (`a[href*='commerce.php?annuler=']`) :
        *   **Ajouter une condition :** Si `localStorage.getItem('outiiil_convoi_annulation_pending_id')` existe déjà, la fonction doit `return;` immédiatement pour éviter une boucle infinie.
        *   Appelle `e.preventDefault()` pour empêcher la navigation par défaut.
        *   Extrait l'ID d'annulation du convoi annulé à partir de l'URL du lien.
        *   Stocke cet ID d'annulation dans `localStorage` sous la clé `outiiil_convoi_annulation_pending_id`.
        *   Redirige la page vers `commerce.php` (ex: `window.location.href = "commerce.php";`) pour forcer un rechargement de la page.

5.  **Traitement de l'annulation après le premier rechargement :**
    *   **Tâche 5.1 :** Dans la méthode `_traiterAnnulationConvoiApresRechargement()` de `js/page/Commerce.js` (appelée au rechargement de la page), vérifier la présence de `outiiil_convoi_annulation_pending_id` dans `localStorage`.
    *   **Tâche 5.2 :** Si `outiiil_convoi_annulation_pending_id` est présent :
        *   Récupérer l'ID d'annulation stocké.
        *   Récupérer les IDs d'annulation de tous les convois *actuellement affichés* sur la page (`this.getConvoiAnnulationIds()`).
        *   **Tâche 5.2.1 :** Si l'ID d'annulation stocké est *toujours* présent dans la liste des IDs actuels (`idsActuelsPage.includes(idAnnulationPending)`), cela signifie que le jeu n'a pas encore traité l'annulation. Dans ce cas :
            *   Stocker `idAnnulationPending` dans `localStorage` sous la clé `outiiil_convoi_annulation_forwarded_id`.
            *   Trouver le lien d'annulation correspondant sur la page (`$("a[href*='commerce.php?annuler=" + idAnnulationPending + "']")`).
            *   Simuler un clic sur cet élément (ex: `$(selector).get(0).click();`) pour "forwarder" l'action au jeu. Cela entraînera un *second* rechargement.
            *   Ne pas effacer `outiiil_convoi_annulation_pending_id` du `localStorage` à ce stade.
        *   **Tâche 5.2.2 :** Si l'ID d'annulation stocké n'est *pas* présent dans la liste des IDs actuels (`!idsActuelsPage.includes(idAnnulationPending)`), cela signifie que le convoi a été annulé côté jeu. Dans ce cas, vérifier si c'est le second rechargement après un forward.
            *   **Tâche 5.2.2.1 :** Vérifier la présence de `outiiil_convoi_annulation_forwarded_id` dans `localStorage`.
            *   **Tâche 5.2.2.2 :** Si `outiiil_convoi_annulation_forwarded_id` est présent (c'est le second rechargement après un forward) :
                *   Charger tous les convois en cours depuis le forum (`this._utilitaire.chargerConvois`).
                *   Rechercher le convoi annulé parmi les convois chargés en utilisant son `idAnnulation` (qui est `idAnnulationPending`).
                *   Créer un nouvel objet `Convoi` avec les mêmes caractéristiques mais des quantités négatives pour les ressources.
                *   Appeler `this._utilitaire.envoyerMessage` pour poster ce convoi négatif sur le forum, pour la commande associée.
                *   Mettre à jour la quantité livrée de la commande associée en mémoire (décrémenter la quantité livrée).
                *   S'assurer que les quantités livrées ne deviennent pas négatives.
                *   Si la commande était "Terminée" et que la quantité livrée redevient inférieure à la quantité demandée, repasser son statut en "En cours".
                *   Appeler `this._utilitaire.modifierSujet` pour sauvegarder l'état mis à jour de la commande sur le forum.
            *   **Tâche 5.2.2.3 :** Si `outiiil_convoi_annulation_forwarded_id` n'est *pas* présent (le convoi a été annulé par le jeu sans notre intervention ou l'ID n'a jamais été valide), s'arrêter là.
    *   **Tâche 5.3 :** Dans tous les cas (que le traitement ait réussi, qu'il ait été forwardé, ou qu'il n'y ait pas eu de convoi à traiter), effacer `outiiil_convoi_annulation_pending_id` et `outiiil_convoi_annulation_forwarded_id` du `localStorage`.

## Tests à Effectuer
1.  **Scénario 1: Annulation simple d'un convoi.**
    *   Lancer un convoi.
    *   Cliquer sur le lien "Annuler" de ce convoi.
    *   Vérifier qu'un seul message de convoi négatif est posté sur le forum pour la commande correspondante.
    *   Vérifier que la quantité livrée de la commande est correctement décrémentée *et que ce changement est persistant après rechargement de la page*.
    *   Vérifier que si la commande était terminée, son statut repasse en "En cours" *et que ce changement est persistant après rechargement de la page*.
2.  **Scénario 2: Annulation multiple de convois identiques.**
    *   Lancer deux convois identiques (même destinataire, mêmes quantités, même date d'arrivée).
    *   Cliquer sur le lien "Annuler" du premier convoi.
    *   Vérifier qu'un message de convoi négatif est posté et que la quantité livrée est décrémentée.
    *   Cliquer sur le lien "Annuler" du deuxième convoi.
    *   Vérifier qu'un deuxième message de convoi négatif est posté et que la quantité livrée est décrémentée une deuxième fois.
3.  **Scénario 3: Annulation multiple de convois identiques sur plusieurs commandes.**
    *   Lancer deux convois identiques sur deux commandes du même joueur.
    *   Annuler l'un des deux.
    *   Vérifier qu'un convoi négatif est posté sur la commande correspondante.
    *   Annuler l'autre convoi.
    *   Vérifier qu'un convoi négatif est posté sur la deuxième commande.
4.  **Scénario 4: Annulation de convois identiques dans le système et hors système.**
    *   Lancer deux convois identiques, l'un hors système, l'autre dedans.
    *   Annuler celui dans le système.
    *   Vérifier qu'un convoi négatif est posté pour la commande appropriée.
    *   Annuler celui hors système.
    *   Vérifier qu'aucun convoi négatif n'est posté.
5.  **Scénario 5: Annulation d'un convoi d'une commande supprimée ou annulée.**
    *   Lancer un convoi.
    *   Passer la commande correspondante en supprimée ou annulée
    *   Cliquer sur le lien "Annuler" de ce convoi.
    *   Vérifier qu'un seul message de convoi négatif est posté sur le forum pour la commande correspondante.
6.  **Scénario 6: Annulation d'un convoi en cours dont le lien d'annulation n'est plus effectif.**
    *   Lancer un convoi.
    *   Attendre sans rafraîchir qu'il ne soit plus annulable.
    *   Cliquer sur le lien "Annuler" de ce convoi.
    *   Vérifier qu'aucun convoi négatif n'est posté.
7.  **Scénario 7: Lancement de convois via plusieurs instances parallèles de la page.**
    *   Ouvrir deux instances de la page.
    *   Lancer un convoi sur l'une des instances.
    *   Vérifier qu'un seul message de convoi est posté sur le forum pour la commande correspondante.
    *   Sans rafraîchir, lancer un convoi différent sur l'autre instance.
    *   Vérifier dans les logs qu'il n'y a bien qu'un seul nouveau convoi détecté.
    *   Vérifier qu'un seul message de convoi est posté sur le forum pour la commande correspondante et avec le bon identifiant.
8.  **Scénario 8: Annulation de convois via plusieurs instances parallèles de la page.**
    *   Ouvrir deux instances de la page avec un convoi lancé.
    *   Annuler le convoi sur l'une des instances.
    *   Vérifier qu'un seul message de convoi négatif est posté sur le forum pour la commande correspondante.
    *   Sans rafraîchir, annuler le convoi sur l'autre instance.
    *   Vérifier qu'aucun convoi négatif n'est posté.

## Avancement
- La stratégie de détection des annulations a été modifiée pour se baser sur le clic direct sur le lien d'annulation.
- Le plan d'implémentation a été mis à jour pour refléter cette nouvelle approche.
- La méthode `gererAnnulationsConvois` a été supprimée de `js/page/Commerce.js`.
- La méthode `getConvoiAnnulationIds()` a été ajoutée à `js/page/Commerce.js` pour récupérer les IDs d'annulation de tous les convois affichés sur la page.
- La capture des IDs d'annulation avant et après l'envoi du convoi a été implémentée dans `js/page/Commerce.js`, et le nouvel ID est assigné à l'objet `Convoi`.
- La propriété `_idAnnulation` et ses accesseurs ont été ajoutés à la classe `Convoi` dans `js/class/Convoi.js`.
- La méthode `toUtilitaire()` de la classe `Convoi` a été modifiée pour inclure l'ID d'annulation dans le message du forum.
- La méthode statique `fromUtilitaireString` a été ajoutée à la classe `Convoi` pour parser les messages du forum et créer des objets `Convoi`, incluant l'ID d'annulation et le nombre d'ouvrières.
- La méthode `chargerConvois()` dans `js/page/Forum.js` a été modifiée pour utiliser `Convoi.fromUtilitaireString` pour extraire les informations des convois, y compris l'ID d'annulation, lors de la lecture des messages du forum.
- **Modification de la logique de récupération des commandes :** La méthode `chargerCommande` dans `js/page/Forum.js` a été modifiée pour charger toutes les commandes depuis le forum, y compris celles qui sont "Supprimée" ou "Annulée". La méthode `actualiserCommande` dans `js/page/Commerce.js` utilise la méthode `estAFaire()` de la classe `Commande` pour filtrer les commandes à afficher dans le tableau, garantissant que les commandes annulées et supprimées ne sont pas affichées.
- La logique de lancement des convois a été implémentée et corrigée pour assurer la création correcte des convois dans le jeu et leur enregistrement sur le forum, tout en évitant les boucles de rechargement.
- La logique de traitement de l'annulation des convois après rechargement a été implémentée et corrigée pour suivre le plan d'implémentation (tâches 5.1 à 5.3).
- Ajout d'une condition dans `_attacherListenersAnnulationConvoi()` pour éviter une boucle infinie si `outiiil_convoi_annulation_pending_id` existe déjà.
- Ajout d'un log `console.error` dans `_traiterAnnulationConvoiApresRechargement` pour afficher les IDs d'annulation des convois chargés depuis le forum.
- Les ouvrières du convoi annulé sont maintenant incluses dans le convoi négatif posté sur le forum.
- Tests 1 à 8 validés.
