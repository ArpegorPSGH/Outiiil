# Séparation fonctionnalités alliance

## Objectifs
Rendre les fonctionnalités sur la page alliance indépendantes les unes des autres.

## Fonctionnement Détaillé
- Créer sur la page des fonctions sans arguments pour :
    - Ajouter les boutons de base du tableau
    - Compter les joueurs dans chaque état (ajouter attribut à Joueur et compter via Alliance)
    - Afficher les stats d'alliance (via la classe Alliance)
    - Afficher les indications d'adversaires à portée attaque ou défense (utiliser Joueur)
    - Ajouter et remplir les colonnes dépendant de données publiques (attributs purs de Joueur)
- Les ajouter à FONCTIONNALITES_LOCALES
- Fonctionnalité d'actualisation de l'alliance :
    - Ne vérifier que la version et les droits d'administration Fourmizzz, pas la présence sujet membre ni les droits Outiiil (surcharger fonctions de vérif à true)
    - Initialiser l'alliance de rattachement du Joueur
    - Ajouter le bouton et lier son callback (à mettre à jour)
- Fonctionnalité de recensement :
    - Vérification de version, sujet membre, et droit R ou plus ou droits d'administration Fourmizzz
    - Ajouter le bouton et lier son callback
    - Appler la fonction de recensement de l'objet du joueur chargé depuis le forum
- Fonctionnalité de modification de grade :
    - Vérification de version, sujet membre, et droit A ou plus ou droits d'administration Fourmizzz (se fier à la présence du crayon sur une ligne au moins)
    - Présence d'un sujet membre de la cible
    - Ajouter le bouton et lier son callback (à mettre à jour)
- Fonctionnalité d'ajout de colonnes :
    - Vérification de version, sujet membre, et droit R ou plus ou droits d'administration Fourmizzz
    - Ajouter et remplir les colonnes dépendant de données privées (paramètre ou calculé à partir d'un paramètre)
- Fonctionnalité d'ajout de joueurs extérieurs :
    - Vérification de version, sujet membre, et droit R ou plus ou droits d'administration Fourmizzz
    - Ajouter les lignes des joueurs présents sur le forum mais pas dans le tableau d'alliance
- Les ajouter à FONCTIONNALITES_ALLIANCE
- Sur la page membres, les droits d'administration Fourmizzz by-passent les droits Outiiil.
- Considérer uniquement les joueurs sur le forum comme membres de l'alliance, et ceux sur la page alliance mais pas sur le forum comme de simples joueurs, chargés via leur pseudo (chargement publique bloqué par l'absence d'id sujet?) pour être utilisés

## Plan d'Implémentation

Ce plan d'implémentation est basé sur une approche séquentielle unifiée pour garantir la robustesse, la maintenabilité et une stricte séparation des responsabilités entre les fonctionnalités.

### Architecture : Le Pipeline Séquentiel Unifié

Le cœur de l'architecture reposera sur une unique liste statique `FONCTIONNALITES` dans `PageAlliance`. Cette liste contiendra un mélange de références de méthodes (pour les fonctionnalités locales) et de classes (pour les `FonctionnaliteAlliance`). La méthode `Page.init()` parcourra cette liste et exécutera chaque élément séquentiellement, en détectant son type pour savoir comment le traiter.

**Gestion de l'état du tableau :**
Une méthode utilitaire, `synchroniserJoueursDepuisDOM`, sera responsable de lire l'état actuel du tableau DOM. Elle sera appelée par toute fonctionnalité nécessitant une vue d'ensemble à jour des joueurs affichés, garantissant que les données sont toujours fraîches.

---

### Phase 1 : Préparation et Mises à Jour du Framework

1.  **Mettre à jour `Page.js` :**
    *   Modifier la méthode `init()` pour d'abord vérifier la présence des sections de version et rafraîchir le `GestionnaireVersions`, puis parcourir la liste unifiée `FONCTIONNALITES` pour exécuter chaque élément. Les fonctionnalités d'alliance ne sont lancées que si les versions sont présentes.
        ```javascript
        // Dans js/class/framework/Page.js
        async init() {
            const versionsPresentes = await window.gestionnaireVersions.verifierPresenceSectionVersions();
            if (versionsPresentes) {
                await window.gestionnaireVersions.rafraichir();
            }

            for (const item of this.constructor.FONCTIONNALITES) {
                if (typeof item === 'function') {
                    await item.call(this);
                } else if (item.prototype instanceof FonctionnaliteAlliance) {
                    if(versionsPresentes) {
                        const instance = new item(this);
                        await instance.init();
                    }
                }
            }
        }
        ```

2.  **Mettre à jour `FonctionnaliteAlliance.js` :**
    *   Ajouter l'attribut `NIVEAU_DROIT_REQUIS = 'R';`.
    *   Mettre à jour la méthode `verifierDroits` pour qu'elle utilise cet attribut par défaut.

3.  **Refactoriser `Joueur.js` et `Alliance.js` :**
    *   **`Joueur.js` :** Remplacer l'attribut `mv` par un attribut `etat` plus descriptif ('actif', 'vacances', 'banni', etc.).
    *   **`Alliance.js` :** Ajouter une méthode `compterJoueursParEtat()` qui parcourt sa liste de joueurs et retourne les comptes.

4.  **Définir la structure de `PageAlliance.js` :**
    *   La méthode `init` attendra le chargement du tableau avant d'appeler `super.init()`.
    *   Ajouter la méthode utilitaire `async synchroniserJoueursDepuisDOM()`.
    *   Déclarer une seule liste statique `FONCTIONNALITES` qui définira l'ordre d'exécution.

---

### Phase 2 : Implémentation de la Chaîne de Fonctionnalités (Ordre Optimisé)

L'ordre dans la liste `FONCTIONNALITES` de `PageAlliance.js` est crucial et dictera toute la logique d'exécution.

```javascript
// Ordre final dans js/class/page/Alliance.js
static FONCTIONNALITES = [
    // Étape 1: Préparation de la structure du tableau
    this.prototype.ajouterBoutonsDataTable,

    // Étape 2: Ajout de toutes les lignes de joueurs
    FonctionnaliteJoueursExterieurs,

    // Étape 3: Mise en forme et enrichissement du tableau complet
    this.prototype.afficherColonnesPubliques,
    this.prototype.afficherIndicateursAttaqueDefense,
    FonctionnaliteDonneesPrivees,
    FonctionnaliteModificationGrade,

    // Étape 4: Calculs finaux sur le tableau complet
    this.prototype.afficherStatsEtCompteurs,

    // Étape 5: Ajout des boutons d'action
    FonctionnaliteRecensement,
    FonctionnaliteActualisation
];
```

**Détail de l'implémentation de chaque fonctionnalité :**

1.  **`ajouterBoutonsDataTable` (Méthode locale) :** Prépare la structure de base du tableau en ajoutant les en-têtes et en initialisant `DataTable`. Doit être exécutée en premier.

2.  **`FonctionnaliteJoueursExterieurs` (Classe) :**
    *   **Rôle :** S'assure que toutes les lignes de joueurs (internes et externes) sont présentes dans le DOM.
    *   **Logique :** Appelle `synchroniserJoueursDepuisDOM` pour lister les joueurs déjà présents. Charge les joueurs depuis le forum, compare les listes, et ajoute les `<tr>` manquantes au `<tbody>`. Son unique rôle est de compléter les lignes.

3.  **`afficherColonnesPubliques` (Méthode locale) :** S'exécute après `FonctionnaliteJoueursExterieurs`. Elle parcourt **toutes** les lignes du tableau (initiales + extérieures) et ajoute les colonnes `TdT` et `Retour`.

4.  **`afficherIndicateursAttaqueDefense` (Méthode locale) :** Parcourt **toutes** les lignes et ajoute les icônes d'attaque/défense.

5.  **`FonctionnaliteDonneesPrivees` (Classe) :** Charge ses données, puis parcourt **toutes** les lignes pour ajouter la colonne `Grade`.

6.  **`FonctionnaliteModificationGrade` (Classe) :** Charge ses données, puis parcourt **toutes** les lignes pour ajouter les icônes de modification de grade.

7.  **`afficherStatsEtCompteurs` (Méthode locale) :**
    *   **Rôle :** Affiche les statistiques finales. Doit s'exécuter après que toutes les modifications de lignes soient terminées.
    *   **Logique :** Appelle `synchroniserJoueursDepuisDOM` pour obtenir l'état final et complet du tableau, puis calcule et affiche les statistiques à l'aide de la classe `Alliance`.

8.  **`FonctionnaliteRecensement` et `FonctionnaliteActualisation` (Classes) :** Ajoutent leurs boutons d'action respectifs à l'interface.

---

### Phase 3 : Finalisation

1.  **Conservation de l'ancien code :** Le fichier `js/class/page/Alliance.js` existant sera renommé en `Alliance_old.js` pour servir de référence et permettre des tests de non-régression.
2.  **Mise à jour de la roadmap :** La section "Avancement" sera mise à jour au fur et à mesure de l'implémentation.

## Tests à effectuer

### Préambule : Configuration de l'Environnement de Test

**1. Utilisateurs de Test :**
Les tests seront menés avec les profils suivants, configurés dans la section "Droits Outiiil" :
*   **`JoueurAdmin`** : Droit 'A' (Administrateur).
*   **`JoueurNormal`** : Droit 'N' (Normal).
*   **`JoueurRestreint`** : Droit 'R' (Restreint).
*   **`JoueurBloque`** : Droit 'B' (Bloqué).

**2. Simulation des Droits d'Administration Fourmizzz :**
*   **Méthode :** Commenter le test de présence icône admnistration.
*   **Application :** Les tests pour les fonctionnalités dépendant de ces droits seront exécutés une fois avec le comportement normal (droits FZ détectés) et une fois avec la simulation activée (droits FZ masqués).

**3. Fonctionnalité de Test pour la Lecture :**
*   Une fonctionnalité `TestFonctionnaliteLectureDonnees` sera utilisée pour valider la lecture des données du recensement par un joueur ayant des droits restreints.

---

### 1. Tests Unitaires des Fonctionnalités d'Alliance

**Configuration de base pour tous les tests unitaires :**
La liste `FONCTIONNALITES` de `PageAlliance.js` contiendra toujours **toutes les fonctionnalités locales**, plus **une seule** fonctionnalité d'alliance à la fois, à sa position d'utilisation.

#### **1.1 `FonctionnaliteDonneesPrivees` / `FonctionnaliteJoueursExterieurs`**
*   **Logique des droits :** Ces fonctionnalités nécessitent un droit 'R' (Restreint) ou plus.
*   **Test à la limite :**
    *   **Profil Limite (Succès) : `JoueurRestreint`**
        *   **Vérification :** Les colonnes privées (`Grade`) et les joueurs externes sont correctement ajoutés et affichés.
    *   **Profil Limite (Échec) : `JoueurBloque`**
        *   **Vérification :** Les colonnes privées et les joueurs externes ne sont **pas** ajoutés. Aucune erreur n'apparaît en console.

#### **1.2 `FonctionnaliteModificationGrade`**
*   **Logique des droits :** Accessible avec le droit 'A' (Admin Outiiil) **OU** les droits d'administration Fourmizzz.
*   **Test à la limite :**
    *   **Profil Limite (Succès) : `JoueurAdmin`**
        *   **Vérification :** L'icône de modification de grade est visible et fonctionnelle.
    *   **Profil Limite (Succès) : `JoueurNormal` avec droits d'admin FZ**
        *   **Vérification :** L'icône de modification de grade est visible et fonctionnelle.
    *   **Profil Limite (Échec) : `JoueurNormal` (simulation sans droits FZ)**
        *   **Vérification :** L'icône de modification de grade n'est **pas** visible.

#### **1.3 `FonctionnaliteRecensement`**
*   **Logique des droits :** Accessible à tous sauf 'B' (Bloqué).
*   **Test à la limite :**
    *   **Profil Limite (Succès) : `JoueurRestreint`**
        *   **Vérification :** Le bouton "Recensement" est visible. Un clic déclenche l'écriture sur le forum et affiche une notification de succès.
    *   **Profil Limite (Échec) : `JoueurBloque`**
        *   **Vérification :** Le bouton "Recensement" n'est **pas** visible.
*   **Test de Lecture :**
    *   **Configuration :** Activer les locales + `TestFonctionnaliteLectureDonnees`.
    *   **Profil de test : `JoueurRestreint`**.
    *   **Action :** La fonctionnalité de test tente de lire les données du recensement posté par `JoueurRestreint`.
    *   **Vérification :** La console confirme que les données sont lues correctement.

#### **1.4 `FonctionnaliteActualisation`**
*   **Logique des droits :** Accessible avec le droit 'A' (Admin Outiiil) **OU** les droits d'administration Fourmizzz.
*   **Test à la limite :**
    *   **Profil Limite (Succès) : `JoueurAdmin`**
        *   **Vérification :** Le bouton "Actualiser l'alliance" est visible et fonctionnel.
    *   **Profil Limite (Succès) : `JoueurNormal` avec droits d'admin FZ**
        *   **Vérification :** Le bouton "Actualiser l'alliance" est visible et fonctionnel.
    *   **Profil Limite (Échec) : `JoueurNormal` (simulation sans droits FZ)**
        *   **Vérification :** Le bouton "Actualiser l'alliance" n'est **pas** visible.

---

### 2. Test d'Intégration Complet

*   **Objectif :** Valider le comportement global de la page avec toutes les fonctionnalités activées, pour chaque profil (avec et sans droits Fourmizzz pris en compte).
*   **Configuration :** La liste `FONCTIONNALITES` est complète.
*   **Procédure :** Répéter le scénario de vérification ci-dessous pour chaque profil (`JoueurAdmin`, `JoueurNormal`, `JoueurRestreint`, `JoueurBloque`) x avec/sans droits FZ. Tester 2 fois d'affilée sans rechargement le recensement et l'actualisation.

#### **Scénario de Vérification par Profil**
1.  Charger la page alliance.
2.  **Vérifier l'état de l'interface :**
    *   **[ ] Tableau :** Le tableau est complet et correctement affiché.
    *   **[ ] Colonnes et Icônes :** Les éléments sont affichés ou masqués en parfaite conformité avec les droits du profil testé.
    *   **[ ] Boutons :** Les boutons d'action sont affichés ou masqués en parfaite conformité avec les droits du profil testé.
    *   **[ ] Console :** Aucune erreur JavaScript n'est présente.

## Avancement

### Phase 1 : Préparation et Mises à Jour du Framework - Terminé

1.  **Mettre à jour `Page.js` :**
    *   La méthode `init()` a été modifiée pour parcourir la liste unifiée `FONCTIONNALITES` et exécuter chaque élément séquentiellement.
2.  **Mettre à jour `FonctionnaliteAlliance.js` :**
    *   L'attribut `NIVEAU_DROIT_REQUIS = 'R';` a été ajouté.
    *   La méthode `verifierDroits` a été mise à jour pour utiliser cet attribut par défaut.
3.  **Refactoriser `Joueur.js` et `Alliance.js` :**
    *   **`Joueur.js` :** L'attribut `mv` a été remplacé par `etat` et toutes les références associées ont été mises à jour.
    *   **`Alliance.js` :** La méthode `compterJoueursParEtat()` a été ajoutée et mise à jour pour compter les joueurs colonisés en plus de leur état principal.
4.  **Définir la structure de `PageAlliance.js` :**
    *   Le fichier `js/class/page/Alliance.js` a été renommé en `js/class/page/Alliance_old.js`.
    *   Un nouveau fichier `js/class/page/Alliance.js` a été créé avec la structure de base, incluant la méthode `init` qui attend le chargement du tableau, la méthode utilitaire `synchroniserJoueursDepuisDOM`, et les méthodes locales `ajouterBoutonsDataTable`, `afficherColonnesPubliques`, `afficherIndicateursAttaqueDefense`, et `afficherStatsEtCompteurs`.
    *   Les corrections suite au feedback utilisateur ont été appliquées :
        *   `ajouterBoutonsDataTable` ajoute uniquement les boutons.
        *   `afficherColonnesPubliques` n'ajoute plus la colonne de grade.
        *   `colspanValue` utilise le nombre de colonnes actuel du tableau.
        *   `Utils.register` a été ajouté à la classe `PageAlliance`.

### Phase 2 : Implémentation de la Chaîne de Fonctionnalités - Terminé

1.  **`ajouterBoutonsDataTable` (Méthode locale) :** Implémentée dans `PageAlliance.js`.
2.  **`FonctionnaliteJoueursExterieurs` (Classe) :** Implémentée dans `js/class/fonctionnalite/alliance/FonctionnaliteJoueursExterieurs.js`.
3.  **`afficherColonnesPubliques` (Méthode locale) :** Implémentée dans `PageAlliance.js`.
4.  **`afficherIndicateursAttaqueDefense` (Méthode locale) :** Implémentée dans `PageAlliance.js`.
5.  **`FonctionnaliteDonneesPrivees` (Classe) :** Implémentée dans `js/class/fonctionnalite/alliance/FonctionnaliteDonneesPrivees.js`.
6.  **`FonctionnaliteModificationGrade` (Classe) :** Implémentée dans `js/class/fonctionnalite/alliance/FonctionnaliteModificationGrade.js`.
7.  **`afficherStatsEtCompteurs` (Méthode locale) :** Implémentée dans `PageAlliance.js`.
8.  **`FonctionnaliteRecensement` (Classe) :** Implémentée dans `js/class/fonctionnalite/alliance/FonctionnaliteRecensement.js`.
9.  **`FonctionnaliteActualisation` (Classe) :** Implémentée dans `js/class/fonctionnalite/alliance/FonctionnaliteActualisation.js`.
10. **Intégration :** La liste `FONCTIONNALITES` de `PageAlliance.js` a été mise à jour pour inclure toutes les fonctionnalités dans le bon ordre.

### Tests

1.  **`afficherColonnesPubliques` (Méthode locale)** validé
2.  **`afficherIndicateursAttaqueDefense` (Méthode locale)** validé
3.  **`afficherStatsEtCompteurs` (Méthode locale)** validé
4.  **`ajouterBoutonsDataTable` (Méthode locale)** validé
5.  **`FonctionnaliteJoueursExterieurs` (Classe)** validé
6.  **`FonctionnaliteDonneesPrivees` (Classe)** validé
7.  **`FonctionnaliteModificationGrade` (Classe)** validé
8.  **`FonctionnaliteRecensement` (Classe)** validé
9.  **`FonctionnaliteActualisation` (Classe)** validé
9.  Test d'intégration validé

