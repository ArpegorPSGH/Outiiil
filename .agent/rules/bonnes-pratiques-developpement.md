---
trigger: always_on
---

# 1. Divers

- **Organisation des fichiers :** `js/class/` suit : `framework/` (mères), `page/` (`Page`), `fonctionnalite/` (`FonctionnaliteAlliance`), `objet/` (`ObjetForum`), `parametre/` (`ParametreObjetForum`), `attribut/` (`AttributObjet`). Sous-dossiers par page/objet pour les 3 derniers.
- **Héritage :** Héritez directement des classes mères. Modifiez les formats globaux uniquement dans `ParametreObjetForum`.
- **Création :** Instanciez `ObjetForum` dans `FonctionnaliteAlliance`, un autre `ObjetForum` ou `initialiserFrameworkGlobal()`.
- **Gestionnaires :** Créez-les dans l'initialisation, héritant d'`ObjetForum` avec section dans `LOCATION_HISTORY`.
- **Historiques :** Le premier élément de `FORMAT_HISTORY`, `LOCATION_HISTORY` et `CLASSES_PARAMETRES` sert d'ancre unique. Ajoutez-y un nouvel élément pour chaque changement majeur (nom/format, lieu, paramètres).
- **Optimisation :** Chargez les sous-objets (`objetsForumContenus`) uniquement si nécessaire.
- **Paramètres :** Ne réutilisez pas un paramètre si sa signification change.
- **Initialisation :** Surchargez `FONCTIONNALITES_ALLIANCE` et appelez `Page.init()`. `run()` ne doit contenir que le séquentiel critique ; le reste en `async` non attendu.
- **Versions :** Incrémentez `VERSION_LOGIQUE` si la logique interne ou le format de valeur change radicalement.
- **Accès aux données :** Utilisez EXCLUSIVEMENT `lire[Chaque]Parametre()`, `ecrire[Chaque]Parametre()`, `lire[Chaque]Attribut()` ou `ecrireAttribut()`. Ils gèrent verrous et validation. Ne jamais accéder à `.valeur`.
- **Droits :** Modifiez les droits depuis les fonctionnalités concernées au moment de l'action.
- **Admin Fourmizzz :** `verifierDroits()` délègue à `Page.estAdminFourmizzz()`. Implémentez-la correctement dans la classe `Page`.

# 2. Cycle de vie et Compléments

Surcharger ces méthodes dans les classes filles pour injecter une logique spécifique :

- **`completerChargementPourVersionsAnterieures()` :** Gère la migration des données (switch sur `_determinerVersionChargee()`).
- **`_migrerValeur(valeurChargee)` (Paramètre) :** Convertit une ancienne valeur brute vers le format actuel.
- **`completerRafraichissement()` :** Appelé après chargement sujet/contenus pour charger des données/attributs additionnels.
- **`completerAffichage(donnees)` :** Modifie `donnees` avant rendu HTML.
- **`_invoquerCalculSecurise(methodeCalcul)` :** Pour les attributs dérivés. Gère droits et erreurs (`Restreint` ou `Incalculable`). Passez `methodeCalcul.bind(this)`.

# 3. Affichage et Persistance

- **Colonnes Multiples :** Si une valeur est un tableau, `afficher()` génère plusieurs `<td>`.
- **LocalStorage :**
    - `enregistrerLocalStorage(cle)` (Objet) : Sérialise et ajoute à une liste JSON en local.
    - `chargerObjetsLocalStorage(Classe, cle)` (Fonctionnalité) : Instancie et peuple depuis la liste locale.

# 4. Formats
- **`SEPARATEUR_PARAMETRES` :** Cosmétique pour l'enregistrement (ex: `\n`).