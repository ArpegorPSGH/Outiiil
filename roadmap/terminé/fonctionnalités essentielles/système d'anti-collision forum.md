# Système d'anti-collision forum

## Objectifs
Empêcher les collisions de plusieurs clients sur un même sujet ou message sur le forum en validant l'intégrité de l'état post-transaction après un délai d'attente de sécurité.

---

## Fonctionnement Détaillé

### 1. Attente Post-Transaction
À la fin du callback d'une transaction, si celle-ci contient des opérations (`creations`, `modifications`, `transferts`, `suppressions`), le système attend une durée définie de sécurité avant de valider l'état sur le forum.

### 2. Points de Contrôle Unitaires et Succès Indépendants
La détection de collision repose sur la vérification indépendante de propriétés élémentaires pour chaque objet impliqué dans la transaction (créé, modifié, déplacé ou supprimé). Chaque vérification d'un objet (existence, section, ou valeur) compte comme un succès ou un échec unitaire indépendant. Cela permet une évaluation fine et autorise les mélanges (succès partiels) au sein d'un même objet complexe.

#### A. Vérification pour les objets actifs (Créations, Modifications, Transferts)
- **Existence (Sujets et Messages) :** On s'assure que l'objet existe toujours sur le forum. Le succès de la méthode de rafraîchissement permet de conclure que l'objet existe.
- **Section attendue (uniquement pour les Sujets) :**
  - La fonction utilitaire de récupération d'un sujet (par exemple `Utils.consulterSujetAvecMessagesEtIds(idSujet)`) est modifiée pour inclure la récupération et le retour de l'ID de la section courante (identifié à partir de la section en surbrillance dans l'interface du forum).
  - Lors du rafraîchissement d'un sujet, la mise à jour de sa propriété `idSection` s'effectue directement à partir de cette valeur retournée (et non plus au sein de `chargerObjetsForum`).
  - Pour s'assurer de la validité de la section du sujet, on compare sa valeur `idSection` avant et après le rafraîchissement (la section est correcte si les valeurs correspondent).
- **Conformité de la valeur (Sujets et Messages) :** Appel à la méthode `rafraichir(false, false)` pour charger l'état depuis le forum sans impacter le cache local, et s'assurer que `estModifie === false` (les paramètres locaux sont strictement identiques à ceux du forum).

#### B. Vérification pour les objets supprimés (Suppressions)
- **Cas Objet (Sujet) vs Sous-Objet (Message) pour la sauvegarde :**
  - **Pour un Objet (Sujet) :** Seul l'`idSujet` est sauvegardé dans la liste des suppressions de la transaction. L'`idMessage` est absent ou non pertinent.
  - **Pour un Sous-Objet (Message) :** L'objet parent doit d'abord être récupéré. Son `idSujet` ainsi que l'`idMessage` du sous-objet sont tous deux sauvegardés dans la liste des suppressions de la transaction.
- **Vidage des Identifiants :**
  - Le vidage des identifiants (`idSujet` et/ou `idMessage`) est effectué par l'objet lui-même dans sa propre fonction de suppression.
  - **Déplacement temporel critique :** L'appel à ce vidage dans la méthode de suppression de l'objet est déplacé pour être exécuté **strictement après** l'appel à l'enregistrement de la suppression dans la transaction, afin de garantir que la transaction reçoive et enregistre les identifiants originaux valides avant qu'ils ne soient effacés.
- **Logique de Vérification de Non-existence :**
  - Pour vérifier la suppression, la fonction de vérification de la transaction réinjecte temporairement les identifiants sauvegardés dans les propriétés actives de l'objet supprimé :
    - S'il s'agit d'un **Sujet** (Objet) : On réinjecte `idSujet`.
    - S'il s'agit d'un **Message** (Sous-objet) : On réinjecte à la fois son `idMessage` actif et l'`idSujet` de son objet parent.
  - On lance ensuite une tentative de rafraîchissement de cet objet (`rafraichir()`).
  - Si le rafraîchissement échoue (renvoie `false` ou lève une exception d'inexistence), on en conclut que l'objet n'existe plus sur le forum, ce qui valide la suppression (**Succès**).
  - Si le rafraîchissement réussit, cela signifie que l'objet est toujours présent sur le forum, la suppression n'est donc pas valide (**Échec**).
  - Une fois la vérification terminée, la transaction retire à nouveau les identifiants réinjectés sur l'objet en les remettant à `null`.

### 3. Conditions de Détermination de l'État Global (`verifierEtatForum()`)
À l'issue de l'exécution de tous les points de contrôle unitaires (sur tous les objets actifs et supprimés de la transaction), le résultat de `verifierEtatForum()` est calculé selon les conditions strictes suivantes :

- **`OK` :**
  - **Tous** les points de contrôle unitaires exécutés se soldent par un **Succès**.
  - *Interprétation :* Aucun changement tiers n'a interféré avec la transaction, l'état forum est identique à l'état local attendu.

- **`COLLISION_TOTAL` :**
  - **Tous** les points de contrôle unitaires exécutés se soldent par un **Échec**.
  - *Interprétation :* L'état forum a été entièrement altéré, écrasé ou supprimé par un tiers. Il n'est plus possible de conclure ou d'appliquer de rollback car l'état local est intégralement caduc.

- **`COLLISION_INCOHERENT` :**
  - Il y a au moins un point de contrôle unitaire au statut **Succès** ET au moins un point de contrôle unitaire au statut **Échec**.
  - *Interprétation :* Une partie seulement des opérations de la transaction a été écrasée ou modifiée par un tiers. L'état global est donc incohérent, ce qui nécessite une annulation (rollback) robuste des opérations valides restantes pour assainir le forum avant rechargement.

---

## Plan d'Implémentation

### 1. Configuration de la Durée d'Attente
Ajouter la constante suivante dans `js/constants.js` :
```javascript
const TRANSACTION_COLLISION_WAIT_MS = 1000;
```

### 2. Classe Mère `ObjetForum` (`js/class/framework/ObjetForum.js`)
- **Méthode de suppression :**
  - Modifier le séquencement interne : appeler d'abord l'enregistrement de l'opération de suppression dans la transaction (qui capture l'`idSujet` et l'`idMessage`), et effectuer le vidage des identifiants (`this.idSujet = null; this.idMessage = null;`) **uniquement après** cet enregistrement.
- **Modification de `rafraichir(chargerContenus = true, mettreAJourCache = true)` :**
  - Mettre à jour la propriété `idSection` de l'objet (uniquement si c'est un sujet) directement avec la valeur retournée par la fonction utilitaire de consultation (ex: `Utils.consulterSujetAvecMessagesEtIds`).
  - Permettre l'appel directement sur un sous-objet de type message (`lieu === 'message'`).
  - Dans ce scénario, interroger le sujet parent (`this.objetParent.idSujet`), retrouver le message correspondant à son `idMessage` dans la liste.
  - S'il n'est pas trouvé dans la liste des objets contenus, la méthode doit renvoyer `false`.
  - Si trouvé, exécuter `chargerDepuisString(msg.contenu)`.
- **Méthode récursive `estDoublonDe(autre)` :**
  - Si `lieu === 'message'` : renvoyer `true` si tous ses paramètres ont la même valeur que ceux d' `autre`.
  - Si `lieu === 'sujet'` : renvoyer `true` si tous ses paramètres ont la même valeur ET si tous les sous-objets de sa liste `objetsForumContenus` ont des doublons équivalents chez `autre` (récursion).
  - Dans tous les autres cas (ou si les classes diffèrent), renvoyer `false`.
- **Nettoyage des doublons logiques dans `chargerObjetForumsContenus(messages)` :**
  - Après chargement des sous-objets, identifier les doublons à l'aide de `estDoublonDe()`.
  - Supprimer le doublon sur le forum et localement (`await obj.supprimer()`).

### 3. Classe `ActionSecurisee` (`js/class/framework/ActionSecurisee.js`)
- S'assurer que le callback de l'action sécurisée est correctement exécuté de manière asynchrone attendue :
  ```javascript
  await callback.call(this, e);
  ```

### 4. Classe `FonctionnaliteAlliance` (`js/class/framework/FonctionnaliteAlliance.js`)
- **Dédoublonnage au chargement initial :** Dans `chargerObjetsForum`, appliquer le nettoyage des doublons logiques sur les objets principaux et supprimer automatiquement les doublons détectés sur le forum.
- **Modification de `executerTransaction(callback)` :**
  - À la fin du callback, si `transaction.contientDesOperations()` est vrai :
    1. Attendre `TRANSACTION_COLLISION_WAIT_MS`.
    2. Exécuter `await transaction.verifierEtatForum()`.
    3. Si `COLLISION_TOTAL` : Afficher un toast et recharger la page.
    4. Si `COLLISION_INCOHERENT` : Exécuter le rollback (`await transaction.annuler()`), afficher un toast et recharger la page.

### 5. Classe `Transaction` (`js/class/framework/Transaction.js`)
- **Ajout de `contientDesOperations()` :** Retourne `true` s'il y a au moins un objet dans `creations`, `modifications`, `transferts` ou `suppressions`.
- **Modification de l'enregistrement de suppression :**
  - Stocker l'objet supprimé dans la liste des suppressions de la transaction sous forme d'une structure associant l'objet à ses identifiants originaux :
    - Pour un **Sujet** (Objet) : `{ objet, idSujet: originalIdSujet, idMessage: null }`.
    - Pour un **Message** (Sous-objet) : `{ objet, idSujet: parentIdSujet, idMessage: originalIdMessage }`.
- **Robustesse de `annuler()` (Rollback) :** Entourer chaque rollback d'un bloc `try/catch` individuel dans les boucles pour s'assurer qu'une erreur de rollback sur un objet ne bloque pas le rollback des autres objets restants.
- **Ajout de `verifierEtatForum()` :**
  - Déterminer la liste unique des objets actifs (`creations`, `modifications`, `transferts` non présents dans `suppressions`).
  - **Pour chaque objet actif (Sujet ou Message) :**
    1. Lancer le rafraîchissement `await objet.rafraichir(false, false)`. Si l'appel renvoie `false` ou lève une exception, les points de contrôle valent false.
    2. Pour la **section** (uniquement si l'objet est un **Sujet**) : Sauvegarder l'ID de section actuel (`idSection`) avant le rafraîchissement. Effectuer le rafraîchissement. Comparer l'ID de section obtenu après avec celui d'avant. S'il a changé, le point de contrôle de section est un **Échec**.
    3. Pour la **valeur** (Sujets et Messages) : Après le rafraîchissement réussi, vérifier que `estModifie === false`. Si `true`, le point de contrôle de valeur est un **Échec**.
  - Classer le résultat final global en `OK`, `COLLISION_TOTAL` ou `COLLISION_INCOHERENT` selon la répartition des succès/échecs.

### 6. Fonctions Utilitaires (`js/utils/Utils.js`)
- **Modification de la fonction de récupération de sujet (ex: `Utils.consulterSujetAvecMessagesEtIds`) :**
  - Ajouter l'extraction et la récupération de l'ID de section (la section actuellement en surbrillance/active dans l'interface du forum).
  - Retourner cet ID de section en plus du titre et des messages : `{ idSection, titre, messages }`.
---

## Plan de Validation

### 1. Validation du Dédoublonnage Automatique
- **Protocole :** Simuler la présence de doublons d'un sujet (ex: deux Joueurs créés avec le même pseudo) ou sous-objet sur le forum.
- **Résultat attendu :** Lors du chargement initial, le doublon est détecté par `estDoublonDe`, automatiquement purgé sur le forum via `supprimer()`, et ignoré en mémoire locale.

### 2. Validation de Collision Nominale (Succès)
- **Protocole :** Effectuer une modification simple (ex: changement de grade d'un joueur) sans interférence externe.
- **Résultat attendu :** Après 1 seconde d'attente de sécurité, le statut retourné est `OK` et aucune alerte n'apparaît.

### 3. Validation de Collision par Opération et Type de Collision (Hors suppressions)
Pour chacune des 5 opérations suivantes :
1. **Création de Sujet**
2. **Modification de Sujet**
3. **Transfert de Sujet**
4. **Création de Message**
5. **Modification de Message**

Effectuer les tests combinatoires avec les types de collisions suivants :
- **Collision : Rien (Pas de collision)**
  - *Protocole :* Laisser la transaction se terminer sans modification externe.
  - *Résultat attendu :* Points de contrôle OK -> Statut final `OK`.
- **Collision : Valeur**
  - *Protocole :* Modifier la valeur de l'objet (titre du sujet ou contenu du message) sur le forum pendant le délai de sécurité de 1 seconde.
  - *Résultat attendu :* Échec du point de contrôle de valeur.
- **Collision : Section** *(Uniquement applicable aux Sujets : Création, Modification, Transfert)*
  - *Protocole :* Déplacer le sujet vers une autre section sur le forum pendant le délai de sécurité.
  - *Résultat attendu :* Échec du point de contrôle de section.
- **Collision : Valeur + Section** *(Uniquement applicable aux Sujets : Création, Modification, Transfert)*
  - *Protocole :* Déplacer le sujet ET modifier son titre sur le forum pendant le délai de sécurité.
  - *Résultat attendu :* Échec des points de contrôle de valeur et de section.
- **Collision : Suppression**
  - *Protocole :* Supprimer l'objet (sujet ou message) sur le forum pendant le délai de sécurité de 1 seconde.
  - *Résultat attendu :* Échec des points de contrôle de valeur et de section.

### 4. Validation de collision totale multi-objets et opérations
- **Protocole :** Lancer une transaction sur plusieurs objets contenant plusieurs opérations de natures différentes (une création de sujet, une modification et transfert de sujet, une création de message et une modification de message). Durant l'attente de sécurité, modifier et déplacer l'un des sujets et supprimer l'autre, modifier l'un des messages et supprimer l'autre.
- **Résultat attendu :** Tous les points de contrôle unitaires retournent un **Échec**. Le statut global calculé est `COLLISION_TOTAL`. Aucun rollback n'est tenté sur le forum car l'état distant est entièrement compromis, et la page est rechargée.

### 5. Validation de Collision Incohérente multi-objets et opérations
- **Protocole :** Lancer une transaction sur plusieurs objets contenant plusieurs opérations de natures différentes (une création de sujet, une modification et transfert de sujet, une création de message et une modification de message). Pendant l'attente de sécurité :
  - Modifier ou supprimer seulement une partie de ces éléments directement sur le forum (ex: modifier le sujet mais laisser le message intact).
- **Résultat attendu :** Détection d'un statut `COLLISION_INCOHERENT` (mélange de succès et d'échecs). Exécution du rollback robuste indépendant pour chaque opération restante valide, affichage d'un toast de collision incohérente, et rechargement de la page.

### 6. Validation de la Vérification lors d'une Suppression (Message puis Sujet)
- **Protocole :** Effectuer une transaction contenant une suppression de message et une de sujet sur des objets distincts, puis en les modifiant avant suppression, puis en le faisant sur le même sujet.
- **Résultat attendu :** Aucune collision n'est possible, donc le statut global est `OK`.

### 7. Validation de Collision sur Transfert de Sujet Concurrent
- **Protocole :** Deux transactions concurrentes tentent de déplacer le même sujet vers deux sections différentes (S1 vers S2 pour T1, et S1 vers S3 pour T2).
  - T1 s'exécute en premier, déplace le sujet vers S2.
  - T2 s'exécute ensuite et (tente de) le déplacer vers S3.
- **Résultat attendu :** T2 se termine sans erreur. T1 détecte une collision totale.

### 8. Validation de Collision avec Mélange de Modification et de Transfert sur le même Sujet
- **Protocole :** Une transaction T1 effectue une modification de titre sur un sujet S1. Simultanément, une transaction T2 déplace ce même sujet S1 vers une autre section.
  - Pendant le délai de validation de T1 : Le transfert de T2 s'applique et déplace le sujet S1 vers la nouvelle section sur le forum, mais sans altérer le titre mis à jour par T1.
- **Résultat attendu :** Succès des deux transactions

### 9. Validation d'échec de suppression sur un ID inexistant
- **Protocole :** Lancer la suppression d'un sujet ou d'un message réel avec un identifiant fictif ou inexistant (ex: `99999999`).
- **Résultat attendu :** L'appel aux méthodes `Utils.supprimerSujet` ou `Utils.supprimerMessage` doit lever une erreur, signalant que le sujet ou le message n'a pas pu être supprimé de manière effective (toujours présent ou erreur réseau/forum).

## Avancement
Dédoublonnage validé
Test nominal validé
Tests élémentaires des opérations x types de collision 
Test de collision totale multi-objets et opérations validé
Test de collision partielle (incohérente) multi-objets et opérations validé
Test suppression simple validé
Test collision transfert validé
Test concurrence transfert et modification validé
Impossible de tester l'échec de suppression sans accès à la logique de réponse du forum