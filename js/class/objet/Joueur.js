/*
 * Joueur.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe pour creer et gérer un joueur, conforme au framework ObjetForum.
 * Gère un chargement en deux temps : données forum, puis données via AJAX depuis Membre.php.
 * Conserve les anciennes méthodes pour la rétro-compatibilité.
 *
 * @class Joueur
 * @extends {ObjetForum}
 */
Utils.register(class Joueur extends ObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static LOCATION_HISTORY = [{ 'section': 'Membres Outiiil', 'lieu': 'titre' }];
    static CLASSES_PARAMETRES = [
        [
            ParametreJoueurPseudo,
            ParametreJoueurRang,
            ParametreJoueurOrdreRang,
            ParametreJoueurAllianceRattachement
        ]
    ];

    /** @type {number} id du joueur. */
    _id = -1;
    /** @type {number} Abscisse du joueur, chargée via AJAX. */
    _x = -1;
    /** @type {number} Ordonnée du joueur, chargée via AJAX. */
    _y = -1;
    /** @type {number} Terrain du joueur, chargé via AJAX. */
    _terrain = -1;
    /** @type {number} Fourmilière du joueur, chargée via AJAX. */
    _fourmiliere = -1;
    /** @type {number} Technologie du joueur, chargée via AJAX. */
    _technologie = -1;
    /** @type {boolean} Indique si le joueur est en mode vacances, chargé via AJAX. */
    _mv = false;
    /** @type {boolean} Indique si le joueur est colonisé, chargé via AJAX. */
    _colonise = false;
    /** @type {string} Tag de l'alliance du joueur, chargé via AJAX. */
    _allianceTag = "";
    /** @type {number} Ordre d'affichage du joueur dans le radar. */
    _ordreRadar = -1;
    /** @type {number[]} Niveaux de recherche, chargés depuis laboratoire.php. */
    _niveauRecherche = new Array(10).fill(-1);
    /** @type {number[]} Niveaux de construction, chargés depuis construction.php. */
    _niveauConstruction = new Array(13).fill(-1);

    constructor(param1, options = {}) {
        // Gestion de la compatibilité ascendante du constructeur
        if (param1 && param1.constructor && typeof param1.constructor.ABREVIATIONS_HISTORY !== 'undefined') {
            // Nouveau constructeur du framework
            super(param1, options);
        } else {
            // Ancien constructeur
            super(null, {});
            this._constructeurLegacy(param1 || {});
        }
    }

    /**
     * Logique de l'ancien constructeur pour la compatibilité.
     * @param {object} parametres - L'ancien objet de paramètres.
     * @private
     */
    _constructeurLegacy(parametres) {
        console.log("[Joueur] Appel du constructeur legacy.");
        /**
        * id du joueur
        */
        this._id = parametres["id"] || -1;
        /**
        * pseudo du joueur
        */
        this.ecrireParametre('pseudo', parametres["pseudo"]);
        /**
        * abscisse du joueur
        */
        this._x = parametres["x"] || -1;
        /**
        * ordonnée du joueur
        */
        this._y = parametres["y"] || -1;
        /**
        *
        */
        this._terrain = parametres["terrain"] || -1;
        /**
        *
        */
        this._niveauRecherche = parametres["niveauRecherche"] || new Array(10).fill(-1);
        /**
        *
        */
        this._technologie = parametres["technologie"] || -1;
        /**
        *
        */
        this._niveauConstruction = parametres["niveauConstruction"] || new Array(13).fill(-1);
        /**
        *
        */
        this._fourmiliere = parametres["fourmiliere"] || -1;
        /**
        *
        */
        this._mv = parametres["mv"] || false;
        /**
        *
        */
        this._ordreRadar = parametres["ordreRadar"] || -1;
        /**
        *
        */
        this.idSujet = parametres["sujetForum"] || 0;
        /**
        *
        */
        this.ecrireParametre('rang', parametres["rang"] || "");
        /**
        *
        */
        this.ecrireParametre('ordreRang', parametres["ordreRang"] || 0);
        /**
        * Tag de l'alliance du joueur (utile pour les joueurs extérieurs).
        */
        this._allianceTag = parametres["allianceTag"] || "";
        const estExterieur = parametres["estExterieur"] || false;
        this.ecrireParametre('allianceRattachement', estExterieur ? '' : this._allianceTag);
        /**
        * Indique si le joueur est colonisé.
        */
        this._colonise = parametres["colonise"] || false;
    }


    // =============================================================================================
    // SECTION: NOUVEAUX GETTERS & SETTERS (FRAMEWORK)
    // =============================================================================================

    get id() { return this._id; }
    set id(newId) { this._id = newId; }

    get pseudo() { return this.lireParametre('pseudo'); }
    set pseudo(newPseudo) { this.ecrireParametre('pseudo', newPseudo); }

    get ordreRadar() { return this._ordreRadar; }
    set ordreRadar(newOrdre) { this._ordreRadar = newOrdre; }

    get rang() { return this.lireParametre('rang'); }
    set rang(newRang) { this.ecrireParametre('rang', newRang); }

    get ordreRang() { return this.lireParametre('ordreRang'); }
    set ordreRang(newOrdre) { this.ecrireParametre('ordreRang', newOrdre); }

    get allianceRattachement() { return this.lireParametre('allianceRattachement'); }
    set allianceRattachement(newAlliance) { this.ecrireParametre('allianceRattachement', newAlliance); }

    async estExterieur(peutVoirDonneesRestreintes) {
        const allianceRattachement = await this.lireParametre('allianceRattachement', peutVoirDonneesRestreintes);
        return allianceRattachement !== null && this.allianceTag !== allianceRattachement;
    }

    // --- Getters/Setters pour les propriétés non-forum (compatibilité) ---
    get colonise() { return this._colonise; }
    set colonise(newColonise) { this._colonise = newColonise; }
    
    get allianceTag() { return this._allianceTag; }
    set allianceTag(newAllianceTag) { this._allianceTag = newAllianceTag; }
    
    get x() { return this._x; }
    set x(newX) { this._x = newX; }
    
    get y() { return this._y; }
    set y(newY) { this._y = newY; }
    
    get terrain() { return this._terrain; }
    set terrain(newTerrain) { this._terrain = newTerrain; }
    
    get niveauRecherche() { return this._niveauRecherche; }
    set niveauRecherche(newNiveau) { this._niveauRecherche = newNiveau; }
    
    get technologie() { return this._technologie; }
    set technologie(newTechnologie) { this._technologie = newTechnologie; }
    
    get niveauConstruction() { return this._niveauConstruction; }
    set niveauConstruction(newNiveau) { this._niveauConstruction = newNiveau; }
    
    get fourmiliere() { return this._fourmiliere; }
    set fourmiliere(newFourmiliere) { this._fourmiliere = newFourmiliere; }
    
    get mv() { return this._mv; }
    set mv(newMV) { this._mv = newMV; }
    
    get sujetForum() { return this.idSujet; }
    set sujetForum(newSujet) { this.idSujet = newSujet; }

    // =============================================================================================
    // SECTION: NOUVELLE LOGIQUE DE CHARGEMENT (FRAMEWORK)
    // =============================================================================================

    /**
     * Charge les données du joueur depuis sa page Membre.php (deuxième temps du chargement).
     * @returns {Promise<boolean>} Vrai si le chargement a réussi.
     */
    async chargerDonneesMembre() {
        const pseudo = await this.lireParametre('pseudo');
        if (!pseudo) {
            console.warn('[Joueur] Impossible de charger les données membre sans pseudo.');
            return false;
        }

        console.log(`[Joueur] Récupération du profil pour: ${pseudo}`);
        try {
            const html = await $.ajax({ url: "http://" + Utils.serveur + ".fourmizzz.fr/Membre.php?Pseudo=" + pseudo });
            return await this._chargerDonneesMembreDepuisPage(html);
        } catch (error) {
            console.error(`[Joueur] Erreur AJAX lors de la récupération du profil pour: ${pseudo}`, error);
            return false;
        }
    }

    /**
     * Parse le HTML de la page Membre.php pour peupler les attributs de l'instance.
     * @param {string} html - Le contenu HTML de la page.
     * @returns {boolean} Vrai si le parsing a réussi.
     * @private
     */
    async _chargerDonneesMembreDepuisPage(html) {
        const pseudo = await this.lireParametre('pseudo');
        if (html.includes("Aucun joueurs avec le pseudo")) {
            console.log(`[Joueur] Profil non trouvé pour: ${pseudo}`);
            return false;
        }

        let regexp = new RegExp("x=(\\d*) et y=(\\d*)"), ligne = $(html).find(".boite_membre a[href^='carte2.php?']").text();
        this._id = parseInt($(html).find("a[href^='commerce.php?ID=']").attr("href").match(/\d+/g)[0], 10);
        this._x = ~~(ligne.replace(regexp, "$1"));
        this._y = ~~(ligne.replace(regexp, "$2"));
        this._mv = $(html).find("table:eq(0) tr:eq(0) td:eq(0)").text().includes("Joueur en vacances");
        this._terrain = numeral($(html).find(".tableau_score tr:eq(1) td:eq(1)").text()).value();
        this._fourmiliere = numeral($(html).find(".tableau_score tr:eq(2) td:eq(1)").text()).value();
        this._technologie = numeral($(html).find(".tableau_score tr:eq(3) td:eq(1)").text()).value();
        
        const etatText = $(html).find("table:eq(0)").text();
        this._colonise = etatText.includes("Etat : Fourmilière soumise par ");

        const allianceRow = $(html).find("table:eq(0) tr:contains('Alliance :')");
        if (allianceRow.length > 0) {
            let allianceTag = allianceRow.find("td:eq(1)").text().trim();
            this._allianceTag = (allianceTag === "-") ? "" : allianceTag;
        } else {
            this._allianceTag = "";
        }

        console.log(`[Joueur] Profil chargé pour ${pseudo}: X=${this._x}, Y=${this._y}, Terrain=${this._terrain}, Colonise=${this._colonise}`);
        return true;
    }

    /**
     * Complète le processus de rafraîchissement en chargeant les données spécifiques au joueur
     * qui ne sont pas sur le forum (page membre, constructions, recherches).
     * @returns {Promise<boolean>} Vrai si le chargement complémentaire a réussi.
     */
    async completerRafraichissement() {
        // Deuxième temps : chargement des données depuis la page Membre.php
        const membreDataLoaded = await this.chargerDonneesMembre();
        if (!membreDataLoaded) {
            return false;
        }

        // Troisième temps (optionnel) : chargement des constructions et recherches pour le joueur courant
        if (await this.estJoueurCourant()) {
            const constructionPromise = this.getConstruction();
            if (constructionPromise) {
                const htmlConstruction = await constructionPromise;
                await this.chargerConstruction(htmlConstruction);
            }

            const recherchePromise = this.getLaboratoire();
            if (recherchePromise) {
                const htmlRecherche = await recherchePromise;
                await this.chargerRecherche(htmlRecherche);
            }
        }

        return true;
    }

    /**
     * Complète les données à afficher avec les informations qui ne proviennent pas des paramètres forum.
     * @param {Object} donnees - Les données des paramètres prêtes à être affichées.
     * @returns {Promise<Object>} Les données complétées.
     */
    async completerAffichage(donnees) {
        donnees['Coordonnées'] = { valeur: `(${this.x}, ${this.y})`, nom_affiche: 'Coordonnées' };
        donnees['Terrain'] = { valeur: numeral(this.terrain).format(), nom_affiche: 'Terrain' };
        donnees['Fourmilière'] = { valeur: numeral(this.fourmiliere).format(), nom_affiche: 'Fourmilière' };
        donnees['Technologie'] = { valeur: numeral(this.technologie).format(), nom_affiche: 'Technologie' };
        donnees['MV'] = { valeur: this.mv ? 'Oui' : 'Non', nom_affiche: 'MV' };
        donnees['Colonisé'] = { valeur: this.colonise ? 'Oui' : 'Non', nom_affiche: 'Colonisé' };
        donnees['Tag Alliance'] = { valeur: this.allianceTag, nom_affiche: 'Tag Alliance' };

        const estExterieurResult = await this._invoquerCalculSecurise(this.estExterieur.bind(this));
        donnees['Extérieur'] = { valeur: estExterieurResult, nom_affiche: 'Extérieur' };
        
        return donnees;
    }

    // =============================================================================================
    // SECTION: MÉTHODES CONSERVÉES POUR COMPATIBILITÉ
    // =============================================================================================

    async toUtilitaire() {
        return `${await this.lireParametre('pseudo')} / ${this.id} / ${this._x} / ${this._y}` + (this.lireParametre('rang') ? ` / ${this.lireParametre('rang')} / ${this.lireParametre('ordreRang')}` : "");
    }

    async toJSON() { // Make toJSON method async
        return {
            id: this.id,
            x: this._x,
            y: this._y,
            pseudo: await this.lireParametre('pseudo'), 
            terrain: this._terrain,
            mv: this._mv,
            ordreRadar: this.ordreRadar,
            rang: await this.lireParametre('rang'), 
            niveauConstruction: this._niveauConstruction,
            niveauRecherche: this._niveauRecherche
        };
    }

    async estJoueurCourant() {
        return await this.lireParametre('pseudo') == await monProfilJoueur.lireParametre('pseudo');
    }

    estAttaquable() {
        return this._terrain >= ((Utils.terrain * 0.5) + 1) && this._terrain <= ((Utils.terrain * 3) - 1);
    }

    estAttaquant() {
        return ((this._terrain * 0.5) + 1) <= Utils.terrain && ((this._terrain * 3) - 1) >= Utils.terrain;
    }

    getTDP() {
        return this._niveauConstruction[3] + this._niveauConstruction[4] + this._niveauRecherche[0];
    }

    getTempsParcours(x = monProfilJoueur.x, y = monProfilJoueur.y) {
        if (this._x === -1 || this._y === -1) {
            console.warn(`[Joueur] Calcul du temps de parcours pour ${this.lireParametre('pseudo')} sans coordonnées chargées.`);
            return Infinity;
        }
        return Math.ceil(Math.pow(0.9, this._niveauRecherche[6]) * 637200 * (1 - Math.exp(-(Math.sqrt(Math.pow(x - this._x, 2) + Math.pow(y - this._y, 2)) / 350))));
    }

    async getTempsParcours2(joueur) {
        console.log(`[Joueur] DEBUG: Coordonnées pour le calcul du temps de parcours: this._x=${this._x}, this._y=${this._y}, joueur.x=${joueur.x}, joueur.y=${joueur.y}`);
        if (this._x === -1 || this._y === -1 || joueur.x === -1 || joueur.y === -1) {
            console.warn(`[Joueur] Calcul du temps de parcours entre ${await this.lireParametre('pseudo')} et ${await joueur.lireParametre('pseudo')} sans coordonnées chargées.`);
            return Infinity;
        }
        return Math.ceil(Math.pow(0.9, this._niveauRecherche[6]) * 637200 * (1 - Math.exp(-(Math.sqrt(Math.pow(joueur.x - this._x, 2) + Math.pow(joueur.y - this._y, 2)) / 350))));
    }

    async getLienFourmizzz() {
        return await this.lireParametre('pseudo') != "Vous" || await this.lireParametre('pseudo') != "Ennemie" ? `<a href="Membre.php?Pseudo=${await this.lireParametre('pseudo')}" class='o_lien'>${await this.lireParametre('pseudo')}</a>` : await this.lireParametre('pseudo');
    }

    attenteSynchro() {
        return 60 - (moment().add(this.getTempsParcours(), 's').seconds() % 60);
    }

    async sauvegarder() {
        const dataToSave = await this.toJSON();
        return localStorage.setItem("outiiil_joueur", JSON.stringify(dataToSave));
    }

    async getProfil() {
        console.log(`[Joueur] (Legacy) Récupération du profil pour: ${await this.lireParametre('pseudo')}`);
        return $.ajax({ url: "http://" + Utils.serveur + ".fourmizzz.fr/Membre.php?Pseudo=" + await this.lireParametre('pseudo') });
    }

    async getProfilCourant() {
        // si on est le joueur courant on a peut etre les infos dans le storage
        if(await monProfilJoueur.lireParametre('pseudo') == await this.lireParametre('pseudo')){
            // si on est le joueur courant on regarde dans le localstorage
            let data = JSON.parse(localStorage.getItem("outiiil_joueur")) || {};
            // Si des données sont deja presente et à jour on les charges
            if(data.hasOwnProperty("id") && data.hasOwnProperty("x") && data.hasOwnProperty("y")){
                this._id = data.id;
                this._x = data.x;
                this._y = data.y;
            }
        }
        // sinon
        if(this._x == -1 || this._y == -1 || this._id == -1)
            return await this.getProfil();
        return null;
    }

    async chargerProfil(html) {
        const success = await this._chargerDonneesMembreDepuisPage(html);
        if (success) {
            console.log(`[Joueur.chargerProfil] Profil chargé avec succès pour ${await this.lireParametre('pseudo')}. Coordonnées: (${this._x}, ${this._y}), ID: ${this._id}`);
            if (await monProfilJoueur.lireParametre('pseudo') == await this.lireParametre('pseudo')) {
                await this.sauvegarder();
            }
        } else {
            console.warn(`[Joueur.chargerProfil] Échec du chargement du profil pour ${await this.lireParametre('pseudo')}.`);
        }
        return success;
    }

	getConstruction() {
        let data = JSON.parse(localStorage.getItem("outiiil_joueur")) || {};
        if (data.hasOwnProperty("niveauConstruction"))
            this._niveauConstruction = data.niveauConstruction;
        if (this._niveauConstruction.every((elt) => { return elt == -1 }))
            return $.ajax({ url: "http://" + Utils.serveur + ".fourmizzz.fr/construction.php" });
        return null;
	}

    async chargerConstruction(html) {
        let parsed = $("<div/>").append(html);
        parsed.find(".ligneAmelioration").each((i, elt) => { this._niveauConstruction[i] = parseInt($(elt).find(".niveau_amelioration").text().split(" ")[1]); });
        console.log(`[Joueur.chargerConstruction] Niveaux de construction chargés pour ${await this.lireParametre('pseudo')}:`, this._niveauConstruction);
        let ligne = parsed.find("#centre strong").text(),
            construction = ligne.substring(2, ligne.indexOf("se termine") - 1),
            time = parseInt(ligne.split(',')[0].split('(')[1]);
        // si il y a une construction en cours les données expirent à la fin de cette construction
    	if(construction){
            let dataEvo = JSON.parse(localStorage.getItem("outiiil_evolution")) || {};
            // si on a pas de donné ou que la consutrction n'est pas deja enregistré
            if(!dataEvo.hasOwnProperty("construction")){
                // si on pas les infos en localstorage
                dataEvo.construction = construction.substr(0,1).toUpperCase() + construction.substr(1);
                dataEvo.expConstruction = moment().add(time, 's');
                dataEvo.startConstruction = moment();
                localStorage.setItem("outiiil_evolution", JSON.stringify(dataEvo));
            }
        }
        await this.sauvegarder();
        return this;
    }

	getLaboratoire() {
        let data = JSON.parse(localStorage.getItem("outiiil_joueur")) || {};
        if (data.hasOwnProperty("niveauRecherche"))
            this._niveauRecherche = data.niveauRecherche;
        if (this._niveauRecherche.every((elt) => { return elt == -1 }))
            return $.ajax({ url: "http://" + Utils.serveur + ".fourmizzz.fr/laboratoire.php" });
        return null;
	}

    async chargerRecherche(html) {
        let parsed = $("<div/>").append(html);
        parsed.find(".ligneAmelioration").each((i, elt) => { this._niveauRecherche[i] = parseInt($(elt).find(".niveau_amelioration").text().split(" ")[1]); });
        console.log(`[Joueur.chargerRecherche] Niveaux de recherche chargés pour ${await this.lireParametre('pseudo')}:`, this._niveauRecherche);
        let ligne = parsed.find("#centre strong").text();
        let recherche = ligne.substring(2, ligne.indexOf("termin") - 1), time = parseInt(ligne.split(",")[0].split("(")[1]);
        // si il y a une recherche en cours les données expirent à la fin de cette construction
    	if(recherche){
            let dataEvo = JSON.parse(localStorage.getItem("outiiil_evolution")) || {};
            // si on a pas de donné ou que la recherche n'est pas deja enregistré
            if(!dataEvo.hasOwnProperty("recherche")){
                // si on pas les infos en localstorage
                dataEvo.recherche = recherche;
                dataEvo.expRecherche = moment().add(time, 's');
                dataEvo.startRecherche = moment();
                localStorage.setItem("outiiil_evolution", JSON.stringify(dataEvo));
            }
        }
        await this.sauvegarder();
        return this;
    }
    /**
    *
    */
    getHistorique(id) {
        $.get("http://outiiil.fr/fzzz/" + Utils.serveur + "/player/" + $("a[href^='commerce.php?ID=']").attr("href").match(/\d+/g)[0], (data) => {
            // Creation du graphique
            let histoAlliance = new Array(), histoDate = new Array(), donnees = JSON.parse(data);
            let chart = new Highcharts.Chart({
                chart : {
                    renderTo : id,
                    type : "spline",
                    backgroundColor : null,
                    height : 320
                },
                data : {
                    csv : donnees.message,
                    itemDelimiter : ';',
                    parsed : (columns) => {
                        histoDate = columns.slice().splice(0, 1)[0];
                        histoAlliance = columns.splice(1, 1)[0];
                    },
                    firstRowAsNames : false
                },
                title : {text: ''},
                credits : {enabled : false},
                tooltip : {
                    crosshairs : [true],
                    formatter : function(){
                        let s = Highcharts.dateFormat("%A %e %b", this.x);
                        $.each(this.points, function(){s += "<br/><span style='color:" + this.series.color + "'>\u25CF</span> " + this.series.name + ": <b>" + numeral(this.y).format() + "</b>";});
                        return s;
                    },
                    shared : true,
                    useHTML : true,
                },
                plotOptions : {
                    series : {
                        marker : {
                            radius : 3
                        }
                    }
                },
                xAxis : {
                    lineColor : "#333333",
                    startOnTick : true,
                    labels : {style : {color : "#222222"}},
                    min : moment().subtract(30, "days").valueOf()
                },
                yAxis : {
                    title : {text : null},
                    lineColor : "#333333",
                    gridLineColor : "#333333",
                    labels : {align : "left", x : 0, y : -2, style : {color : "#222222"}}
                },
                series : [
                    {name : "Terrain", color : "#21610B", type : "areaspline"},
                    {name : "Fourmilière", color : "#DF7401", type : "areaspline", visible : false},
                    {name : "Technologie", color : "#FF0000", type : "areaspline", visible : false},
                    {name : "Banni", color : "#6E6E6E", visible : false},
                    {name : "Vacance", color : "#013ADF", visible : false}
                ]
            });
            $("span[id^=o_selectHisto]").click((e) => {
                let chart = $("#o_chartJoueur").highcharts(), histo = $(e.currentTarget).attr("data");
                $("span[id^=o_selectHisto]").removeClass("active");
                $(e.currentTarget).addClass("active");
                if(histo == "all")
                    chart.xAxis[0].update({min : moment("2016-01-01").valueOf()});
                else
                    chart.xAxis[0].update({min : moment().subtract(histo, "days").valueOf()});
                // Style
                $("#o_bouton_range span.active").addClass("ligne_paire");
                $("#o_bouton_range span:not(.active)").removeClass("ligne_paire");
            });
            // ajout d'un tableau pour l'historique des alliance
            if(histoDate.length){
                let html = "", ligne = "", i = 0, nbJour = 0, cDate = moment(histoDate[0]), cTeam = histoAlliance[0], fDate = moment(cDate);
                while(!moment().isSame(cDate, "day")){ // tant qu'on est pas arrivé à aujourd'hui
                    if(moment(histoDate[i]).isSame(cDate, "day")){ // si les dates sont continue
                        if(cTeam != histoAlliance[i]){ // si on a changé d'alli
                            html += `<tr><td class='left'>${fDate.format("DD/MM/YYYY")} -> ${cDate.format("DD/MM/YYYY")} (${(nbJour > 1 ? nbJour + " jours" : nbJour + " jour")})</td><td class='centre'>${cTeam != "0" ? `<a href='/classementAlliance.php?alliance=${cTeam}'>${cTeam}` : "Sans alliance"}</a></td></tr>`;
                            nbJour = 1;
                            cTeam = histoAlliance[i];
                            fDate = moment(cDate).add(1, "days");
                        }else
                            nbJour++;
                        i++;
                    }
                    cDate.add(1, "days");
                }
                if(nbJour != 1)
                    html += `<tr><td class='left'>${fDate.format("DD/MM/YYYY")} -> ${cDate.format("DD/MM/YYYY")} (${(nbJour > 1 ? nbJour + " jours" : nbJour + " jour")})</td><td class='centre'>${cTeam != "0" ? `<a href='/classementAlliance.php?alliance=${cTeam}'>${cTeam}` : "Sans alliance"}</a></td></tr>`;
                $("#" + id).after("<table id='o_historiqueAlliance' cellspacing=0><thead><tr class='gras even'><th>Date</th><th>Alliance</th></tr></thead><tbody>" + html + "</tbody></table>");
                $("#o_historiqueAlliance tr:even").addClass("ligne_paire");
            }
        });
    }
    /**
    *
    */
    async getLigneRadar(radar, id, indice) { // Make method async
        const pseudoParam = await this.lireParametre('pseudo'); // Get the raw return value
        console.log(`[Joueur.getLigneRadar] Valeur brute de lireParametre('pseudo'):`, pseudoParam, `Type: ${typeof pseudoParam}`);
        const pseudo = (typeof pseudoParam === 'object' && pseudoParam !== null && pseudoParam.hasOwnProperty('valeur')) ? pseudoParam.valeur : pseudoParam;
        console.log(`[Joueur.getLigneRadar] Début pour pseudo: ${pseudo}, ID: ${this._id}`);
        let cellTerrain = this.estAttaquable() ? `<a class="gras ${this._mv ? "blue_light" : ""} href="/ennemie.php?Attaquer=${this._id}&lieu=1">${numeral(this._terrain).format()}</a>` : `<span ${this._mv ? `class="blue_light" title="En vacances"` : ""}>${numeral(this._terrain).format()}</span>`;
        $(id).append(`<tr id="o_item_${indice}" class="lien"><td><a id="o_maj_${this._id}" class='o_actualiser' href=""><img src="${IMG_ACTUALISER}" alt="rang" height="20"/></a></td><td id="o_nom_${this._id}" class="left" title=""><a class="gras ${this._mv ? "blue_light" : ""}" href="Membre.php?Pseudo=${pseudo}">${pseudo}</a></td><td id="o_terrain_${this._id}" class="right reduce" title="">${cellTerrain}</td></tr>`);
        // event
        $("#o_maj_" + this._id).click(async (e) => {
            console.log(`[Joueur.getLigneRadar] Clic sur le bouton de rafraîchissement pour joueur: ${pseudo}, ID: ${this._id}`);
            e.preventDefault(); // Empêche le rechargement de la page
            console.log(`[Joueur.getLigneRadar] e.preventDefault() appelé pour joueur: ${pseudo}, ID: ${this._id}`);
            let oldTerrain = numeral($("#o_terrain_" + this._id).text()).value(), oldMV = this._mv, bSave = false;
            $({deg : 0}).animate({deg : 360}, {duration : 600, step: (now) => {$(e.currentTarget).find("img").css({transform: "rotate(" + now + "deg)"});}});
            
            console.log(`[Joueur.getLigneRadar] Avant getProfil pour ${pseudo}. Pseudo actuel: ${pseudo}`);
            await this.getProfil().then(async (data) => {
                console.log(`[Joueur.getLigneRadar] getProfil terminé pour ${pseudo}. Données reçues:`, data);
                if(await this.chargerProfil(data)){
                    console.log(`[Joueur.getLigneRadar] chargerProfil réussi pour ${pseudo}. Nouveau terrain: ${this._terrain}, Nouveau MV: ${this._mv}`);
                    // si il y une différence de terrain
                    let diff = this._terrain - oldTerrain;
                    let cellTerrain = this.estAttaquable() ? `<a class="gras ${this._mv ? "blue_light" : ""} href="/ennemie.php?Attaquer=${this._id}&lieu=1">${numeral(this._terrain).format()}</a>` : `<span ${this._mv ? `class="blue_light" title="En vacances"` : ""}>${numeral(this._terrain).format()}</span>`;
                    // si le joueur est sortie de MV ou si il a mis le MV
                    if(oldMV != this._mv){
                        console.log(`[Joueur.getLigneRadar] Changement de statut MV pour ${pseudo}. Old MV: ${oldMV}, New MV: ${this._mv}`);
                        $("#o_terrain_" + this._id).html(cellTerrain);
                        if(this._mv)
                            $("#o_nom_" + this._id + " a").addClass("blue_light");
                        else
                            $("#o_nom_" + this._id + " a").removeClass("blue_light");
                        bSave = true;
                    }
                    if(diff){
                        console.log(`[Joueur.getLigneRadar] Différence de terrain pour ${pseudo}. Diff: ${diff}`);
                        $("#o_terrain_" + this._id)
                            .html(cellTerrain)
                            .effect("highlight", {color : (diff > 0 ? "#458D58" : "#8D4545")}, 1000)
                            .attr("title", numeral(diff).format())
                            .tooltip({
                                position : {my : "left+10 center", at : "right center"},
                                content : `<span class='${diff > 0 ? "green_light" : "red_xlight"}'>${diff > 0 ? "+ " + $("#o_terrain_" + this._id).attr("title") : $("#o_terrain_" + this._id).attr("title")} cm²</span>`,
                                hide : {effect: "fade", duration: 10},
                                tooltipClass : "warning-tooltip ui-tooltip-right"
                            }).tooltip("open");
                        bSave = true;
                    }
                    console.log(`[Joueur.getLigneRadar] bSave pour ${pseudo}: ${bSave}`);
                    bSave && await radar.sauvegarder();
                }else{
                    console.warn(`[Joueur.getLigneRadar] chargerProfil a échoué pour ${pseudo}.`);
                    $.toast({...TOAST_WARNING, text : `Le joueur ${pseudo} n'existe plus.`});
                    await radar.supprimeJoueur(this).sauvegarder().actualiser();
                }
            }).catch(error => {
                console.error(`[Joueur.getLigneRadar] Erreur lors du rafraîchissement du profil pour ${pseudo}:`, error);
                $.toast({...TOAST_ERROR, text : `Erreur lors du rafraîchissement du joueur ${pseudo}.`});
            });
            console.log(`[Joueur.getLigneRadar] Fin du clic sur le bouton de rafraîchissement pour joueur: ${pseudo}.`);
            return false; // Assure que l'événement ne se propage pas et que le navigateur ne suit pas le lien
        });
        // tooltip vacance...
        $("#o_terrain_" + this._id).tooltip({position : {my : "left+10 center", at : "right center"}, tooltipClass : "warning-tooltip"});
        // creation du tooltip sur les joueurs pour avoir le temps de trajet
        $("#o_nom_" + this._id).tooltip({
            position : {my : "left+10 bottom", at : "right center"},
            content : async (callback) => {
                console.log(`[Joueur.getLigneRadar] Tooltip 'content' function called for pseudo: ${pseudo}`);
                if(radar.joueurs.hasOwnProperty(pseudo)){
                    const joueurInRadar = radar.joueurs[pseudo];
                    console.log(`[Joueur.getLigneRadar] Joueur found in radar.joueurs for content:`, joueurInRadar);
                    const tempsParcours = await monProfilJoueur.getTempsParcours2(joueurInRadar);
                    console.log(`[Joueur.getLigneRadar] Temps de parcours calculated for content: ${tempsParcours}`);
                    const contentHtml = `<table><tr><td>Temps de trajet</td><td class="right">${Utils.intToTime(tempsParcours)}</td></tr><td>Retour le</td><td class="right">${moment().add(tempsParcours, 's').format("D MMM à HH[h]mm[m]ss[s]")}</td><tr></tr></table>`;
                    callback(contentHtml);
                } else {
                    console.warn(`[Joueur.getLigneRadar] Joueur ${pseudo} not found in radar.joueurs for content. Displaying NC.`);
                    callback("NC");
                }
            },
            hide : {effect: "fade", duration: 10},
			tooltipClass : "warning-tooltip ui-tooltip-right"
        });
    }
    /**
    *
    */
    static rechercher(elt) {
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/classementAlliance.php",
            data: {
                "requete": elt,
                "recherche": 1,
                "prioriteRecherche": "joueur"
            }
        });
    }
})
