---
trigger: always_on
---

Pour garantir la robustesse des fonctionnalités :
- **Gestion du temps :** Assurez-vous que chaque fonctionnalité est robuste face à une imprécision d'une seconde sur la date d'arrivée prévue des convois, attaques et chasses.
- **Validation des actions :** Lors de la validation par le joueur d'une action dépendant de paramètres externes au client Outiiil et susceptibles de changer, vérifiez avant de l'effectuer que les infos clés nécessaires à l'action n'ont pas changées dans les infos actualisées. Si ce n'est pas le cas, annuler l'action en le signalant par un message et prendre en compte les dernières infos dans l'affichage pour que l'utilisateur puisse recommencer.
- **Actualisation des données :**
    - Pour un `ObjetForum`, actualisez cet objet en utilisant `ObjetForum.rafraichir()`.
    - Pour un objet classique, envoyez une (ou des) requête(s) ajax pour récupérer le contenu de la (ou des) page(s) actualisée(s), mais sans effectuer un rechargement visuellement.
- **Gestion des collisions :** Si des collisions sont avérées ou qu'une fonctionnalité a besoin de s'assurer qu'un `ObjetForum` n'est pas modifié pendant qu'elle l'utilise, introduisez un mécanisme d'anti-collision sur le forum (par exemple, via un flag de réservation sur l'objet forum).