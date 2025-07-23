# Compatibilité entre versions

## Objectifs
Eviter que des versions utilisant des formats différents de stockage de données sur le forum ne créent des incohérences dans les données stockées en restreignant l'accès au forum sur la base de la version.

## Fonctionnement Détaillé
Fichiers :
    - Les versions minimales nécessaires à l'accès à chaque partie du forum au moment de la sortie de la version sont stockées en interne dans un fichier de l'extension. Les versions sont définies indépendamment au global, pour tous les titres de sujets au global, pour tous les contenus de sujets au global, par section, pour les titres des sujets pour chaque section, et pour les contenus des sujets pour chaque section. Les section sont désignées par leur nom.
    - Dans un autre fichier sont stockés les liens entre chaque fonctionnalité (désignée par son nom), les parties du forum utilisées par la fonctionnalité (désignées par leur noms), et les fonctions implémentant cette fonctionnalité (désignées par leur noms).
- Forum :
    - Sur le forum, une section Outiiil_version est créée lors de la mise en place du SdC, et enregistrée dans l'utilitaire (identiquement à ce qui est fait pour les autres sections). La fonction d'update de la section est ensuite lancée :
        - Les versions minimales du forum sont chargées, en ignorant les sujets dont toutes les données ne peuvent pas être extraites
        - Si une section présente dans le fichier interne des versions minimales n'est pas présente dans les versions extraites du forum, alors son sujet sur le forum est créé, en renseignant comme versions celles présentes dans le fichier interne, et une notification est envoyée. Les versions minimales associées sont alors chargées avec les autres.
        - Si pour une partie de forum, la version minimale interne est supérieure à la version sur le forum, mettre la version interne à la place et afficher un message de notification. Mettre également à jour la version minimale dans la structure chargée.
    - La section Outiiil_version contient un sujet pour les versions minimales d'accès au forum globales (forum entier, juste les titres de sujets, juste les contenus de sujets), plus un sujet pour chaque section présente dans le fichier interne des versions minimales, précisant les versions minimales d'accès à cette section (section entière, juste les titres de sujets, juste les contenus de sujets). Les informations sont contenues dans le titre des sujets, qui ont tous le même format.
    - Si jamais la section Outiiil_version existe déjà lorsque l'utilisateur clique sur le bouton de mise en place du SdC, alors la fonction d'update de la section est lancée sans recréation de la section (identiquement à ce qui est fait pour les autres sections).
- Page de fonctionnalité :
    - Au moment du chargement d'une page, dans la fonction constructor, une instance de point d'accès forum (PageForum) est créée, qui elle-même lance à sa création la fonction d'update.
    - Chaque fonction membre de la classe de la page lancée dans executer, l'est via la fonction de vérification de versions dans une nouvelle classe dédiée, dans un nouveau fichier :
        - Cette dernière utilise le nom de la fonction pour identifier le nom de la fonctionnalité associée à l'aide du fichier de lien entre fonctionnalité, fonctions, et parties du forum.
        - Elle récupère ensuite toutes les parties du forum nécessaires à cette fonctionnalité.
        - Elle récupére dans l'instance de point d'accès forum fournie toutes les versions minimales du forum.
        - Si la version de l'extension est inférieure à la version minimale (calculée à l'aide des contenances) sur le forum pour au moins l'une des parties, déclencher une mise à jour de l'extension, et afficher un message de notification.
        - Si la mise à jour ne marche pas (principalement pour cause de navigateur non compatible), afficher un message d'erreur suggérant une mise à jour manuelle
        - Si la version de l'extension est supérieure ou égale à la version minimale sur le forum pour toutes les parties :
            - La fonction passée en entrée est lancée
    - Les versions minimales étant exprimées à différents niveaux, pour calculer la version minimale réelle d'une partie du forum, il faut prendre la plus restrictive (version plus récente) entre celle de cette partie, celles des parties qu'elle contient, et celles de toutes les parties qui la contiennent.
    - Les contenances sont les suivantes :
        - La partie global n'est contenue dans rien
        - La partie tous les titres de sujets au global est contenue dans la partie global
        - La partie tous les contenus de sujets au global est contenue dans la partie global
        - La partie correspondant à une section spécifique est contenue dans la partie global
        - La partie correspondant au titres des sujets d'une section spécifique est contenue par la partie global, la partie tous les titres de sujets au global et la partie correpsondant à cette section
        - La partie correspondant au contenu des sujets d'une section spécifique est contenue par la partie global, la partie tous les contenus de sujets au global et la partie correspondant à cette section
        - La partie global contient tout
        - La partie tous les titres de sujets au global contient tous les titres de sujet de chaque section
        - La partie tous les contenus de sujets au global contient tous les contenus de sujet de chaque section
        - La partie correspondant à une section spécifique contient les titres et les contenus des sujets de cette section
        - La partie correspondant au titres des sujets d'une section spécifique ne contient rien
        - La partie correspondant au contenu des sujets d'une section spécifique ne contient rien
- Tâche de fond :
    - Le point d'accès forum est créé au lancement de la tâche
    - Au moment où les conditions de déclenchement de l'action de la tâche sont réunies, la fonction d'update du point d'accès forum est lancée depuis l'extérieur
    - Chaque fonction membre de la classe de la tâche lancée ensuite dans le cadre de l'action, l'est via la fonction de vérification de versions
- La fonction verifierSujetMembre doit aussi être considérée comme une fonctionnalité à vérifier

## Plan d'Implémentation

### 1. Préparation et Structures de Données

*   **1.1 Création du fichier de versions minimales internes (`js/data/versions_minimales.json`)**
    *   **Action 1.1.1 : Créer le fichier `js/data/versions_minimales.json`**
        *   Contenu initial :
            ```json
            {
              "global": {
                "forum": "1.0.0",
                "titres": "1.0.0",
                "contenus": "1.0.0"
              },
              "sections": {
                "Outiiil_membre": {
                  "section": "1.0.0",
                  "titres": "1.0.0",
                  "contenus": "1.0.0"
                },
                "Commerce": {
                  "section": "1.0.0",
                  "titres": "1.0.0",
                  "contenus": "1.0.0"
                }
                // Ajouter d'autres sections pertinentes au fur et à mesure
              }
            }
            ```
        *   **Considération :** Les versions initiales doivent être définies en fonction de la version actuelle de l'extension et des formats de données existants.
*   **1.2 Création du fichier de liens fonctionnalités/fonctions/parties du forum (`js/data/liens_fonctionnalites.json`)**
    *   **Action 1.2.1 : Créer le fichier `js/data/liens_fonctionnalites.json`**
        *   Contenu initial (à compléter avec les fonctionnalités réelles) :
            ```json
            {
              "GestionPageAlliance": {
                "fonctions": ["chargerDonneesAlliance", "afficherTableauAlliance"],
                "partiesForum": ["sections.Alliance.section", "sections.Alliance.contenus"]
              },
              "GestionCommandes": {
                "fonctions": ["creerCommande", "annulerCommande"],
                "partiesForum": ["sections.Commerce.section", "sections.Commerce.titres", "sections.Commerce.contenus"]
              }
              // Ajouter d'autres mappings fonctionnalité -> fonctions -> parties du forum
            }
            ```
        *   **Considération :** Ce fichier nécessitera une analyse approfondie du code existant pour mapper correctement chaque fonctionnalité aux fonctions qui l'implémentent et aux parties du forum qu'elles utilisent. La clé est le nom de la fonctionnalité.
*   **1.3 Mise à jour de `manifest.json`**
    *   **Action 1.3.1 : Ajouter les nouveaux fichiers de données à `manifest.json`**
        *   S'assurer que `js/data/versions_minimales.json` et `js/data/liens_fonctionnalites.json` sont accessibles par l'extension. Cela peut impliquer de les ajouter à la section `web_accessible_resources` si l'extension les charge directement depuis le contenu de la page, ou de s'assurer qu'ils sont inclus dans le bundle si un processus de build est utilisé.

### 2. Logique de Gestion des Versions

*   **2.1 Création de la classe `VersionManager` (`js/class/VersionManager.js`)**
    *   **Action 2.1.1 : Créer le fichier `js/class/VersionManager.js`**
    *   **Action 2.1.2 : Implémenter le constructeur de `VersionManager`**
        *   Charger `versions_minimales.json` et `liens_fonctionnalites.json` au moment de l'instanciation. Utiliser `fetch` ou `XMLHttpRequest` pour charger ces fichiers de manière asynchrone.
    *   **Action 2.1.3 : Implémenter la méthode `calculerVersionMinimaleReelle(cheminPartieForum)`**
        *   Prendre en entrée un chemin comme "sections.Outiiil_membre.titres".
        *   Parcourir les contenances définies (global, titres globaux, contenus globaux, section spécifique, titres de section, contenus de section).
        *   Pour chaque partie contenante, récupérer sa version minimale.
        *   Retourner la version la plus récente (la plus restrictive) parmi toutes les versions pertinentes. Utiliser une fonction utilitaire pour comparer les versions (ex: `Utils.compareVersions('1.0.0', '1.1.0')`).
    *   **Action 2.1.4 : Implémenter la méthode `checkVersion(pageForumInstance, fonctionACallback)`**
        *   Obtenir le nom de la fonction à partir de `fonctionACallback.name`.
        *   Parcourir `liens_fonctionnalites.json` pour trouver la `fonctionnalite` qui contient cette fonction dans son tableau `fonctions`.
        *   Une fois la `fonctionnalite` trouvée, récupérer ses `partiesForum` associées.
        *   Appeler `versionsForum = pageForumInstance.getVersionsFromForum()` une seule fois au début.
        *   Initialiser un drapeau `versionIncompatibleTrouvee = false`.
        *   Pour chaque `partieForum` requise par la fonctionnalité :
            *   Appeler `this.calculerVersionMinimaleReelle(cheminPartieForum)` pour obtenir la version minimale requise pour cette partie.
            *   Comparer la version de l'extension (récupérée depuis `manifest.json` ou une variable globale) avec la version minimale requise.
            *   Si la version de l'extension est inférieure à la version minimale pour cette partie, définir `versionIncompatibleTrouvee = true` et sortir de la boucle (pas besoin de vérifier les autres parties).
        *   **Après la boucle :**
            *   Si `versionIncompatibleTrouvee` est `true` :
                *   Déclencher la mise à jour de l'extension (ex: rediriger vers la page de mise à jour ou afficher un message).
                *   Afficher un message de notification clair à l'utilisateur.
                *   Recharger la page après un court délai pour permettre à l'utilisateur de lire la notification.
                *   Si la mise à jour échoue, afficher un message d'erreur suggérant une mise à jour manuelle.
            *   Sinon (si toutes les versions sont compatibles) :
                *   Exécuter `fonctionACallback()`.
*   **2.2 Modification de la classe `PageForum` (dans `js/page/Forum.js`)**
    *   **Action 2.2.1 : Ajouter une propriété pour stocker les versions du forum**
        *   Ex: `this.versionsForum = {};`
    *   **Action 2.2.2 : Implémenter la méthode `updateVersionSection()` dans `PageForum`**
        *   **Sous-action 2.2.2.1 : Extraire les versions existantes du forum**
            *   Parcourir la section `Outiiil_version` sur le forum.
            *   Extraire les versions minimales des titres des sujets (global, titres, contenus, sections spécifiques).
            *   Stocker ces versions dans `this.versionsForum`, en ignorant les sujets dont les données ne peuvent pas être extraites.
        *   **Sous-action 2.2.2.2 : Comparer et mettre à jour les versions**
            *   Parcourir `versions_minimales.json` (les versions internes).
            *   Pour chaque entrée (global, chaque section, chaque type de contenu) :
                *   Si l'entrée n'est pas présente dans `this.versionsForum` (pas de sujet correspondant sur le forum) :
                    *   Créer le sujet sur le forum avec la version interne.
                    *   Envoyer une notification à l'utilisateur.
                    *   Ajouter cette version à `this.versionsForum`.
                *   Si la version interne est supérieure à la version correspondante dans `this.versionsForum` :
                    *   Mettre à jour le sujet sur le forum avec la version interne.
                    *   Afficher un message de notification.
                    *   Mettre à jour la version dans `this.versionsForum`.
        *   **Considération :** Cette sous-action, si correctement implémentée, garantira que `this.versionsForum` contient toutes les entrées définies dans `versions_minimales.json`.
*   **2.3 Implémentation de la fonction de vérification de versions (`checkVersion`)**
    *   (Détails déjà couverts dans 2.1.4, mais à noter que cette fonction sera le point d'entrée principal pour la vérification de compatibilité).

### 3. Intégration dans le Code Existant

*   **3.1 Modification de `js/page/Forum.js` pour la mise en place du SdC**
    *   **Action 3.1.1 : Identifier la fonction de mise en place du SdC dans `Forum.js`**
        *   Localiser la logique qui initialise le Système de Distribution de Convois (SdC).
    *   **Action 3.1.2 : Appeler `updateVersionSection()`**
        *   Dans cette fonction, après l'initialisation de `PageForum`, appeler `this.pageForum.updateVersionSection()`.
        *   S'assurer que cet appel est fait de manière à ne pas recréer la section si elle existe déjà, mais simplement à la mettre à jour.
*   **3.2 Modification des pages de fonctionnalité**
    *   **Action 3.2.1 : Modifier le `constructor` de chaque classe de page**
        *   Dans `js/page/Alliance.js`, `js/page/Commerce.js`, `js/page/Attaquer.js`, etc. :
            *   Instancier `PageForum` (si ce n'est pas déjà fait) : `this.pageForum = new PageForum();`
            *   Instancier `VersionManager` : `this.versionManager = new VersionManager();`
    *   **Action 3.2.2 : Modifier les appels de fonctions clés dans chaque page**
        *   Pour chaque appel de fonction membre important qui interagit avec le forum et est lié à une fonctionnalité spécifique, encapsuler l'appel avec `this.versionManager.checkVersion()`.
        *   **Exemple pour `js/page/Alliance.js` :**
            ```javascript
            class Alliance {
                constructor() {
                    this.pageForum = new PageForum();
                    this.versionManager = new VersionManager();
                    // ... autres initialisations
                }

                async executer() {
                    // ...
                    // Appel individuel pour chaque fonction nécessitant une vérification
                    await this.versionManager.checkVersion(this.pageForum, () => this.chargerDonneesAlliance());
                    await this.versionManager.checkVersion(this.pageForum, () => this.afficherTableauAlliance());
                    // ... autres appels de fonctions
                }

                async chargerDonneesAlliance() { /* ... */ }
                async afficherTableauAlliance() { /* ... */ }
            }
            ```
        *   **Considération :** Il faudra identifier précisément quelles fonctions nécessitent cette vérification et mettre à jour `liens_fonctionnalites.json` en conséquence.

### 4. Tests à Effectuer (Scénarios Fonctionnels)

*   **Préparation Générale :**
    *   Avoir une version de l'extension installée dans un navigateur (ex: Chrome, Firefox).
    *   Avoir accès à un forum de test où la section `Outiiil_version` peut être manipulée (créée, modifiée manuellement).
    *   Connaître la version actuelle de l'extension.
    *   Avoir une console de développement ouverte pour observer les logs et les notifications.

*   **4.1 Scénarios de Test de la Section `Outiiil_version` sur le Forum**
    *   **4.1.1 Création initiale de la section `Outiiil_version`**
        *   **Procédure :**
            1.  Assurer que la section `Outiiil_version` n'existe pas sur le forum de test.
            2.  Lancer l'extension et déclencher la fonction de mise en place du SdC (ex: via un bouton ou une action spécifique dans l'extension).
            3.  **Vérification :**
                *   Observer que la section `Outiiil_version` est créée sur le forum.
                *   Vérifier que les sujets pour `global` et toutes les `sections` définies dans `versions_minimales.json` sont présents dans cette section.
                *   Vérifier que les titres des sujets contiennent les versions initiales correctes définies dans `versions_minimales.json`.
                *   Vérifier les logs de la console pour toute notification ou message d'erreur.
    *   **4.1.2 Mise à jour des versions sur le forum par l'extension**
        *   **Procédure :**
            1.  Assurer que la section `Outiiil_version` existe sur le forum avec des versions *antérieures* à celles définies dans `versions_minimales.json` (ex: `versions_minimales.json` a "1.1.0", forum a "1.0.0").
            2.  Lancer l'extension et déclencher la fonction de mise à jour de la section `Outiiil_version` (via le SdC ou un appel direct si exposé).
            3.  **Vérification :**
                *   Observer que les titres des sujets correspondants sur le forum sont mis à jour avec les versions plus récentes de `versions_minimales.json`.
                *   Vérifier que des messages de notification appropriés sont affichés à l'utilisateur.
                *   Vérifier les logs de la console.
    *   **4.1.3 Extraction correcte des versions depuis le forum**
        *   **Procédure :**
            1.  Assurer que la section `Outiiil_version` contient diverses versions sur le forum (certaines à jour, certaines anciennes, certaines avec des formats valides).
            2.  Lancer l'extension et naviguer vers une page qui utilise `PageForum` et `VersionManager`.
            3.  **Vérification :**
                *   Observer le comportement de l'extension : si aucune notification de mise à jour n'est affichée et que la fonctionnalité de la page s'exécute correctement, cela indique que les versions ont été correctement lues et interprétées.
                *   (Optionnel, si possible via la console) : Inspecter l'objet `pageForumInstance.versionsForum` pour confirmer qu'il reflète fidèlement les versions du forum.
    *   **4.1.4 Gestion des sujets incomplets ou mal formés sur le forum**
        *   **Procédure :**
            1.  Manuellement, introduire des sujets dans la section `Outiiil_version` avec des titres mal formatés (ex: "Version:1.0", "Global_Forum_V1.0.0", "Section_X_V1.0.0_Titre_MalFormé").
            2.  Lancer l'extension et déclencher la mise à jour de la section `Outiiil_version`.
            3.  **Vérification :**
                *   Vérifier que l'extension ne plante pas.
                *   Vérifier que les sujets valides sont toujours traités correctement.
                *   Vérifier les logs de la console pour des messages d'erreur ou d'avertissement concernant les sujets mal formés.

*   **4.2 Scénarios de Test de la Compatibilité des Versions pour les Pages de Fonctionnalité**
    *   **4.2.1 Scénario : Version de l'extension incompatible (mise à jour requise)**
        *   **Procédure :**
            1.  Modifier manuellement la version de l'extension dans `manifest.json` à une version *supérieure* (ex: "2.1.16").
            2.  Générer une release à partir de cette version
            3.  Charger la version normale dans le navigateur
            4.  Sur le forum de test, définir une version minimale pour une fonctionnalité spécifique (ex: `GestionPageAlliance`) à la version de la release.
            5.  Naviguer vers une page qui utilise cette fonctionnalité (ex: page Alliance).
            5.  **Vérification :**
                *   Observer qu'une notification claire de mise à jour est affichée à l'utilisateur.
                *   Vérifier que la fonctionnalité cible de la page (ex: affichage du tableau de l'alliance) n'est *pas* exécutée avant le rechargement.
                *   Vérifier que la page se recharge automatiquement après un court délai.
                *   Vérifier que toutes les fonctionnalités s'exécutent
                *   Vérifier que l'extension a bien été mise à jour (upgrade de version)
                *   Vérifier qu'un rechargement manuel n'entraîne pas de nouvelle mise à jour
    *   **4.2.2 Scénario : Version de l'extension compatible (fonctionnement normal)**
        *   **Procédure :**
            1.  Assurer que la version de l'extension dans `manifest.json` est *égale ou supérieure* à toutes les versions minimales définies sur le forum pour les fonctionnalités testées (ex: extension "1.1.0", forum "1.0.0" pour `GestionPageAlliance`).
            2.  Recharger l'extension.
            3.  Naviguer vers les pages de fonctionnalité.
            4.  **Vérification :**
                *   Observer qu'aucune notification de mise à jour n'est affichée.
                *   Vérifier que les pages fonctionnent normalement et que toutes les fonctionnalités sont exécutées comme prévu.
    *   **4.2.3 Scénario : Échec de la mise à jour automatique**
        *   **Procédure :**
            1.  Mettre en place un environnement où la mise à jour automatique est impossible pour cause de navigateur non compatible (simuler absence de mise à jour disponible).
            2.  Pour chaque niveau de restriction de version :
                *  Pour chaque page de fonctionnalité :
                    *  **Vérification :**
                        *   Observer qu'un message d'erreur clair est affiché, suggérant une mise à jour manuelle.
                        *   Vérifier que la page ne se recharge pas indéfiniment en boucle.
                        *   Vérifier que les  bonnes fonctionalités sont bloquées (d'après contenances amont et aval), mais que les autres fonctionnent correctement.
                        *   Vérifier qu'un rechargement manuel entraîne une réponse identique
    *   **4.2.4 Scénario : Modification du format des titres/contenus des messages des sujets**
        *   **Procédure :**
            1.  Sur le forum de test, modifier manuellement le format des titres ou des contenus des messages dans un sujet utilisé par une fonctionnalité (ex: un sujet de commande dans la section Commerce).
            2.  Définir une version minimale sur le forum pour la partie concernée (ex: `sections.Commerce.contenus`) qui est supérieure à la version de l'extension.
            3.  Recharger l'extension.
            4.  Naviguer vers la page de fonctionnalité correspondante (ex: page Commerce).
        *   **Vérification :**
            *   Observer qu'une notification de mise à jour est affichée.
            *   Vérifier que la page se recharge automatiquement.
            *   Après la mise à jour (si elle réussit), vérifier que la fonctionnalité peut à nouveau lire et interpréter correctement les données, même avec l'ancien format (si la nouvelle version de l'extension gère la rétrocompatibilité). Si la rétrocompatibilité n'est pas gérée, la fonctionnalité devrait afficher un message d'erreur clair ou ne pas fonctionner pour les données de l'ancien format.
*   **4.3 Scénario : ajout de l'id de section version à l'UI et mise à jour auto**
*   **4.4 Scénario : vérifier que verifierSujetMembre se comporte comme une fonctionnalité**

## Avancement

*   **1. Préparation et Structures de Données**
    *   **1.1 Création du fichier de versions minimales internes (`js/data/versions_minimales.json`)**
        *   **Action 1.1.1 : Créer le fichier `js/data/versions_minimales.json`**: Terminé. Le fichier a été créé et la clé `global.forum` a été renommée en `global.section`.
    *   **1.2 Création du fichier de liens fonctionnalités/fonctions/parties du forum (`js/data/liens_fonctionnalites.json`)**
        *   **Action 1.2.1 : Créer le fichier `js/data/liens_fonctionnalites.json`**: Terminé. Le fichier a été créé.
    *   **1.3 Mise à jour de `manifest.json`**
        *   **Action 1.3.1 : Ajouter les nouveaux fichiers de données à `manifest.json`**: Non nécessaire, les fichiers sont déjà inclus via `js/*`.

*   **2. Logique de Gestion des Versions**
    *   **2.1 Création de la classe `VersionManager` (`js/class/VersionManager.js`)**
        *   **Action 2.1.1 : Créer le fichier `js/class/VersionManager.js`**: Terminé.
        *   **Action 2.1.2 : Implémenter le constructeur de `VersionManager`**: Terminé. Le constructeur récupère dynamiquement la version de l'extension et charge les fichiers de données.
        *   **Action 2.1.3 : Implémenter la méthode `calculerVersionMinimaleReelle(cheminPartieForum)`**: Terminé. La méthode calcule correctement la version minimale réelle en tenant compte des contenances amont et aval, comme spécifié dans le fonctionnement détaillé. Des fonctions auxiliaires (`getVersionFromPath`, `getContenancesAmont`, `getContenancesAval`) ont été ajoutées pour structurer la logique.
        *   **Action 2.1.4 : Implémenter la méthode `checkVersion(pageForumInstance, fonctionACallback)`**: Terminé. La méthode gère l'incompatibilité de version, utilise `chrome.runtime.requestUpdateCheck` pour vérifier la disponibilité d'une mise à jour avant de tenter un rechargement de l'extension, et affiche des notifications appropriées. Si aucune mise à jour n'est disponible ou si la fonction `requestUpdateCheck` n'est pas supportée, un message d'erreur persistant est affiché sans rechargement, assurant un échec propre et la poursuite de l'exécution. Le paramètre `isBackgroundTask` a été supprimé.
    *   **2.2 Modification de la classe `PageForum` (dans `js/page/Forum.js`)**
        *   **Action 2.2.1 : Ajouter une propriété pour stocker les versions du forum (`this.versionsForum = {};`)**: Terminé.
        *   **Action 2.2.2 : Implémenter la méthode `updateVersionSection()` dans `PageForum`**:
            *   **Sous-action 2.2.2.1 : Extraire les versions existantes du forum**: Terminé. La logique de parsing a été adaptée au nouveau format de titre des sujets (`"global / section=1.0.0 / titres=1.0.0 / contenus=1.0.0"`).
            *   **Sous-action 2.2.2.2 : Comparer et mettre à jour les versions**: Terminé. La logique de comparaison avec les versions internes et de mise à jour des sujets sur le forum (création/modification) a été implémentée, ainsi que l'affichage des notifications. La génération des titres de sujets respecte le nouveau format.
    *   **2.3 Implémentation de la fonction de vérification de versions (`checkVersion`)**: Terminé (couvert par 2.1.4).

*   **Ajout de `Utils.compareVersions` à `js/class/Utils.js`**: Terminé.

*   **Prochaines étapes :**
    *   **3. Intégration dans le Code Existant**
        *   **3.1 Modification de `js/page/Forum.js` pour la mise en place du SdC**
        *   **3.2 Modification des pages de fonctionnalité**
Tests 4.1 et 4.3 validés.
Test 4.2.1 validé dans la limite du possible, car la mise à jour auto n'est pas possible.