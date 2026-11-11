# Utilisation

Ce document décrit l'utilisation des outils du dock et des fonctionnalités qui s'ajoutent aux pages du jeu.

---

## Système de droits

L'extension s'appuie sur un système de droits pour contrôler l'accès aux fonctionnalités d'alliance et aux données d'alliance sensibles. Les droits sont définis indépendamment pour chaque fonctionnalité.

### Fonctionnement des niveaux de droits

Les droits Outiiil sont structurés selon 4 niveaux hiérarchisés :
- **Bloqué** : Aucun accès à la fonctionnalité d'alliance. C'est le droit affecté par défaut.
- **Restreint** : Pas d'accès aux données sensibles des autres joueurs affichées dans la fonctionnalité.
- **Normal** : Accès standard à la fonctionnalité et aux données d'alliance.
- **Administrateur** : Accès à toutes les options de la fonctionnalité. Les fonctionnalités de gestion d'Outiiil sont exclusivement accessibles aux administrateurs.

### Évaluation des autorisations

Lorsqu'un membre tente d'exécuter une fonctionnalité d'alliance :
1. **Droits natifs Fourmizzz** : L'extension vérifie en premier lieu si le joueur possède le droit administrateur correspondant dans le jeu (ex: `Administrer le forum` ou `Administrer l'alliance`). Si ce droit est présent, l'accès est accordé immédiatement sans restriction.
2. **Droits Outiiil** : À défaut, l'extension compare le niveau attribué au joueur pour cette fonctionnalité précise dans l'utilitaire au niveau requis.

---

## Options communes aux tableaux

La plupart des tableaux créés ou enrichis par l'extension disposent d'un ensemble d'outils et de contrôles communs :

- **Tri interactif** : cliquez sur l'en-tête de n'importe quelle colonne pour trier les données par ordre croissant ou décroissant. Les nombres, dates, durées et textes sont triés automatiquement selon leur type.
- **Champ de recherche** : un champ de texte au-dessus du tableau permet de filtrer dynamiquement les lignes affichées en saisissant n'importe quel terme.
- **Gestion des colonnes** : le bouton « Colonnes » ouvre un menu déroulant permettant d'afficher ou de masquer individuellement certaines colonnes du tableau.
- **Export des données** : des boutons d'exportation (`Copier`, `CSV`, `Excel`) permettent d'extraire et sauvegarder le contenu du tableau vers le presse-papier ou sous forme de fichier.
- **Pagination** : des boutons de navigation au bas du tableau permettent d'en parcourir rapidement les différentes pages.

---

## Dock

Cette section regroupe toutes les fenêtres d'outils que vous pouvez ouvrir depuis la barre d'outils (dock) qui apparaît sur le côté droit ou en bas de l'écran, selon votre configuration.

---

### Boîte Ponte

Cette boîte vous permet de configurer et de lancer la ponte d'unités avec un calcul automatique du temps nécessaire. Vous y trouvez un tableau où chaque ligne correspond à un type d'unité disponible.

- **Tableau des unités** : chaque ligne affiche le nom du type d'unité, la durée de ponte estimée, et plusieurs champs de saisie.
- **Champ Nombre** : entrez la quantité d'unités que vous souhaitez pondre.
- **Champs de durée** : entrez le temps souhaité sous forme de jours, heures, minutes et secondes (en-têtes : Jour, Heure, Minute, Seconde).
- **Temps de ponte** : situé en bas du tableau, il permet d'ajuster le niveau de temps de ponte. Quand vous modifiez ce niveau, la durée affichée pour chaque unité se met à jour automatiquement.
- **Recalcul automatique** : quand vous changez le nombre d'unités, le temps total nécessaire se recalcule tout seul dans les champs de durée. Quand vous changez un élément du temps, le nombre d'unités pondable se recalcule automatiquement.
- **Bouton de lancement** : situé à droite de chaque ligne. Cliquez dessus pour lancer la ponte de cette unité. Seules les unités que vous avez débloquées dans le jeu apparaissent avec ce bouton disponible.

**Flux d'utilisation :**
1. Choisissez une unité dans le tableau.
2. Entrez le nombre souhaité dans le champ Nombre ou le temps souhaité dans les champs Jours, Heures, Minutes et Secondes.
3. Cliquez sur le bouton de lancement à droite de la ligne.
4. Un message confirme le lancement de la ponte.

---

### Boîte Chasse

Cette boîte propose deux outils distincts : l'analyse de rapports de chasse et la simulation.

#### Onglet Analyser

Cet onglet vous permet d'analyser un ou plusieurs rapports de chasse que vous collez dans un champ de texte.

- **Champ de texte** : collez le texte du ou des rapports de chasse.
- **Tableau des résultats** : dès que vous collez du texte, un tableau se remplit automatiquement avec l'analyse de chaque chasse.
- **Menu déroulant** : si plusieurs chasses sont analysées, un menu apparaît en bas du tableau. Vous pouvez choisir d'afficher une chasse particulière ou le bilan global qui additionne toutes les chasses.

**Flux d'utilisation :**
1. Collez le texte du rapport dans le grand champ de texte.
2. Observez le tableau des résultats qui se remplit automatiquement.
3. Si plusieurs chasses sont présentes, utilisez le menu déroulant en bas du tableau pour sélectionner celle que vous souhaitez consulter, ou le bilan global.

#### Onglet Simuler

Cet onglet est réservé et n'est pas accessible dans la version actuelle de l'outil.

---

### Boîte Combat

Cette boîte regroupe quatre outils distincts : l'analyse de rapport de combat, la simulation, le multi-flood et le calcul du temps de trajet.

#### Onglet Analyser

Cet onglet vous permet d'analyser un rapport de combat.

- **Champ de texte** : collez le texte complet du rapport de combat.
- **Tableau des résultats** : situé juste en dessous du champ, il affiche automatiquement l'analyse du combat dès que vous collez le texte.

**Flux d'utilisation :**
1. Collez le texte du rapport dans le champ prévu.
2. Lisez le tableau des résultats qui apparaît automatiquement en dessous.

#### Onglet Simuler

Cet onglet vous permet de simuler un combat entre deux armées et d'observer le résultat.

- **Formulaire des armées** : deux colonnes, une pour l'attaquant et une pour le défenseur. Pour chaque type d'unité, entrez la quantité souhaitée dans le champ correspondant.
- **Chevrons de switch des armées** : dans le formulaire des armées, des chevrons (flèches) permettent de permuter l'armée et les bonus de l'attaquant et du défenseur.
- **Clic sur les en-têtes de colonnes** : cliquez sur un nom d'en-tête (par exemple « Attaquant », « Défenseur » ou « Lieu ») pour basculer entre une valeur de 0 et votre niveau actuel pour ces paramètres.
- **Champs de bonus** : pour chaque camp, configurez le niveau du bouclier, des armes et de l'étable.
- **Choix du lieu** : sélectionnez le terrain, le dôme ou la loge. Si vous choisissez le dôme ou la loge, indiquez le niveau de la construction correspondante.
- **Curseur de position** : déplacez le curseur pour indiquer si vous êtes l'attaquant ou le défenseur dans cette simulation.
- **Bouton Simuler** : lance le calcul du combat.
- **Résultat affiché** : après la simulation, le formulaire est mis à jour avec les armées avant et après le combat.
- **Bouton de basculement** : après la simulation, un bouton « Avant combat / Après combat » apparaît pour basculer entre l'affichage de l'armée avant et après le combat.
- **Rapport de combat** : après avoir lancé la simulation, une fenêtre apparaît, montrant le détail du combat tour par tour avec les dégâts et pertes.
- **Import d'armée** : deux boutons d'importation ouvrent la fenêtre « Importer une Armée » où vous pouvez entrer un texte décrivant une armée. Cette fenêtre accepte des phrases naturelles (par exemple « 30 soldates et 27 artilleuses ») et des abréviations courantes.
- **Bouton Aide** : dans la fenêtre d'import, ce bouton affiche la liste des abréviations acceptées.
- **Bouton Valider** : dans la fenêtre d'import, ce bouton effectue l'importation de l'armée entrée.

**Flux d'utilisation (simulation) :**
1. Remplissez les quantités d'unités pour l'attaquant et le défenseur dans le tableau.
2. Configurez les bonus (bouclier, armes, étable) pour chaque camp.
3. Choisissez le lieu du combat et, si nécessaire, le niveau de la construction (dôme ou loge).
4. Positionnez le curseur selon votre rôle dans le combat.
5. Cliquez sur le bouton Simuler.
6. Observez la fenêtre du rapport de combat qui apparaît, montrant l'évolution tour par tour.
7. Utilisez le bouton « Avant combat / Après combat » pour comparer l'armée avant et après le combat.

**Flux d'utilisation (import d'armée) :**
1. Cliquez sur le bouton d'importation du camp souhaité (attaquant ou défenseur).
2. Dans la fenêtre qui s'ouvre, collez ou tapez le texte décrivant vos unités.
3. Si nécessaire, cliquez sur le bouton Aide pour consulter la liste des abréviations acceptées.
4. Cliquez sur le bouton Valider pour importer l'armée dans le formulaire.
5. L'armée est chargée automatiquement dans les champs correspondants.

#### Onglet Multi-flood

Cet onglet est réservé et n'est pas accessible dans la version actuelle de l'outil.

#### Onglet Temps de trajet

Cet onglet vous permet de calculer le temps de trajet entre un joueur donné et d'autres joueurs ou alliances.

- **Champ pseudo de référence** : sous l'en-tête « Joueur 1 », entrez le pseudo du joueur. Un clic sur l'en-tête « Joueur 1 » permet de basculer entre votre pseudo actuel et un champ vide.
- **Champ vitesse d'attaque** : entrez la vitesse d'attaque du joueur de référence. Un clic sur l'en-tête « Joueur 1 » permet de basculer entre votre vitesse actuelle et 0.
- **Champ dernier mouvement** : sélectionnez la date et l'heure de son dernier déplacement.
- **Champs cibles** : deux champs distincts permettent de saisir les pseudos des joueurs cibles (séparés par des virgules) ou les tags des alliances cibles.
- **Bouton Calculer** : lance le calcul des temps de trajet.
- **Tableau des résultats** : affiche le pseudo, le terrain de chasse, le temps de trajet et la date de retour estimée.

**Flux d'utilisation :**
1. Remplissez le pseudo de référence et sa vitesse d'attaque.
2. Indiquez la date et l'heure de son dernier mouvement.
3. Entrez le pseudo du joueur ou le tag de l'alliance visée.
4. Cliquez sur le bouton Calculer.
5. Lisez le tableau des résultats affiché en bas de la fenêtre.

---

### Boîte Traceur

Cette boîte affiche les événements du traceur pour les joueurs et les alliances sur le serveur.

- **Options et fonctionnalités communes aux onglets** :
  - **Tableau interactif** : les événements sont présentés sous forme de tableau interactif trié par défaut par date décroissante (du plus récent au plus ancien), avec tri interactif possible sur chaque colonne.
  - **Champ de recherche** : une barre de recherche (« Rechercher : ») permet de filtrer dynamiquement les lignes du tableau selon un pseudo, un tag d'alliance ou un mot-clé d'événement.
  - **Liens cliquables** : les pseudos et tags d'alliances sont automatiquement convertis en liens hypertexte redirigeant vers la page de profil du joueur ou la description de l'alliance dans le jeu.
  - **Export des données** : des boutons d'exportation (`Copier`, `CSV`, `Excel`) permettent d'extraire la liste des événements.
  - **Pagination** : affichage découpé à 25 éléments par page avec boutons de navigation.

#### Onglet Joueur

Dans cet onglet, vous consultez les événements récents détectés pour l'ensemble des joueurs.

- **Colonnes du tableau** : affiche la **Date**, le **Pseudo** du joueur (avec le tag de son alliance) et la description de l'**Événement**.
- **Événements suivis** :
  - **Terrain de chasse** : gains ou pertes de TdC (attaques, chasses).
  - **Constructions** : évolution des niveaux de la fourmilière.
  - **Recherches** : progression des niveaux de technologie du laboratoire.
  - **Trophées** : variations du nombre de trophées détenus.
  - **Alliances** : adhésion, départ ou changement d'alliance d'un joueur.

#### Onglet Alliance

Dans cet onglet, vous consultez les événements récents détectés pour l'ensemble des alliances.

- **Colonnes du tableau** : affiche la **Date**, le **Tag** de l'alliance et la description de l'**Événement**.
- **Événements suivis** :
  - **Terrain total** : variations du terrain cumulé par l'ensemble des membres.
  - **Constructions globales** : évolution cumulée des niveaux de fourmilière.
  - **Recherches globales** : progression cumulée des technologies.
  - **Trophées cumulés** : évolution du total des trophées de l'alliance.

---

### Boîte Carte

Cette boîte affiche la position des joueurs du serveur sur un graphique de type dispersion.

- **Graphique** : chaque joueur est représenté par un point sur le graphique.
- **Position du joueur actuel** : votre propre position est mise en évidence avec une couleur spéciale et un marqueur plus grand.
- **Info-bulle au survol** : lorsque vous passez la souris sur un point, une fenêtre d'informations affiche le nom du joueur, ses coordonnées et le temps de trajet estimé depuis votre position.
- **Ouverture de page** : lorsque vous cliquez sur un point, la page du joueur correspondant s'ouvre dans un nouvel onglet.

**Flux d'utilisation :**
1. Ouvrez la boîte depuis le dock.
2. Observez le graphique avec tous les points représentant les joueurs.
3. Passez la souris sur un point pour afficher ses détails dans l'info-bulle.
4. Cliquez sur un point si vous souhaitez consulter la page du joueur.

---

### Boîte Préférences

Cette fenêtre vous permet de personnaliser le comportement général, les paramètres de l'utilitaire, l'apparence, et le traceur.

#### Onglet Général

Dans cet onglet, vous configurez le comportement des outils du jeu.

- **Affectation des ressources** : paramètre pour le comportement d'affectation.
- **Méthode de lancement** : choix de la méthode utilisée par défaut dans le lanceur de flood.
- **Unités anti-sonde** : nombre d'unités à placer automatiquement en terrain et en dôme selon vos préférences.
- **Unité de sonde** : paramètre lié au comportement de la sonde.

#### Onglet Utilitaire

Dans cet onglet, vous configurez les identifiants des sections de votre utilitaire. Ils sont automatiquement importés une fois les sections créées sur le forum par un administrateur de l'alliance.

- **Champs de texte** : un champ par section requise. À modifier uniquement dans des cas très particuliers et si vous savez ce que vous faites.

#### Onglet Apparence

Dans cet onglet, vous personnalisez l'aspect visuel de l'outil.

- **Couleurs** : choix des couleurs du titre, du fond, du texte et d'autres éléments visuels.
- **Position du dock** : choisissez si le dock s'affiche en bas ou à droite.
- **Visibilité du dock** : activer ou désactiver l'affichage permanent du dock (si désactivé, il apparaît au survol du bord).
- **Affichage des boîtes** : effet d'affichage et masquage des différentes boîtes d'outil.

#### Onglet Traceur

Cet onglet est réservé et n'est pas accessible dans la version actuelle de l'outil.

---

### Boîte Signaler un bug

Cette boîte vous permet d'envoyer un signalement à l'administration de votre alliance lorsque vous rencontrez un dysfonctionnement.

- **Champ de description** : un grand champ de texte où vous décrivez précisément le problème observé, ainsi que les actions qui y ont mené.
- **Bouton Signaler** : lance l'envoi du signalement.
- **Indicateur de progression** : affiché pendant l'envoi pour indiquer l'avancement.
- **Message de confirmation** : affiché lorsque l'envoi a réussi.
- **Message d'erreur** : affiché en cas d'échec de l'envoi.

**Flux d'utilisation :**
1. Décrivez le problème dans le champ de texte, au moment où il se produit et sur la page concernée, pour que les informations soient utiles.
2. Cliquez sur le bouton de signalement.
3. Attendez la fin de l'envoi du signalement.
4. La confirmation de réussite ou le message d'erreur s'affiche.

---

### Boîte Documentation

Cette boîte donne accès à la documentation intégrée au format texte structuré avec un sommaire.

- **Onglets de documents** : en haut de la fenêtre, chaque document disponible apparaît comme un onglet. Cliquez sur un onglet pour charger le contenu du document.
- **Sommaire** : une colonne à gauche affiche la liste des titres du document.
- **Contenu** : la colonne principale affiche le texte du document.
- **Navigation dans le sommaire** : cliquez sur un titre dans le sommaire pour aller directement à la section correspondante dans le texte.
- **Développement et repli du sommaire** : chaque titre qui possède des sous-parties a un petit chevron. Cliquez dessus pour développer ou replier la section.
- **Masquage du sommaire** : une bande verticale entre le sommaire et le texte permet de masquer ou d'afficher le sommaire en cliquant dessus. Le chevron sur cette bande indique l'état actuel.
- **Redimensionnement** : vous pouvez ajuster la taille de la fenêtre en tirant sur ses bords ou ses coins.

**Flux d'utilisation :**
1. Cliquez sur l'onglet du document que vous souhaitez consulter.
2. Utilisez le sommaire pour naviguer rapidement vers la section qui vous intéresse.
3. Développez ou repliez les sections du sommaire selon vos besoins.
4. Cliquez sur la bande verticale si vous souhaitez masquer ou réafficher le sommaire, ou bien redimensionnez la fenêtre pour plus d'aisance de lecture.

---

## Fonctionnalités

Cette section décrit toutes les fonctionnalités qui s'ajoutent automatiquement lorsque vous consultez une page spécifique du jeu. Elles sont regroupées par page, puis séparées entre deux types : celles locales et celles liées à l'alliance.

---

### Page Reine

#### Locale

##### Date de fin

Une colonne supplémentaire « Terminé le » à la fin du tableau des pontes en cours affiche la date de fin de chaque ponte.

##### Stats avec bonus

Un clic sur les statistiques d'une unité permet de basculer entre un affichage avec et sans bonus armes et bouclier.

##### Saisie avancée de ponte

Cliquez sur les icônes de fourmi, sablier ou nourriture pour chaque unité pour afficher un champ de saisie directe. Vous pouvez saisir une durée (ex: `1.5j`, `36h`) ou une quantité de nourriture (ex: `100k`, `0.1M`), et le nombre d'unités à pondre se calcule automatiquement.

---

### Page Construction

#### Locale

##### Indication de rentabilité

Un texte « Rentabilité » avec une infobulle s'affiche à côté du coût de l'étable à pucerons pour présenter le seuil de rentabilité en nombre d'ouvrières.

##### Date de fin
A l'extrémité de la ligne de construction en cours est ajouté la date de fin prévue.

---

### Page Laboratoire

#### Locale

##### Infobulles de rentabilité

Des infobulles s'affichent sur « Armes » et « Bouclier Thoracique » pour comparer le gain d'attaque, défense ou vie selon le choix de pondre les ouvrières nécessaires pour monter d'un niveau la recherche ou de pondre des combattantes. La meilleure solution est mise en gras.

##### Date de fin

A l'extrémité de la ligne de recherche en cours est ajouté la date de fin prévue.

---

### Page Ressource

#### Locale

##### Affectation rapide

Un bouton à droite des champs de récolte de la nourriture et des matériaux permet d'affecter le maximum d'ouvrières possible (minimum entre le terrain inexploité et les ouvrières disponibles).

##### Affectation automatique

Sous les champs de récolte se trouve un sélecteur à choix unique pour définir si l'on souhaite lors de la consultation de la page affecter automatiquement les ouvrières disponibles à la récolte de la nourriture ou des matériaux sur le terrain inexploité, ou bien ne pas faire d'affectation automatique. 

##### Lanceur de chasse

Cette fonctionnalité permet d'optimiser les chasses à lancer et de les lancer automatiquement. Elle se présente comme suit :
- **Terrain à l'arrivée** : un champ pour entrer le terrain prévu au retour de la chasse (hors celui chassé).
- **Nombre de chasses** : un champ pour indiquer combien de chasses lancer, ou laisser coché la boite « Auto » pour un calcul optimisé du terrain chassé par rapport aux pertes encourues.
- **Terrain par chasse** : un champ pour indiquer le terrain à chasser pour chaque chasse, ou laisser coché la boite « Auto » pour un calcul optimisé du terrain chassé par rapport aux pertes encourues.
- **Difficulté** : un menu déroulant pour choisir un niveau de difficulté définissant un taux de réplique à 10%.
- **Garder des JSN** : un champ pour définir le nombre de JSN conservé pour flooder.
- **Intervalle** : un menu déroulant pour choisir le temps entre le lancement des chasses successives.
- **Composition des chasses** : un tableau sous les réglages précédents présente la composition de chacune des chasses à lancer.
- **Envoyer** : un bouton lance les chasses ; vous devez rester sur la page pendant l'exécution.
- **Récapitulatif** : un tableau de synthèse sous le bouton de lancement récapitule :
    - le terrain total chassé
    - la durée de la chasse
    - la date de retour
    - la rentabilité en cm²/jour
    - la difficulté
    - l'estimation des pertes moyennes et maximales, en termes de JSN

**Flux d'utilisation :**
1. Ajustez la valeur du terrain prévu à l'arrivée dans « Terrain à l'arrivée ».
2. Définissez le nombre de chasses et le terrain par chasse (ou laissez coché « Auto » pour une optimisation automatique du rendement).
3. Configurez la difficulté souhaitée, le nombre de JSN à conserver en garnison et l'intervalle entre chaque vague.
4. Vérifiez la composition automatique des vagues et le tableau de récapitulatif.
5. Cliquez sur le bouton « Envoyer » pour démarrer le lancement automatisé des chasses et restez sur la page jusqu'à la fin de la procédure.

##### Date de retour

A l'extrémité de la ligne de chasse en cours est ajouté la date de retour prévue.

---

### Page Armée

#### Locale

##### Replacer l'armée

Un bouton dans la page permet de repositionner automatiquement vos unités selon vos paramètres d'anti-sonde définis dans vos préférences.

##### Informations supplémentaires

Des lignes supplémentaires apparaissent dans le tableau, affichant la vie, l'attaque, la défense et la consommation de vos unités en terrain, dôme et loge.
- **Développement** : un clic sur une ligne bascule entre l'affichage avec bonus (AB) et hors bonus (HB).

##### Flèches de déplacement rapide

Des flèches dans le tableau des unités permettent de transférer rapidement toutes les unités d'un type d'un lieu à l'un de ceux voisins.

##### Statistiques

Un tableau récapitulatif apparaît, affichant la vie, l'attaque et la défense de vos unités, avec et sans bonus, avec et sans Xp.

##### Nombre de troupes

En haut du tableau des troupes en garnison, le nombre total de troupes présentes est affiché.

##### Attaques restantes

Le nombre d'attaques en cours et d'attaques restantes autorisées est affiché dans le titre de la section « Attaques en cours ».

##### Date de retour

L'heure de retour prévue est ajoutée à l'extrémité de la ligne de chaque attaque en cours.

##### Temps de ponte HOF et relatif

Au bas du tableau de la garnison, le temps total de ponte de base (HOF, sans bonus de vitesse) et le temps de ponte relatif (avec votre niveau de temps de ponte) de l'ensemble de votre armée sont affichés.

---

### Page Attaquer

#### Locale

##### Statistiques

Une infobulle s'affiche automatiquement au survol ou à la sélection de la zone du choix d'armée. Elle se réactualise dynamiquement à chaque modification de la quantité d'une unité.
- **Contenu** : présente un tableau comparatif avec les statistiques globales de l'armée sélectionnée : Vie, Attaque et Défense réparties entre la colonne **HB** (Hors Bonus - valeur de base) et **AB** (Avec Bonus - incluant les niveaux de recherche Armes et Bouclier Thoraciques), ainsi que le nombre total de combattantes engagées.

##### Synchroniser

Un bouton situé en bas à gauche de la zone « Armée ». Il calcule la durée d'attente exacte nécessaire pour que votre armée arrive sur la cible au début d'une nouvelle minute ou seconde synchronisée (selon la vitesse d'attaque et l'attente du profil adverse).

**Flux d'utilisation :**
1. Sur la page d'attaque d'un joueur, composez l'armée à envoyer.
2. Cliquez sur le bouton « Synchroniser ».
3. Un décompte (« Synchronisation en cours, veuillez attendre : ... ») s'affiche sous l'armée.
4. À l'échéance du chrono, l'attaque s'envoie automatiquement à la seconde précise.

##### Sonder

Un bouton situé en bas à gauche de la zone « Armée ». Il prépare automatiquement le formulaire d'attaque pour un sondage en sélectionnant la Loge, en fixant la quantité de la plus faible unité disponible selon la valeur configurée dans la préférence « Unité de sonde », puis lance immédiatement le processus de synchronisation automatique avant d'envoyer l'unité.

##### Lanceur de flood
Un optimiseur et lanceur automatique de vagues de flood situé sous la zone « Armée ».
  - **Méthode** : un menu déroulant en haut à gauche permet de définir la méthode :
      - **Standard** : permet de définir dans la colonne « Troupes » le nombre d'unités à envoyer à chaque attaque de la vague.
      - **Optimisée** : calcule automatiquement le nombre d'attaques et de troupes par attaque pour descendre le terrain de la cible le plus bas possible (jusqu'au coefficient 2.75).
      - **Uniforme** : copie la quantité de troupes saisie sur la première attaque sur l'ensemble des autres vagues.
      - **Dégressive** : calcule automatiquement la quantité de troupes de chaque vague de manière à prélever 20% du TdC de la cible à chaque étape.
  - **Supp.** : cocher la case sur l'une des attaques attribue le reliquat de troupes disponibles à cette vague spécifique.
  - **Mon Terrain** et **[Nom du joueur]** : permet d'ajuster le TdC de départ considéré pour l'attaquant et pour le défenseur.
  - **Supprimer/Ajouter une attaque** : liens permettant d'ajuster le nombre de vagues lancées (dans la limite de votre vitesse d'attaque).
  - **Flooder** : bouton qui lance automatiquement la séquence d'attaques calculées, espacées d'une seconde.

**Flux d'utilisation :**
1. Sur la page d'attaque d'un joueur ennemi, accédez au bloc « Lanceur de Flood » en bas de la page.
2. Choisissez la méthode de calcul dans le menu déroulant (ou laissez le choix par défaut).
3. Saisissez ou ajustez les troupes par vague, et si toutes les troupes disponibles doivent être envoyées, cochez la case « Supp. » sur l'attaque souhaitée.
4. Ajustez le nombre d'attaques avec les liens « Ajouter une attaque » ou « Supprimer une attaque ».
5. Cliquez sur le bouton « Flooder » pour exécuter le lancement automatisé des vagues d'attaque.

##### Date de retour et du rapport

A l'extrémité de la ligne de chaque attaque en cours est ajoutée la date de retour prévue, ainsi que l'heure estimée du rapport de combat (RC).

---

### Page Ennemie

#### Locale

##### Temps de trajet

Ajoute une colonne « Temps » calculée selon la distance à l'ennemi et le niveau de vitesse d'attaque.

---

### Page Profil d'un Joueur

#### Locale

##### Temps de trajet

A gauche du tableau des statistiques du joueur est affiché le temps pour aller chez ce joueur.

##### Retour et Rapport

A gauche du tableau des statistiques du joueur est affiché l'heure de retour des troupes et l'heure du rapport de combat, tous deux mis à jour en temps réel.

##### Surveiller ce joueur

Un lien dans la colonne de gauche de la zone « Action » permet d'ajouter le joueur à la **Boîte Radar**.

**Flux d'utilisation :**
1. Sur la page de profil d'un joueur, cliquez sur le lien « Surveiller ce joueur » dans le bloc d'action à gauche.
2. Le lien se transforme en « Supprimer la surveillance » et le joueur est ajouté au tableau de la boîte Radar.
3. Pour retirer le joueur du radar, cliquez sur « Supprimer la surveillance ».

##### Historique

Un bouton affiche le graphique d'évolution des statistiques du joueur (terrain, fourmilière, technologie).

**Flux d'utilisation :**
1. Cliquez sur le bouton « Historique » dans la zone d'action du profil.
2. Le graphique s'insère sous les informations du membre. Choisissez l'intervalle temporel ou filtrez les courbes via la légende.

---

### Page Commerce

#### Locale

##### Informations de l'étable

Dans l'encadré d'envoi des convois, une ligne supplémentaire affiche le niveau de votre étable et la capacité de transport d'une ouvrière.

##### Arrondir

Un bouton à côté de la quantité de nourriture ou matériaux à envoyer arrondi automatiquement la quantité saisie.

##### Enrichissement convois en cours

L'heure de retour et le contenu sont ajoutés aux convois en cours

##### Autocomplétion du pseudo

Le champ du destinataire dans le formulaire d'envoi de convoi propose des suggestions automatiques de pseudos.

#### Alliance

##### Gérer les commandes

Les commandes de ressources de l'alliance sont centralisées et gérables dans le **Tableau des commandes**.
- **Affichage et colonnes du tableau** :
  - **Demandeur** : pseudo du joueur ayant passé la commande.
  - **Date Commande** : date et heure de création de la commande.
  - **Évolution** : évolution demandée.
  - **Nourriture Demandée / Matériaux Demandés** : quantités totales demandées.
  - **Nourriture Restante / Matériaux Restants** : quantités restant à livrer.
  - **Date Souhaitée** : date limite souhaitée pour la livraison de la commande.
  - **Statut** : icône visuelle indiquant l'urgence et le respect de l'échéance :
    - **Croix rouge** : la date minimale « À partir du » n'est pas encore atteinte (ne pas livrer avant cette date).
    - **Rond vert** : commande dans les temps (date souhaitée à plus de 3 jours et « À partir du » passée).
    - **Rond orange** : échéance proche (date souhaitée dans 0 à 3 jours).
    - **Rond rouge** : commande en retard (date souhaitée dépassée).
  - **État** : étape de traitement dans le cycle de vie de la commande :
    - `Nouvelle` : commande venant d'être créée par le demandeur.
    - `En attente` : commande approuvée par l'administration et en file d'attente avant activation.
    - `En cours` : commande active en cours de livraison.
  - **Temps de trajet** : durée estimée du trajet du convoi.
  - **Livrer** (icône coccinelle) : bouton affiché sur les commandes en cours lorsque la date « À partir du » est atteinte.
  - **Options** (icônes crayon et croix) : affichées pour le demandeur de la commande afin de la modifier ou la supprimer.
- **Pied de tableau** : affiche le nombre total de commandes affichées, le volume cumulé de matériaux restants à livrer, ainsi que la quantité en retard en rouge si des échéances sont dépassées.
- **Bouton « Commander »** : situé dans la barre d'outils du tableau, il ouvre la **Boîte Commande** pour créer une nouvelle commande avec les champs suivants :
  - **Évolution** : menu déroulant pour choisir l'évolution (pré-remplit automatiquement la nourriture et les matériaux requis).
  - **Nourriture / Matériaux** : champs de saisie pour ajuster les quantités demandées.
  - **Pour le** : date souhaitée de livraison.
  - **À partir du** : date optionnelle à partir de laquelle la livraison est autorisée. Si non précisée, la commande est considérée livrable immédiatement.
  - **Commander** : un bouton en bas permet d'enregistrer la commande. Un message confirme l'ajout ou la mise à jour.

**Flux de création d'une commande :**
1. Cliquez sur le bouton « Commander » dans la barre d'outils du tableau des commandes.
2. Dans la boîte de commande qui s'ouvre, choisissez une évolution dans le menu déroulant ou saisissez manuellement la nourriture et les matériaux demandés (dans ce cas choisissez l'évolution « Nourriture » ou « Matériaux »).
3. Indiquez la date souhaitée dans le champ « Pour le » et éventuellement la date de début de livraison dans « À partir du ».
4. Cliquez sur le bouton « Commander » au bas de la boîte.
5. L'extension enregistre la nouvelle commande et affiche un message de confirmation en fermant la boîte.

**Flux de modification d'une commande :**
1. Dans le tableau des commandes, repérez votre commande et cliquez sur l'icône de crayon (Modifier) dans la colonne Options.
2. La boîte de commande s'ouvre pré-remplie avec les valeurs actuelles de la commande.
3. Modifiez l'évolution, les quantités de ressources ou les dates de livraison souhaitées.
4. Cliquez sur le bouton « Commander ».
5. Les modifications sont enregistrées, un message confirme la mise à jour.

**Flux de suppression d'une commande :**
1. Dans le tableau des commandes, repérez votre commande et cliquez sur l'icône de croix (Supprimer) dans la colonne Options.
2. Une boîte de dialogue de confirmation s'affiche (« Supprimer cette commande ? »).
3. Confirmez la suppression.
4. Un message d'information s'affiche et la commande est retirée du tableau.

**Flux de livraison d'une commande :**
1. Dans le tableau des commandes, repérez une commande et cliquez sur l'icône de livraison (coccinelle) dans la colonne Livrer.
2. L'extension remplit automatiquement les champs du formulaire de convoi et fait défiler la page vers le haut.
3. Ajustez les quantités si vous le souhaitez, puis cliquez sur le bouton d'envoi de convoi.
4. La quantité livrée est déduite de la commande. Si la commande est intégralement livrée, elle passe automatiquement à l'état « Terminée », est retirée du tableau, et la commande suivante en attente est activée.

**Flux d'annulation d'une livraison :**
1. Cliquez sur le lien « annuler » (dans le délai de 2 minutes) d'un convoi en cours.
2. Les ressources du convoi sont déduites du total livré. Si la commande était terminée, elle repasse automatiquement à l'état « En cours » et est réintroduite dans le tableau.

##### Afficher les convois

La liste des convois en cours dans l'alliance est affichée avec leur expéditeur, destinataire, heure d'arrivée et contenu.

---

### Page Messagerie

#### Locale

##### Analyse des messages

Lorsqu'un nouveau message est ouvert, son contenu est analysé automatiquement. Si le message contient un rapport de chasse ou un rapport de combat, une analyse détaillée est affichée sous le message avec un bouton « + » pour la développer ou la replier.

**Flux d'utilisation :**
1. Ouvrez un message de chasse ou combat.
2. Cliquez sur le bouton « + » ou « - » pour développer ou replier le détail.

##### Mise en forme

Des boutons de mise en forme (gras, italique, souligné) et un sélecteur de couleur sont ajoutés dans la zone de réponse des messages.

**Flux d'utilisation :**
1. Sélectionnez le texte dans la zone de réponse
2. Cliquez sur le bouton de mise en forme souhaité, ou choisissez une couleur dans le sélecteur.

##### Émoticônes supplémentaires

Des images supplémentaires sont disponibles dans la liste des smileys de la zone de réponse.

#### Alliance

##### Colorer le message

Applique un code couleur sur les messages en fonction de leur contenu (rouge pour une perte, vert pour un gain).

---

### Page Chat général et alliance

#### Locale

##### Auto-actualisation

Une case à cocher dans la page permet d'activer/désactiver le rafraîchissement automatiquement des nouveaux messages toutes les quelques secondes.

##### Mise en forme

Des boutons sont ajoutés dans la zone de saisie du message. Ils permettent de mettre le texte en gras, en italique, souligné, de changer la taille du texte, d'insérer une image, un lien, un pseudo ou le nom d'une alliance.
**Flux d'utilisation :**
1. Sélectionnez le texte (si nécessaire) dans la zone de saisie.
2. Cliquez sur le bouton de mise en forme souhaité.

##### Citer un message

Sous chaque message, un lien « citer » apparaît. En cliquant dessus, le texte du message est copié dans la zone de saisie avec la mise en forme appropriée.

##### Couleur du texte

Un sélecteur de couleur remplace le bouton par défaut dans la zone de saisie. La couleur que vous choisissez s'applique au message que vous allez envoyer.

##### Émoticônes supplémentaires

De nouvelles images sont disponibles dans la liste des smileys. Vous pouvez naviguer dans cette liste à l'aide de flèches.

---

### Page Forum

#### Alliance

##### Administration du forum

Cette fonctionnalité permet de préparer rapidement la structure du forum d'alliance depuis la page du forum pour un SDC ou une guerre.
- **Droits d'accès** : nécessite les droits d'administration (niveau `Administrateur` Outiiil ou droit Fourmizzz `Administrer le forum`).
- **Option Outiiil** : une icône de roue dentée placée en haut à droite du forum permet d'afficher ou masquer le menu d'administration d'utilitaire.
- **Menu d'administration d'utilitaire** :
  - **» Préparer le forum pour un SDC** : crée automatiquement sur le forum toutes les sections requises pour l'utilitaire d'alliance qui n'existent pas encore, configure leur visibilité, et enregistre leurs identifiants dans vos paramètres.
  - **» Préparer une section pour une guerre** : affiche le formulaire de préparation de guerre.
- **Formulaire de préparation de guerre** :
  - **Champ d'autocomplétion du tag** : champ de recherche avec autocomplétion pour sélectionner le tag de l'alliance ennemie.
  - **Créer section** : crée automatiquement une nouvelle section nommée « Guerre [TAG] », récupère la liste des membres de l'alliance adverse depuis sa description et génère un sujet individuel pour chaque joueur ennemi contenant la balise `[player]Pseudo[/player]`.

**Flux d'utilisation (Préparation SDC) :**
1. Cliquez sur l'icône Outiiil en haut de la liste des catégories du forum d'alliance pour afficher le menu utilitaire.
2. Cliquez sur le lien « » Préparer le forum pour un SDC ».
3. L'extension crée les catégories nécessaires sur le forum et affiche des notifications de succès.

**Flux d'utilisation (Préparation Guerre) :**
1. Cliquez sur l'icône Outiiil en haut du forum d'alliance pour ouvrir le menu utilitaire.
2. Cliquez sur le lien « » Préparer une section pour une guerre » pour faire apparaître le formulaire.
3. Saisissez le tag de l'alliance ennemie dans le champ de texte en profitant des suggestions de l'autocomplétion.
4. Cliquez sur le bouton « Créer section ».
5. L'extension crée la section « Guerre [TAG] », avant de rafraîchir la page.

##### Administration des commandes

Permet aux administrateurs de modifier en masse l'état des commandes depuis les options sur la dernière ligne de la section « Commandes Outiiil » du forum.
- **Droits d'accès** : nécessite les droits d'administration (niveau `Administrateur` Outiiil ou droit Fourmizzz `Administrer le forum`).
- **Changement d'état** : icône pour afficher les contrôles de modification d'état.
- **Menu déroulant des états** : permet de sélectionner le nouvel état à appliquer (Nouvelle, En attente, En cours, Terminée, Annulée, Supprimée).
- **Modifier l'état** : bouton appliquant le nouvel état à toutes les commandes dont le sujet est coché dans la liste.

**Flux d'utilisation :**
1. Ouvrez la section « Commandes Outiiil » du forum.
2. Cochez les sujets de commandes dont vous souhaitez modifier l'état à l'aide des cases à cocher.
3. Cliquez sur l'icône de changement d'état (double flèche) pour faire apparaître la liste déroulante des états et le bouton de modification.
4. Sélectionnez le nouvel état dans le menu déroulant.
5. Cliquez sur le bouton « Modifier l'état ».
6. L'extension met à jour l'ensemble des commandes sélectionnées et affiche une notification de succès.

**Gestion standard d'une commande par l'administration :**
1. Lors de sa création par un joueur, une commande est « Nouvelle ».
2. Si la commande est acceptée, il faut changer son état à « En attente ».
3. En cas de refus de la commande, sont état doit être changé à « Supprimée » (« Annulée » est pour le demandeur).
4. La commande progressera toute seule vers « En cours » puis « Terminée ».

##### Export des logs

Permet d'exporter les logs d'exécution depuis les options sur la dernière ligne de la section « Logs Outiiil » du forum vers le presse-papier.
- **Droits d'accès** : nécessite les droits d'administration (niveau `Administrateur` Outiiil ou droit Fourmizzz `Administrer le forum`).
- **Copie** : icône de porte-bloc extrayant tous les messages des sujets cochés et les copiant dans le presse-papier avec notification.

**Flux d'utilisation :**
1. Ouvrez la section « Logs Outiiil » du forum d'alliance.
2. Cochez les sujets de logs que vous souhaitez exporter.
3. Cliquez sur l'icône de copie située dans la barre d'action.
4. L'extension place tous les logs dans votre presse-papier.

---

### Page Membres

#### Locale

##### Données publiques

Deux colonnes supplémentaires (« TdT » et « Retour ») sont insérées après la fourmilière pour afficher le temps de trajet vers chaque membre ainsi que l'heure de retour prévue en cas d'envoi.

##### Indicateurs d'attaque et de défense

Des icônes sont affichées dans les colonnes adjacentes au terrain de chasse pour signaler immédiatement les membres attaquables (épées rouges) ou en mesure d'attaquer (épées bleues).

##### Statistiques de l'alliance

Un pied de tableau récapitulatif affiche les totaux cumulés de l'alliance (Terrain de Chasse, Fourmilière, Technologie) ainsi que la moyenne par joueur pour chacun de ces critères.

##### Compteurs par état d'activité

Le nombre de membres correspondant à chaque statut (actif, en vacances, inactif 3 jours, banni, inactif 10 jours, colonisé) est affiché entre parenthèses à côté des pastilles d'état.

#### Alliance

##### Actualiser

Cette fonctionnalité lance la synchronisation des données des joueurs entre le tableau actuel et le forum. Elle sert à intégrer de nouveaux membres.
- **Droits d'accès** : nécessite les droits d'administration (niveau `Administrateur` Outiiil ou droit Fourmizzz `Administrer l'alliance`).
- **Actualiser l'alliance** : un bouton dans la barre d'outils du tableau des membres.
- **Résultat** : après le lancement, un message confirme que la mise à jour a réussi ou signale une erreur si un problème est survenu.
- **Création de membres** : si de nouveaux joueurs sont détectés dans le tableau mais ne font pas partie de l'alliance sur le forum, ils sont enregistrés automatiquement.

**Flux d'utilisation :**
1. Cliquez sur le bouton « Actualiser l'alliance » dans la barre d'outils du tableau.
2. Attendez le message de confirmation ou d'erreur qui apparaît après le traitement.

##### Données privées

Affiche le grade de chaque membre de l'alliance dans une colonne dédiée du tableau.

##### Joueurs extérieurs

Ajoute au tableau des membres ceux qui sont actuellement à l'extérieur.
- **Colonne du tag** : une colonne affichant le tag de l'alliance d'accueil actuelle de chaque joueur permet de visualiser où se trouve chacun.

##### Modifier le grade

Cette fonctionnalité permet de changer le grade et sa priorité pour un membre spécifique.
- **Droits d'accès** : nécessite les droits d'administration (niveau `Administrateur` Outiiil ou droit Fourmizzz `Administrer l'alliance`).
- **Icône** : pour chaque joueur faisant partie de l'alliance, une petite icône de roues dentées apparaît dans sa ligne du tableau.
- **Fenêtre de modification** : Permet d'entrer le nouveau grade et sa priorité. Il contient les champs suivants :
  - **Grade de [nom du joueur]** : le champ dans lequel entrer le grade souhaité.
  - **Priorité du grade** : le champ dans lequel entrer la priorité de grade souhaitée.
  - **Valider** : un bouton permettant d'appliquer le changement.
- **Confirmation** : après la validation, un message confirme que la mise à jour a été effectuée.

**Flux d'utilisation :**
1. Repérez le membre dont vous souhaitez modifier le grade.
2. Cliquez sur l'icône située dans sa ligne.
3. Entrez le nouveau grade et sa priorité dans la fenêtre qui s'ouvre.
4. Cliquez sur le bouton de validation.
5. Attendez le message de confirmation.

##### Recenser

Cette fonctionnalité lance un recensement des données du joueur (troupes, constructions, recherches et ressources).
- **Recensement** : un bouton dédié dans la barre d'outils du tableau des membres.
- **Confirmation** : une fois terminé, un message confirme le résultat du recensement, ou signale une erreur si le processus a échoué.

**Flux d'utilisation :**
1. Cliquez sur le bouton « Recensement » dans la barre d'outils.
2. Attendez le message de confirmation ou d'échec qui apparaît à la fin.

---

### Page Description d'Alliance Extérieure

#### Locale

##### Indicateurs d'attaque et de défense

Les icônes signalant les joueur attaquables (épées rouges) et pouvant attaquer (épées bleues) apparaissent dans le tableau des membres.

##### Totaux de l'alliance

Un pied de tableau récapitulatif affiche la somme cumulée du Terrain de Chasse, de la Fourmilière et de la Technologie pour l'ensemble des membres de l'alliance.

##### Surveiller

Un bouton en bas du tableau permet d'ajouter ou de retirer l'alliance de la **Boîte Radar**.

**Flux d'utilisation :**
1. Sur la page de description d'une alliance extérieure, faites défiler jusqu'en bas du tableau des membres.
2. Cliquez sur le bouton « Surveiller » pour ajouter l'alliance au radar (le bouton se transforme en « Ignorer »).
3. Pour retirer l'alliance du radar, cliquez sur « Ignorer ».

##### Historique

Un bouton en bas du tableau ouvre le graphique d'évolution des statistiques de l'alliance (terrain, fourmilière, technologie).

**Flux d'utilisation :**
1. Sur la page de description d'une alliance, cliquez sur le bouton « Historique » en bas du tableau.
2. Le graphique s'affiche sous le tableau. Vous pouvez ajuster la période (30J, 90J, 180J, Tout) et masquer/afficher les courbes via la légende.

---

## Autres outils

### Boîte Radar

Cette boîte permet de suivre et surveiller une liste personnalisée de joueurs et d'alliances directement depuis la colonne latérale du jeu.

- **Basculement d'affichage** : cliquez sur le titre de la boîte latérale (Outiiil) pour permuter entre l'affichage de la boîte Compte Plus et la boîte Radar.
- **Tableau de surveillance** : affiche sous forme de liste réorganisable la totalité des cibles (joueurs et alliances) ajoutées au radar.
- **Tri par glisser-déposer** : vous pouvez déplacer les lignes du tableau vers le haut ou vers le bas pour réordonner l'affichage selon vos préférences.
- **Rafraîchissement** : une icône d'actualisation présente devant chaque ligne permet de recharger les données du joueur ou de l'alliance en direct. Lors du clic, l'icône tourne sur elle-même pendant le rechargement et met en évidence toute variation de terrain de chasse par un clignotement vert (gain) ou rouge (perte).
- **Infobulles au survol** :
  - **Sur le nom de la cible** : passer la souris sur le pseudo d'un joueur surveillé affiche une infobulle indiquant le **temps de trajet** estimé vers ce joueur ainsi que l'**heure de retour prévue** en cas d'attaque.
  - **Sur le terrain de chasse** : affiche une infobulle indiquant la variation récente de terrain (ex: `+ 50 cm²` en vert ou `- 30 cm²` en rouge) et signale si le joueur est en mode vacances.
- **Détails affichés pour un joueur** : son pseudo (lien cliquable vers son profil) et son terrain de chasse actuel.
- **Détails affichés pour une alliance** : son tag (lien cliquable vers sa description) et le terrain total cumulé de l'alliance.

**Flux d'utilisation :**
1. Ajoutez un joueur ou une alliance au radar en cliquant sur « Surveiller ce joueur » ou « Surveiller » depuis sa page de profil ou de description.
2. Cliquez sur le titre de la boîte dans la colonne latérale pour afficher le tableau du Radar.
3. Cliquez sur le bouton de rafraîchissement devant la ligne d'une cible pour mettre à jour ses données en temps réel.
4. Réorganisez la liste des cibles par glisser-déposer si besoin.
5. Pour retirer une cible du radar, cliquez à nouveau sur le lien de surveillance (« Supprimer la surveillance » ou « Ignorer ») depuis sa page de profil ou de description.

---

### Graphique d'historique

Cet outil graphique interactif vous permet d'analyser l'évolution temporelle des statistiques d'un joueur ou d'une alliance.

- **Boutons de période** : quatre boutons (`30J`, `90J`, `180J`, `Tout`) situés en haut du graphique vous permettent de sélectionner la période temporelle à observer.
- **Sélection des courbes affichées** : vous pouvez cliquer sur les éléments de la légende du graphique pour afficher ou masquer individuellement chaque courbe.
- **Courbes du joueur** : affiche l'évolution de son terrain de chasse (TdC), de sa fourmilière, de ses technologies, ainsi que les périodes de bannissement et de vacances. Un tableau « Historique des alliances » récapitulant ses alliances passées s'affiche également sous le graphique.
- **Courbes de l'alliance** : affiche l'évolution cumulée du terrain total, de la fourmilière globale, des technologies et du nombre de membres de l'alliance.

**Flux d'utilisation :**
1. Allez sur la page de profil d'un joueur ou la page de description d'une alliance.
2. Cliquez sur le bouton « Historique ».
3. Le graphique d'évolution apparaît.
4. Cliquez sur les boutons de sélection temporelle (`30J`, `90J`, `180J`, `Tout`) pour ajuster la plage d'affichage.
5. Cliquez sur les éléments de la légende en bas du graphique pour masquer ou afficher les courbes souhaitées.

---
