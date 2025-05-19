# Affichage des convois en cours

## Objectif
Afficher la liste des convois de ressources en cours sur la page Commerce, dans un tableau dédié et stylisé de manière similaire au tableau des commandes, afin de fournir aux joueurs une visibilité immédiate sur les livraisons à venir.

## Fonctionnement Détaillé
La fonctionnalité doit :
- Récupérer les informations des convois depuis les messages postés dans les sujets de la section commande du forum.
- Identifier les messages qui correspondent à des envois de convois (format spécifique à déterminer/confirmer).
- Extraire de ces messages le pseudo de l'expéditeur, les quantités de nourriture et matériaux, et la durée du convoi.
- Calculer la date et l'heure d'arrivée estimée en ajoutant la durée du convoi à la date et l'heure du message.
- Filtrer les convois pour ne retenir que ceux dont la date d'arrivée est dans le futur ou dans la minute actuelle.
- Associer chaque convoi à l'objet Commande correspondant (via l'ID du sujet) pour récupérer le pseudo du destinataire (créateur du sujet).
- Afficher les convois retenus dans un tableau DataTables sur la page Commerce, sous le tableau des commandes.
- Le tableau doit comporter les colonnes suivantes : Expéditeur, Destinataire, Nourriture (avec icône pomme), Matériaux (avec icône bois), Date d'arrivée (précision à la minute).
- Le style du tableau doit être cohérent avec celui du tableau des commandes.
- Le tableau doit se mettre à jour si de nouveaux convois sont lancés ou si la page est actualisée.

## Plan d'Implémentation
1.  **Créer une nouvelle méthode asynchrone `chargerConvois` dans `js/page/Forum.js`**. Cette méthode prendra en paramètre la liste des commandes chargées (ou pourra y accéder via `this._utilitaire.commande`).
    *   À l'intérieur de `chargerConvois`, récupérer l'ID de la section commande (`monProfil.parametre["forumCommande"].valeur`).
    *   Utiliser `this._utilitaire.consulterSection(idSectionCommande)` pour obtenir la liste des sujets.
    *   Filtrer les sujets dont la dernière activité remonte à moins de 24h.
    *   Pour chaque sujet filtré, utiliser `this._utilitaire.consulterSujet(idSujet)` pour obtenir le contenu du sujet.
    *   Parcourir les messages (`.messageForum`) dans le contenu du sujet.
    *   Pour chaque message, vérifier s'il contient les informations d'un convoi (déterminer le pattern exact, potentiellement basé sur la méthode `toUtilitaire` de la classe `Convoi`).
    *   Si le message est un convoi :
        *   Extraire le pseudo de l'expéditeur (auteur du message).
        *   Extraire les quantités de nourriture et matériaux.
        *   Extraire la durée du convoi.
        *   Extraire la date et l'heure du message.
        *   Calculer la date d'arrivée en ajoutant la durée à la date du message (utiliser Moment.js et potentiellement `Utils.parseForumDate` si nécessaire pour la date du message).
        *   Vérifier si la date d'arrivée est dans le futur ou dans la minute actuelle (`moment(dateArrivee).diff(moment()) >= -60000`).
        *   Si le convoi est pertinent, récupérer le pseudo du destinataire à partir de l'objet `Commande` correspondant à l'ID du sujet (`this._utilitaire.commande[idSujet].demandeur.pseudo`).
        *   Créer un nouvel objet `Convoi` avec les informations extraites et l'ID du sujet de commande.
        *   Ajouter cet objet `Convoi` à une liste temporaire.
    *   Retourner la liste des objets `Convoi`.

2.  **Modifier la méthode `executer` dans `js/page/Commerce.js`**.
    *   Après l'appel à `this._utilitaire.chargerCommande(data).then(...)`, ajouter un appel à la nouvelle méthode `this._utilitaire.chargerConvois(this._utilitaire.commande)`.
    *   Utiliser `.then()` pour gérer la Promise retournée par `chargerConvois`.
    *   Passer la liste des convois retournée à une nouvelle méthode d'affichage (étape 3).
    *   Gérer les erreurs potentielles lors du chargement des convois.

3.  **Créer une nouvelle méthode `afficherConvois` dans `js/page/Commerce.js`**. Cette méthode prendra en paramètre la liste des objets `Convoi`.
    *   Créer la structure HTML pour un nouveau tableau DataTables (par exemple, avec l'ID `#o_tableListeConvoi`), incluant les en-têtes de colonne (Expéditeur, Destinataire, Nourriture ${IMG_POMME}, Matériaux ${IMG_MAT}, Date d'arrivée).
    *   Préparer un tableau de données (`tableDataConvois`) pour DataTables à partir de la liste des objets `Convoi`. Chaque élément du tableau sera un tableau représentant une ligne, avec les valeurs dans l'ordre des colonnes.
    *   Insérer la structure HTML du tableau dans le DOM, sous le tableau des commandes existant (trouver le sélecteur approprié, potentiellement après `#o_listeCommande`).
    *   Initialiser le tableau DataTables (`#o_tableListeConvoi`) avec les données préparées (`tableDataConvois`), en utilisant une configuration similaire à celle du tableau des commandes (classes CSS, options, langue, etc.).
    *   Configurer les `columnDefs` pour le tri et le formatage des colonnes (notamment pour la date d'arrivée).

4.  **Adapter la méthode `actualiserCommande` ou créer `actualiserConvois` dans `js/page/Commerce.js`** si nécessaire pour gérer la mise à jour du tableau des convois. Il pourrait être plus simple de créer une méthode `actualiserConvois` dédiée, appelée après l'actualisation des commandes.
    *   Créer une méthode `actualiserConvois` qui recharge les convois via `chargerConvois` et met à jour le tableau DataTables existant (`#o_tableListeConvoi`) en utilisant `DataTable().clear().rows.add(newData).draw()`.
    *   Appeler `actualiserConvois` depuis `executer` ou une autre fonction de mise à jour si nécessaire (par exemple, après l'envoi d'un nouveau convoi via `formulaireConvoi`). - **Terminé**.

## Tests à effectuer
Voici les tests à effectuer pour vérifier le bon fonctionnement de la fonctionnalité :

1.  **Vérifier l'affichage du tableau :**
    *   Aller sur la page Commerce.
    *   S'assurer qu'un nouveau tableau intitulé "Convois en cours" est affiché sous le tableau des commandes.
    *   Vérifier que le tableau contient les colonnes "Expéditeur", "Destinataire", "Nourriture", "Matériaux", et "Date d'arrivée".
    *   S'assurer que les icônes de nourriture et de matériaux sont correctement affichées dans les en-têtes de colonne.
    *   Vérifier que le style du tableau est similaire à celui du tableau des commandes.

2.  **Vérifier le chargement des convois existants :**
    *   S'assurer qu'il existe des messages de convoi récents (moins de 24h) dans les sujets de commande du forum.
    *   Actualiser la page Commerce.
    *   Vérifier que les convois correspondants sont listés dans le tableau "Convois en cours".
    *   Pour chaque convoi listé, vérifier que les informations (Expéditeur, Destinataire, quantités de ressources, Date d'arrivée) sont correctes et correspondent aux messages du forum.
    *   Vérifier que seuls les convois dont la date d'arrivée est dans le futur ou dans la minute actuelle sont affichés.

3.  **Vérifier la mise à jour après envoi d'un nouveau convoi :**
    *   Lancer un nouveau convoi via le formulaire (si cette partie est déjà implémentée).
    *   Vérifier que le nouveau convoi apparaît immédiatement dans le tableau "Convois en cours" sans avoir à actualiser la page manuellement.
    *   Vérifier que les informations du nouveau convoi sont correctes.

4.  **Vérifier la mise à jour après actualisation manuelle :**
    *   Actualiser la page Commerce manuellement (F5 ou bouton d'actualisation du navigateur).
    *   Vérifier que le tableau "Convois en cours" se met à jour correctement, en affichant les convois pertinents et en retirant ceux dont la date d'arrivée est passée.

5.  **Vérifier le comportement sans convois :**
    *   S'assurer qu'il n'y a aucun message de convoi récent dans les sujets de commande du forum.
    *   Actualiser la page Commerce.
    *   Vérifier que le tableau "Convois en cours" est vide ou affiche un message indiquant qu'aucun convoi n'est en cours.

6.  **Vérifier le tri et le formatage :**
    *   Si DataTables est configuré pour le tri, vérifier que le tri par colonne (notamment par Date d'arrivée) fonctionne correctement.
    *   Vérifier que le format de la date d'arrivée est correct (précision à la minute).

## Avancement
- Plan d'implémentation initial défini.
- Étape 1 : Création de la méthode `chargerConvois` dans `js/page/Forum.js` - **Terminé**.
- Étape 2 : Modification de la méthode `executer` dans `js/page/Commerce.js` pour appeler `chargerConvois` - **Terminé**.
- Étape 3 : Création de la méthode `afficherConvois` dans `js/page/Commerce.js` - **Terminé**.
- Étape 4 : Adapter la méthode `actualiserCommande` ou créer `actualiserConvois` dans `js/page/Commerce.js` - **Terminé**.
- Implémentation terminée et validée par les tests.
