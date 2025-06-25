# Convois au mauvais destinataire

## Objectifs
Gérer les convois dont le destinataire est différent du demandeur de la commande.

## Fonctionnement Détaillé
- Si le destinataire est changé et ne correspond plus au demandeur de la commande, bloquer l'envoi.
- Afficher une notification.

## Plan d'Implémentation

1.  **Identifier le point d'interception :** La logique de vérification doit être ajoutée dans le gestionnaire d'événements `click` de l'élément `$("input[name='convoi']")` dans `js/page/Commerce.js`. C'est là que les données du convoi sont préparées et stockées dans le `localStorage` avant l'envoi réel.

2.  **Récupérer les informations nécessaires :**
    *   Récupérer le pseudo du destinataire du convoi depuis le champ de formulaire (`$("#pseudo_convoi").val()`).
    *   Récupérer l'ID de la commande associée au convoi (`$("#o_idCommande").val()`).
    *   À partir de l'ID de la commande, accéder à l'objet `Commande` correspondant (`this._utilitaire.commande[idCommande]`) pour obtenir le pseudo du demandeur de la commande (`commande.demandeur.pseudo`).

3.  **Implémenter la logique de vérification :**
    *   Dans le gestionnaire de clic de `$("input[name='convoi']")`, avant de stocker le convoi dans le `localStorage` (`localStorage.setItem('outiiil_convoi_a_poster', JSON.stringify(monConvoi.toObject()));`), ajouter une condition :
        ```javascript
        if (idCommande != -1) { // Si c'est un convoi lié à une commande Outiiil
            const commande = this._utilitaire.commande[idCommande];
            const destinataireConvoi = $("#pseudo_convoi").val();

            if (commande && commande.demandeur.pseudo !== destinataireConvoi) {
                // Le destinataire du convoi ne correspond pas au demandeur de la commande
                $.toast({...TOAST_ERROR, text : `Le destinataire du convoi (${destinataireConvoi}) ne correspond pas au demandeur de la commande (${commande.demandeur.pseudo}).`});
                e.preventDefault(); // Empêcher l'envoi du convoi
                return; // Arrêter l'exécution
            }
        }
        ```

4.  **Afficher une notification :** Utiliser `$.toast({...TOAST_ERROR, ...})` pour informer l'utilisateur que le destinataire ne correspond pas.

5.  **Empêcher l'envoi :** Utiliser `e.preventDefault()` et `return` pour bloquer la soumission du formulaire et l'envoi du convoi si la condition n'est pas remplie.

## Tests à Effectuer

1.  **Scénario 1 : Convoi avec destinataire correct**
    *   **Action :** Créer une commande pour le joueur A. Tenter d'envoyer un convoi au joueur A en utilisant le bouton "Livrer" de la commande.
    *   **Résultat attendu :** Le convoi est envoyé avec succès et la commande est mise à jour. Aucune notification d'erreur.

2.  **Scénario 2 : Convoi avec destinataire incorrect**
    *   **Action :** Créer une commande pour le joueur A. Tenter d'envoyer un convoi au joueur B (différent de A) en modifiant manuellement le champ "Pseudo" du convoi.
    *   **Résultat attendu :** Une notification d'erreur s'affiche indiquant que le destinataire ne correspond pas au demandeur de la commande. Le convoi n'est PAS envoyé.

3.  **Scénario 3 : Convoi sans commande associée (envoi manuel)**
    *   **Action :** Tenter d'envoyer un convoi via le formulaire de convoi sans qu'il soit lié à une commande Outiiil (c'est-à-dire `o_idCommande` est `-1`).
    *   **Résultat attendu :** Le convoi est envoyé normalement (le blocage ne s'applique qu'aux convois liés à une commande Outiiil).

## Avancement
- Implémentation de la logique de vérification du destinataire dans `js/page/Commerce.js`.
- Tests validés.
