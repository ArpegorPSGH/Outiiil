# Hébergement de joueurs à l'extérieur

## Objectifs
Maintenir les fonctionnalités d'alliance de l'extension même lorsque le joueur de l'alliance est hébergé dans une autre alliance.

## Fonctionnement Détaillé
- Pour les joueurs hébergés à l’extérieur, créer une copie (possible ?) des sections (avec leur contenu) outiiil partagée avec les alliances hébergeuses. - Si les sections existent déjà, copier dedans les sujets qui n’y sont pas déjà. 
- Le contenu dans ces sections est crypté avec une clé qui est chargée automatiquement dans l’utilitaire depuis une section interne d’outiiil qui elle n’est pas copiée.
- Si la clé est perdue ou incorrecte, bloquer l'accès aux fonctionnalités d'alliance en lecture et en écriture et l'indiquer par une notifiction toast.
- Pour identifier quels sujets appartiennent à quelle alliance dans les sections externes, le nom de celle-ci est inclus dans le titre à la création et seul les sujets avec le nom de l’alliance mère sont lus.
- Lorsqu’au sein de l’alliance hébergeuse, la création ou modification de sujet ou post de message se fait sur les sections externes en crypté, et de même pour la lecture.
- Lorsqu’au sein de l’alliance mère :
    - La création ou modification de sujet ou post de message se fait sur les sections internes, et la même opération est effectuée en parallèle sur la section correspondante externe, mais en cryptant les données.
    - Pour la lecture, au chargement d’une page nécessitant de lire une section interne, avant cela, la liste des sujets internes de la section est chargée, et pour chaque sujet de la section externe correspondante :
        - On regarde si le sujet existe en interne :
            - Si ce n’est pas le cas, on le copie (possible ?) sur la section interne
            - Si c’est le cas, on copie (possible ?) les derniers messages non présents en interne sur la section interne (s’ils existent)
    - Pour la page forum, on effectue l’opération pour toutes les sections
- Lors de la modification d’un message ou d’un sujet interne l’opération équivalente doit être effectuée sur le sujet externe correspondant.
- Lors de la suppression ou le transfert d’un sujet interne, le sujet externe correspondant doit être supprimé.

## Plan d'Implémentation

## Avancement