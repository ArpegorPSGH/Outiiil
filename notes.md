Timer les méthodes consulterSection et consulterSujet :
    -   Si le temps d'exécution de consulterSujet est inférieur à 0.1ms, déléguer la lecture du forum pour le chargement des objets contenus aux objets contenus
    -   Si le temps d'exécution est entre 0.1ms et 1ms, ne rien faire
    -   Si le temps d'exécution de consulterSection est supérieure à 1ms, déléguer la lecture du forum pour le chargement des objets externes à la fonctionnalité
    -   Si le temps d'exécution de consulterSujet est supérieur à 10ms, rajouter un flag pour ne pas charger les objets contenus si non nécessaire

Vérification finale :
    -   Cohérence avec le fonctionnement détaillé
    -   Autocohérence
    -   Concision
    -   Optimisé
    -   Complet
    -   Clarté