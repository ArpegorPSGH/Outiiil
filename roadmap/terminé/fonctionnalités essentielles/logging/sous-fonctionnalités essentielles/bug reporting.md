# Bug reporting

## Objectifs
Permettre de facilement identifier et résoudre les erreurs recontrées par les clients des joueurs.

## Fonctionnement Détaillé
- Créer un nouvelle section pour les logs
- Chaque sujet de cette section correspond à un bug
- Dans le titre du sujet sera écrit : 
    - Version de l'extension
    - Pseudo du joueur
    - URL de la page
    - Hashcode de la stack de l'erreur
    - Nombre d'occurences
- Le premier message du sujet sera un message optionnel s'il existe, dont le ou les auteurs sera précisé
- Le second message contiendra les logs (à splitter en plusieurs messages - sans couper un log - si au-delà de la limite de caractères)
- Créer une fonction utilitaire de post des logs qui :
    - Prend en entrée un message optionnel (pouvant contenir un lien d'image)
    - Récupère les logs de la page actuelle et les diverses informations nécessaires (l'erreur actuelle catchée doit être présente)
    - Regarde s'il existe déjà un sujet d'erreur lié au hashcode de l'erreur actuelle et le cas échéant incrémente le nombre d'occurences et ajoute le message optionnel s'il existe dans le premier message du sujet, à la suite du texte, en précisant l'auteur
    - Sinon, crée un nouveau sujet d'erreur
- Ajouter dans le dock un bouton permettant à un utilisateur de signaler un problème :
    - Lorsque cliqué, ouvre une boite avec un texte d'explication de l'utilisation de la fonctionnalité en haut, un champ texte au centre et un bouton signaler en bas
    - L'utilisateur remplit le champ, et lorsqu'il clique sur le bouton, la fonction de post des logs est appelée, avec le contenu du champ textuel en message optionnel (si le champ textuel est vide, un message d'erreur apparait dans la boite et le post des logs n'est pas effectué)
- Appeler la fonction de post des logs sans message optionnel dans la surcharge de console.error. Si l'erreur est relancée et engendre un nouveau console.error, compléter l'ancien message des logs sur le forum 
- Ajouter des verrous pour eviter la concurrence
- Ajouter des logs d'entrée et sortie avec les arguments passés et les valeurs retournées pour chaque fonction, quelle que soit l'issue
- Dans toutes les classes du framework et le main, ajouter un return false ou null en cas d'échec, à prendre en compte dans la fonction appelante pour ses propres logs et return
- Améliorer la pertinence des logs :
    - si la classe de l'objet N n'est pas définie dans l'extension, s'arrêter aux objets de niveau N+1 dans cet objet, en donnant soit leur valeur (primitif) soit leur classe (autres objets)
    - compression des logs répétés en boucle (identiques en dehors de la date)
    - tronquage des chaînes volumineuses
    - en plus de la circularité, il faut considérer de ne pas répéter la même instance 2 fois dans le même objet sérialisé
    - ne logger que le delta par rapport au dernier pour chaque instance d'objet (prendre en compte la fenêtre tournante et le fait que le snapshot de l'objet doit rester figé)
    - ignorer getters/setters/fonctions privées pour l'instrumentation
    - Retirer la rotation des logs basée sur la longueur et remplacer par un vidage de l'historique au tout début d'une action sécurisée
    - En cas de signalement automatique, circonscrire les logs envoyés à un périmètre basé sur la distance dans la pile d'appel par rapport à l'erreur
    - ignorer attributs privés lors de la sérialisation
    - en cas d'objets non primitifs (instances d'extension, listes/tableaux, dictionnaires, Map, Set, etc.) dont la sérialisation est identique, attacher une clé de référence à sa première apparition et écrire une référence courte à la place du contenu pour les occurrences ultérieures
    - Le calcul de delta doit être unifié pour toute l'instance de logger, y compris en cas de post multiples ou vidage de l'historique
    - Ajouter aux logs d'entrée et sortie des fonctions l'état de l'instance sur laquelle est appelée la fonction (hors fonctions statiques) si l'instance n'est pas déjà dans les arguments d'entrée ou sortie
    - limiter la profondeur de sérialisation
    - pour le calcul des deltas, ne pas prendre en compte le fait qu'une instance soit sérialisée comme circulaire, duplicate ou fasse référence via une clé 
    - Ne pas prendre en compte les valeurs compressées dans le calcul du delta
- A chaque niveau (y compris en cas de référence circulaire, duplicat ou delta), afficher nom de la classe et id instance lors de la sérialisation d'un objet de l'extension, en vérifiant que cela ne créera pas de télescopage si ces variables existent déjà dans la classe (même chose pour _refKey et _id d'instrumentation des classes)
- Rajouter une jauge d'avancement de l'envoi dans la boite de signalement (écraser le bouton en dessous)
- Ajouter au mécanisme de delta une division des changements en trois catégories : modification de la valeur d'une clé ou d'une entrée d'Array/Set (comme fait actuellement), ajout d'une clé ou d'une entrée d'Array/Set (à distinguer de la modification) et suppression d'une clé ou d'une entrée d'Array/Set (à créer et distinguer). Dans une Array/Set, la comparaison se fait position à position; en cas d'instance différente, cela doit être considéré comme une suppression pour l'ancienne instance et un ajout pour la nouvelle instance. En cas de même instance ayant subi une modification, cela doit être considéré comme une modification. En cas d'ajout d'une entrée, cela doit être considéré comme un ajout. En cas de suppression d'une entrée, cela doit être considéré comme une suppression.
- Appliquer le mécanisme de delta aux arrays/sets, en n'affichant que les entrées ayant été ajoutées, enlevées ou modifiées, avec leur indice lorsqu'il y a un ordre
- Le découpage en chunks doit se faire prioritairement entre logs, sinon entre arguments de log, sinon à la jonction entre deux objets sérialisés de premier niveau, sinon deuxième niveau, et ainsi de suite

## Plan d'Implémentation

### Étape 1 : Interception de la Console & Journalisation Globale (`Logger`)
1. **Création de la classe `Logger`** dans un nouveau fichier `js/class/framework/Logger.js` :
   - Initialiser un tableau statique `logger.historique = []` en mémoire pour stocker l'historique des logs sans limite de taille ni rotation automatique basée sur la longueur (suppression de la constante `LOGGER_MAX_TAILLE` et de la rotation du buffer circulaire).
   - Proposer une méthode de réinitialisation/vidage de l'historique (`logger.viderHistorique()` ou réinitialisation de `logger.historique = []`).
   - Définir une fonction de sérialisation automatique et récursive :
     - Parcourir les attributs propres à chaque objet (via `Object.keys(val)`).
     - Exclure totalement les fonctions (`typeof val === 'function'`).
     - Ne pas évaluer les getters de classe (déductibles des attributs lors du debugging).
     - Intégrer un détecteur de références circulaires (via un `Set` des objets visités) pour rompre les boucles récursives en remplaçant la référence par une simple chaîne contenant le nom de la classe, de la clé ou de la variable (ex: `"[Circular: NomDeClasse]"` ou `"[Circular: nomDeVariable]"`).
     - Intégrer un détecteur de duplication d'instance au sein du même log (via `dejaVus` propre à chaque log) pour remplacer la répétition de la même instance mémoire par `"[Duplicate: NomDeClasse (ID: id)]"`.
     - Gérer les cas particuliers des éléments DOM et objets jQuery pour les résumer à leurs caractéristiques simples (sélecteurs, tag name, id, classe) plutôt que de les parcourir récursivement.
2. **Surcharge passive et transparente de la console** (Monkey-Patching de `console.log`, `console.warn` et `console.error`) au démarrage de l'extension :
   - Conserver les références d'origine (`console._log = console.log`, etc.) pour préserver l'affichage de la console DevTools et permettre le blackboxing optionnel de `Logger.js`.
   - Lors de chaque appel à une méthode de la console, capturer la date actuelle (`Date.now()`).
   - Extraire le **type exact de log** : `'info'` pour `console.log`, `'warn'` pour `console.warn`, `'error'` pour `console.error`.
   - **Gestion de la pile d'exécution (Stacktrace)** :
     - Pour tout appel de log, extraire dynamiquement le **fichier**, la **fonction** et la **ligne** de l'appelant direct en instanciant un objet `new Error()` et en analysant sa propriété `stack` (première ligne de la stacktrace située immédiatement après les couches d'interception du Logger).
     - **Pour les erreurs (`console.error` ou exceptions)** : Capturer systématiquement **la pile complète (full stacktrace)** dans le log pour permettre un diagnostic approfondi du cheminement de l'erreur.
   - Sérialiser les arguments passés de manière récursive avant de stocker l'objet log standardisé dans `logger.historique`.
   - **Remontée automatique des erreurs** (pour `console.error`) :
      - Appeler de manière asynchrone `logger.posterLogs(erreurCatchée)` sans message optionnel.
    - Rediriger l'appel vers la méthode d'origine pour ne pas altérer le comportement natif du navigateur.
3. **Filtrage des logs par périmètre dans l'arbre d'appel pour les signalements automatiques** :
   - En cas de signalement automatique d'erreur, circonscrire les logs envoyés à un périmètre défini par la constante `LOGGER_PERIMETRE_STACK_DISTANCE` dans `js/constants.js`.
   - Chaque entrée de log enregistre la séquence des frames de la pile d'exécution active dans l'arbre d'appel lors de son enregistrement.
   - Le matching de la pile d'appel se base uniquement sur le **fichier** et la **fonction** (en ignorant le numéro de ligne), de sorte qu'une distance de 0 corresponde aux logs émis dans la même fonction que celle où l'erreur s'est produite.
   - La distance dans l'arbre d'appel pour relier l'erreur à un log correspond au nombre total de déplacements requis (pure remontée, pure descente, ou remontée(s) jusqu'à l'ancêtre commun suivies de descente(s) vers la fonction du log cible).
   - Lors de la préparation des logs à poster automatiquement, ne conserver que les logs dont la distance exacte dans l'arbre d'appel par rapport à l'erreur est inférieure ou égale à `LOGGER_PERIMETRE_STACK_DISTANCE`.
4. **Instrumentation automatique des méthodes de classe (`instrumenterObject`)** :
   - Intercepter automatiquement les appels et retours des fonctions du framework.
   - Les logs automatiques d'entrée/sortie (`[Entrée]`, `[Sortie]`, `[Sortie Exception]`) doivent comporter :
     - L'identifiant unique de l'instance (`id` ou hash unique lié à l'instance).
     - La classe exacte de l'instance courante (`this.constructor.name`), facilitant la différenciation des classes filles appelant des méthodes mères.
     - Le nom de chaque paramètre de la fonction, mappé à sa valeur respective passée lors de l'appel.
5. **Gestion de la sérialisation par Delta par Instance et Références d'Instances Identiques** :
   - **Identifiants uniques d'instances** : S'appuyer sur l'identifiant unique assigné à chaque instance de l'extension (`_loggerInstanceId`).
    - **Gestion des objets non primitifs à sérialisation identique (`serialisationsVues`)** :
      - Maintenir un dictionnaire/Map `serialisationsVues`, un index `nextRefKeyIndex` et un ensemble `clesPublieesAvecRefKey = new Set()` persistants sur toute la durée de vie de l'instance du `Logger` (effacés lors de `viderHistorique()`) afin de garantir l'unicité stricte des clés de référence sur l'ensemble des messages du sujet sur le forum.
      - Conserver un registre associant chaque clé de référence générée (`R1`, `R2`, etc.) à la position de sa première occurrence sérialisée : `registreEmplacementsRefKeys.set(refKey, { idMessage, indexChunk, jsonStrBrut, texteObjetInitial })`.
      - Ce mécanisme s'applique à tout objet non primitif (instances d'extension, listes/tableaux, dictionnaires, Map, Set, etc.) **après** l'application des deltas et la détection de duplication exacte par `dejaVus`.
      - **Publication conditionnelle de la clé de référence** :
        - Lors du premier envoi d'un lot de logs, la clé de référence (`_refKey: "R1"`) n'est attachée directement à la valeur sérialisée lors de sa première apparition que si cette clé est effectivement citée ultérieurement dans le message de log (`[Ref: ..., Key: R1]`). Si c'est le cas, elle est enregistrée dans `clesPublieesAvecRefKey`.
        - Si la clé n'est pas citée dans ce lot, l'objet est posté sans attribut `_refKey`, mais son emplacement et l'identifiant du message sont conservés dans le registre pour une éventuelle injection ultérieure.
      - Si un objet non primitif possède une sérialisation identique à une valeur déjà vue précédemment dans l'historique, le remplacer par une chaîne de référence courte : `"[Ref: NomDeClasse/Type (ID: id), Key: R1]"`.
   - **Snapshot au format JSON (Figé)** :
     - Le snapshot de référence d'une instance est conservé sous la forme du **résultat JSON de sérialisation** généré au moment où l'instance est journalisée.
     - L'utilisation du JSON garantit un temps de traversée minimal (comparaison d'objets JSON plats/bruts) et assure l'immuabilité absolue du snapshot face aux mutations *in-place* ultérieures de l'objet JS en mémoire.
   - **Calcul et Logging du Delta Minimal** :
     - Pour réduire le volume de caractères au maximum, lors de la comparaison avec le dernier snapshot JSON :
       - **Champs modifiés** : Seule la **nouvelle valeur** est conservée pour chaque clé modifiée (ex: `{ X: 50 }`), sans répéter l'ancienne valeur.
       - **Champs et sous-instances inchangés** : Dans un objet parent, toute sous-instance ou propriété inchangée est complètement ignorée (omission totale de la clé et de sa valeur).
       - **Instance racine totalement inchangée** : Uniquement pour l'objet racine de premier niveau passé directement au log, si toutes ses clés sont inchangées, conserver une référence minimale (ex: `"[Unchanged Classe (ID: id)]"`) afin de ne pas produire un log vide.
   - **Génération dynamique lors du post (`obtenirLogsFormates`) & Vidage sur Action Sécurisée** :
     - Dans `logger.historique`, chaque log enregistre l'état JSON complet des instances au moment de l'appel.
     - La transformation en **Full State** vs **Delta** est effectuée **dynamiquement lors de la génération du texte final** dans `obtenirLogsFormates(logsAformater)` :
       - `obtenirLogsFormates` reçoit la sous-liste exacte des logs de l'historique à envoyer (tenant compte du chevauchement avec le forum).
       - Au cours du parcours séquentiel de cette sous-liste :
         1. La **première occurrence** d'une instance d'objet *au sein de la liste à poster* est obligatoirement formatée en **Full State** (état JSON complet).
         2. Les **occurrences suivantes** de cette même instance *dans la même liste* sont comparées à l'état JSON de leur occurrence précédente dans la liste et formatées en **Delta minimal** (clés modifiées avec leur nouvelle valeur uniquement).
       - Ce fonctionnement dynamique garantit que, quel que soit l'instant du post ou le vidage de l'historique lors d'une action sécurisée, le premier message envoyé contiendra toujours un état complet autonome pour chaque instance, suivi uniquement de ses deltas.

6. **Vidage de l'historique lors d'une action sécurisée (`ActionSecurisee.js`)** :
   - Au tout début de la méthode `ActionSecurisee.traiter` (dans `js/class/framework/ActionSecurisee.js`), avant toute vérification de données ou transaction, appeler `Logger.viderHistorique()`.
   - Cela garantit que chaque action sécurisée démarre avec un historique de logs réinitialisé à zéro, éliminant tout besoin de rotation automatique basée sur la taille du tableau.

7. **Flag de désactivation globale (Mode Débogage)** :
   - Introduire un flag de configuration/débogage (ex: `LOGGER_ACTIF`) dans les constantes globales (`js/constants.js`).
   - Si ce flag est configuré sur `false`, désactiver l'initialisation du Logger, le monkey-patching de la console, et tout appel à `posterLogs` afin de pouvoir éteindre le système de reporting en cas de besoin.

*Note concernant le flux d'exécution lors d'un appel manuel :*
> Lors d'un signalement manuel (clic sur le bouton "Signaler"), le flux d'exécution asynchrone est déconnecté du flux d'exécution précédent. Par conséquent, une stacktrace générée à cet instant n'indiquera que le gestionnaire d'événement de la boîte de dialogue (toujours identique).
> Pour reconstituer l'état du flux d'exécution réel ayant mené au bug, le système s'appuie sur `logger.historique` qui contient chronologiquement l'ensemble des logs de la console (incluant erreurs, avertissements et traces d'exécution) enregistrés depuis le chargement de la page ou la dernière action sécurisée avant le clic. 
> **Mécanisme de Hachage du Flux de Traces Applicatif (HFTA)** : Pour identifier et regrouper de façon cohérente les signalements manuels d'anomalies fonctionnelles identiques sans exception déclenchée :
> - Extraire de `logger.historique` les signatures des 10 dernières traces uniques de logs sous la forme de chaînes formatées : `"${type}:${fichier}:${fonction}"`.
> - Concaténer ces signatures d'enchaînement de fonctions avec le chemin d'accès de la page courante (`location.pathname`).
> - Calculer le hash de cette chaîne composite à l'aide de l'algorithme de hachage.
> - Deux joueurs rencontrant exactement le même comportement anormal (même navigation et mêmes traces d'appels logguées) produiront ainsi le même hash, permettant de regrouper automatiquement leurs signalements sous un unique sujet de forum.

### Étape 2 : Configuration et Déclaration de la Section de Logs
1. **Ajout de la section requise** :
   - Dans `main.js`, via le constructeur de la classe `Logger`, ajouter `'Logs Outiiil'` aux sections requises :
     ```javascript
     sectionsRequises.add({
         nom: 'Logs Outiiil',
         visibilite: 'caché', // Réservé aux administrateurs de l'alliance pour préserver la confidentialité
         estDerniere: true
     });
     ```
   - Le framework (`GestionnaireSections`) se chargera automatiquement de créer la section si elle n'existe pas et d'enregistrer son ID dans `monProfilUtilisateur.parametre['Logs Outiiil'].valeur`.

### Étape 3 : Fonction de Hachage de la Stacktrace
1. **Implémentation d'un algorithme de hashcode** (ex: DJB2 ou FNV-1a) pour convertir la stacktrace d'une erreur en une chaîne hexadécimale unique et stable :
   ```javascript
   static genererHash(str) {
       let hash = 5381;
       for (let i = 0; i < str.length; i++) {
           hash = ((hash << 5) + hash) + str.charCodeAt(i);
       }
       return (hash >>> 0).toString(16);
   }
   ```
   Ce hashcode permettra d'identifier de manière unique chaque type d'erreur pour éviter la duplication de sujets sur le forum.

### Étape 4 : Développement de la Fonction Principale de Post des Logs (`logger.posterLogs`)
Développer la méthode statique asynchrone `logger.posterLogs(erreurCatchée, messageOptionnel = null)` :
1. **Liaison par instance de Logger** :
   - Si `logger.idSujet` est déjà défini :
     - Si `logger.sujetCreeParCetteInstance` est `true` :
       - Procéder directement à l'étape 3 (Mise à jour des logs).
     - Sinon :
       - Retourner immédiatement (ignorer).
2. **Collecte des données & Recherche classique** (uniquement si `logger.idSujet` est nul) :
   - Récupérer la version de l'extension, le pseudo du joueur actuel, l'URL de la page courante (`location.href`).
   - Extraire la stacktrace de `erreurCatchée` (ou HFTA si signalement manuel) et générer le hash.
   - Récupérer l'ID de la section `'Logs Outiiil'`.
   - Appeler `AccesForum.recupererSujetsSection` pour trouver un sujet dont le titre correspond au hashcode calculé.
    - **Si sujet existant trouvé** :
      - Incrémenter le compteur d'occurrences.
      - Enregistrer `logger.idSujet = idSujet` et `logger.sujetCreeParCetteInstance = false`.
      - Consulter le sujet pour mettre à jour le titre (nombre d'occurrences) via `AccesForum.modifierSujet` et le 1er message (si `messageOptionnel` fourni) via `AccesForum.modifierMessage`, sans modifier les messages de logs.
    - **Si aucun sujet existant trouvé** :
      - Procéder à l'étape 4 (Création d'un nouveau sujet).
3. **Mise à jour d'un sujet existant (Logs uniquement)** :
    - Consulter le sujet via `AccesForum.consulterSujetAvecMessagesEtIds`.
    - Si `messageOptionnel` est fourni, l'ajouter à la suite du premier message récupéré : `\n[Auteur: ${pseudo}] : ${messageOptionnel}` et appeler `AccesForum.modifierMessage(idMessage, premierMessageMisAJour)` pour le modifier.
    - **Gestion rétroactive des clés de référence inter-messages** :
      - Lors de l'analyse (Passe 1) du nouveau lot de logs à envoyer (`logsInedits`), identifier l'ensemble des clés de références citées (`clesCitees`).
      - Pour chaque clé `refKey` citée dans le nouveau lot :
        - Vérifier si `refKey` appartient déjà à `clesPublieesAvecRefKey`.
        - **Si `refKey` n'est pas dans `clesPublieesAvecRefKey`** (l'instance source se trouve dans un message antérieur posté sans sa clé) :
          1. Retrouver via le registre `registreEmplacementsRefKeys` l'identifiant du message du forum `idMessage` et le contenu de l'objet d'origine.
          2. Mettre à jour le message d'origine sur le forum via `AccesForum.modifierMessage(idMessage, contenuModifie)` en y injectant `_refKey: "${refKey}"` sur l'instance d'origine.
          3. Ajouter `refKey` à `clesPublieesAvecRefKey`.
    - **Mise à jour adaptative par ajout de nouveaux messages** :
      - Récupérer uniquement le dernier message de logs du sujet sur le forum. Grâce à l'horodatage à la milliseconde des lignes de logs, ce message possède un contenu unique.
      - Extraire la dernière ligne de ce dernier message de logs pour rechercher un chevauchement dans les nouveaux logs locaux de `logger.historique`.
      - **Cas 1 : Présence d'un chevauchement** :
        - Identifier la ligne de jonction exacte correspondant à la fin du dernier message du forum au sein des logs locaux.
        - Ne conserver des logs locaux que la tranche d'objets de logs inédits (postérieure à ce chevauchement).
        - Passer cette tranche de logs inédits à `logger.obtenirLogsFormates(logsInedits)` : la méthode génère dynamiquement la chaîne formatée (Full State pour la première occurrence de chaque instance dans cette tranche, Delta minimal pour les suivantes).
        - Découper cette chaîne en blocs respectant la taille maximale `MESSAGE_MAX_LENGTH`.
        - Poster chaque bloc séquentiellement dans de nouveaux messages via `AccesForum.envoyerMessageEtRetournerId` (sans modifier le contenu des logs existants en dehors de l'éventuel ajout rétroactif d'une clé de référence) et enregistrer les nouveaux `idMessage` dans `registreEmplacementsRefKeys`.
      - **Cas 2 : Absence de chevauchement (Historique réinitialisé lors d'une action sécurisée ou rechargement de page)** :
        - Poster un message contenant la ligne d'information `... [RÉINITIALISATION DE L'HISTORIQUE / ACTION SÉCURISÉE] ...` via `AccesForum.envoyerMessageEtRetournerId`.
        - Passer l'ensemble de l'historique local à `logger.obtenirLogsFormates(logger.historique)` qui génère le texte avec Full State sur la 1ère occurrence de l'historique.
        - Découper le texte résultant en blocs de taille `MESSAGE_MAX_LENGTH` et les poster séquentiellement en mettant à jour le registre `registreEmplacementsRefKeys`.
4. **Création d'un nouveau sujet (Aucun doublon trouvé)** :
   - Construire le dictionnaire JSON du titre :
     ```json
     {
       "version": "1.2.3",
       "pseudo": "JoueurName",
       "url": "/alliance.php",
       "hash": "a1b2c3d4",
       "occurrences": 1
     }
     ```
   - Sérialiser ce dictionnaire pour l'utiliser comme titre : `const titreSujet = JSON.stringify(titreObj)`.
   - Définir le premier message : message optionnel formaté s'il existe, ou texte par défaut (ex: `Signalement automatique.`).
   - Créer le sujet via `AccesForum.creerSujetEtRetournerId` pour obtenir `idSujet`.
   - **Découpage des logs (Deuxième message)** : Appeler `logger.obtenirLogsFormates(logger.historique)` pour formater dynamiquement la totalité de l'historique (Full State pour la 1ère occurrence de chaque instance dans l'historique, Deltas minimaux pour les suivantes). Découper cette chaîne en blocs respectant la limite de caractères du forum (sans couper une ligne de log individuelle). Poster chaque bloc séquentiellement à l'aide de `AccesForum.envoyerMessageEtRetournerId` et enregistrer les messages postés et leurs références dans `registreEmplacementsRefKeys`.

### Étape 5 : Bouton de Signalement dans le Dock et Boîte Modale
1. **Ajout de l'icône dans le Dock** (`Dock.js`) :
   - Ajouter un nouvel élément HTML `<div id="o_toolbarItem7" class="o_toolbarItem" title="Signaler un bug"><span id="o_itemBug" style="background-image: url(...)"/></div>` dans le template `_html` de la barre d'outils.
   - Gérer le clic sur `o_itemBug` pour instancier et afficher une nouvelle boîte modale : `BoiteSignalement`.
2. **Création de la classe `BoiteSignalement`** (héritant de `Boite`) :
   - Le contenu HTML contiendra :
     - En haut, un paragraphe d'explication pédagogique explicitant clairement que **le signalement manuel n'a pas pour rôle de remonter des erreurs techniques d'exécution** (qui sont capturées et transmises en arrière-plan automatiquement par l'extension), mais de **signaler des fonctionnements anormaux en l'absence d'erreurs visibles** (défauts d'interface visuelle, mauvais calculs de ressources, réactivité inattendue, etc.), et invitant l'utilisateur à décrire précisément le problème observé.
     - Au centre, un champ de saisie multi-lignes `<textarea id="o_inputBugDescription" placeholder="Décrivez le problème rencontré..."></textarea>`.
     - En bas, un bouton de soumission `<button id="o_btnEnvoyerSignalement">Signaler</button>` et un conteneur d'erreur masqué par défaut.
   - **Logique de soumission** :
     - Lors du clic sur "Signaler", vérifier si le champ texte est vide.
     - S'il est vide, afficher un message d'erreur rouge clair dans la boîte sans fermer ni poster de logs.
     - S'il est rempli, appeler `logger.posterLogs(new Error("Signalement manuel de l'utilisateur"), descriptionSaisie)`, masquer la boîte, afficher un toast de remerciement et vider le champ.

## Tests à effectuer
- Tester bug catché localement
- Tester bug catché au niveau du main
- Tester un log ne pouvant pas loger dans un message
- Tester post utilisateur des logs avec message optionnel
- Tester post utilisateur des logs sans message optionnel
- Tester erreur remontée automatiquement identique à une déjà existante remontée automatiquement
- Tester erreur remontée par l'utilisateur identique à une déjà existante remontée par l'utilisateur
- Tester log sur plusieurs messages
- Tester bug avec erreur relancée nécessitant l'ajout de messages
- Tester deux erreurs différentes, la première au moins étant catchée sans être relancée (pour permettre à la seconde de se déclencher)
- Tester plusieurs signalements dans le même flux
- Tester même bug avec erreur relancée sur plusieurs chargements de page (simple incrémentation)
- Tester plusieurs signalements identiques dans le même flux sur plusieurs chargements de page (simple incrémentation)
- Tester deuxième erreur située plus loin que la taille de la fenêtre (raccourcir fenêtre)
- Tester même erreur sur deux pages différentes (dans le main) (incrémentation)
- Tester gestion erreur dans posterLogs
- Tester cas erreur inclu dans le string du message de console.error
- Vérifier que les noms/valeurs des paramètres sont correctement restitués même si tous les arguments de la fonction ne sont pas utilisés pour l'appel
- Vérifier logs d'entrée et sortie des fonctions présents sur le forum (fonctions statiques et d'instances) et présentant tous les éléments attendus
- Vérifier cohérence idInstance
- Ne pas explorer les objets non définis dans l'extension au delà du niveau suivant
- Vérifier compression des logs répétés en boucle
- Vérifier tronquage des chaînes volumineuses
- Vérifier non répétition de la même instance 2 fois dans le même objet sérialisé
- Vérifier le logging par delta des instances d'objets (calcul des modifications relatives)
- Vérifier la réinitialisation en Full State lorsqu'un log de référence sort de la fenêtre tournante (buffer circulaire)
- Vérifier présence des noms de classes et ids d'instances à tous les niveaux
- Vérifier getters/setters/fonctions privées non pris en compte
- vérifier réinitialisation de l'historique lors d'unc clic sécurisé
- vérifier circonscription logs autour de l'erreur
- Vérifier attributs privés ignorés
- Tester mécanisme de duplication pour une même instance dans deux arguments d'un même log
- Tester mécanisme de duplication pour une même instance dans deux logs différents
- Tester mécanisme de référence pour objets identiques dans le même argument d'un même log
- Tester mécanisme de référence pour objets identiques dans deux arguments d'un même log
- Tester mécanisme de référence pour objets identiques dans deux logs différents
- Tester mécanisme de référence pour objets de l'extension et de base (liste, dictionnaire, etc)
- Vérifier que seules les références citées sont postées
- Tester application du delta sur un objet (sans modif) dont la première valeur est identique à celle d'un autre objet (application du mécanisme de référence puis delta)
- Tester référence à un delta d'un objet ayant été modifié
- Vérifier que les références et deltas sont unifiés en cas de post multiple (cas référence dans le poste précédent et non référée auparavant et tout niveau d'imbrication)
- Vérifier qu'en cas de clic sécurisé le signalement automatique est fait dans un nouveau sujet avec réinitialisation des références et deltas
- Vérifier que la classe des objets de base n'est postée qu'en cas de référencement
- Tester verrouillage logger durant post (log+erreur+log+erreur collés)
- Tester signalement manuel après signalement automatique
- Vérifier état de l'instance présent en entrée et sortie de log de fonction/constructeur
- Vérifier sérialisation limitée en profondeur
- Vérifier présence et fonctionnement jauge corrects
- Tester la sérialisation correcte de tous les types d'objets qui peuvent être présents dans des logs
- Vérifier la non prise en compte par le calcul des deltas d'une clé d'objet dont la valeur sérialisée passe de normale à circulaire tout en conservant sa valeur (pas de sérialisation)
- Vérifier la non prise en compte par le calcul des deltas d'une clé d'objet dont la valeur sérialisée passe de normale à référençante tout en conservant sa valeur (pas de sérialisation)
- Vérifier la non prise en compte par le calcul des deltas d'une clé d'objet dont la valeur sérialisée passe de normale à duplicate tout en conservant sa valeur (pas de sérialisation)
- Vérifier considération comme différence du changement d'instance d'une clé d'un objet, mais en conservant la même valeur (sérialisée comme delta vide de sa création)
- Vérifier considération comme différence du changement d'instance d'une clé d'un objet, en changeant la valeur de la nouvelle instance par rapport à sa création (delta non vide par rapport à création)
- Vérifier que si une sous-instance d'un objet n'a pas déjà été rendue visible au moins une fois en amont, elle est considérée comme nouvelle et sérialisée en entier, même si elle n'a pas changée.
- Vérifier que les valeurs compressées ne sont pas prises en compte dans le calcul du delta
- Tester delta modification d'une clé d'un objet
- Tester delta ajout d'une clé d'un objet
- Tester delta suppression d'une clé d'un objet
- Tester delta modification de l'objet d'une entrée d'une Array/Set
- Tester delta changement d'objet d'une entrée d'une Array/Set
- Tester delta ajout d'une entrée dans une Array/Set
- Tester delta suppression d'une entrée dans une Array/Set
- Vérifier application du delta aux arrays/sets
- Vérifier découpage entre chunks au niveau des limites d'objets ou de clés

## Avancement
- Bug catché localement validé
- Bug catché au niveau du main validé
- Un log ne pouvant pas loger dans un message validé
- Post utilisateur des logs avec message optionnel validé
- Post utilisateur des logs sans message optionnel validé
- Erreur remontée automatiquement identique à une déjà existante remontée automatiquement validé
- Erreur remontée par l'utilisateur identique à une déjà existante remontée par l'utilisateur validé
- Log sur plusieurs messages validé
- Bug avec erreur relancée nécessitant l'ajout de messages validé
- Deux erreurs différentes dans le même flux validé
- Plusieurs signalements dans le même flux validé
- Même bug avec erreur relancée sur plusieurs chargements de page validé
- Plusieurs signalements identiques dans le même flux sur plusieurs chargements de page validé
- Deuxième erreur située plus loin que la taille de la fenêtre validé
- Même erreur sur deux pages différentes validé
- Gestion erreur dans posterLogs validé
- Cas erreur inclu dans le string du message de console.error géré
- Les noms/valeurs des paramètres sont correctement restitués même si tous les arguments de la fonction ne sont pas utilisés pour l'appel
- Logs d'entrée et sortie des fonctions présents sur le forum (fonctions statiques et d'instances) et présentant tous les éléments attendus
- idInstance cohérents
- Ne pas explorer les objets non définis dans l'extension au delà du niveau suivant validé
- Logs répétés compressés validé
- Chaînes volumineuses tronquées validé
- Pas de répétition de la même instance dans le même objet sérialisé
- Logging par delta des instances d'objets validé
- Réinitialisation en Full State lorsqu'un log de référence sort de la fenêtre tournante validé
- Présence des noms de classes et ids d'instances à tous les niveaux validé
- getters/setters/fonctions privées effectivement non pris en compte
- Réinitialisation de l'historique lors d'unc clic sécurisé validé
- Logs effectivement circonscrits autour de l'erreur
- Attributs privés effectivement ignorés
- Mécanisme de duplication pour une même instance dans deux arguments d'un même log validé
- Mécanisme de duplication pour une même instance dans deux logs différents validé
- Mécanisme de référence pour objets identiques dans le même argument d'un même log validé
- Mécanisme de référence pour objets identiques dans deux arguments d'un même log validé
- Mécanisme de référence pour objets identiques dans deux logs différents validé
- Mécanisme de référence pour objets de l'extension et de base validé
- Seules les références citées sont effectivement postées
- Application du delta sur un objet (sans modif) dont la première valeur est identique à celle d'un autre objet validé
- Application du delta sur un objet (avec modif) dont la première valeur est identique à celle d'un autre objet validé
- Références et deltas effectivement unifiés en cas de post multiple
- En cas de clic sécurisé, le signalement automatique est effectivement fait dans un nouveau sujet avec réinitialisation des références et deltas
- Classe des objets de base n'est effectivement postée qu'en cas de référencement
- Verrouillage logger durant post validé
- Signalement manuel après signalement automatique validé
- Etat de l'instance effectivement présent en entrée et sortie de log de fonction/constructeur
- Sérialisation effectivement limitée en profondeur
- Présence et fonctionnement jauge validé
- Types d'objets pouvant être sérialisés:
  - Undefined	Oui
  - Null	Oui
  - boolean	Oui
  - number	Oui
  - bigint	Oui
  - string	Oui
  - Object 	Oui
  - Array	Oui
  - Set	Oui
  - Map	Oui
  - WeakSet	Oui
  - WeakMap	Oui
  - Date	Oui
  - RegExp	Oui
  - Error	Oui
  - Promise Oui
  - Boolean	Oui
  - Number	Oui
  - String	Oui
  - html	Oui
  - Moment	Oui
- Non prise en compte de la circularité par le calcul des deltas validée
- Non prise en compte du référencement par le calcul des deltas validée
- Non prise en compte de la duplication par le calcul des deltas validée
- Changement d'instance d'une clé d'un objet en conservant la même valeur effectivement considéré comme différence delta
- Changement d'instance d'une clé d'un objet en changeant sa valeur effectivement considéré comme différence delta
- Une sous-instance d'un objet n'ayant pas déjà été rendue visible au moins une fois en amont est effectivement considérée comme nouvelle et sérialisée en entier
- Valeurs compressées non prises en compte par le calcul des deltas validée
- Delta modifications d'une clé d'un objet validé
- Delta ajout d'une clé d'un objet validé
- Delta suppression d'une clé d'un objet validé
- Delta modification de l'objet d'une entrée d'une Array/Set validé
- Delta changement d'objet d'une entrée d'une Array/Set validé
- Delta ajout d'une entrée dans une Array/Set validé
- Delta suppression d'une entrée dans une Array/Set validé
- Application effective du delta aux arrays/sets
- Découpage entre chunks effectivement au niveau des limites d'objets ou de clés