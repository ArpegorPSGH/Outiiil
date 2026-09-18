# Copie logs

## Objectifs
Copier tous les logs dans l'ordre dans le presse-papier pour les exporter

## Fonctionnement Détaillé
- Ajouter un bouton dans la section des logs placé comme le changement d'état des commandes
- Lors du clic, vider le presse-papier, puis pour chaque sujet sélectionné, ajouter le titre du sujet, puis tous les messages par ordre croissant d'id

## Plan d'Implémentation
1. **Création de la classe `CopierLogs`** (`js/class/fonctionnalite/forum/CopierLogs.js`) :
   - Hériter de `FonctionnaliteAlliance`.
   - Définir `ABREVIATIONS_HISTORY = ['CLF']`, `NIVEAU_DROIT_OUTIIIL_REQUIS = 'A'`, et `NIVEAU_DROIT_FOURMIZZZ_REQUIS = 'Administrer le forum'`.
   - Dans la méthode `run()` :
     - Vérifier la présence sur la section `"Logs Outiiil"` via l'élément actif `span[class^='forum'][class$='ligne_paire']`.
     - Vérifier la présence de `#form_cat` et l'absence du bouton `#o_copierLogs`.
     - Injecter l'icône de copie (`${IMG_COPIER}`) dans `#form_cat td:last`.
     - Attacher l'événement au clic :
       - Récupérer les identifiants des sujets sélectionnés (`input[name='topic[]']:checked`).
       - Consulter chaque sujet via `AccesForum.consulterSujetAvecMessagesEtIds(idSujet)`.
       - Formater la chaîne de sortie : pour chaque sujet, inclure son titre suivi de l'ensemble de ses messages ordonnés par ID croissant.
       - Écrire le contenu formaté dans le presse-papier (`navigator.clipboard.writeText`) et afficher un toast de confirmation/erreur.

2. **Déclaration dans le manifest** (`manifest.json`) :
   - Ajouter le script `"js/class/fonctionnalite/forum/CopierLogs.js"` dans la section des scripts forum de `manifest.json`.

3. **Intégration dans la page Forum** (`js/class/page/Forum.js`) :
   - Ajouter `CopierLogs` dans la liste statique `FONCTIONNALITES` de la classe `Forum`.

## Tests à effectuer
- Vérifier copie d'un seul sujet
- Vérifier copie de plusieurs sujets
- Vérifier présence préalable de données dans le presse-papier
- Vérifier pas de sujet sélectionné


## Avancement
- [x] Création de la fonctionnalité `CopierLogs` (`js/class/fonctionnalite/forum/CopierLogs.js`)
- [x] Déclaration dans `manifest.json`
- [x] Ajout de la fonctionnalité dans `js/class/page/Forum.js`
- [x] Copie simple
- [x] Copie multiple
- [x] Vérifier écrasement presse-papier
- [x] Vérifier pas de sujet sélectionné