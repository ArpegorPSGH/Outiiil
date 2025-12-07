# Bug reporting

## Objectifs
Permettre de facilement identifier et résoudre les erreurs recontrées par les clients des joueurs.

## Fonctionnement Détaillé
- Créer un nouvelle section pour les logs en même temps que celle des versions
- Créer une fonction utilitaire de post des logs qui :
    - Prend en entrée un message optionnel (pouvant contenir un lien d'image)
    - Récupère les logs de la page actuelle
    - Crée dans la section des logs un sujet dont le titre contient la version de l'extension et l'adresse de la page actuelle
    - Envoie en premier message du sujet le message optionnel s'il existe
    - Envoie un second message contenant les logs
    - Optionellement, voir si un mécanisme de reporting plus abouti existe (via gitHub?)
- Effectuer dans toutes les classes mères et le main des vérifications partout où il peut y avoir des erreurs, et ajouter un log, avec un return false ou null, à prendre en compte dans la fonction appelante pour ses propres logs et return
- Partout ou un console.error se trouve, appeler juste après la fonction de post des logs sans message optionnel, avant l'éventuel return
- Rajouter un try catch dans le main pour appeler la fonction de post des logs sans message optionnel en cas d'erreur
- Ajouter dans le dock un bouton permettant à un utilisateur de signaler un problème :
    - Lorsque cliqué, ouvre une boite avec un texte d'explication de l'utilisation de la fonctionnalité en haut, un champ texte au centre et un bouton signaler en bas
    - L'utilisateur remplit le champ, et lorsqu'il clique sur le bouton, la fonction de post des logs est appelée, avec le contenu du champ textuel en message optionnel (si le champ textuel est vide, un message d'erreur apparait dans la boite et le post des logs n'est pas effectué)

## Plan d'Implémentation

## Tests à effectuer

## Avancement