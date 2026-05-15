# Gestion données périmées

## Objectifs
Trouver un moyen automatique de rafraichir, détecter et réagir à la modification des données impliquées dans une fonctionnalité lors d'une action.

## Fonctionnement Détaillé
- Action = clic de bouton
- Rafraîchir = rechargement de tous les objets forum chargés dans la fonctionnalité via chargerObjetsForum, avec les mêmes arguments (analyse de la classe via acorn), en ignorant le cache
- Détecter modification = changement de valeur d'un attribut/paramètre ou de la liste des objets contenus (récursivement) des objets forums rechargés. Vérifications d'initialisation de la classe mère fonctionnalité invalides (séparer dans une fonction à part à appeler, pour dissocier du lancement de run, avec un argument spécifiant s'il faut effectuer un rafraîchissement - par défaut à false - , et si c'est le cas, dans les fonctions individuelles de vérification, rafraîchir les joueurs en ignorant le cache, et rafraîchir les gestionnaires de versions et de droits avant d'effectuer la vérification elle-même).
- Réagir = afficher un toast d'information et recharger la page
- Tous les listeners de boutons doivent bloquer le clic et ne le retransmettre qu'à la fin de la bonne exécution
- Minimiser l'impact sur les classes filles
- Adapter les classes filles existantes si nécessaire

## Plan d'Implémentation

L'approche vise à encapsuler la logique de vérification et de rafraîchissement globaux dans un intercepteur d'événement, avec une réaction simple (rechargement de page) en cas de données obsolètes.

### 1. Séparation et enrichissement des vérifications d'initialisation (`FonctionnaliteAlliance.js`)
* **Nouvelle méthode `verifierConditionsInitiales(forcerRafraichissement = false)`** :
  * Extraire la logique de vérification actuellement dans `init()` vers cette nouvelle méthode.
  * Les sous-méthodes appelées (`verifierVersionSuffisanteEtPresenceSections`, `verifierPresenceSujetMembre`, `verifierDroits`) prendront également cet argument `forcerRafraichissement`.
  * **Comportement avec `forcerRafraichissement = true`** :
    * Dans `verifierVersionSuffisanteEtPresenceSections` : déclencher un `gestionnaireVersions.rafraichir()` préalable.
    * Dans `verifierPresenceSujetMembre` : recharger la liste des joueurs (`chargerObjetsForum(Joueur, ...)`), en vidant le cache de la classe `Joueur` au préalable.
    * Dans `verifierDroits` : déclencher un `gestionnaireDroits.rafraichir()` préalable.

### 2. Analyse et Rechargement Global des Objets Forum (`FonctionnaliteAlliance.js`)
* **Analyse de la classe via acorn** :
  * Créer une méthode (ex: `_determinerAppelsChargement()`) qui parse le code source de la fonctionnalité (via `acorn`) pour repérer tous les appels à `this.chargerObjetsForum(...)`.
  * **Signatures d'appels** : Extraire l'intégralité des combinaisons d'arguments uniques passées à `chargerObjetsForum` pour pouvoir les rejouer fidèlement.
* **Méthode `rafraichirDonneesFonctionnalite()`** :
  * **Vider le cache** : Pour chaque classe identifiée comme premier argument d'un appel `chargerObjetsForum`, supprimer l'entrée correspondante dans `cacheObjetForums`.
  * *Note : Le rechargement des données est délégué à la méthode de prise d'empreinte qui suivra.*
* **Consistance du cache dans `chargerObjetsForum`** :
  * Si `chargerContenus` est à `false` mais que les objets en cache possèdent déjà des contenus chargés, la méthode doit vider la liste `objetsForumContenus` de ces instances avant de les retourner. Cela garantit que l'état de l'objet en mémoire correspond exactement à ce qui a été demandé par la fonctionnalité courante.

### 3. Prise d'empreinte globale et Détection de modification
* **Méthode `_prendreEmpreinteGlobale(signaturesAppels)`** :
  * **Collecte par signature** : Pour chaque signature d'appel unique identifiée, appelle `chargerObjetsForum` avec les arguments correspondants.
  * Pour chaque objet retourné par ces appels, extrait l'empreinte de son état (paramètres, attributs marqués, et contenus si présents).
  * L'empreinte globale est l'agrégation de toutes les empreintes d'objets pour toutes les signatures détectées. Cela garantit que tous les états d'objets (avec ou sans contenus) nécessaires à la fonctionnalité sont protégés.

### 4. Intercepteur Universel de Clics (`main.js` ou `Utils.js`)
* **Création du plugin jQuery `$.fn.onActionSecurisee(evenement, fonctionnalite, callback)`** :
  * **Séquence d'exécution** :
    1. **Validation du flag de sécurité** : Laisse passer l'événement si `e.isSecured` est vrai.
    2. Sinon, bloque l'événement original (`preventDefault()`, `stopImmediatePropagation()`).
    3. Exécute `verifierConditionsInitiales(true)`. Si invalide -> Affiche un toast d'erreur et lance `location.reload()`.
    4. Identifie les classes d'objets forum et les signatures d'appels via `_determinerAppelsChargement()`.
    5. **Prend l'empreinte globale initiale** via `_prendreEmpreinteGlobale(classesIdentifiees)` sur les objets actuellement en cache.
    6. **Lance le rafraîchissement global** via `rafraichirDonneesFonctionnalite(signaturesAppels)`.
    7. Prend la nouvelle empreinte globale.
    8. Compare la nouvelle empreinte avec l'ancienne. Si modifiée -> Affiche un toast ("Action annulée : Données modifiées") et lance `location.reload()`.
    9. Si tout est valide et inchangé, redéclenche l'événement original : `$(this).trigger(evenement, [{ isSecured: true }])`.

### 5. Adaptation des classes existantes
* Remplacer les appels à `.on('click', ...)` ou `.click(...)` par `.onActionSecurisee('click', fonctionnalite, ...)` dans les boutons déclenchant des écritures sur le forum.
* Aucun autre changement de logique métier n'est requis dans les classes filles.

---

## Plan de Test

### 1. Test Nominal
* **Action sans modifications** :
  1. Action standard sans conflit externe.
  * *Résultat attendu :* L'action s'exécute normalement.

### 2. Tests de modification de données (Page Commerce)
* **Modification de paramètres d'un objet concerné par le clic sécurisé** :
  1. O1 et O2 ouverts sur les commandes.
  2. O1 : Modifie un paramètre (ex: changer le "Demandeur") et enregistre.
  3. O2 : Tente une action sur une commande.
  * *Résultat attendu :* Blocage, toast, rechargement de O2.
* **Modification d'attributs d'un objet** :
  1. O1 et O2 ouverts sur les commandes.
  2. O1 : Modifie un attribut (ex: "Besoins") d'un objet et enregistre.
  3. O2 : Tente une action sur une commande.
  * *Résultat attendu :* Blocage, toast, rechargement de O2.
* **Ajout ou Retrait d'un objet contenu** :
  1. O1 : Ajoute ou supprime un convoi rattaché à une commande.
  2. O2 : Tente une action sur une commande.
  * *Résultat attendu :* Blocage (la structure de la liste `objetsForumContenus` a changé), toast, rechargement.
* **Modification d'un objet contenu** :
  1. O1 : Modifie les ressources d'un convoi existant déjà rattaché.
  2. O2 : Tente une action sur une commande.
  * *Résultat attendu :* Blocage (l'empreinte récursive d'un sous-objet a changé), toast, rechargement.

### 3. Tests de structure et droits (Page Commerce)
* **Modification des droits** :
  1. O1 : Un administrateur retire les droits d'accès à O2.
  2. O2 : Tente une action.
  * *Résultat attendu :* Détection via `verifierDroits(true)`, toast, rechargement.
* **Modification de version** :
  1. Simuler une montée de version logique sur le forum.
  2. Tente une action sur O2.
  * *Résultat attendu :* Détection via `verifierVersionSuffisante(true)`, toast, rechargement.
* **Modification de section** :
  1. O1 : Renomme une section de la liste des sections sans inclure le nom original.
  2. O2 : Tente une action sur la section renommée.
  * *Résultat attendu :* Détection via `verifierPresenceSections(true)`, toast, rechargement.
* **Modification de section** :
  1. O1 : Renomme une section de la liste des sections en incluant le nom original.
  2. O2 : Tente une action sur la section renommée.
  * *Résultat attendu :* L'action s'exécute normalement.
* **Suppression d'une section** :
  1. O1 : Supprime une section de la liste des sections.
  2. O2 : Tente une action sur la section supprimée.
  * *Résultat attendu :* Détection via `verifierPresenceSections(true)`, toast, rechargement.
* **Suppression d'un id de section dans les paramètres** :
  1. O1 : Supprime un id de section des paramètres de l'extension.
  2. O2 : Tente une action sur la section sans id.
  * *Résultat attendu :* Détection via `verifierPresenceSections(true)`, toast, rechargement.
* **Modification de paramètres d'un objet non concerné par le clic sécurisé** :
  1. O1 et O2 ouverts sur les commandes.
  2. O1 : Modifie un paramètre et enregistre.
  3. O2 : Tente une action sur une commande.
  * *Résultat attendu :* L'action s'exécute normalement.
* **Modification de droits, versions ou sections non concernés par le clic sécurisé** :
  1. O1 et O2 ouverts sur les commandes.
  2. O1 : Modifie un droit, une version ou une section et enregistre.
  3. O2 : Tente une action sur une commande.
  * *Résultat attendu :* L'action s'exécute normalement.

### 4. Tests sur chaque fonctionnalité
* Tester chaque action sur chaque fonctionnalité page forum, membres et commerce (y compris boites).

## Avancement
Implémentation et tests terminés