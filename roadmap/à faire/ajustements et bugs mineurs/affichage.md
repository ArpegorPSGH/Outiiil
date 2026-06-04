# Affichage

## Objectifs
Ajuster divers affichages pour des raisons esthétiques.

## Fonctionnement Détaillé
- Alterner les couleurs dans les nouveaux tableaux.
- Compléter la colonne des numéros de joueurs de l'alliance, dans l'ordre
- Retirer les icônes d'attaque vers soi-même dans le tableau des membres (ajoutées par C+)
- Mettre à jour le tooltip des messages non-lus lorsqu'ils sont cliqués, et pas seulement l'affichage du bouton
- Ajouter tooltips "Fourmilières pouvant m'attaquer" et "Attaquer cette Fourmilière" (avec lien attaquer) aux icônes d'attaque
- Modifier tooltip icône colonisé pour rajouter le nom du colonisateur
- S'assurrer qu'un message d'erreur est toujours affiché en cas de mise à jour auto impossible, que le rechargement se fasse ou non
- Mettre à jour le code de la couleur lors de la sélection via le picker dans les paramètres
- Afficher des toasts lorsqu'une fonctionalité est bloquée et dire pourquoi
- Afficher le TdC réel par joueur en ignorant les hors-chaînes
- Afficher moyenne par joueur des autres alliances
- Ajouter tooltips sur les quantités à livrer d'une commande : sur deux lignes, une avec une barre de progression verte sur fond blanc et marqué dessus le pourcentage d'avancement, et l'autre la quantité livrée/quantité demandée (la longueur de la barre s'ajuste à celle de l'autre ligne)
- Activer l'adaptation automatique de la largeur des colonnes de la page membre (ou contracter technologie et fourmilière?). Voir alliance_old.
- Mettre en cache le résultat de la vérification de version d'un paramètre/objet pour éviter les échecs de mise à jour à la chaîne
- Mettre colonne exclusion de l'alliance en non visible par défaut
- Dans boite C+, mettre 'Aucun Convoi' au lieu de Aucune
- Rendre les timers Fourmizzz de convois, attaques et chasses dynamiques
- Mettre le message de copie tableau en français
- Message du popup de blocage de changement de page en cours de transaction incorrect

## Plan d'Implémentation

## Tests à effectuer

## Avancement