# Affichage infos droits fonctionnalités

## Objectifs
Afficher clairement dans la boite des droits pour chaque fonctionnalité les implications du niveau de droits actuel.

## Fonctionnement Détaillé
- Lorsqu'un niveau de droits pour une fonctionnalité est sélectionné dans la liste déroulante de la boite de droits (ou en tooltip au survol des éléments de la liste déroulante?), afficher ce que le joueur pourra faire/voir exactement
- Pour ce faire, créer un attribut dictionnaire dans la classe mère des fonctionnalités, dont chaque clé correspond à un niveau de droits auquel le fonctionnement de la fonctionnalité change, et la valeur est un string de description de ce qui est possible à partir de ce niveau par rapport au précédent
- Pour la vérification initiale automatique des droits, utiliser le niveau le plus bas du dictionnaire, connu en interrogeant une fonction à ajouter au gestionnaire de droits, qui retourne une liste de droits donnée ordonnée
- Implémenter une fonction dans la classe mère des fonctionnalités qui ira concaténer tous les strings de description correspondant aux niveaux de droits inférieurs ou égaux à celui considéré, et qui ira aussi récupérer le nom de tous les paramètres avec leur état de restriction à ce niveau (via une fonction invoquée sur chaque objet dépendant) si la fonctionnalité n'est pas totalement bloquée. Si c'est le cas (aucune clé inférieure ou égale), afficher un message défaut de blocage.
- Indiquer dans les notes de développement comment créer de nouveaux niveaux de droits et les utiliser (fonctionnalités + paramètres) + mise à jour du dictionnaire de description lors de la modification du fonctionnement des droits de la fonctionnalité ou ajout de nouvelles actions/visualisation

## Plan d'Implémentation

## Tests à effectuer

## Avancement