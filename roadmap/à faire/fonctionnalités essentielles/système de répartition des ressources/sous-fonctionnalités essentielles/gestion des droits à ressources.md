# Gestion des droits à ressources

## Objectifs
Calculer et mettre à jour en continu les droits à ressources attribués à chaque joueur, et utiliser ces droits pour définir l'ordre de priorité des commandes.

## Fonctionnement Détaillé
- Implémentation sur la page membres de nouvelles colonnes :
    - Coût du prochain TdP (masqué par défaut) : le minimum entre le coût du prochain niveau de Couveuse, du prochain niveau de Solarium et du prochain niveau de Laboratoire (accessibles via les données de recensement)
    - Temps de base du prochain TdP (masqué par défaut) : Temps de construction/recherche du prochain TdP sans prendre en compte la réduction de 10% (géométriquement) par niveau d'architecture
    - Ratio coût/temps de base (masqué par défaut) : Coût du prochain TdP divisé par le temps de base du prochain TdP
    - Part du joueur de base (masqué par défaut) : Ratio coût/temps de base du joueur divisé par la somme des ratios coût/temps de base de tous les joueurs de l'alliance
    - Coefficient (en pourcentage, visible par défaut) : Enregistré dans le titre du sujet du joueur dans la section outiiil_membre (initialisé à 0 lors de la création du sujet)
    - Liberté d'ajustement (visible par défaut) : Champ à choix unique : "Exact" ou "à la hausse" ou "à la baisse". Enregistré dans le titre du sujet du joueur dans la section outiiil_membre (initialisé à "Exact" lors de la création du sujet)
    - Part du joueur avec coefficient (masqué par défaut) : Part du joueur de base multiplié par Coefficient
    - Part du joueur avec coefficient ajustée (masqué par défaut) : Si la différence entre 1 et la somme des parts des joueurs avec coefficient est strictement positive, la répartir sur le joueur au pro-rata de sa part de base si sa liberté d'ajustement est "à la hausse". Si la différence entre 1 et la somme des parts des joueurs avec coefficient est strictement négative, la répartir sur le joueur 1 au pro-rata de sa part de base si sa liberté d'ajustement est "à la baisse".
    - TdC à la dernière mise à jour (masqué par défaut) : Enregistré dans le titre du sujet du joueur dans la section outiiil_membre (initialisé au TdC actuel du joueur 1 lors de la création du sujet)
    - Date de la dernière mise à jour (précision à la minute et masqué par défaut) : Enregistré dans le titre du sujet du joueur dans la section outiiil_membre (initialisé à la date actuelle lors de la création du sujet)
    - Production de l'alliance depuis la dernière mise à jour (masqué par défaut) : Somme d’une suite géométrique à partir du second terme, dont le premier terme est la somme des TdC à la dernière mise à jour de tous les joueurs, le dernier terme le TdC actuel de l'alliance (somme des TdC des membres de l'alliance), et le nombre de termes le nombre d’intervalles d’une demi-heure entre maintenant et la Date de la dernière mise à jour, augmenté de 1
    - Droit du joueur depuis la dernière mise à jour (masqué par défaut) : Part du joueur avec coefficient ajustée multipliée par Production de l'alliance depuis la dernière mise à jour
    - Production du joueur depuis la dernière mise à jour (masqué par défaut) : Somme d’une suite géométrique à partir du second terme, dont le premier terme est le TdC à la dernière mise à jour du joueur, le dernier terme le TdC actuel du joueur et le nombre de termes le nombre d’intervalles d’une demi-heure entre maintenant et la Date de la dernière mise à jour, augmenté de 1
    - Quantité envoyée depuis la dernière mise à jour (masqué par défaut et peut être négatif) : Dans la section outiiil_commande, regarder tous les sujets dont la date de dernier message est entre le début de la minute de la Date de la dernière mise à jour (compris) et le début de la minute actuelle (non-compris), et dans ces sujets récupérer et additionner les quantités de matériaux livrées mentionnées dans les posts effectués par le joueur entre le début de la minute de la Date de la dernière mise à jour (compris) et le début de la minute actuelle (non-compris)
    - Quantité reçue depuis la dernière mise à jour (masqué par défaut et peut être négatif) : Dans la section outiiil_commande, regarder tous les sujets dont la date de dernier message est entre le début de la minute de la Date de la dernière mise à jour (compris) et le début de la minute actuelle (non-compris) et le créateur est le joueur, et dans ces sujets récupérer et additionner les quantités de matériaux livrées mentionnées dans les posts de tous les joueurs entre le début de la minute de la Date de la dernière mise à jour (compris) et le début de la minute actuelle (non-compris)
    - Droits accumulés du joueur (visible par défaut) : Valeur lors de la précédente mise à jour + Droit du joueur depuis la dernière mise à jour + Quantité envoyée depuis la dernière mise à jour - Production du joueur depuis la dernière mise à jour - Quantité reçue depuis la dernière mise à jour (enregistré dans le titre du sujet du joueur dans la section outiiil_membre et initialisé à 0 lors de la création du sujet)
- Implémentation dans le tableau des commandes d'une colonne score : (Droits accumulés du joueur - valeur de la commande restante à livrer) * part du joueur de base
- Tri par ordre de score décroissant par défaut
- Changer la logique de passage automatique d’en attente à en cours pour que la prochaine commande soit considérée d’après la valeur du score
- Donner l’accès aux colonnes de calcul sur la page membres uniquement à ceux ayant les droits d’administration de l’alliance
- Ajouter aux restrictions accès colonnes supplémentaires membres la présence d’un sujet pour le joueur dans la section membres
- Donner possibilité modifier manuellement coefficient et droit accumulés à ceux ayant droit d’administration de l’alliance (utiliser la boîte rang actuelle)
- A chaque chargement de page, enregistrer dans l’extension la date, heure et minute de la prochaine récolte (affichée sur la page ressources)
- Mise à jour :
    - A chaque début de minute de récolte (sur la base de la prochaine récolte enregistrée et le fait qu’elles ont lieu toutes les demi-heures), mettre à jour toutes les colonnes présentées dans l’image, de gauche à droite (sauf les colonnes de TdC à la dernière mise à jour et date de la dernière mise à jour qui sont mises à jour en dernier).
    - Lorsque le coefficient ou la liberté d’ajustement sont changés pour un joueur, mettre à jour les parts des joueurs ajustées
- Si un joueur dont le coefficient est non nul n'a aucun recensement dans son sujet membres, ne pas mettre à jour les droits accumulés pour tous les joueurs de l'alliance et afficher une notification toast informant que la mise à jour est bloquée à cause de certains joueurs n'ayant pas effectué de recensement et indiquer leurs pseudos

## Plan d'Implémentation
- Vérifier si la mise à jour automatique se fait même quand l’onglet n’est pas affiché

## Tests à effectuer

## Avancement
- Les restrictions d'accès aux colonnes supplémentaires sur la page membres sous réserve de la présence d’un sujet pour le joueur dans la section membres ont été appliquées.