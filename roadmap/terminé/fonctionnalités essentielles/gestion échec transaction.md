# Gestion échec transaction

## Objectifs
Créer un système de transaction pour assurer la cohérence du forum en cas d'erreur.

## Fonctionnement Détaillé
- Créer la notion de transaction
- Le début et la fin d'une transaction sont définis au sein d'une fonctionnalité
- En cas d'erreur, interrompre la transaction, et annuler toutes les modifications effectuées depuis son début :
    - Remettre les messages/titre de sujet des objets forum à leur état avant la transaction
    - Supprimer les objets forum créés pendant la transaction
    - Recréer les objets forum supprimés pendant la transaction
    - Transférer en sens inverse les objets déplacés pendant la transaction
- Afficher un message d'erreur

## Plan d'Implémentation

1. **Création de la classe `Transaction` (Contexte parallèle)** :
   - Créer une classe `Transaction` (`js/class/framework/Transaction.js`).
   - Pour supporter l'exécution parallèle, la transaction sera instanciée et liée à la fonctionnalité parente (pas de variable globale).
   - Elle maintiendra 4 listes distinctes d'instances d'objets pour tracer les altérations :
       - `creations` : Liste d'objets `ObjetForum` créés.
       - `modifications` : Liste d'éléments `{ objetForum, stringInitial }`.
       - `transferts` : Liste d'objets `ObjetForum` transférés.
       - `suppressions` : Liste d'objets `ObjetForum` supprimés.
   - La classe proposera les méthodes d'enregistrement : `enregistrerCreation(objetForum)`, `enregistrerModification(objetForum)`, `enregistrerTransfert(objetForum)`, `enregistrerSuppression(objetForum)`.
   - **Logique d'enregistrement** :
       - *Création* : Ajouter l'objet `ObjetForum` à `creations`.
       - *Modification* : Si l'objet est déjà présent (identifié par son idSujet/idMessage) dans `creations`, ignorer. Sinon, ajouter l'élément `{ objetForum, stringInitial (extrait de l'objet) }` à la liste `modifications`.
       - *Transfert* : Si l'objet est déjà présent dans `creations`, ignorer. Sinon, ajouter l'objet à la liste `transferts` s'il n'y est pas encore.
       - *Suppression* : 
         - Si l'objet est présent dans `creations`, le retirer de `creations` (action nulle). 
         - Sinon, ajouter l'objet `ObjetForum` à la liste `suppressions`.
   - **Logique d'annulation (`annuler(fonctionnalite)`)** :
       L'annulation s'exécutera de manière séquentielle, type d'action par type d'action. 
       1. **Créations** : Appeler la fonction `supprimerSurForum()` sur chacun des objets contenus dans la liste `creations`.
       2. **Suppressions (Recréations)** : 
          Itérer sur la liste `suppressions` dans **l'ordre inverse** (`reverse()`).
          - Si c'est un sujet (lieu `titre`) : Marquer l'objet et ses messages comme modifiés, puis appeler sa méthode `enregistrerSurForum()` pour le recréer.
          - Si c'est un message (lieu `message`) : Réintroduire l'objet message dans les objets contenus de son parent, marquer ses paramètres comme modifiés, et appeler sa méthode `enregistrerSurForum()` pour le recréer.
       3. **Transferts** : Pour chaque objet dans `transferts`, appeler sa méthode `transferer(idSectionDestination)` avec le dernier id de section renseigné statiquement dans l'objet comme destination (provenant de ses `idsSection`).
       4. **Modifications** : Pour chaque élément `{ objetForum, stringInitial }` de `modifications`, appeler `chargerDepuisString(stringInitial)` sur l'objet, puis appeler `enregistrerSurForum(false)`.

2. **Intégration dans `FonctionnaliteAlliance` (Gestion anti-concurrence)** :
   - Ajouter une propriété d'instance `transactionCourante = null`.
   - Créer une méthode `executerTransaction(callback)` qui intègre un verrouillage :
       - **Vérification** : Si `this.transactionCourante` n'est pas `null`, afficher un toast "Une opération est déjà en cours, veuillez patienter." et bloquer l'exécution.
       - Instancier `this.transactionCourante = new Transaction()`.
       - Exécuter `await callback()` dans un bloc `try...catch`.
       - En cas d'erreur, neutraliser la transaction courante (`let tx = this.transactionCourante; this.transactionCourante = null;`), déclencher `await tx.annuler(this)`, afficher l'erreur (`$.toast`), et relancer l'exception.
       - En cas de succès, réinitialiser `this.transactionCourante = null`.
   - Mettre à jour `mettreAJourCache(objet, supprimer = false)` :
       - Si `supprimer` est vrai, retirer l'objet du cache (du tableau des sujets ou des sous-messages du contenant).

3. **Capture de l'état initial et suppression dans `ObjetForum`** :
   - **Méthode de suppression `supprimerSurForum()`** : Appelle `AccesForum.supprimerSujet` ou `AccesForum.supprimerMessage`, puis appelle `mettreAJourCache(this, true)` pour retirer l'objet du cache.
   - **Nouvelle méthode `transferer(idSection)`** : Appelle `AccesForum.transfererSujet(this.idSujet, idSection)`.
   - **État Original** : Remplacer `etatOriginal` par un simple `stringInitial` pour simplifier la structure. L'état initial (`stringInitial`) est récupéré lors du rafraîchissementde l'objet.
   - **Enregistrement auprès de la transaction** : Délocaliser la détection et l'enregistrement auprès de la transaction de `Utils` vers les méthodes d'écriture (`enregistrerSurForum`, `supprimerSurForum`, `transferer`) de `ObjetForum`.

4. **Interception directement dans les méthodes `Utils` via l'objet** :
   - Retirer l'objet `ObjetForum` des signatures des méthodes de `Utils` pour simplifier ces fonctions utilitaires et éliminer tout couplage avec la logique transactionnelle :
     - `AccesForum.creerSujetEtRetournerId(nomSujet, contenu, id, type)`
     - `AccesForum.modifierSujet(nomSujet, contenu, idSujet)`
     - `AccesForum.supprimerSujet(idSujet, idSection)`
     - `AccesForum.envoyerMessageEtRetournerId(idSujet, message)`
     - `AccesForum.transfererSujet(idSujet, idSectionDestination)`
     - `AccesForum.modifierMessage(idMessage, contenu)`
     - `AccesForum.supprimerMessage(idMessage)`


## Tests à effectuer

Pour garantir la robustesse du système, chaque opération isolée puis des combinaisons d'opérations doivent être testées en déclenchant volontairement une exception (ex: `throw new Error("Test rollback")`) à l'intérieur du callback de la transaction. 
À l'issue de chaque test, il faut faire un click sécurisé pour vérifier la bonne synchronisation du cache.

1. **Validation d'un cycle sans erreur** :
   - Effectuer un scénario normal d'une fonctionnalité sans exception.
   - S'assurer que la transaction est validée (nettoyée), qu'aucune action d'annulation n'est déclenchée, et que les modifications ont bien été persistées.

2. **Test du verrouillage anti-concurrence** :
   - Lancer une transaction longue (via `setTimeout` ou `await` lent), puis tenter de relancer la même action pendant ce temps.
   - Vérifier que le système bloque l'exécution et affiche le toast.

3. **Test du verrouillage des clics de changement/rechargement de page** :
   - Lancer une transaction lente, puis tenter de recharger la page, cliquer sur un lien vers une autre page, soumettre un formulaire pendant ce temps.
   - Vérifier que le système bloque l'exécution et affiche le toast.

4. **Rollback d'une création (Sujet et Message)** :
   - Créer un sujet et/ou un message, puis lever une exception.
   - Vérifier que les éléments fraîchement créés ont bien été supprimés du forum.

5. **Rollback d'une modification (Sujet et Message)** :
   - Modifier le titre et le contenu d'un sujet et d'un message existants, puis lever une exception.
   - Vérifier que les textes originaux (ceux au moment du début de la transaction) sont bien restaurés.

6. **Rollback d'un transfert de sujet** :
   - Déplacer un sujet d'une section à une autre, puis lever une exception.
   - Vérifier que le sujet est bien re-transféré dans sa section d'origine.

7. **Rollback d'une suppression (Sujet et Message)** :
   - Supprimer un sujet et/ou un message, puis lever une exception.
   - Vérifier que les éléments supprimés sont bien recréés avec leur contenu d'origine.

8. **Rollback de multiples modifications sur un même objet** :
   - Créer un objet, créer un sous-objet, modifier l'objet, le transférer, puis modifier le sous-objet, puis remodifier l'objet, le retransférer, remodifier le sous-objet, supprimer le sous-objet, puis supprimer l'objet. Lever une exception avec toutes les combinaisons d'opérations successives possibles, en coupant la séquence depuis le début ou la fin.
   - Vérifier que l'annulation s'effectue en appliquant directement l'état de départ en un minimum d'opérations, et que le résultat final correspond parfaitement à l'état initial.

## Avancement
Cycle sans erreur validé
Verrouillage anti-concurrence validé
Verrouillage des clics de changement/rechargement de page validé
Rollback d'une création de sujet validé
Rollback d'une création de message validé
Rollback d'une modification de sujet validé
Rollback d'une modification de message validé
Rollback d'un transfert de sujet validé
Rollback d'une suppression de sujet validé
Rollback d'une suppression de message validé
Rollback de multiples modifications validé