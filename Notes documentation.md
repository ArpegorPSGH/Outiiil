# Documentation des Bonnes Pratiques et Points de Vigilance du Framework Outiiil

Ce document fournit des lignes directrices pour le développement de nouvelles fonctionnalités et la maintenance du framework Outiiil, en mettant l'accent sur la clarté, la robustesse et l'utilisation correcte des composants existants.

L'extension est destinée à être déployée et testée sur les plateformes suivantes : Windows, macOS, Linux, Android et iPhone.

---

## 1. Ajout de Nouvelles Fonctionnalités

### 1.1 Fonctionnalités n'utilisant pas de données stockées sur le forum

Pour ajouter une fonctionnalité qui ne persiste pas de données sur le forum :
- Implémentez la logique dans une classe héritant de `Page` qui sera utilisée sur la page souhaitée.
- Ajoutez le point d'entrée (méthode) de cette fonctionnalité à la liste statique `FONCTIONNALITES_LOCALES` de la classe `Page` correspondante.

### 1.2 Fonctionnalités utilisant des données stockées sur le forum

Pour ajouter ou modifier une fonctionnalité d'alliance, un objet ou un paramètre qui utilise des données stockées sur le forum :
- **Fonctionnalité :** Créez une classe héritant de `FonctionnaliteAlliance`. Définissez son historique d'abréviations via la propriété statique `FonctionnaliteAlliance.ABREVIATIONS_HISTORY`.
    - Ajoutez cette classe à la liste statique `FONCTIONNALITES_ALLIANCE` de la classe `Page` correspondante.
- **Objet :** Créez une classe héritant de `ObjetForum`.
    - Définissez sa version logique via `ObjetForum.VERSION_LOGIQUE`.
    - Spécifiez l'historique de ses lieux de stockage via `ObjetForum.LOCATION_HISTORY`.
    - Déclarez les classes d'attributs qu'il utilise via `ObjetForum.ATTRIBUTS_OBJET`.
    - Déclarez les classes de paramètres qu'il utilise pour chaque version via `ObjetForum.PARAMETRES_OBJET`.
    - Si l'objet contient d'autres `ObjetForum`, spécifiez la classe du sous-objet via `ObjetForum.classeObjetsForumContenus`.
    - **Auteur et Date :** Chaque objet doit posséder des paramètres définissant son auteur et sa date, à moins qu'il ne soit possible de les récupérer par un autre moyen (ex: le recensement dont l'auteur est le joueur qui le contient).
- **Paramètre / Attribut :** Créez une classe héritant de `ParametreObjetForum` ou `AttributObjet`.
    - **Pour un paramètre :**
        - Définissez sa version logique via `ParametreObjetForum.VERSION_LOGIQUE`.
        - Définissez son historique de formats via `ParametreObjetForum.FORMAT_HISTORY`. Chaque élément est un objet de la forme `{ nom: 'NomDuParam', format: 'un string contenant "(nom)" et "(valeur)"' }`.
        - Si le paramètre a des restrictions d'affichage, définissez `ParametreObjetForum.stringRestriction`.
        - **Format d'affichage personnalisé :** Définissez `DonneeValidable.FORMAT_AFFICHAGE` (ex: `'D MMM [à] HH[h]mm'`). Pour les dates (`moment`), si cette propriété est nulle, le format global `window.FORMAT_DATE_DEFAUT` (défini dans `main.js`) est appliqué.
        - La valeur par défaut du paramètre doit être initialisée directement dans la déclaration de la classe fille (ex: `valeur = 0;`). Un paramètre ne peut contenir que des listes, des dictionnaires, ou des types primitifs (nombre, chaîne, booléen), peu importe le niveau de nesting.
    - **Pour un attribut :**
        - Définissez son nom d'affichage via `AttributObjet.NOM_AFFICHAGE` (une liste de chaînes).
        - (Optionnel) Définissez ses alias d'appel via `AttributObjet.NOM_APPEL`.
        - **Format d'affichage personnalisé :** Comme pour les paramètres, définissez `DonneeValidable.FORMAT_AFFICHAGE` pour surcharger le format par défaut des dates.
        - Pour un attribut calculé, surchargez la méthode `calculerValeur(peutVoirDonneesRestreintes)`.
        - La valeur par défaut d'un attribut statique doit être initialisée dans `valeur`. Un attribut d'objet peut contenir n'importe quel type de données (y compris des instances de classes ou objets complexes).

### 1.3 Ajout d'une Nouvelle Classe de Page

Pour créer une nouvelle classe de page :
- Créez une classe héritant de `Page`.
- Définissez les fonctionnalités d'alliance et locales spécifiques à cette page en ajoutant les classes `FonctionnaliteAlliance` et les méthodes à la liste statique `Page.FONCTIONNALITES`.
- Implémentez les fonctionnalités locales dans la classe.
- Définissez l'adresse de la page via `Page.URIs`.
- Enregistrez la nouvelle classe de page dans l'objet `window` avec `Utils.register()`.

---

## 2. Ajout d'une Nouvelle Section

L'ajout de nouvelles sections sur le forum est géré automatiquement par le framework à partir des sections définies dans les `ObjetForum.LOCATION_HISTORY` des objets.

---

## 3. Modification d'un Format de Données du Forum

Lors des phases de test, si un format de données dans une section du forum change :
- Créez une nouvelle section sur le forum dédiée aux tests, dont le nom contient celle de l'originale à tester.
- Enregistrez l'ID de cette nouvelle section dans l'utilitaire de configuration pour qu'elle soit utilisée lors des tests.

---

## 4. Robustesse des Fonctionnalités

Pour garantir la robustesse des fonctionnalités :
- **Gestion du temps :** Assurez-vous que chaque fonctionnalité est robuste face à une imprécision d'une seconde sur la date d'arrivée prévue des convois, attaques et chasses.
- **Validation des actions :** Utilisez systématiquement le plugin `onActionSecurisee` (voir section 5.7) pour les boutons déclenchant des modifications sur le forum. Il automatise la vérification de l'intégrité des données, des droits et des versions juste avant l'exécution de l'action. Pour les actions complexes ne reposant pas exclusivement sur des `ObjetForum`, assurez-vous manuellement que les informations clés n'ont pas changé.
- **Actualisation des données :**
    - Pour un `ObjetForum`, actualisez cet objet en utilisant `ObjetForum.rafraichir()`.
    - Pour un objet classique, envoyez une (ou des) requête(s) ajax pour récupérer le contenu de la (ou des) page(s) actualisée(s), mais sans effectuer un rechargement visuellement.
- **Gestion des collisions :** Si des collisions sont avérées ou qu'une fonctionnalité a besoin de s'assurer qu'un `ObjetForum` n'est pas modifié pendant qu'elle l'utilise, introduisez un mécanisme d'anti-collision sur le forum (par exemple, via un flag de réservation sur l'objet forum).

---

## 5. Bonnes Pratiques de Développement

- **Organisation des fichiers :** L'arborescence des classes sous `js/class` doit suivre la structure suivante :
    - `framework/` : Contient les classes mères du framework (`Page`, `FonctionnaliteAlliance`, `ObjetForum`, `ParametreObjetForum`, `AttributObjet`, `Boite`, etc.) ainsi que les gestionnaires.
    - `page/` : Contient les classes qui héritent de `Page`.
    - `fonctionnalite/` : Contient les classes qui héritent de `FonctionnaliteAlliance`, regroupées dans des sous-dossiers nommés d'après la page à laquelle elles s'appliquent.
    - `objet/` : Contient les classes qui héritent de `ObjetForum`.
    - `parametre/` : Contient les classes qui héritent de `ParametreObjetForum`, regroupées dans des sous-dossiers nommés d'après l'objet auquel elles appartiennent.
    - `attribut/` : Contient les classes qui héritent de `AttributObjet`, regroupées dans des sous-dossiers nommés d'après l'objet auquel elles appartiennent.
    - `boite/` : Contient les classes qui héritent de `Boite`.
    - `autre/` : Contient les classes qui héritent de classes non définies dans les autres catégories.
- **Héritage et Formats :**
    - Les classes de paramètres, objets, fonctionnalités et pages doivent directement hériter de leurs classes mères respectives.
    - Les modifications de formats des paramètres (comme les formats de template string) ne doivent être effectuées que dans la classe mère des paramètres (`ParametreObjetForum`), et non dans les classes de paramètres filles.
- **Accès au forum :** Ne jamais accéder au forum avec un `ObjetForum` créé à l'extérieur d'une `FonctionnaliteAlliance`. Ces instances doivent être créées à l'intérieur de la fonctionnalité (ou sa classe mère), dans un autre `ObjetForum` (via `objetsForumContenus`), ou dans `initialiserFrameworkGlobal()` pour les objets globaux.
- **Manipulation des sujets/messages :** Ne jamais créer, modifier ou supprimer un sujet ou un message sur le forum sans passer par les fonctions dédiées de l'objet (`ObjetForum`).
- **Initialisation des gestionnaires :** Pour un nouveau gestionnaire, il doit être créé dans la fonction d'initialisation et hériter d'`ObjetForum`, et spécifier sa section dans `ObjetForum.LOCATION_HISTORY`.
- **Unicité des historiques :**
    - Le premier format de `ParametreObjetForum.FORMAT_HISTORY` sert d'ancre unique pour un paramètre. Deux classes de paramètres ne doivent jamais partager la même ancre.
    - Le premier lieu de `ObjetForum.LOCATION_HISTORY` et le premier set de `ObjetForum.PARAMETRES_OBJET` servent d'ancres uniques pour un objet. Deux classes d'objets ne doivent jamais partager les mêmes ancres.
- **Modification des historiques :**
    - Lors d'une modification de nom ou de format de paramètre, ajoutez un nouvel objet format `{ nom: '...', format: '...' }` à sa liste statique `ParametreObjetForum.FORMAT_HISTORY`.
    - Lors d'une modification de lieu d'enregistrement d'un objet, ajoutez le nouveau lieu à sa liste statique `ObjetForum.LOCATION_HISTORY`.
    - Lors d'une modification des paramètres d'un objet, ajoutez le nouveau set de paramètres à sa liste statique `ObjetForum.PARAMETRES_OBJET`.
- **Chargement des sous-objets :** Ne chargez les sous-objets (`ObjetForum.objetsForumContenus`) que lorsque cela est nécessaire pour réduire la latence.
- **Réutilisation des paramètres :** Ne réutilisez pas un `ParametreObjetForum` existant si sa signification change ; créez-en un nouveau.
- **Initialisation des pages :** Une classe `Page` doit surcharger la liste `FONCTIONNALITES_ALLIANCE` de la classe mère et invoquer `Page.init()` pour lancer les fonctionnalités.
- **Exécution des fonctionnalités :** Le run des fonctionnalités ne doit contenir que les opérations à effectuer séquentiellement au moment du chargement de la page, le reste devra être lancé dans des fonctions `async` non `await`-ées.
- **Version de logique :** Lorsque la logique de fonctionnement d'un `ObjetForum` ou d'un `ParametreObjetForum` change suffisamment pour ne plus être compatible avec la logique précédente, incrémentez sa propriété statique `VERSION_LOGIQUE`. Pour un `ObjetForum`, cela concerne des situations où, dans des conditions identiques, les paramètres ne seraient plus censés prendre la même valeur. Pour un `ParametreObjetForum`, cela s'applique quand une même valeur brute est traitée différemment.
- **Enregistrement global :** Les `ObjetForum` et `FonctionnaliteAlliance` doivent être enregistrés dans l'objet `window` avec `Utils.register()`.
- **Accès aux valeurs des paramètres :** Toujours utiliser les méthodes `ObjetForum.lire()` et `ObjetForum.ecrire()`. Ces méthodes délèguent aux méthodes `lire()` et `ecrire()` de `ParametreObjetForum`, qui gèrent la concurrence via un système de verrous (locks) et assurent la validation des types de données. Ne jamais accéder directement à la propriété `valeur` d'un paramètre.
- **Ajout d'une fonctionnalité modifiant les droits accumulés :** Modifier directement depuis les fonctionnalités concernées au moment de l'opération, ne pas compter sur le script de fond de mise à jour à chaque récolte.
- **Mise à jour de la documentation :** Après chaque fonctionnalité implémentée, assurez-vous de mettre à jour la documentation (si nécessaire) pour refléter les changements et les nouvelles pratiques.
- **Gestion des droits d'administration Fourmizzz :** Il n'est pas nécessaire de surcharger la méthode `verifierDroits()` dans les classes héritant de `FonctionnaliteAlliance` pour gérer les droits d'administration Fourmizzz. La vérification est déjà incluse et délègue à la méthode `estAdminFourmizzz()` de la classe `Page` qui lance la fonctionnalité. Il suffit donc d'implémenter correctement la vérification dans la classe fille de `Page` concernée.

### 5.3 Configuration des Formats d'Enregistrement

Le framework offre des propriétés statiques pour contrôler la manière dont les objets sont formatés lors de leur enregistrement sur le forum. Ces propriétés sont essentielles pour structurer les données de manière lisible.


*   **`ObjetForum.SEPARATEUR_PARAMETRES`**
    *   **Objectif :** Définir la chaîne de caractères utilisée pour séparer les différents paramètres d'un `ObjetForum` lors de leur concaténation pour l'enregistrement. Ceci est purement cosmétique.
    *   **Utilisation :** Permet de contrôler la mise en page des paramètres dans le titre du sujet ou le message.
    *   **Exemple :** `static SEPARATEUR_PARAMETRES = '\n';` (chaque paramètre sur une nouvelle ligne)

#### 5.3.1 Limites de Caractères à l'Enregistrement

Lors de l'enregistrement des objets sur le forum (via la méthode `enregistrerSurForum`), le framework valide la longueur de la chaîne d'enregistrement générée :
*   **Titre de sujet (`lieu === 'titre'`) :** La longueur de la chaîne d'enregistrement ne doit pas dépasser **240** caractères, sous peine de lever une erreur.
*   **Message (`lieu === 'message'`) :** La longueur de la chaîne d'enregistrement ne doit pas dépasser **61495** caractères, sous peine de lever une erreur.

### 5.4 Complément de Chargement

Le framework `ObjetForum` offre des méthodes de "complément" qui peuvent être surchargées dans les classes filles pour injecter une logique spécifique à différentes étapes du cycle de vie de l'objet, sans modifier le comportement de base du framework.

*   **`completerChargementPourVersionsAnterieures()`**
    *   **Objectif :** Gérer la migration des données lors du chargement d'une version antérieure de l'objet.
    *   **Utilisation :** Cette méthode est appelée par `ObjetForum.chargerDepuisString()` après que les paramètres de l'objet aient été chargés depuis une chaîne. Elle permet de calculer et de peupler les paramètres des versions récentes à partir des données d'une version plus ancienne.
    *   **Bonne Pratique :** Utilisez `this._determinerVersionChargee()` pour identifier la version chargée et un `switch` pour implémenter la logique de migration spécifique à chaque version. Utilisez `this.ecrire()` pour mettre à jour les valeurs des paramètres afin de garantir que l'état `estModifie` est correctement géré.
    ```javascript
    completerChargementPourVersionsAnterieures() {
        let versionActuelle = this._determinerVersionChargee();
        const versionCible = this.constructor.PARAMETRES_OBJET.length - 1;

        // Boucle tant que nous n'avons pas atteint la dernière version
        while (versionActuelle < versionCible && versionActuelle !== -1) {
            switch (versionActuelle) {
                case 0:
                    // Logique pour migrer de la v0 à la v1
                    console.log('Migration de v0 à v1...');
                    // ... mettre à jour les paramètres de la v1 en utilisant this.ecrire() ...
                    break; // On sort du switch pour la v0

                case 1:
                    // Logique pour migrer de la v1 à la v2
                    console.log('Migration de v1 à v2...');
                    // ... mettre à jour les paramètres de la v2 en utilisant this.ecrire() ...
                    break; // On sort du switch pour la v1
            }
            
            // Incrémenter la version pour la prochaine itération de la boucle
            versionActuelle++; 
        }
    }
    ```

*   **`_migrerValeur(valeurChargee)` (dans `ParametreObjetForum`)**
    *   **Objectif :** Convertir une valeur de paramètre chargée depuis le forum d'un ancien format ou d'une ancienne valeur vers le format et la valeur actuels attendus par la classe fille.
    *   **Utilisation :** Cette méthode est appelée par `ParametreObjetForum.chargerDepuisString()` juste après le parsing initial de la valeur. Elle doit être surchargée dans les classes filles lorsque le format interne (type de contenant) ou la signification de la valeur du paramètre change.
    *   **Fonctionnement :**
        1.  La méthode reçoit `valeurChargee`, qui est la valeur brute parsée depuis le forum (souvent une chaîne, un nombre, un booléen, ou un objet/tableau si le JSON a été parsé).
        2.  La classe fille doit implémenter la logique de conversion pour transformer `valeurChargee` en un format et une valeur compatibles avec la propriété `valeur` actuelle de l'instance.
        3.  Le framework tentera ensuite de valider et de caster la valeur retournée par `_migrerValeur` avec la méthode `_checkValeur`.
    *   **Exemple (migration d'une valeur primitive vers un dictionnaire, et conversion de valeur) :**
        ```javascript
        class MonParametreMigrable extends ParametreObjetForum {
            static VERSION_LOGIQUE = '2.0'; // Incrémenter la version logique si le format ou la valeur change
            static FORMAT_HISTORY = [{ nom: 'MonParam', format: '(nom): (valeur) |' }];
            valeur = { 'cle1': 0, 'cle2': '' }; // Nouveau format: dictionnaire

            async _migrerValeur(valeurChargee) {
                // Migration de type de contenant (primitive vers dictionnaire)
                if (typeof valeurChargee === 'number') {
                    return { 'cle1': valeurChargee, 'cle2': 'valeur par défaut' };
                }
                // Migration de valeur (ex: 'a' en 0, 'b' en 1)
                if (typeof valeurChargee === 'string') {
                    switch (valeurChargee.toLowerCase()) {
                        case 'a': return 0;
                        case 'b': return 1;
                        default: return valeurChargee; // Retourne la valeur telle quelle si pas de correspondance
                    }
                }
                // Si c'est déjà un dictionnaire ou un autre type, le retourner tel quel
                return valeurChargee;
            }
        }
        ```
    *   **Bonne Pratique :** Incrémentez `VERSION_LOGIQUE` de la classe de paramètre lorsque vous modifiez son format interne ou la signification de ses valeurs, et implémentez `_migrerValeur` pour assurer la rétro-compatibilité.

*   **`completerRafraichissement()`**
    *   **Objectif :** Ajouter une logique spécifique à la fin du processus de rafraîchissement d'un objet.
    *   **Utilisation :** Cette méthode est appelée par `ObjetForum.rafraichir()` après que le titre du sujet et les objets contenus aient été chargés. Elle est utile pour charger des attributs supplémentaires de la classe fille qui ne sont pas des `ParametreObjetForum` ou des `ObjetForum` contenus.

### 5.5 Définition d'un `AttributObjet`

Les attributs permettent d'ajouter des données à un `ObjetForum` qui ne sont pas persistées directement comme paramètres sur le forum. Ils peuvent être statiques (pour stocker une information temporaire) ou calculés (dérivés d'autres paramètres).

*   **Création :** Créez une classe héritant de `AttributObjet` dans le dossier `js/class/attribut/`.
*   **`NOM_AFFICHAGE` :** Liste (tableau) des noms utilisés pour l'en-tête des tableaux. Le dernier élément est le nom actuel.
*   **`NOM_APPEL` :** (Optionnel) Liste des noms permettant d'appeler l'attribut via `objet.lire('Nom')`.
*   **`calculerValeur(peutVoirDonneesRestreintes)` :**
    *   **Objectif :** Définir la logique de calcul pour un attribut dérivé.
    *   **Fonctionnement :** Cette méthode est appelée automatiquement par `lire()`. Elle reçoit `peutVoirDonneesRestreintes` pour gérer la sécurité.
    *   **Bonne Pratique :** Utilisez `this.objetParent.lire()` pour accéder aux dépendances. Le framework gère automatiquement les `ErreurRestriction` levées par les dépendances restreintes si l'utilisateur n'a pas les droits.

*   **Exemple d'Attribut Calculé :**
    ```javascript
    class Coordonnees extends AttributObjet {
        static NOM_AFFICHAGE = ['Coordonnées'];

        async calculerValeur(peutVoirDonneesRestreintes) {
            // Accès sécurisé aux paramètres de l'objet parent
            const { x, y } = await this.objetParent.lire(['X', 'Y'], peutVoirDonneesRestreintes);
            return `(${x}, ${y})`;
        }
    }
    ```

*   **Enregistrement dans l'Objet :**
    ```javascript
    class MonObjet extends ObjetForum {
        static ATTRIBUTS_OBJET = [Coordonnees];
        // ...
    }
    ```

*   **Gestion des Retours :** Le framework (via `_invoquerCalculSecurise` interne à `AttributObjet`) retourne :
    *   La valeur calculée si tout est en ordre.
    *   La chaîne `'Restreint'` (ou la valeur de `STRING_RESTRICTION`) si une donnée dépendante est restreinte.
    *   La chaîne `'<i>Incalculable</i>'` si le calcul produit `NaN`, `null` ou `undefined` sans lever d'erreur.

### 5.6 Affichage de Données en Colonnes Multiples

La méthode `ObjetForum.afficher()` gère l'affichage de données en colonnes multiples.

*   **Fonctionnement :**
    1.  Si la valeur d'un `ParametreObjetForum` est un tableau, `afficher()` génère une cellule d'en-tête (`<th>`) avec un `colspan` égal à la taille du tableau (ou `1` si vide).
    2.  Chaque élément du tableau est affiché dans une cellule `<td>` distincte. Si le tableau est vide, une seule cellule `<td></td>` est générée.
    3.  Les paramètres manquants ou les valeurs `null`/`undefined` sont affichés comme des cellules vides.

### 5.7 Sécurisation des Actions (onActionSecurisee)

Pour prévenir les conflits de modification et l'utilisation de données périmées lors d'une action utilisateur (ex: clic sur un bouton d'enregistrement), le framework propose un plugin jQuery dédié.

*   **Plugin :** `$.fn.onActionSecurisee(evenement, fonctionnalite, callback)`
*   **Objectif :** Garantir que l'état local des données (`ObjetForum`) et les pré-requis (droits, versions, appartenance à l'alliance) sont identiques à ceux présents sur le forum au moment exact de l'action.
*   **Fonctionnement :**
    1. Intercepte et bloque l'événement initial (ex: clic).
    2. Identifie automatiquement tous les types d'objets forum et les signatures de chargement utilisés par la fonctionnalité (via une analyse AST des appels à `chargerObjetsForum`).
    3. Effectue un rafraîchissement forcé des conditions initiales via `verifierConditionsInitiales(true)` (rechargement des gestionnaires de droits/versions et de la liste des membres).
    4. Compare l'empreinte (fingerprint) de l'état actuel des objets en cache avec une version fraîchement rechargée depuis le forum.
    5. Si une divergence est détectée (donnée modifiée par un tiers, droits révoqués ou version obsolète), l'action est annulée, un toast d'avertissement est affiché, et la page est rechargée.
    6. Si tout est conforme, l'événement original est redéclenché avec un flag de sécurité (`isSecured: true`) pour permettre l'exécution du callback.
*   **Mode d'utilisation :**
    Remplacez les écouteurs d'événements classiques sur les éléments déclenchant des écritures sur le forum :
    ```javascript
    // Ancienne méthode (non sécurisée face aux données périmées)
    $('#monBouton').on('click', () => this.maMethodeDAction());

    // Nouvelle méthode sécurisée
    $('#monBouton').onActionSecurisee('click', this, (e) => this.maMethodeDAction(e));
    ```
*   **Points de vigilance :**
    - L'analyse AST détecte les dépendances dans la classe actuelle et sa classe parente.
    - Seuls les objets chargés via `chargerObjetsForum` sont inclus dans l'empreinte automatique.

---

## 6. Points de Fragilité

- **Dépendances d'objets non déclarées :** Si un `ObjetForum` est utilisé dans un autre `ObjetForum` sans être un objet contenu (`ObjetForum.objetsForumContenus`) et sans être utilisé par les fonctionnalités (`FonctionnaliteAlliance.objetsDependants`), alors il faudra revoir la fonction de vérification de version de l'objet (`ObjetForum.verifierVersionSuffisanteEtPresenceSection`), probablement en utilisant un AST avec `acorn`.

---

## 7. Documentation des Points de Vigilance du Framework

Ce document détaille les explications pour les points de vigilance identifiés lors de l'analyse du plan de refonte du framework.

---

### 7.1 Documentation sur la Métaprogrammation du `GestionnaireDroits`

**Contexte :** Le `GestionnaireDroits` utilise une approche de métaprogrammation pour créer dynamiquement les classes `ObjetForumDroits` et `ParametreDroit` à l'initialisation.

**Fonctionnement :**
1.  Au démarrage, il découvre toutes les `FonctionnaliteAlliance` existantes via un registre global (`registreClasses.FonctionnaliteAlliance`).
2.  Il crée dynamiquement une classe `ParametrePseudo` pour stocker le pseudo du joueur.
3.  Pour chaque fonctionnalité découverte, il génère à la volée une classe `ParametreDroit` sur mesure. L'historique des formats (`FORMAT_HISTORY`) de ce paramètre est construit en combinant les templates de format de `GestionnaireDroits.FORMAT_HISTORY` avec chaque abréviation de `FonctionnaliteAlliance.ABREVIATIONS_HISTORY`.
4.  Toutes ces classes de paramètres (`ParametrePseudo` et tous les `ParametreDroit`) sont ensuite regroupées pour définir la structure de la classe `ObjetForumDroits`, également créée dynamiquement.

**Avantages :**
*   **Flexibilité Extrême :** L'ajout d'une nouvelle `FonctionnaliteAlliance` ne requiert aucune modification manuelle du système de droits. Le framework la découvre et s'adapte automatiquement.
*   **Centralisation :** La logique de création des droits est entièrement contenue dans le `GestionnaireDroits`.

**Risques et Complexité :**
*   **Courbe d'apprentissage :** Ce mécanisme est puissant mais abstrait. Un développeur non familier avec le code devra investir du temps pour comprendre cette génération dynamique avant de pouvoir intervenir dessus.
*   **Débogage :** Le débogage peut être complexe car les classes manipulées n'existent pas de manière statique dans le code ; elles sont construites à l'exécution.

**Recommandation :**
Ce mécanisme doit être accompagné de commentaires détaillés directement dans le constructeur de `GestionnaireDroits` pour guider la maintenance future.

---

### 7.2 Notes sur la Robustesse : Concurrence et Transactions

**Contexte :** Le framework utilise un forum comme système de stockage, ce qui n'offre pas les garanties d'une base de données traditionnelle. Pour pallier cela, un système de verrous (locks) a été implémenté pour gérer la concurrence d'accès depuis un même utilisateur.

#### 7.2.1 Gestion de la Concurrence par Verrous

Pour éviter les conditions de concurrence (`race conditions`), le framework utilise deux niveaux de verrous asynchrones :

1.  **Verrou Global du `GestionnaireVersions` :**
    *   **Objectif :** Empêcher que deux onglets ou processus tentent de lire ou de modifier simultanément les sujets de version dans la section 'Versions Outiiil'.
    *   **Fonctionnement :** Le `GestionnaireVersions` possède un verrou unique. Toute opération (ex: `rafraichir`, `verifierCompatibiliteObjetForum`) doit d'abord acquérir ce verrou. Les demandes concurrentes sont mises en file d'attente et traitées séquentiellement, garantissant ainsi que les opérations sur la section des versions sont atomiques au niveau du gestionnaire.

2.  **Verrous par Instance de `ParametreObjetForum` :**
    *   **Objectif :** Gérer la concurrence au niveau de la lecture et de l'écriture de la valeur d'un paramètre individuel.
    *   **Fonctionnement :** Chaque instance de `ParametreObjetForum` dispose d'un mécanisme de verrouillage sophistiqué :
        *   **Verrou de Lecture (`Lire`, `genererStringPourEnregistrement`) :** Plusieurs opérations de lecture peuvent avoir lieu en parallèle.
        *   **Verrou de Chargement (`chargerDepuisString`) :** Plusieurs opérations de chargement peuvent avoir lieu en parallèle, mais elles sont exclusives par rapport aux lectures et écritures.
        *   **Verrou Exclusif (`Ecrire`) :** Une seule opération d'écriture est autorisée à la fois, et elle bloque toutes les autres opérations (lecture, chargement, autre écriture).
    *   **Prévention du "Starvation" :** Un système de files d'attente priorise les écritures pour éviter qu'un flux constant de lectures n'empêche indéfiniment une écriture de s'exécuter.

Grâce à ces mécanismes, les risques de corruption de données dus à des accès concurrents (par exemple, deux processus mettant à jour une version en même temps) sont considérablement réduits.

#### 7.2.2 Transactions sur un Objet Unique (et ses objets contenus)

*   **Scénario :** Une opération métier complexe nécessite de modifier un `ObjetForum` et tous ses `objetsForumContenus` en une seule fois (par exemple, via la méthode `enregistrerSurForum`).
*   **Fonctionnement :** Le framework traite l'enregistrement d'un objet et de ses enfants comme une transaction unique. Il effectue toutes les écritures nécessaires sur le forum de manière séquentielle.
*   **Limites :**
    *   Cette atomicité est applicative, pas garantie par le système de stockage (le forum). Si une écriture intermédiaire échoue (erreur réseau, déconnexion), le système peut se retrouver dans un **état incohérent** (par exemple, l'objet parent est mis à jour mais pas ses enfants).
    *   La transaction ne s'applique nativement qu'à **un seul `ObjetForum` parent et ses descendants directs**.
*   **Mesure :**
    *   La logique de chargement (`ObjetForum.chargerDepuisString()`, `ObjetForum.chargerObjetForumsContenus()`) doit être conçue pour être robuste face à des données partiellement écrites.

#### 7.2.3 Système de Transactions Globales et Rollback (`Transaction.js`)

Pour des cas d'écriture complexes impliquant plusieurs objets ou des actions variées, le framework introduit un mécanisme de transactions globales et sécurisées à l'échelle de l'extension.

*   **Classe `Transaction` :**
    *   **Rôle :** Enregistre l'ensemble des opérations effectuées au cours d'un processus pour pouvoir les annuler en bloc si une erreur survient (Rollback).
    *   **Propriété globale `window.transaction` :** Stocke la transaction globale unique actuellement active sur l'extension.
    *   **Enregistrements supportés :**
        *   `enregistrerCreation(objet)` : Conserve les objets créés.
        *   `enregistrerModification(objet)` : Conserve l'objet et son `stringInitial` d'origine pour pouvoir le restaurer.
        *   `enregistrerTransfert(objet)` : Conserve l'objet transféré pour le replacer dans sa section originale.
        *   `enregistrerSuppression(objet)` : Conserve l'objet supprimé pour le recréer si nécessaire.
    *   **Méthode `annuler()` (Rollback) :** Exécute les opérations inverses dans l'ordre approprié pour remettre le forum dans son état initial en cas d'échec.

*   **Utilisation dans `FonctionnaliteAlliance` :**
    *   **Méthode `executerTransaction(callback)` :**
        *   Vérifie qu'aucune transaction n'est déjà en cours via l'existence de la transaction global `window.transaction` (si elle est active, bloque et affiche un message Toast d'attente).
        *   Instancie une transaction globale unique dans `window.transaction` (référencée directement partout dans le code par les `ObjetForum` et autres classes pour y enregistrer leurs opérations).
        *   Exécute la fonction asynchrone `callback` fournie.
        *   **En cas d'erreur :** Catch l'exception, déclenche automatiquement le rollback via `window.transaction.annuler()`, affiche une notification d'erreur Toast à l'utilisateur, déclenche un rechargement de la page après 3 secondes, réinitialise `window.transaction = null` et propage l'erreur.
    *   **Bonne Pratique pour le développeur :**
        *   **Périmètre :** Restreindre la portée des transactions au plus près autour des écritures sur le forum (et non englober de longs calculs ou requêtes préalables) afin de limiter la durée de verrouillage et de réduire le risque de collisions entre transactions concurrentes.
        *   **Lieu de déclaration :** Les transactions sont à déclarer exclusivement au niveau des fonctionnalités (classes héritant de `FonctionnaliteAlliance`) et des boîtes (classes héritant de `Boite`) appelées par ces fonctionnalités.
        *   **Pas d'action utilisateur dans la transaction :** Le callback exécuté au sein d'une transaction ne doit pas inclure la moindre action ou interaction de l'utilisateur (comme attendre la saisie d'un formulaire, une confirmation ou un clic). Toute interaction doit être gérée en amont.
        *   **Pas d'imbrication (nesting) :** Veiller à ne pas nester (imbriquer) des appels à `executerTransaction`. Si une fonction exécutant déjà une transaction en appelle une autre, s'assurer que cette dernière n'initie pas elle-même une nouvelle transaction imbriquée (ce qui lèverait une exception de transaction déjà en cours).
    *   **Exemple d'utilisation :**
        ```javascript
        await this.executerTransaction(async () => {
            // 1. Création, modification ou suppression d'objets forum
            const nouvelObjet = new MonObjet(this);
            await nouvelObjet.enregistrerSurForum(); // L'écriture s'enregistre dans la transaction

            // 2. Autre opération pouvant échouer
            await unAutreObjet.ecrire({ Parametre: 'Nouvelle valeur' });
            await unAutreObjet.enregistrerSurForum();
        });
        ```

#### 7.2.4 Recommandations à l'attention de l'utilisateur

*   **Enchaînement des actions :** L'utilisateur doit impérativement attendre le toast de confirmation d'une action avant d'en démarrer une autre ou de changer de page (ce qui est normalement déjà bloqué par le système de transactions). Cela permet de s'assurer que les opérations asynchrones et l'écriture des données sur le forum se terminent correctement sans interruption ni corruption.
