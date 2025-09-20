# Documentation des Bonnes Pratiques et Points de Vigilance du Framework Outiiil

Ce document fournit des lignes directrices pour le développement de nouvelles fonctionnalités et la maintenance du framework Outiiil, en mettant l'accent sur la clarté, la robustesse et l'utilisation correcte des composants existants.

---

## 1. Ajout de Nouvelles Fonctionnalités

### 1.1 Fonctionnalités n'utilisant pas de données stockées sur le forum

Pour ajouter une fonctionnalité d'alliance qui ne persiste pas de données sur le forum :
- Implémentez la logique dans une classe héritant de `Page`.
- Ajoutez le point d'entrée (méthode) de cette fonctionnalité à la liste statique `FONCTIONNALITES_LOCALES` de la classe `Page` correspondante.

### 1.2 Fonctionnalités utilisant des données stockées sur le forum

Pour ajouter ou modifier une fonctionnalité d'alliance, un objet ou un paramètre qui utilise des données stockées sur le forum :
- **Fonctionnalité :** Créez une classe héritant de `FonctionnaliteAlliance`. Définissez son historique d'abréviations via la propriété statique `FonctionnaliteAlliance.ABREVIATIONS_HISTORY`.
    - Ajoutez cette classe à la liste statique `FONCTIONNALITES_ALLIANCE` de la classe `Page` correspondante.
- **Objet :** Créez une classe héritant de `ObjetForum`.
    - Définissez sa version logique via `ObjetForum.VERSION_LOGIQUE`.
    - Spécifiez l'historique de ses lieux de stockage via `ObjetForum.LOCATION_HISTORY`.
    - Déclarez les classes de paramètres qu'il utilise pour chaque version via `ObjetForum.CLASSES_PARAMETRES`.
    - Si l'objet contient d'autres `ObjetForum`, spécifiez la classe du sous-objet via `ObjetForum.classeObjetsForumContenus`.
- **Paramètre :** Créez une classe héritant de `ParametreObjetForum`.
    - Définissez son historique de noms via `ParametreObjetForum.NAME_HISTORY`.
    - Si le paramètre a des restrictions d'affichage, définissez `ParametreObjetForum.stringRestriction`.
    - La valeur par défaut du paramètre doit être initialisée directement dans la déclaration de la classe fille (ex: `valeur = 0;`).

### 1.3 Ajout d'une Nouvelle Classe de Page

Pour créer une nouvelle classe de page :
- Créez une classe héritant de `Page`.
- Définissez les fonctionnalités d'alliance spécifiques à cette page en ajoutant les classes `FonctionnaliteAlliance` à la liste statique `Page.FONCTIONNALITES_ALLIANCE`.
- Implémentez les fonctionnalités locales dans la classe.
- Définissez les fonctionnalités locales spécifiques à cette page en ajoutant les méthodes à la liste statique `Page.FONCTIONNALITES_LOCALES`.
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
- **Validation des actions :** Lors de la validation par le joueur d'une action entraînant une modification d'un `ObjetForum` qui dépend de son état actuel, vérifiez que la modification est correcte par rapport à l'objet actuel avant d'effectuer la modification.
- **Rechargement des données :**
    - À chaque clic dont l'action dépend d'un `ObjetForum` enregistré sur le forum, rechargez cet objet en utilisant `ObjetForum.rafraichir()` avant d'effectuer l'action.
    - Si l'action dépend de données de Fourmizzz (non stockées sur le forum), rechargez la page avant d'effectuer l'action.
- **Gestion des collisions :** Si des collisions sont avérées ou qu'une fonctionnalité a besoin de s'assurer qu'un `ObjetForum` n'est pas modifié pendant qu'elle l'utilise, introduisez un mécanisme d'anti-collision sur le forum (par exemple, via un flag de réservation sur l'objet forum).

---

## 5. Bonnes Pratiques de Développement

- **Organisation des fichiers :**
    - Placez les classes de `Page`, `FonctionnaliteAlliance`, `ObjetForum`, `ParametreObjetForum` dans leurs dossiers respectifs sous `js/class`.
    - Placez les gestionnaires (comme `GestionnaireDroits`, `GestionnaireVersions`) dans le dossier `js/class/framework`.
- **Création des objets :**
    - Créez les instances d'`ObjetForum` à l'intérieur de la classe `FonctionnaliteAlliance` (ou sa classe mère), dans un autre `ObjetForum` (via `objetsForumContenus`), ou dans la fonction d'initialisation de l'extension `initialiserFrameworkGlobal()` pour les objets globaux.
- **Initialisation des gestionnaires :** Pour un nouveau gestionnaire, il doit être créé dans la fonction d'initialisation et hériter d'`ObjetForum`, et spécifier sa section dans `ObjetForum.LOCATION_HISTORY`.
- **Unicité des historiques :**
    - Deux `ParametreObjetForum` ne doivent jamais avoir le même historique de noms (`ParametreObjetForum.NAME_HISTORY`).
    - Deux `ObjetForum` ne doivent jamais avoir le même historique de lieux (`ObjetForum.LOCATION_HISTORY`) et de classes de paramètres utilisés (`ObjetForum.CLASSES_PARAMETRES`).
- **Modification des historiques :**
    - Lors d'une modification de nom de paramètre, ajoutez le nouveau nom à sa liste statique `ParametreObjetForum.NAME_HISTORY`.
    - Lors d'une modification de lieu d'enregistrement d'un objet, ajoutez le nouveau lieu à sa liste statique `ObjetForum.LOCATION_HISTORY`.
    - Lors d'une modification des paramètres d'un objet, ajoutez le nouveau set de paramètres à sa liste statique `ObjetForum.CLASSES_PARAMETRES`.
- **Chargement des sous-objets :** Ne chargez les sous-objets (`ObjetForum.objetsForumContenus`) que lorsque cela est nécessaire pour réduire la latence.
- **Réutilisation des paramètres :** Ne réutilisez pas un `ParametreObjetForum` existant si sa signification change ; créez-en un nouveau.
- **Initialisation des pages :** Une classe `Page` doit surcharger la liste `FONCTIONNALITES_ALLIANCE` de la classe mère et invoquer `Page.init()` pour lancer les fonctionnalités.
- **Version de logique :** Lorsque la logique de fonctionnement d'un `ObjetForum` change suffisamment pour ne plus être compatible avec la logique précédente (tout changement faisant que dans des situations identiques, les paramètres ne seront pas censés prendre la même valeur), incrémentez la propriété statique `ObjetForum.VERSION_LOGIQUE`.
- **Enregistrement global :** Les `ObjetForum` et `FonctionnaliteAlliance` doivent être enregistrés dans l'objet `window` avec `Utils.register()`.
- **Accès aux valeurs des paramètres :** Toujours utiliser les méthodes `ObjetForum.lireParametre()`, `ObjetForum.lireChaqueParametre()`, `ObjetForum.ecrireParametre()`, `ObjetForum.ecrireChaqueParametre()`, ne jamais accéder directement à sa propriété `valeur`.
- **Ajout d'une fonctionnalité modifiant les droits accumulés :** Modifier directement depuis les fonctionnalités concernées au moment de l'opération, ne pas compter sur le script de fond de mise à jour à chaque récolte.


### 5.4 Compléments de Chargement et d'Affichage

Le framework `ObjetForum` offre des méthodes de "complément" qui peuvent être surchargées dans les classes filles pour injecter une logique spécifique à différentes étapes du cycle de vie de l'objet, sans modifier le comportement de base du framework.

*   **`completerChargementPourVersionsAnterieures()`**
    *   **Objectif :** Gérer la migration des données lors du chargement d'une version antérieure de l'objet.
    *   **Utilisation :** Cette méthode est appelée par `ObjetForum.chargerDepuisString()` après que les paramètres de l'objet aient été chargés depuis une chaîne. Elle permet de calculer et de peupler les paramètres des versions récentes à partir des données d'une version plus ancienne.
    *   **Bonne Pratique :** Utilisez `this._determinerVersionChargee()` pour identifier la version chargée et un `switch` pour implémenter la logique de migration spécifique à chaque version. Utilisez `this.ecrireParametre()` pour mettre à jour les valeurs des paramètres afin de garantir que l'état `estModifie` est correctement géré.
    ```javascript
    completerChargementPourVersionsAnterieures() {
        let versionActuelle = this._determinerVersionChargee();
        const versionCible = this.constructor.CLASSES_PARAMETRES.length - 1;

        // Boucle tant que nous n'avons pas atteint la dernière version
        while (versionActuelle < versionCible && versionActuelle !== -1) {
            switch (versionActuelle) {
                case 0:
                    // Logique pour migrer de la v0 à la v1
                    console.log('Migration de v0 à v1...');
                    // ... mettre à jour les paramètres de la v1 en utilisant this.ecrireParametre() ...
                    break; // On sort du switch pour la v0

                case 1:
                    // Logique pour migrer de la v1 à la v2
                    console.log('Migration de v1 à v2...');
                    // ... mettre à jour les paramètres de la v2 en utilisant this.ecrireParametre() ...
                    break; // On sort du switch pour la v1
            }
            
            // Incrémenter la version pour la prochaine itération de la boucle
            versionActuelle++; 
        }
    }
    ```

*   **`completerRafraichissement()`**
    *   **Objectif :** Ajouter une logique spécifique à la fin du processus de rafraîchissement d'un objet.
    *   **Utilisation :** Cette méthode est appelée par `ObjetForum.rafraichir()` après que le titre du sujet et les objets contenus aient été chargés. Elle est utile pour charger des attributs supplémentaires de la classe fille qui ne sont pas des `ParametreObjetForum` ou des `ObjetForum` contenus.

*   **`completerAffichage(donnees)`**
    *   **Objectif :** Modifier ou ajouter des données avant l'affichage HTML.
    *   **Utilisation :** Cette méthode est appelée par `ObjetForum.afficher()` juste avant la génération du HTML. Elle reçoit un dictionnaire des données des `ParametreObjetForum` et permet d'ajouter des attributs calculés ou de modifier les valeurs existantes avant qu'elles ne soient rendues.

### 5.5 Définition d'Attributs Calculés

Pour définir des attributs dont la valeur est dérivée d'autres paramètres et qui doivent respecter les restrictions de droits, utilisez la méthode protégée `_invoquerCalculSecurise()`.

*   **`_invoquerCalculSecurise(methodeCalcul)`**
    *   **Objectif :** Invoquer de manière sécurisée une méthode de calcul d'un attribut dérivé. Gère automatiquement les droits d'accès et les erreurs de calcul (notamment dues à des données restreintes).
    *   **Utilisation :**
        1.  Définissez une méthode privée dans votre classe fille qui contient la logique de calcul de l'attribut. Cette méthode doit prendre un argument `peutVoirDonneesRestreintes` (un booléen) qui indique si l'utilisateur a les droits suffisants pour voir les données normales.
        2.  Dans cette méthode de calcul, utilisez `this.lireParametre()` (ou `this.lireChaqueParametre()` éventuellement) pour accéder aux valeurs des paramètres nécessaires au calcul. Si `peutVoirDonneesRestreintes` est `false`, `lire(Chaque)Parametre()` lèvera une `ErreurRestriction` si le paramètre est restreint.
        3.  Appelez `_invoquerCalculSecurise()` en lui passant votre méthode de calcul liée à l'instance de l'objet (`votreMethodeDeCalcul.bind(this)`).
    *   **Exemple :**
        ```javascript
        class MonObjetForum extends ObjetForum {
            // ... autres attributs et méthodes ...

            async completerAffichage(donnees) {
                donnees['new'] = await this._invoquerCalculSecurise(this._calculerMonAttribut.bind(this));
                return donnees
            }

            async _calculerMonAttribut(peutVoirDonneesRestreintes) {
                return await this.lireParametre('Quantité', peutVoirDonneesRestreintes) * await this.lireParametre('PrixUnitaire', peutVoirDonneesRestreintes);
            }
        }
        ```
    *   **Gestion des retours :** `_invoquerCalculSecurise()` retournera :
        *   La valeur calculée si tout est en ordre.
        *   La chaîne `'<i>Restreint</i>'` si une `ErreurRestriction` est levée (indiquant que des données sous-jacentes sont restreintes).
        *   La chaîne `'<i>Incalculable</i>'` si le calcul aboutit à `NaN`, `null` ou `undefined` sans lever d'erreur.

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
2.  Pour chaque fonctionnalité, il génère à la volée une classe `ParametreDroit` sur mesure, configurée avec l'historique des formats et des abréviations de la fonctionnalité (`FonctionnaliteAlliance.ABREVIATIONS_HISTORY`).
3.  Toutes ces classes de paramètres sont ensuite regroupées pour définir la structure de la classe `ObjetForumDroits`, également créée dynamiquement.

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

**Contexte :** Le framework utilise un forum comme système de stockage, ce qui n'offre pas les garanties d'une base de données traditionnelle (comme les transactions atomiques ou le verrouillage de bas niveau).

#### 7.2.1 Risque de Conditions de Concurrence (`Race Conditions`)

*   **Scénario :** Deux processus (par exemple, deux utilisateurs différents) tentent de modifier la même ressource sur le forum quasi-simultanément.
    *   *Exemple 1 :* Deux extensions à jour détectent une version obsolète d'un paramètre sur le forum et essaient de mettre à jour le titre du sujet de version en même temps.
    *   *Exemple 2 :* Deux nouveaux membres sont ajoutés à l'alliance, et le système tente de créer leurs objets de droits respectifs en parallèle.
*   **Impact :** Dans la plupart des cas prévus par le framework, l'impact est bénin. La seconde écriture écrasera la première avec des données identiques. Cependant, cela constitue une faille de conception théorique.
*   **Mesure :** Le système est conçu pour être "idempotent" : une opération répétée plusieurs fois produit le même résultat que si elle n'était exécutée qu'une seule fois. Il n'y a pas de verrouillage possible, donc la robustesse repose sur cette idempotence.

#### 7.2.2 Absence de Transactions Atomiques

*   **Scénario :** Une opération métier complexe nécessite plusieurs écritures séquentielles sur le forum (par exemple, la création d'un `ObjetForum` principal dans un sujet, puis de ses 3 sous-objets dans des messages).
*   **Risque :** Si une des écritures intermédiaires échoue (à cause d'une erreur réseau, d'une déconnexion, etc.), le système se retrouve dans un **état incohérent**. Les premières données sont écrites, mais pas les dernières.
*   **Mesure :**
    *   C'est une limitation inhérente à l'architecture. Il n'y a pas de mécanisme de "rollback" (annulation).
    *   La logique de chargement (`ObjetForum.chargerDepuisString()`, `ObjetForum.chargerObjetForumsContenus()`) doit être suffisamment robuste pour gérer des données partiellement écrites (par exemple, en ignorant les objets conteneurs qui n'ont pas tous leurs enfants attendus).
    *   Pour les opérations les plus critiques, il pourrait être envisagé d'ajouter une étape de validation post-écriture ou un flag "opération_terminée" pour marquer la complétude d'une écriture multi-étapes.
