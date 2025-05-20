# Gestion de l'annulation des convois

## Objectifs
Répercuter l'annulation d'un convoi par un joueur sur les données de la commande sur le forum, sans que cela ne crée de dysfonctionnement avec les autres fonctionnalités utilisant ces données.

## Fonctionnement Détaillé (Révisé 3)
- Au moment du chargement de la page commerce, utiliser la fonction existante pour extraire les convois actuellement actifs du joueur.
- Utiliser la fonctionnalité d'extraction des données du forum pour récupérer *tous* les convois en cours du forum.
- Filtrer les convois du forum extraits pour ne conserver que ceux dont l'expéditeur est le joueur actuel.
- Grouper les convois du forum filtrés par destinataire, montant de ressources et date d’arrivée. Compter le nombre de convois dans chaque groupe (nombre attendu).
- Grouper de la même manière les convois actuellement actifs sur la page commerce du joueur par destinataire, montant de ressources et date d’arrivée. Compter le nombre de convois dans chaque groupe (nombre réel).
- Comparer les groupes correspondants (même expéditeur, destinataire, montant, date d'arrivée). Si le nombre attendu (forum) est supérieur au nombre réel (page), la différence correspond au nombre de convois annulés pour ce groupe spécifique.
- Pour chaque groupe où des annulations ont été identifiées :
    - Calculer la quantité totale annulée pour ce groupe (`nombre_annulations * montant_du_convoi`).
    - Mettre à jour les données de la commande correspondante (en mémoire) : soustraire la quantité totale annulée de la quantité déjà livrée pour cette commande.
    - Si la commande était terminée et que la quantité livrée est maintenant inférieure à la quantité commandée, la remettre en "en cours" (en mémoire).
    - Préparer un message unique de "livraison négative" pour ce groupe d'annulations, en utilisant le format attendu par la fonction de post sur le forum des convois classiques, mais avec la quantité totale annulée en négatif.

## Plan d'Implémentation (Révisé 3)
1.  **Extraction des données :**
    *   Appeler la fonction `getConvoisActifsJoueur()` (ou nom similaire) pour récupérer la liste des convois actuellement actifs sur la page commerce du joueur.
    *   Appeler la fonction d'extraction des données du forum pour récupérer *tous* les convois en cours du forum.
2.  **Filtrage et Groupement des Convois du Forum :**
    *   Filtrer la liste des convois du forum pour ne conserver que ceux dont l'expéditeur correspond à l'ID du joueur actuel.
    *   Créer une structure de données (ex: Map, objet) pour stocker les groupes de convois attendus du forum filtrés. La clé pourrait être une combinaison unique de `destinataire-montant-dateArrivée`. La valeur serait un objet contenant le nombre de convois dans ce groupe (`count_forum`) et une référence à la commande associée.
    *   Parcourir les convois du forum filtrés et peupler cette structure, en incrémentant le compteur pour chaque convoi ajouté à un groupe existant.
3.  **Groupement et Comptage des Convois Actifs :**
    *   Créer une structure de données similaire pour les convois actifs sur la page commerce du joueur. La clé serait une combinaison unique de `destinataire-montant-dateArrivée`. La valeur serait le nombre de convois dans ce groupe (`count_page`).
    *   Parcourir les convois actifs et peupler cette structure.
4.  **Comparaison des Groupes et Identification des Annulations :**
    *   Parcourir les groupes de convois attendus du forum.
    *   Pour chaque groupe (identifié par sa clé `destinataire-montant-dateArrivée`), rechercher le groupe correspondant dans les convois actifs de la page.
    *   Comparer le nombre de convois attendus (`count_forum`) avec le nombre de convois actifs (`count_page`, qui sera 0 si le groupe n'existe pas dans les convois actifs). Si `count_forum > count_page`, la différence (`count_forum - count_page`) représente le nombre de convois annulés pour ce groupe.
5.  **Traitement des Annulations :**
    *   Pour chaque groupe où des annulations ont été identifiées :
        *   Calculer la quantité totale annulée pour ce groupe (`nombre_annulations * montant_du_convoi`).
        *   Mettre à jour les données de la commande associée (en mémoire) : soustraire la quantité totale annulée de la quantité déjà livrée.
        *   Vérifier et mettre à jour le statut de la commande si nécessaire (passer de "terminée" à "en cours").
        *   Préparer un message de "livraison négative" pour ce groupe. Le contenu du message doit indiquer le destinataire, le montant *total* annulé (en négatif) et potentiellement la date d'arrivée initialement prévue.
6.  **Mise à jour sur le Forum :**
    *   Appeler la fonction existante `postConvoiSurForum()` (ou nom similaire), en lui passant les informations du message de "livraison négative" préparé à l'étape précédente (avec la quantité totale annulée en négatif) et l'ID du fil de discussion de la commande.
7.  **Mise à jour locale des données :**
    *   Les données des commandes mises à jour (quantité livrée, statut) sont conservées en mémoire pour la session actuelle. Elles seront rafraîchies lors de la prochaine extraction du forum.

## Tests à effectuer (Révisé 3)
1.  **Scénario d'annulations multiples identiques :**
    *   Créer une commande sur le forum.
    *   Lancer *deux* convois identiques (même destinataire, même montant, arrivant à la même minute) depuis la page commerce.
    *   Vérifier que les deux convois apparaissent dans les données du forum après extraction.
    *   Annuler *un seul* des deux convois depuis la page commerce.
    *   Recharger la page commerce et vérifier que *un seul* convoi est identifié comme annulé pour ce groupe lors de la comparaison.
    *   Vérifier que la quantité livrée de la commande est correctement mise à jour en mémoire (diminuée du montant d'un seul convoi).
    *   Vérifier qu'un *unique* message de livraison négative est posté sur le forum pour ce groupe, indiquant la quantité d'un seul convoi en négatif.
    *   Si la commande était terminée (par exemple, si c'était le seul convoi), vérifier qu'elle repasse en statut "en cours" en mémoire.
2.  **Scénario d'annulations multiples non identiques :**
    *   Créer une commande nécessitant plusieurs convois de montants ou dates d'arrivée différents.
    *   Lancer ces convois.
    *   Annuler un ou plusieurs de ces convois non identiques.
    *   Vérifier que chaque convoi annulé est traité individuellement (car ils forment des groupes d'une seule unité).
    *   Vérifier qu'un message de livraison négative est posté pour chaque convoi annulé.
3.  **Scénario mixte (identiques et non identiques) :**
    *   Créer une commande avec un mélange de convois identiques et non identiques.
    *   Annuler certains convois de chaque type.
    *   Vérifier que la logique gère correctement les deux cas : un message par groupe d'identiques annulés, et un message par non-identique annulé.
4.  **Scénario sans annulation :**
    *   Lancer des convois sans les annuler.
    *   Vérifier qu'aucun convoi n'est marqué comme annulé et qu'aucune action n'est entreprise.
5.  **Scénario avec convois arrivés :**
    *   Lancer un convoi et le laisser arriver.
    *   Vérifier que le convoi n'est pas traité comme annulé après son arrivée.
6.  **Scénario avec convois d'autres joueurs :**
    *   Vérifier que les convois envoyés par d'autres joueurs ne sont pas pris en compte dans le processus d'identification des annulations du joueur actuel (grâce au filtrage).

## Avancement
