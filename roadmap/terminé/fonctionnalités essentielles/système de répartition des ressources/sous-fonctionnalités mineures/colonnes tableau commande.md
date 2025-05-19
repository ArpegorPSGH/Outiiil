# Colonnes tableau commande

## Objectifs
Rajouter des colonnes dans le tableau des commandes pour afficher plus d'informations sur les commandes en cours.

## Fonctionnement Détaillé
- Faire apparaître quantité demandée dans le tableau en plus de la restante
- Rajouter colonne date envoi commande (connue via date du post de la commande)
- Ajouter une colonne avec l’évolution demandée

## Plan d'Implémentation
1.  Modifier la configuration DataTables dans `js/page/Commerce.js` (`afficherCommande` et `actualiserCommande`).
2.  Ajouter une colonne pour afficher la quantité totale demandée de nourriture et de matériaux.
3.  Renommer les colonnes de quantité existantes pour plus de clarté ('Qté demandée', 'Qté à livrer').
4.  Centrer les colonnes de matériaux dans le tableau.
5.  Ajouter une colonne "Date commande" dans le tableau.
6.  Modifier la méthode `toHTML` dans `js/class/Commande.js` pour inclure la date de création formatée du sujet de commande dans les données de la ligne du tableau.
7.  Modifier la configuration DataTables pour inclure la colonne "Date commande", la masquer par défaut, et ajuster les indices des colonnes existantes.
8.  Ajouter une colonne "Évolution" dans le tableau.
9.  Modifier la méthode `toHTML` dans `js/class/Commande.js` pour inclure le nom de l'évolution demandée dans les données de la ligne du tableau, en utilisant l'index stocké et le tableau `EVOLUTION` de `js/content.js`.
10. Modifier la configuration DataTables pour inclure la colonne "Évolution", la masquer par défaut, et ajuster les indices des colonnes.
11. S'assurer que les méthodes `afficherCommande` et `actualiserCommande` construisent un tableau de données structurées incluant les informations nécessaires (quantité demandée, date, évolution) et initialisent/mettent à jour DataTables avec ces données.
12. Déplacer la gestion des événements des boutons de commande dans l'option `createdRow` de DataTables.
13. Renommer les colonnes "Echéance" en "Échéance" et "Status" en "Statut" dans le tableau des commandes.

## Tests à effectuer
1.  **Vérifier l'affichage des nouvelles colonnes :**
    *   Aller sur la page Commerce.
    *   Vérifier que les colonnes "Qté demandée", "Qté à livrer", "Date commande" et "Évolution" sont présentes dans le tableau des commandes.
    *   Vérifier que les colonnes de matériaux sont centrées.

2.  **Vérifier les données affichées dans les nouvelles colonnes :**
    *   Pour chaque commande, vérifier que la "Qté demandée" correspond à la quantité totale spécifiée lors de la création de la commande.
    *   Vérifier que la "Qté à livrer" correspond à la quantité restante (quantité demandée - quantité livrée).
    *   Vérifier que la "Date commande" affiche la date de création du sujet du forum correspondant à la commande, formatée correctement.
    *   Vérifier que la colonne "Évolution" affiche le nom correct de l'évolution demandée pour chaque commande.

3.  **Vérifier le masquage par défaut des colonnes :**
    *   Vérifier que les colonnes "Date commande" et "Évolution" sont masquées par défaut lors du premier chargement de la page.
    *   Vérifier que l'option de visibilité des colonnes de DataTables permet d'afficher/masquer ces colonnes correctement.

4.  **Vérifier la mise à jour des colonnes :**
    *   Modifier une commande (si la fonctionnalité de modification est implémentée et testable).
    *   Vérifier que les colonnes "Qté demandée" et "Qté à livrer" sont mises à jour en conséquence dans le tableau.
    *   Ajouter un convoi à une commande (si la fonctionnalité d'ajout de convoi est implémentée et testable).
    *   Vérifier que la colonne "Qté à livrer" est mise à jour en conséquence.

5.  **Vérifier la gestion des événements des boutons :**
    *   Vérifier que les boutons d'action sur les commandes (modifier, supprimer, etc.) fonctionnent toujours correctement après le déplacement de la gestion des événements dans `createdRow`.

6.  **Vérifier le renommage des colonnes :**
    *   Vérifier que les colonnes "Echéance" et "Status" sont bien renommées en "Échéance" et "Statut".

## Avancement
Une colonne pour la quantité totale demandée a été ajoutée dans le tableau des commandes sur la page Commerce. Les colonnes de quantité ont été renommées en 'Qté demandée' et 'Qté à livrer' pour une meilleure clarté. Les colonnes de matériaux ont été centrées. Une colonne "Date commande" a été ajoutée, affichant la date de création du sujet du forum (extraite via `Utils.parseForumDate`). Une colonne "Évolution" a été ajoutée, affichant le nom de l'évolution demandée. Les méthodes `afficherCommande` et `actualiserCommande` dans `js/page/Commerce.js` ont été modifiées pour construire un tableau de données structurées et initialiser/mettre à jour DataTables avec ces données, incluant les nouvelles colonnes. La gestion des événements des boutons de commande a été déplacée dans l'option `createdRow` de DataTables. Les colonnes "Echéance" et "Status" ont été renommées en "Échéance" et "Statut". La fonctionnalité est terminée et fonctionnelle.
