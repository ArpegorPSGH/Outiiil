# Hébergement de joueurs à l'extérieur

## Objectifs
Maintenir les fonctionnalités d'alliance de l'extension même lorsque le joueur de l'alliance est hébergé dans une autre alliance.

## Fonctionnement Détaillé
- Pour les joueurs hébergés à l’extérieur, créer une copie (possible ?) des sections (avec leur contenu) outiiil partagée avec les alliances hébergeuses.
- Si les sections existent déjà, copier dedans les sujets qui n’y sont pas déjà. 
- Le contenu dans ces sections est crypté avec une clé qui est chargée automatiquement dans l’utilitaire depuis une section interne d’outiiil qui elle n’est pas copiée.
- Si la clé est perdue ou incorrecte, bloquer l'accès aux fonctionnalités d'alliance en lecture et en écriture et l'indiquer par une notifiction toast.
- Pour identifier quels sujets appartiennent à quelle alliance dans les sections externes, le nom de celle-ci est inclus dans le titre à la création et seul les sujets avec le nom de l’alliance mère sont lus.
- Lorsqu’au sein de l’alliance hébergeuse, la création ou modification de sujet ou post de message se fait sur les sections externes en crypté, et de même pour la lecture.
- Lorsqu’au sein de l’alliance mère :
    - Si une section ou un sujet externe ne sont pas présents, en refaire une copie. Si une section n'est plus partagée, la repartager.
    - La création ou modification de sujet ou post de message se fait sur les sections internes, et la même opération est effectuée en parallèle sur la section correspondante externe, mais en cryptant les données. 
    - Pour la lecture, au chargement d’une page nécessitant de lire une section interne, avant cela, la liste des sujets internes de la section est chargée, et pour chaque sujet de la section externe correspondante :
        - On regarde si le sujet existe en interne :
            - Si ce n’est pas le cas, on le copie (possible ?) sur la section interne
            - Si c’est le cas, on copie (possible ?) les derniers messages non présents en interne sur la section interne (s’ils existent)
    - Pour la page forum, on effectue l’opération pour toutes les sections
- Lors de la modification d’un message ou d’un sujet interne l’opération équivalente doit être effectuée sur le sujet externe correspondant.
- Lors de la suppression ou le transfert d’un sujet interne, le sujet externe correspondant doit être supprimé.
- Offrir la possibilité de réencrypter avec une nouvelle clé
- Automatiquement désencrypter/réencrypter lors de la modification d'un sujet ou message
- Offrir la possibilité d'encrypter (alliés) ou non (CA) le forum partagé
- Si la copie n'est pas possible, simplement transférer les sujets sur le forum partagé, en les encyptant ou non, au moment du partage. A la fin du partage, retransférer les sujets, en les décryptant si nécessaire, sur le forum interne (recréeer les sections si nécessaire).
- Donner la possibilité de lire et écrire manuellement des sujets et messages cryptés et d'automatiquement reporter les modifications sur la copie (et dans l'autre sens aussi).

## Plan d'Implémentation

## Tests à effectuer

## Avancement