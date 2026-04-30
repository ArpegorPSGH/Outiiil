# Gestion données périmées

## Objectifs
Trouver un moyen automatique de rafraichir, détecter et réagir à la modification des données pour une action de fonctionnalité.

## Fonctionnement Détaillé
- Appliquer le rechargement unique convoi
- Aucune fonctionnalité locale ou d'alliance ne doit inclure un rechargement de page dans son flux, seulement éventuellement à la toute fin
- Action = clic de bouton aboutissant à l'envoi d'une requête d'écriture Fourmizzz
- Applicable à la modification des attributs/paramètres d'un objet forum ou classique, des droits ou de la version
- Toutes les données nécessaires à une fonctionnalité locale ou d'alliance doivent être obtenues via la page actuelle ou un objet forum ou classique
- Minimiser l'impact sur les classes filles
- Adapter les classes filles existantes si nécessaire

## Plan d'Implémentation

## Tests à effectuer
- Vérifier cas lancement de convoi sur deux pages parallèles sans rechargement

## Avancement