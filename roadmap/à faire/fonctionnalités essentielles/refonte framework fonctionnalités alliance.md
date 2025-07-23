# Refonte framework fonctionnalités alliance

## Objectifs
Refondre le coeur de l'extension pour pouvoir développer plus simplement, flexiblement et robustement de nouvelles fonctionnalités d'alliance :
- Mettre en place un système de restrictions par joueur de l’accès à chaque fonctionnalité
- Mettre en place un système de restrictions s'il y a incompatibilité de version

## Fonctionnement Détaillé
- Restrictions de droits :
    - Créer un niveau de droit d'administration permettant d'accéder aux fonctions d'administration même sans les icônes sur la page
    - Les niveaux de droits seront A pour administrateur, B pour bloquée, R pour restreint, et N pour normal.
    - Ils seront modifiés via la boîte page alliance, dans un nouvel onglet.
    - Sur la page alliance (pas page forum), les droits d'administration seront accordés si l'icône ou les droits d'administration Outiiil sont présents.
    - Sur la page alliance, le blocage ou la restriction des droits sont by-passés par les droits d'administration Fourmizzz (présence de l'icône).
- Restrictions de versions :
    - Sur le forum, une section Outiiil_version est créée lors de la mise en place du SdC, et enregistrée dans l'utilitaire (identiquement à ce qui est fait pour les autres sections).
    - Ne plus appeler update de la section
    - Si jamais la section Outiiil_version existe déjà lorsque l'utilisateur clique sur le bouton de mise en place du SdC, alors la section n'est pas recréée (identiquement à ce qui est fait pour les autres sections).
    - Un sujet par paramètre dans la section version, dans lequel sont stockés la liste de paires de lieux et formats.
    - Quand un paramètre est supprimé, à la place d'une paire de lieu et format, il y a 'deprecated'.

- Classes :
    - Classes mères :
        - Fonctionnalité alliance
            - Attributs :
                - Abréviation
                - Gestionnaire de droits
                - Gestionnaire de version
            - Méthodes :
                - init
                - Vérification version suffisante et présence sections
                - Vérification présence sujet membre
                - Vérification droits
                - Chargement multiple d'objets

        - Objet :
            - Attributs :
                - Tous ses paramètres
                - L'id de sa section
                - L'id de son sujet
                - Liste d'objets contenus (classes filles, si nécessaire)
            - Méthodes :
                - Vérification version suffisante et présence section
                - Charger depuis le forum
                - Charger à partir d'un string
                - Charger des objets contenus
                - Afficher
                - Init (classes filles)
                - Lire chaque paramètre (classes filles)
                - Ecrire chaque paramètre (classes filles)
                - Enregistrer sur le forum (classes filles) :
                    - appel des fonctions d'enregistrement de des paramètres

        - Paramètre :
            - Attributs :
                - Liste de paires de format et lieu d'enregistrement (section et titre sujet ou contenu) 
                - String de restriction (ou None si non restreint)
                - Valeur par défaut
            - Méthodes :
                - Vérification version suffisante partie section
                - Charger depuis le forum :
                    - Ignorer les lieux et formats 'deprecated'
                - Enregistrer sur le forum :
                    - Il se réécrit sur le sujet correspondant à l'id de sujet de son objet, ou crée un nouveau sujet sinon, et le note dans l'objet. 
                - Lire (appel direct)
                - Ecrire

    - Autres classes :
        - Gestion des versions :
            - Attributs :
                - Liste de section.titre/contenu et version minimale
            - Méthodes :
                - init :
                    - Génère automatiquement les paramètres nécessaires pour chaque section de l'utilitaire (connu via les paramètres du profil du joueur actuel) à sa création. Si une version de section n'est pas présente sur le forum lors du chargement des paramètres, il lui met par défaut la version actuelle de l'extension.
                - Charger depuis le forum
                - Vérification version suffisante partie section et mise à jour
                - Enregistrer sur le forum
        - Gestion des droits (hérite d'objet) :
            - Attributs :
                - Liste de paramètres de niveaux de droits de fonctionnalités alliance
                - Liste ordonnée des niveaux de droits
                - Format d'enregistrement
            - Méthodes :
                - Init
                - Charger depuis le forum
                - Vérification droits
                - Afficher
                - Lire les droits de chaque fonctionnalité
                - Ecrire les droits de chaque fonctionnalité
                - Enregistrer sur le forum
- Processus :
    - Lancement de fonctionnalités :
        - Au chargement de la page, les fonctionnalités hors alliance sont exécutées et un gestionnaire de version est créé (il charge ses données depuis le forum à sa création) ainsi qu'un gestionnaire de droits pour le joueur, tous deux accessibles depuis n'importe où dans la fonctionnalité.
        - À sa création, le gestionnaire de droits scan les fonctionnalités existantes (héritant de la classe fonctionnalité) dans les fichiers de l'extension. Pour chaque fonctionnalité identifiée, il crée et attache un paramètre dont le format combine l'abréviation de la fonctionnalité avec le format défini dans le gestionnaire de droits, sans restrictions, et dans la partie du forum définie dans le gestionnaire de droits, et ce pour chaque version. Il charge ensuite ses données depuis le forum pour le joueur.
        - Ensuite, les fonctionnalités alliance sont créées les unes après les autres sans blocage.
        - Chaque fonctionnalité, au moment de sa création, invoque une fonction d'initialisation définie dans sa classe mère.
        - Cette fonction d'initialisation commence par lancer la fonction de vérification des versions minimales nécessaires à l'accès aux parties du forum dont la fonctionnalité a besoin, et la présence de celles-ci.
        - Cette fonction scan toutes les fonctions de la fonctionnalité (classe mère y compris, hors elle-même) pour identifier toutes les classes descendant d'objet (mais pas objet) créées directement ou indirectement. Elle crée ensuite une instance de chaque et lui demande de vérifier si la version de l'extension et les ids de section disponibles lui permettent d'accéder aux données dont elle a besoin.
        - Chaque instance vérifie que l'id de section dont elle a besoin est présent et correct, et demande elle-même à chacun de ses paramètres si la version de l'extension est suffisante.
        - Chaque paramètre interroge le gestionnaire de version pour savoir si les versions de format et lieux dont il dispose sont compatibles avec les formats actuellement utilisés.
        - Si le dernier lieu et format du paramètre correspond au dernier dans la section version, il répond oui, s'il correspond à un précédent, il répond non et tente une mise à jour de l'extension. Si aucune correspondance n'est trouvée, il répond oui, prend le premier lieu et format, et s'il y a une correspondance, met à jour le forum avec le dernier lieu et format. Sinon, il crée un nouveau sujet pour le paramètre avec sa liste de paires de lieux et formats.
        - Le paramètre transmet la réponse du gestionnaire à l'objet. 
        - L'objet répond oui à la fonctionnalité si tous ses paramètres répondent oui et son id de section est présent et correct, non sinon. 
        - Si tous les objets répondent oui, la fonction de vérification des versions et présence des ids retourne oui, non sinon.
        - En cas de réponse négative, la fonction d'initialisation retourne faux. Sinon, elle se poursuit par l'appel de la fonction de vérification de la présence d'un sujet membre au nom du joueur.
        - Celle-ci charge tous les joueurs, et renvoie True si l'un des objets a le pseudo du joueur actuel.
        - En cas de réponse négative, la fonction d'initialisation retourne faux. Sinon, elle se poursuit par l'appel de la fonction de vérification des droits.
        - La fonction de vérification de droits interroge le gestionnaire de droits pour savoir si le joueur a un niveau de droits pour la fonctionnalité supérieur ou égal à restreint. Si c'est le cas, la fonction d'initialisation retourne vrai, sinon faux.
        - Si la fonction d'initialisation retourne vrai, l'exécution de la fonctionnalité se poursuit par l'appel des différentes fonctions mettant en œuvre la fonctionnalité. Sinon, l'exécution s'arrête.
    - Chargement d'objets multiples : 
        - Une fonction est définie dans la classe mère des fonctionnalités.
        - Elle crée dans une boucle un objet par défaut de la classe demandée et invoque sa fonction de chargement.
        - Cette dernière invoque la fonction de chargement de chacun de ses paramètres.
        - Celles-ci, si l'id de sujet est présent dans l'objet qui les a appelées, chargent leurs données à partir de là (en utilisant les
        données de format et lieu hardcodé dans leur classe).
        - Sinon, elles cherchent le premier sujet dont l'id n'est pas dans la liste des exclusions fournies, et chargent leurs données à partir de là, puis mettent à jour l'id de sujet de l'objet avec celui utilisé.
        - Si les fonctions de chargement n'arrivent pas à charger leurs données, au lieu d'utiliser les formats et lieux de la version la plus récente, elles remontent à ceux de la version précédente, puis reessaient le chargement selon la même logique. La remontée de versions se poursuit jusqu'à réussite du chargement ou épuisement des versions, auquel cas, une erreur est levée.
        - La fonction de chargement de l'objet, si un de ses paramètres lui retourne une erreur, s'interrompt et transmet l'erreur, sinon se poursuit jusqu'à chargement de tous ses paramètres.
    - Chargement d'objets inclus dans d'autres :
        - Si un objet secondaire est contenu dans le premier, alors une fonction de chargement de contenu définie dans la classe mère de l'objet est invoquée à  la fin de la fonction de chargement classique.
        - Cette fonction de chargement de contenu récupère tous les messages du sujet de l'objet, et pour chacun crée un objet secondaire par défaut puis appelle sa fonction de chargement depuis une chaîne de caractères, définie dans sa classe mère, en lui donnant le contenu du message. Elle place les objets contenus dans une liste attribut de l'objet primaire.
    - Restrictions d'affichage :
        - Au début de la fonction d'affichage d'un objet, sa fonction super est appelée, qui scan la pile d'appel pour identifier quelle fonctionnalité l'a appelée, et interroge ensuite le gestionnaire de droits pour savoir si les droits du joueur sont supérieurs ou égaux à normal.
        - La réponse est ensuite retournée à la fonction d'affichage initiale, qui la transmet à tous les paramètres au moment de leur lecture.
        - Si la réponse est négative, le string de restriction est retourné, sinon la valeur du paramètre.
        - Les valeurs retournées sont ensuite mises en forme par la fonction d'affichage puis l'objet résultant est retourné.
    - Pour les tâches de fond, le processus de vérification est effectué lorsque les conditions de déclenchement de l'action de la tâche sont réunies

## Plan d'Implémentation

## Tests à effectuer

## Avancement