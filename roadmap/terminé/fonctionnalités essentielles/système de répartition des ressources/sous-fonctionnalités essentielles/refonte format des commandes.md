# Refonte format des commandes

## Objectifs
Dissocier le montant d'une commande et la quantité déjà livrée pour permettre de nouvelles opérations.

## Fonctionnement Détaillé

## Plan d'Implémentation
1.  Modifier la classe `Commande` (`js/class/Commande.js`) pour stocker séparément les quantités totales demandées (`_totalNourritureDemandee`, `_totalMateriauxDemandes`) et les quantités déjà livrées (`_nourritureLivree`, `_materiauxLivres`).
2.  Ajuster les getters `nourriture` et `materiaux` dans la classe `Commande` pour qu'ils retournent la quantité restante (quantité totale demandée - quantité livrée).
3.  Adapter les méthodes existantes de la classe `Commande` (`parseUtilitaire`, `toUtilitaire`, `ajouteConvoi`, `estValide`, `ajouterEvent`) pour utiliser les nouvelles propriétés de stockage des quantités.
4.  Modifier la boîte de dialogue de modification des commandes (`js/boite/Commande.js`) pour permettre la modification uniquement des quantités totales demandées, et non des quantités restantes ou livrées directement.
5.  Modifier la méthode `estValide` dans `js/class/Commande.js` pour bloquer la création de commandes si la quantité totale de nourriture ET la quantité totale de matériaux demandés sont inférieures ou égales à zéro.

## Tests à effectuer
1.  **Vérifier la création de commande :**
    *   Créer une nouvelle commande via l'interface.
    *   Vérifier que les quantités totales demandées sont correctement enregistrées.
    *   Tenter de créer une commande avec des quantités totales de nourriture et de matériaux inférieures ou égales à zéro. Vérifier que la création est bloquée.

2.  **Vérifier la modification de commande :**
    *   Modifier une commande existante via l'interface.
    *   Vérifier que seule la quantité totale demandée peut être modifiée.
    *   Vérifier que la quantité livrée n'est pas affectée par la modification de la quantité totale demandée.

3.  **Vérifier l'affichage de la quantité restante :**
    *   Créer une commande.
    *   Simuler l'ajout d'un convoi à cette commande (si la fonctionnalité d'ajout de convoi est testable indépendamment).
    *   Vérifier que la quantité affichée dans le tableau des commandes correspond bien à la quantité restante (quantité totale demandée - quantité livrée).

4.  **Vérifier l'ajout de convoi :**
    *   Créer une commande.
    *   Ajouter un convoi à cette commande (si la fonctionnalité d'ajout de convoi est implémentée et testable).
    *   Vérifier que la quantité livrée dans l'objet `Commande` est correctement mise à jour.
    *   Vérifier que la quantité restante affichée dans le tableau est mise à jour en conséquence.

5.  **Vérifier la persistance des données :**
    *   Créer ou modifier une commande.
    *   Actualiser la page.
    *   Vérifier que les quantités totales demandées et livrées sont correctement rechargées depuis le forum et que la quantité restante affichée est correcte.

## Avancement
La classe `Commande` (`js/class/Commande.js`) a été refondue pour stocker les quantités totales demandées et livrées séparément. Les getters `nourriture` et `materiaux` calculent désormais la quantité restante. Les méthodes `parseUtilitaire`, `toUtilitaire`, `ajouteConvoi`, `estValide` et `ajouterEvent` ont été adaptées pour fonctionner avec ce nouveau modèle de données. La boîte de dialogue de modification (`js/boite/Commande.js`) a été ajustée pour permettre la modification uniquement des quantités totales demandées. La méthode `estValide` a été modifiée pour empêcher la création de commandes avec des quantités totales demandées nulles ou négatives. Un problème d'affichage de la quantité restante dans le tableau a été identifié comme étant lié à des données incorrectes enregistrées dans le forum pour une commande spécifique, et non à un bug dans la logique de refonte ou d'affichage. Le code de débogage temporaire dans `toHTML` a été retiré. La fonctionnalité est terminée et fonctionnelle.
