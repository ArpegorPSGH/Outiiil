# Ajout de nouvelles fonctionnalités d'alliance (n'utilisant pas de données stockées sur le forum)
- Toujours exécutées

# Ajout de nouvelles fonctionnalités d'alliance (utilisant des données stockées sur le forum)
1. En restreindre l'accès aux joueurs possédant un sujet dans la section Membres Outiiil (restreint en fonction de la version)
2. L'intégrer au système de restrictions d'accès en fonction de la version de l'extension
3. L'intégrer au système de droits des joueurs pour permettre d'en bloquer l'accès ou de bloquer l'affichage des données sensibles des autres joueurs (compatibilité déjà vérifiée via la vérification de sujet membre)
Décrire comment ajouter/modifier une fonctionnalité d'alliance, un objet ou un paramètre

# Ajout d'une nouvelle section
- Reprendre la procédure de création et accès aux sections existantes + UI et mise à jour auto

# Modification d'un format de données du forum
- Lors des tests, si un format dans une section change, en créer une contenant le nom de celle à tester, et enregistrer son id dans l'utilitaire pour l'utiliser pour les tests.

# Robustesse des fonctionnalités
- S'assurer que chaque fonctionnalité est robuste par rapport à une imprécision d'une seconde sur la date d'arrivée prévue des convois, attaques et chasses.
- Lors de la validation par le joueur d'une action entraînant une modification d'un objet qui dépend de l'état actuel de l'objet, vérifier que la modification est correcte par rapport à l'objet actuel avant d'effectuer la modification.
- A chaque clic dont l'action dépend d'un objet enregistré sur le forum, recharger cet objet avant d'effectuer l'action. Si l'action dépend de données de Fourmizzz, recharger la page avant d'effectuer l'action.
- Si des collisions sont avérées ou qu'une fonctionnalité a besoin de s'assurer qu'un objet n'est pas modifié pendant qu'elle l'utilise, introduire un mécanisme d'anti-collision sur le forum (via un flag de réservation sur l'objet forum?).


# Bonnes pratiques
- Mettre les fonctionnalités, objets et paramètres dans les dossiers respectifs
- Toujours créer les objets à l'intérieur de la classe fonctionnalité (ou sa classe mère), dans un autre objet (via objetsContenus), ou dans la fonction d'initialisation de l'extension pour les objets globaux.
- Ne pas modifier un sous-objet (dans un message) chargé depuis le forum ou déjà enregistré, aucune modification ne sera enregistrée
- Pour un nouveau gestionnaire, il doit être créé dans la fonction d'initialisation
- Deux paramètres ne doivent jamais avoir le même historique de formats, et deux objets le même historique de lieux et classes utilisées.
- Les objets contenus, lors d'un rafraîchissement, ne sont pas garantis de pointer vers le même message (s'il y a eu une suppression de message entre-temps), donc ne pas stocker de données non enregistrées sur le forum dans ces objets
- Lors d'une modification de format de paramètre, ajouter le nouveau format à sa liste statique 
- Lors d'une modification des paramètres d'un objet, ajouter le nouveau set de paramètres à sa liste statique. Compléter/ajouter également le contenu de la fonction de migration. Cette méthode doit d'abord appeler la méthode de la classe mère retournant la version de l'objet chargé. Ensuite, pour chaque version (hors actuelle), elle doit implémenter dans des cas séparés la manière de migrer les paramètres d'une version à la suivante, dans une boucle itérant jusqu'à migration jusqu'à la dernière version.
- Ne charger les sous-objets que quand nécessaire pour éviter trop de latence.
- Ne pas réutiliser un paramètre existant si sa signification change, mais en créer un nouveau.
- Une page doit surcharger les liste de fonctionnalités de la classe mère et invoquer init() pour les lancer.
- Lorsque la logique de fonctionnement d'un objet change suffisamment pour ne plus être compatible avec la logique précédente (tout changement faisant que dans des situations identiques, les paramètres ne seront pas censés prendre pas la même valeur), incrémenter la version de logique de l'objet.
---

# Documentation des Points de Vigilance du Framework

Ce document détaille les explications pour les points de vigilance identifiés lors de l'analyse du plan de refonte du framework.

---

### 1. Documentation sur la Métaprogrammation du `GestionnaireDroits`

**Contexte :** Le `GestionnaireDroits` utilise une approche de métaprogrammation pour créer dynamiquement les classes `ObjetDroits` et `ParametreDroit` à l'initialisation.

**Fonctionnement :**
1.  Au démarrage, il découvre toutes les `FonctionnaliteAlliance` existantes via un registre global.
2.  Pour chaque fonctionnalité, il génère à la volée une classe `ParametreDroit` sur mesure, configurée avec l'historique des formats et des abréviations de la fonctionnalité.
3.  Toutes ces classes de paramètres sont ensuite regroupées pour définir la structure de la classe `ObjetDroits`, également créée dynamiquement.

**Avantages :**
*   **Flexibilité Extrême :** L'ajout d'une nouvelle fonctionnalité ne requiert aucune modification manuelle du système de droits. Le framework la découvre et s'adapte automatiquement.
*   **Centralisation :** La logique de création des droits est entièrement contenue dans le `GestionnaireDroits`.

**Risques et Complexité :**
*   **Courbe d'apprentissage :** Ce mécanisme est puissant mais abstrait. Un développeur non familier avec le code devra investir du temps pour comprendre cette génération dynamique avant de pouvoir intervenir dessus.
*   **Débogage :** Le débogage peut être complexe car les classes manipulées n'existent pas de manière statique dans le code ; elles sont construites à l'exécution.

**Recommandation :**
Ce mécanisme doit être accompagné de commentaires détaillés directement dans le constructeur de `GestionnaireDroits` pour guider la maintenance future.

---

### 2. Notes sur la Robustesse : Concurrence et Transactions

**Contexte :** Le framework utilise un forum comme système de stockage, ce qui n'offre pas les garanties d'une base de données traditionnelle (comme les transactions atomiques ou le verrouillage de bas niveau).

#### **2.1 Risque de Conditions de Concurrence (Race Conditions)**

*   **Scénario :** Deux processus (par exemple, deux utilisateurs différents) tentent de modifier la même ressource sur le forum quasi-simultanément.
    *   *Exemple 1 :* Deux extensions à jour détectent une version obsolète d'un paramètre sur le forum et essaient de mettre à jour le titre du sujet de version en même temps.
    *   *Exemple 2 :* Deux nouveaux membres sont ajoutés à l'alliance, et le système tente de créer leurs objets de droits respectifs en parallèle.
*   **Impact :** Dans la plupart des cas prévus par le framework, l'impact est bénin. La seconde écriture écrasera la première avec des données identiques. Cependant, cela constitue une faille de conception théorique.
*   **Mesure :** Le système est conçu pour être "idempotent" : une opération répétée plusieurs fois produit le même résultat que si elle n'était exécutée qu'une seule fois. Il n'y a pas de verrouillage possible, donc la robustesse repose sur cette idempotence.

#### **2.2 Absence de Transactions Atomiques**

*   **Scénario :** Une opération métier complexe nécessite plusieurs écritures séquentielles sur le forum (par exemple, la création d'un objet principal dans un sujet, puis de ses 3 sous-objets dans des messages).
*   **Risque :** Si une des écritures intermédiaires échoue (à cause d'une erreur réseau, d'une déconnexion, etc.), le système se retrouve dans un **état incohérent**. Les premières données sont écrites, mais pas les dernières.
*   **Mesure :**
    *   C'est une limitation inhérente à l'architecture. Il n'y a pas de mécanisme de "rollback" (annulation).
    *   La logique de chargement doit être suffisamment robuste pour gérer des données partiellement écrites (par exemple, en ignorant les objets conteneurs qui n'ont pas tous leurs enfants attendus).
    *   Pour les opérations les plus critiques, il pourrait être envisagé d'ajouter une étape de validation post-écriture ou un flag "opération_terminée" pour marquer la complétude d'une écriture multi-étapes.
