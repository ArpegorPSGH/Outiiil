Définir l'adresse d'activation des pages dans une variable statique et les lancer via une boucle sur un registre des pages

Retirer les fonctions obsolètes (notamment getters/setters, constructeur legacy) de joueur et les parties pour rétro-compatibilité
Fusionner get et chargement recherche/construction joueur (si l'adresse n'est pas utilisée indépendamment ailleurs) et rajouter booléen de succès pour le succès de rafraichir

Voir à créer une fonction page pour récupérer le contenu actuel de la page, prenant le nom du tableau et la classe d'objet à créer (statiquement?) et retournant une liste de ces objets. Permettre à la classe ObjetForum de s'initialiser à partir de la ligne d'en-tête et la ligne cible du tableau.

Définir la politique de nommage des classes et des fichiers

Lors du rafraîchissement du gestionnaire de droits, effectuer l'enregistrement sur forum des sujets de droit si toutes les fonctionnalités n'ont pas pu être chargées

Créer un dictionnaire (nom colonne en clé) sur la pageAlliance pour stocker les colonnes du tableau et préciser si elles sont sortable/visibles (les fonctionnalités y inscrivent leurs colonnes ajoutées). La fonction d'ajout des en-têtes l'utilise.
