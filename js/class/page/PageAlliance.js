/*
 * Alliance.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe de fonction pour la page /alliance.php, conforme au framework Page.
 *
 * @class PageAlliance
 * @extends {Page}
 */
Utils.register(class PageAlliance extends Page {
    /**
     * Liste unifiée des fonctionnalités à exécuter sur la page Alliance.
     * L'ordre est crucial.
     * @type {Array<Function|typeof FonctionnaliteAlliance>}
     */
    static FONCTIONNALITES = [
        // Étape 1: Ajout de toutes les lignes de joueurs
        FonctionnaliteJoueursExterieurs,
    
        // Étape 2: Mise en forme et enrichissement du tableau complet
        this.prototype.afficherColonnesPubliques,
        this.prototype.afficherIndicateursAttaqueDefense,
        FonctionnaliteDonneesPrivees,
        FonctionnaliteModificationGrade,
    
        // Étape 3: Calculs finaux sur le tableau complet
        this.prototype.afficherStatsEtCompteurs,

        // Étape 4: Ajout des boutons du tableau
        this.prototype.ajouterBoutonsDataTable,
    
        // Étape 5: Ajout des boutons d'action
        FonctionnaliteRecensement,
        FonctionnaliteActualisation
    ];

    /**
     * Instance de la classe Alliance pour gérer les données globales de l'alliance.
     * @type {Alliance}
     */
    _alliance = null;

    /**
     * Définit les propriétés des colonnes du tableau des membres de l'alliance pour DataTable.
     * Chaque clé est le nom de l'en-tête de la colonne, et la valeur est un objet avec :
     * - `sortable` (boolean) : Indique si la colonne est triable.
     * - `visible` (boolean) : Indique si la colonne est visible par défaut.
     * @type {Object<string, {sortable: boolean, visible: boolean}>}
     */
    _columnSettings = {
        "": { sortable: false, visible: true }, // Colonne vide (souvent pour les icônes)
        "Rang": { sortable: false, visible: true },
        "Pseudo": { sortable: true, visible: true },
        "Terrain": { sortable: true, visible: true },
        "Technologie": { sortable: true, visible: true },
        "Fourmiliere": { sortable: true, visible: true },
        "État": { sortable: false, visible: true }
    };

    /**
     * Constructeur de la classe PageAlliance.
     */
    constructor() {
        super();
        this._alliance = new Alliance({tag : Utils.alliance});
    }

    /**
     * Récupère l'indice ou les indices d'une ou plusieurs colonnes du tableau des membres de l'alliance à partir de leur(s) nom(s) d'en-tête.
     * @param {String|String[]} nomEnTete - Le texte de l'en-tête de la colonne, ou une liste de textes d'en-tête.
     * @returns {Number|Number[]} L'indice de la colonne (base 0) si unique et un seul nom d'en-tête est fourni,
     *                            une liste d'indices si plusieurs noms d'en-tête sont fournis ou si un nom unique correspond à plusieurs colonnes,
     *                            ou -1 si aucune colonne n'est trouvée pour un nom unique.
     */
    getColonneIndex(nomEnTete) {
        const allHeaderTexts = [];
        $("#tabMembresAlliance thead th").each((i, th) => {
            allHeaderTexts.push($(th).text().trim().replace(/\s+/g, ' '));
        });

        const findIndicesForSingleHeader = (singleNomEnTete) => {
            const cleanedNomEnTete = singleNomEnTete.trim().replace(/\s+/g, ' ');
            const foundIndices = [];
            allHeaderTexts.forEach((headerText, i) => {
                if (headerText === cleanedNomEnTete) {
                    foundIndices.push(i);
                }
            });
            if (foundIndices.length === 0) {
                console.warn(`[PageAlliance] getColonneIndex: Colonne(s) "${singleNomEnTete}" non trouvée(s).`);
            }
            return foundIndices;
        };

        if (Array.isArray(nomEnTete)) {
            let resultIndices = [];
            nomEnTete.forEach(name => {
                resultIndices = resultIndices.concat(findIndicesForSingleHeader(name));
            });
            return resultIndices;
        } else {
            const indices = findIndicesForSingleHeader(nomEnTete);
            if (indices.length === 1) {
                return indices[0];
            } else if (indices.length === 0) {
                return -1;
            } else {
                return indices;
            }
        }
    }

    /**
     * Surcharge la fonction de la classe mère en se basant sur la présence de l'icône de modification.
     * @returns {boolean}
     */
    estAdminFourmizzz() {
        return $("img[src='images/crayon.gif']").length > 0;
    }

    /**
     * Initialise la page Alliance.
     * Attend le chargement du tableau des membres avant d'appeler l'initialisation du framework.
     * @returns {Promise<void>}
     */
    async init() {
        // Attendre que le tableau des membres soit présent dans le DOM
        if ($("#tabMembresAlliance").length) {
            // Supprimer la première ligne si elle existe (souvent l'en-tête par défaut de Fourmizzz)
            $("#tabMembresAlliance tr:first").remove();
            // Ajouter le thead avec les en-têtes attendus (12 colonnes)
            $("#tabMembresAlliance").prepend(`<thead><tr class='alt'><th></th><th></th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmiliere</span></th><th colspan='2'>État</th><th></th></tr></thead>`);
            await super.init();
        } else {
            // Observer le DOM pour l'apparition du tableau
            let observer = new MutationObserver(async (mutationsList) => {
                if ($("#tabMembresAlliance").length) {
                    $("#tabMembresAlliance tr:first").remove();
                    $("#tabMembresAlliance").prepend(`<thead><tr class='alt'><th></th><th></th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmiliere</span></th><th colspan='2'>État</th><th></th></tr></thead>`);
                    await super.init();
                    observer.disconnect();
                }
            });
            observer.observe($("#alliance")[0], { childList: true, subtree: true });
        }
    }

    /**
     * Méthode utilitaire pour synchroniser la liste des joueurs de l'alliance
     * avec l'état actuel du tableau DOM.
     * Cette méthode est appelée par les fonctionnalités qui ont besoin d'une vue à jour
     * des joueurs affichés, y compris ceux ajoutés dynamiquement.
     * @returns {Promise<void>}
     */
    async synchroniserJoueursDepuisDOM() {
        console.log('lancement ')
        const joueursDansDOM = {};
        const promises = [];

        const pseudoColIndex = this.getColonneIndex('Pseudo');
        const etatColIndex = this.getColonneIndex('État');

        $("#tabMembresAlliance tr:gt(0)").each((i, elt) => {
            const pseudo = $(elt).find(`td:eq(${pseudoColIndex})`).text().split(' ')[0];
            const etatImage = $(elt).find(`td:eq(${etatColIndex}) img`).attr('src');
            // Créer une instance de Joueur ou mettre à jour une existante
            let joueur = this._alliance.joueurs[pseudo];
            if (!joueur && pseudo.length > 0) {
                console.log('pseudo ligne:', pseudo)
                joueur = new Joueur(this, {donneesInitiales:{
                    pseudo: pseudo,
                    etat: etatImage // Ajouter la pastille d'état aux données initiales
                }});
                promises.push(joueur.completerRafraichissement());
            }
            if (joueur) {
                joueursDansDOM[pseudo] = joueur;
            }
        });
        
        await Promise.all(promises); // Attendre que toutes les promesses soient résolues
        
        this._alliance.joueurs = joueursDansDOM;
        console.log('this._alliance.joueurs :', this._alliance.joueurs)
        console.log("[PageAlliance] synchroniserJoueursDepuisDOM: Joueurs synchronisés depuis le DOM:", Object.keys(this._alliance.joueurs));
    }

    /**
     * Parcourt toutes les lignes du tableau (initiales + extérieures) et ajoute les colonnes TdT et Retour.
     * @returns {Promise<void>}
     */
    async afficherColonnesPubliques() {
        console.log('getColonneIndex', this.getColonneIndex(""));
        await this.synchroniserJoueursDepuisDOM();
        console.log('this._alliance.joueurs colonnes publiques :', this._alliance.joueurs)
        // Insérer les en-têtes pour TdT et Retour après la colonne "Fourmiliere" dans le thead
        $("#tabMembresAlliance thead tr th:contains('Fourmiliere')").after(`<th class="dt-head-center">TdT</th><th class="dt-head-center">Retour</th>`);
        
        this._columnSettings.TdT = {sortable: true, visible: true};
        this._columnSettings.Retour = {sortable: true, visible: true};
        console.log('_columnSettings', this._columnSettings)

        const pseudoColIndex = this.getColonneIndex('Pseudo');
        const fourmiliereColIndex = this.getColonneIndex('Fourmiliere');

        await $("#tabMembresAlliance tbody tr").each(async (i, elt) => {
            const pseudo = $(elt).find(`td:eq(${pseudoColIndex})`).text().split(' ')[0];
            console.log('[PageAlliance] pseudo:', pseudo)
            const joueur = this._alliance.joueurs[pseudo];
            console.log('[PageAlliance] joueur:', joueur)

            if (joueur) {
                // Insérer les cellules TdT et Retour après la colonne "Fourmiliere"
                const tempsParcours = await monProfilJoueur.getTempsParcours2(joueur);
                const tdtDisplay = Utils.intToTime(tempsParcours);
                const retourDisplay = Utils.roundMinute(tempsParcours).format("D MMM à HH[h]mm");
                $(elt).find(`td:eq(${fourmiliereColIndex})`).after(`<td align="center">${tdtDisplay}</td><td align="center">${retourDisplay}</td>`);
            } else {
                // Si le joueur n'est pas trouvé dans l'alliance (cas inattendu après synchronisation),
                // ajouter des valeurs par défaut pour éviter les erreurs d'affichage.
                $(elt).find(`td:eq(${fourmiliereColIndex})`).after(`<td align="center">N/C</td><td align="center">N/C</td>`);
            }
        });
    }

    /**
     * Parcourt toutes les lignes et ajoute les icônes d'attaque/défense.
     * @returns {Promise<void>}
     */
    async afficherIndicateursAttaqueDefense() {
        if(!Utils.comptePlus){
            await this.synchroniserJoueursDepuisDOM();
            console.log('this._alliance.joueurs :', this._alliance.joueurs)
            await $("#tabMembresAlliance tbody tr").each(async (i, elt) => {
                const pseudoColIndex = this.getColonneIndex('Pseudo');
                const TerrainColIndex = this.getColonneIndex('Terrain');

                const pseudo = $(elt).find(`td:eq(${pseudoColIndex})`).text();
                const joueur = this._alliance.joueurs[pseudo];

                if (joueur && !await joueur.estJoueurCourant()) {
                    if (joueur.estAttaquable()) {
                        $(elt).find(`td:eq(${TerrainColIndex+1})`).html(IMG_ATT);
                    }
                    if (joueur.estAttaquant()) {
                        $(elt).find(`td:eq(${TerrainColIndex-1})`).html(IMG_DEF);
                    }
                }
            });
        }
    }

    /**
     * Affiche les statistiques finales et les compteurs.
     * Doit s'exécuter après que toutes les modifications de lignes soient terminées.
     * @returns {Promise<void>}
     */
    async afficherStatsEtCompteurs() {
        await this.synchroniserJoueursDepuisDOM(); // S'assurer que la liste des joueurs est à jour
        console.log('this._alliance.joueurs :', this._alliance.joueurs)
        const totalTerrain = this._alliance.calculTerrain();
        const totalFourmiliere = this._alliance.calculFourmiliere();
        const totalTechnologie = this._alliance.calculTechnologie();
        const nbJoueurs = Object.keys(this._alliance.joueurs).length;

        const moyenneTerrain = nbJoueurs > 0 ? totalTerrain / nbJoueurs : 0;
        const moyenneFourmiliere = nbJoueurs > 0 ? totalFourmiliere / nbJoueurs : 0;
        const moyenneTechnologie = nbJoueurs > 0 ? totalTechnologie / nbJoueurs : 0;
        
        // Calculer le nombre de colonnes actuel du tableau en se basant sur la première ligne du tbody.
        // Cela garantit que toutes les colonnes ajoutées dynamiquement sont prises en compte.
        let colspanValue = 0;
        const firstRow = $("#tabMembresAlliance tbody tr:first");
        colspanValue = firstRow.find("td").length;

        $("#tabMembresAlliance").append(`
            <tfoot class='${nbJoueurs % 2 ? "ligne_paire" : ""}'>
                <tr class='gras centre'>
                    <td colspan='${colspanValue}'>Terrain : <span id='totalTerrain'>${numeral(totalTerrain).format()}</span> cm² | Fourmilière : ${numeral(totalFourmiliere).format()} | Technologie : ${numeral(totalTechnologie).format()}.</td>
                </tr>
                <tr class='gras centre'>
                    <td colspan='${colspanValue}'>Moyenne par joueur : Terrain : ${numeral(moyenneTerrain).format()} cm² | Fourmilière : ${numeral(moyenneFourmiliere).format()} | Technologie : ${numeral(moyenneTechnologie).format()}.</td>
                </tr>
            </tfoot>
        `);

        // Affichage des compteurs par état
        const comptesParEtat = await this._alliance.compterJoueursParEtat();
        // Ces éléments sont généralement dans un simulateur ou une section dédiée,
        // il faudra adapter le sélecteur si l'emplacement change.
        // Pour l'instant, on utilise les sélecteurs de l'ancien code pour les images d'état.
        $(".simulateur table[class='ligne_paire'] tr:eq(0) td:eq(1)").append(` (${comptesParEtat['actif'] || 0})`);
        $(".simulateur table[class='ligne_paire'] tr:eq(0) td:eq(3)").append(` (${comptesParEtat['vacances'] || 0})`);
        // Les autres états ('banni', 'inactif', 'colonise') nécessitent une adaptation des sélecteurs
        // ou l'ajout de nouveaux éléments HTML pour les afficher.
        // Pour l'exemple, je me base sur les images existantes.
        $(".simulateur table[class='ligne_paire'] tr:eq(1) td:eq(1)").append(` (${comptesParEtat['inactif_3_jours'] || 0})`); // Exemple
        $(".simulateur table[class='ligne_paire'] tr:eq(1) td:eq(3)").append(` (${comptesParEtat['banni'] || 0})`); // Exemple
        $(".simulateur table[class='ligne_paire'] tr:eq(2) td:eq(1)").append(` (${comptesParEtat['inactif_10_jours'] || 0})`); // Exemple
        $(".simulateur table[class='ligne_paire'] tr:eq(2) td:eq(3)").append(` (${comptesParEtat['colonise'] || 0})`); // Exemple
    }

     /**
     * Prépare la structure de base du tableau en ajoutant les en-têtes et en initialisant DataTable.
     * Doit être exécutée en premier dans la liste FONCTIONNALITES.
     * @returns {Promise<void>}
     */
    async ajouterBoutonsDataTable() {
        // Initialiser DataTable
        $("#tabMembresAlliance").DataTable({
            bInfo : false,
            bPaginate : false,
            bAutoWidth : false,
            dom : "Bfrti",
            buttons : ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
            order : [[this.getColonneIndex('Terrain'), "desc"]], // Tri par défaut par la colonne "Terrain" en ordre décroissant
            stripeClasses : ["", "alt"],
            responsive : true,
            language : {
                zeroRecords : "Aucun joueur trouvé",
                infoEmpty : "Aucun enregistrement",
                infoFiltered : "(Filtré par _MAX_ enregistrements)",
                search : "Rechercher : ",
                buttons : {colvis : "Colonne"}
            },
            columnDefs : Array.from(Object.entries(this._columnSettings)).map(([header, settings]) => ({
                targets: this.getColonneIndex(header),
                sortable: settings.sortable,
                visible: settings.visible
            })).concat([
                {className: "dt-body-center", targets: "_all"}, // Centrer toutes les cellules du corps du tableau
                {type : "quantite-grade", targets : this.getColonneIndex('Terrain')}
            ])
        });
    }
});
