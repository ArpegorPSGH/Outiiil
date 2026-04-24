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
    static LOCATION_HISTORY = [{ section: 'Membres Outiiil', lieu: 'titre' }];
    static PARAMETRES_OBJET = [
        [
            Pseudo,
            Grade,
            OrdreGrade,
            AllianceRattachement,
            VersionExtension
        ]
    ];
    static classeObjetsForumContenus = Recensement; // Un joueur peut contenir des objets Recensement

    static ATTRIBUTS_OBJET = [
        Id,
        X,
        Y,
        TerrainDeChasse,
        Fourmiliere,
        Technologie,
        Activite,
        Colonise,
        TagAlliance,
        Rang,
        OrdreRadar,
        NiveauxRecherches,
        NiveauxConstructions,
        Nourriture,
        Materiaux,
        ArmeeJoueur,
        Coordonnees,
        EtatJoueur
    ];


    // constructor(param1, options = {}) {
    //     // Gestion de la compatibilité ascendante du constructeur
    //     if (param1 && param1.constructor && (typeof param1.constructor.ABREVIATIONS_HISTORY !== 'undefined' || typeof param1.constructor.FONCTIONNALITES !== 'undefined')) {
    //         // Nouveau constructeur du framework
    //         super(param1, options);
    //     } else {
    //         // Ancien constructeur
    //         super(null, {});
    //         this._constructeurLegacy(param1 || {});
    //     }
    // }

    // /**
    //  * Logique de l'ancien constructeur pour la compatibilité.
    //  * @param {object} parametres - L'ancien objet de paramètres.
    //  * @private
    //  */
    // _constructeurLegacy(parametres) {
    //     console.log("[Joueur] Appel du constructeur legacy.");
    //     /**
    //     * id du joueur
    //     */
    //     this.ecrire('Id', parametres['Id'] || -1);
    //     /**
    //     * pseudo du joueur
    //     */
    //     this.ecrire('Pseudo', parametres["Pseudo"]);
    //     /**
    //     * rang du joueur
    //     */
    //     this.ecrire('Rang', parametres["Rang"] || "");
    //     /**
    //     * abscisse du joueur
    //     */
    //     this.ecrire('X', parametres["X"] || -1);
    //     /**
    //     * ordonnée du joueur
    //     */
    //     this.ecrire('Y', parametres["Y"] || -1);
    //     /**
    //     *
    //     */
    //     this.ecrire('Terrain de Chasse', parametres["Terrain de Chasse"] || -1);
    //     /**
    //     *
    //     */
    //     this.ecrire('Niveaux Recherches', parametres["Niveaux Recherches"] || new Array(10).fill(-1));
    //     /**
    //     *
    //     */
    //     this.ecrire('Technologie', parametres["Technologie"] || -1);
    //     /**
    //     *
    //     */
    //     this.ecrire('Niveaux Constructions', parametres["Niveaux Constructions"] || new Array(13).fill(-1));
    //     /**
    //     *
    //     */
    //     this.ecrire('Fourmilière', parametres["Fourmiliere"] || -1);
    //     /**
    //     *
    //     */
    //     this.ecrire('Activité', (parametres["mv"] || false) ? 'vacances' : 'actif');
    //     /**
    //     *
    //     */
    //     this.ecrire('Ordre Radar', parametres["Ordre Radar"] || -1);
    //     /**
    //     *
    //     */
    //     this.idSujet = parametres["sujetForum"] || 0;
    //     /**
    //     *
    //     */
    //     this.ecrire('Grade', parametres["Grade"] || "");
    //     /**
    //     *
    //     */
    //     this.ecrire('Ordre Grade', parametres["Ordre Grade"] || 0);
    //     /**
    //     * Tag de l'alliance du joueur (utile pour les joueurs extérieurs).
    //     */
    //     this.ecrire('Tag Alliance', parametres["Tag Alliance"] || "");
    //     const estExterieur = parametres["estExterieur"] || false;
    //     this.ecrire('Alliance Rattachement', estExterieur ? '' : parametres["Tag Alliance"] || "");
    //     /**
    //     * Indique si le joueur est colonisé.
    //     */
    //     this.ecrire('Colonisé', parametres["Colonisé"] || false);
    // }


    // =============================================================================================
    // SECTION: NOUVEAUX GETTERS & SETTERS (FRAMEWORK)
    // =============================================================================================

    // get id() { return this.lire('Id'); }
    // set id(newId) { this.ecrire('Id', newId); }

    // get pseudo() { return this.lire('Pseudo'); }
    // set pseudo(newPseudo) { this.ecrire('Pseudo', newPseudo); }

    // get rang() { return this.lire('Rang'); }
    // set rang(newRang) { this.ecrire('Rang', newRang); }

    // get ordreRadar() { return this.lire('Ordre Radar'); }
    // set ordreRadar(newOrdre) { this.ecrire('Ordre Radar', newOrdre); }

    // get grade() { return this.lire('Grade'); }
    // set grade(newGrade) { this.ecrire('Grade', newGrade); }

    // get ordreGrade() { return this.lire('Ordre Grade'); }
    // set ordreGrade(newOrdre) { this.ecrire('Ordre Grade', newOrdre); }

    // get allianceRattachement() { return this.lire('Alliance Rattachement'); }
    // set allianceRattachement(newAlliance) { this.ecrire('Alliance Rattachement', newAlliance); }

    // get colonise() { return this.lire('Colonisé'); }
    // set colonise(newColonise) { this.ecrire('Colonisé', newColonise); }

    // get allianceTag() { return this.lire('Tag Alliance'); }
    // set allianceTag(newTag) { this.ecrire('Tag Alliance', newTag); }

    // get x() { return this.lire('X'); }
    // set x(newX) { this.ecrire('X', newX); }

    // get y() { return this.lire('Y'); }
    // set y(newY) { this.ecrire('Y', newY); }

    // get terrain() { return this.lire('Terrain de Chasse'); }
    // set terrain(newTerrain) { this.ecrire('Terrain de Chasse', newTerrain); }

    // get niveauRecherche() { return this.lire('Niveaux Recherches'); }
    // set niveauRecherche(newNiveau) { this.ecrire('Niveaux Recherches', newNiveau); }

    // get technologie() { return this.lire('Technologie'); }
    // set technologie(newTechnologie) { this.ecrire('Technologie', newTechnologie); }

    // get niveauxConstructions() { return this.lire('Niveaux Constructions'); }
    // set niveauxConstructions(newNiveau) { this.ecrire('Niveaux Constructions', newNiveau); }

    // get fourmiliere() { return this.lire('Fourmilière'); }
    // set fourmiliere(newFourmiliere) { this.ecrire('Fourmilière', newFourmiliere); }

    // /** Activité : délègue à Activite qui gère la conversion image→string. */
    // get activite() { return this.lire('Activité'); }
    // set activite(newActivite) { this.ecrire('Activité', newActivite); }

    // get nourriture() { return this.lire('Nourriture'); }
    // set nourriture(newVal) { this.ecrire('Nourriture', newVal); }

    // get materiaux() { return this.lire('Matériaux'); }
    // set materiaux(newVal) { this.ecrire('Matériaux', newVal); }

    // get armee() { return this.lire('Armée'); }
    // set armee(newVal) { this.ecrire('Armée', newVal); }

    // get coordonnees() { return this.lire('Coordonnées'); }

    // get sujetForum() { return this.idSujet; }
    // set sujetForum(newSujet) { this.idSujet = newSujet; }

    // =============================================================================================
    // SECTION: NOUVELLE LOGIQUE DE CHARGEMENT (FRAMEWORK)
    // =============================================================================================

    /**
     * Charge les données du joueur depuis sa page Membre.php (deuxième temps du chargement).
     * @returns {Promise<boolean>} Vrai si le chargement a réussi.
     */
    async chargerDonneesMembre() {
        const pseudo = await this.lire('Pseudo');
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
        const pseudo = await this.lire('Pseudo');
        if (html.includes("Aucun joueurs avec le pseudo")) {
            console.log(`[Joueur] Profil non trouvé pour: ${pseudo}`);
            return false;
        }

        let regexp = new RegExp("x=(\\d*) et y=(\\d*)"), ligne = $(html).find(".boite_membre a[href^='carte2.php?']").text();
        await this.ecrire('Id', parseInt($(html).find("a[href^='commerce.php?ID=']").attr("href").match(/\d+/g)[0], 10));
        await this.ecrire('X', ~~(ligne.replace(regexp, "$1")));
        await this.ecrire('Y', ~~(ligne.replace(regexp, "$2")));
        await this.ecrire('Activité', $(html).find("table:eq(0) tr:eq(0) td:eq(0)").text().includes("Joueur en vacances") ? 'vacances' : await this.lire('Activité'));
        await this.ecrire('Activité', $(html).find("table:eq(0) tr:eq(0) td:eq(0)").text().includes("Joueur banni") ? 'banni' : await this.lire('Activité'));
        await this.ecrire('Terrain de Chasse', numeral($(html).find(".tableau_score tr:eq(1) td:eq(1)").text()).value());
        await this.ecrire('Fourmilière', numeral($(html).find(".tableau_score tr:eq(2) td:eq(1)").text()).value());
        await this.ecrire('Technologie', numeral($(html).find(".tableau_score tr:eq(3) td:eq(1)").text()).value());

        const etatText = $(html).find("table:eq(0)").text();
        await this.ecrire('Colonisé', etatText.includes("Etat : Fourmilière soumise par "));

        const allianceRow = $(html).find("table:eq(0) tr:contains('Alliance :')");
        if (allianceRow.length > 0) {
            let allianceTag = allianceRow.find("td:eq(1)").text().trim();
            await this.ecrire('Tag Alliance', (allianceTag === "-") ? "" : allianceTag);
        } else {
            await this.ecrire('Tag Alliance', "");
        }

        console.log(`[Joueur] Profil chargé pour ${pseudo}: X=${await this.lire('X')}, Y=${await this.lire('Y')}, Terrain de Chasse=${await this.lire('Terrain de Chasse')}, Colonisé=${await this.lire('Colonisé')}`);
        return true;
    }

    /**
     * Complète le processus de rafraîchissement en chargeant les données spécifiques au joueur
     * qui ne sont pas sur le forum (page membre, constructions, recherches).
     * @returns {Promise<boolean>} Vrai si le chargement complémentaire a réussi.
     */
    async completerRafraichissement() {
        // Enregistrement de la version de l'extension pour le joueur courant
        if (await this.estJoueurCourant()) {
            await this.ecrire('Version Extension', VERSION);
        }

        // Deuxième temps : chargement des données depuis la page Membre.php
        const membreDataLoaded = await this.chargerDonneesMembre();
        if (!membreDataLoaded) {
            return false;
        }
        console.log('completerRafraichissement 1')

        // Troisième temps (optionnel) : chargement des constructions, recherches, armée et ressources
        if (await this.estJoueurCourant()) {
            // Pour le joueur courant, on charge les données "fraîches"
            // Constructions
            await this.chargerConstruction();
            console.log('completerRafraichissement 2')

            // Recherches
            await this.chargerRecherche();
            console.log('completerRafraichissement 3')


            // Armée et ressources
            try {
                console.log("[Joueur] Armée : ", await this.lire('Armée'));
                const armee = await this.lire('Armée');
                const htmlArmee = await armee.getArmee();
                console.log("[Joueur] Html Armée : ", htmlArmee);
                await armee.chargeData(htmlArmee);
                armee.unite[0] = Utils.ouvrieres;
                await this.ecrire('Armée', armee);
                await this.ecrire('Nourriture', Utils.nourriture);
                await this.ecrire('Matériaux', Utils.materiaux);
                await this.ecrire('Terrain de Chasse', Utils.terrain);
                console.log("[Joueur] Armée : ", await this.lire('Armée'));
                console.log("[Joueur] Nourriture : ", await this.lire('Nourriture'));
                console.log("[Joueur] Matériaux : ", await this.lire('Matériaux'));
                console.log("[Joueur] Terrain de Chasse : ", await this.lire('Terrain de Chasse'));
                console.log(`[Joueur] Armée et ressources fraîches chargées pour le joueur courant.`);
            } catch (error) {
                console.error(`[Joueur] Erreur lors du chargement de l'armée ou des ressources pour le joueur courant.`, error);
            }
        } else {
            // Pour les autres joueurs, on charge les données depuis le dernier recensement disponible
            if (this.objetsForumContenus && this.objetsForumContenus.length > 0) {
                // On suppose que le dernier recensement dans la liste est le plus récent
                const dernierRecensement = this.objetsForumContenus[this.objetsForumContenus.length - 1];
                const pseudo = await this.lire('Pseudo');
                console.log(`[Joueur] Chargement des données depuis le dernier recensement pour ${pseudo}.`);

                try {
                    // Lecture des ressources
                    await this.ecrire('Nourriture', await dernierRecensement.lire('Nourriture') || this.lire('Nourriture'));
                    await this.ecrire('Matériaux', await dernierRecensement.lire('Matériaux') || this.lire('Matériaux'));
                    await this.ecrire('Terrain de Chasse', await dernierRecensement.lire('Terrain de Chasse') || this.lire('Terrain de Chasse'));

                    // Lecture des niveaux de construction
                    const constructionsDict = await dernierRecensement.lire('Constructions');
                    if (constructionsDict) {
                        let currentConstruction = await this.lire('Niveaux Constructions');
                        let modifie = false;
                        CONSTRUCTION.forEach((nom, index) => {
                            const niveau = constructionsDict[nom];
                            if (niveau !== null && niveau !== undefined) {
                                currentConstruction[index] = niveau;
                                modifie = true;
                            }
                        });
                        if (modifie) await this.ecrire('Niveaux Constructions', currentConstruction);
                    }

                    // Lecture des niveaux de recherche
                    const recherchesDict = await dernierRecensement.lire('Recherches');
                    if (recherchesDict) {
                        let currentRecherche = await this.lire('Niveaux Recherches');
                        let modifie = false;
                        RECHERCHE.forEach((nom, index) => {
                            const niveau = recherchesDict[nom];
                            if (niveau !== null && niveau !== undefined) {
                                currentRecherche[index] = niveau;
                                modifie = true;
                            }
                        });
                        if (modifie) await this.ecrire('Niveaux Recherches', currentRecherche);
                    }

                    // Lecture de l'armée (NOM_UNITES est en pluriel)
                    const unitesDict = await dernierRecensement.lire('Unités');
                    if (unitesDict) {
                        let currentArmee = await this.lire('Armée');
                        let modifie = false;
                        NOM_UNITES.forEach((nomUnite, index) => {
                            const quantite = unitesDict[nomUnite];
                            if (quantite !== null && quantite !== undefined) {
                                currentArmee.unite[index] = quantite;
                                modifie = true;
                            }
                        });
                        if (modifie) await this.ecrire('Armée', currentArmee);
                    }

                    console.log(`[Joueur] Données du recensement chargées pour ${pseudo}.`);
                } catch (error) {
                    console.error(`[Joueur] Erreur lors de la lecture des données du recensement pour ${pseudo}.`, error);
                }
            }
        }

        return true;
    }

    /**
     * Charge les données du joueur courant en extrayant son pseudo de la page,
     * puis lance le chargement complet de ses informations.
     * @returns {Promise<boolean>} Vrai si le chargement a réussi.
     */
    async chargerJoueurCourant() {
        const pseudo = $("#pseudo").text();
        if (!pseudo) {
            console.error('[Joueur] Impossible de trouver le pseudo du joueur courant sur la page.');
            return false;
        }
        await this.ecrire('Pseudo', pseudo);
        console.log(`[Joueur] Chargement du joueur courant : ${pseudo}`);
        return await this.completerRafraichissement();
    }

    /**
     * Effectue un recensement complet du joueur et l'enregistre sur le forum.
     * @returns {Promise<Boolean>} Vrai si le recensement a été effectué et enregistré avec succès.
     */
    async effectuerRecensement() {
        await this._acquireReadLock(); // Verrouiller l'objet Joueur pendant le recensement

        console.log(`[Joueur] Début de l'opération de recensement pour ${await this.lire('Pseudo')}.`);

        try {
            // 1. Charger les données du joueur (assure que les ressources/constructions/recherches/unités sont à jour)
            const rafraichissementReussi = await this.completerRafraichissement(); // Ne pas charger les objets contenus ici
            if (!rafraichissementReussi) {
                console.error(`[Joueur] Échec du rafraîchissement du profil pour le recensement.`);
                return false;
            }

            // 2. Préparer les données pour le nouvel objet Recensement
            const donneesRecensement = {};

            // Ressources et Terrain de Chasse
            donneesRecensement['Ressources'] = {
                'Nourriture': await this.lire('Nourriture'),
                'Matériaux': await this.lire('Matériaux'),
                'Terrain de Chasse': await this.lire('Terrain de Chasse')
            };

            // Constructions
            const constructions = {};
            const levelsC = await this.lire('Niveaux Constructions');
            CONSTRUCTION.forEach((nom, index) => {
                constructions[nom] = levelsC[index];
            });
            donneesRecensement['Constructions'] = constructions;

            // Recherches
            const recherches = {};
            const levelsR = await this.lire('Niveaux Recherches');
            RECHERCHE.forEach((nom, index) => {
                recherches[nom] = levelsR[index];
            });
            donneesRecensement['Recherches'] = recherches;

            // Unités
            const unites = {};
            const currentArmee = await this.lire('Armée');
            currentArmee.unite.forEach((quantite, index) => {
                const nomUnite = NOM_UNITES[index];
                if (nomUnite) {
                    unites[nomUnite] = quantite;
                }
            });
            donneesRecensement['Unités'] = unites;

            // 3. Créer l'objet Recensement
            let recensementInstance = new Recensement(this.fonctionnaliteCreatrice, {
                objetParent: this,
                donneesInitiales: donneesRecensement
            });
            this.objetsForumContenus.push(recensementInstance); // Ajouter à la liste des objets contenus
            console.log(`[Joueur] Nouvelle instance de Recensement créée: `, recensementInstance);

            // 5. Enregistrer le recensement sur le forum
            await recensementInstance.enregistrerSurForum();
            console.log(`[Joueur] Recensement enregistré sur le forum avec succès.`);
            return true;

        } catch (error) {
            console.error(`[Joueur] Erreur lors de l'exécution du recensement pour ${await this.lire('Pseudo')}:`, error);
            return false;
        } finally {
            this._releaseReadLock(); // Libérer le verrou
            console.log(`[Joueur] Fin de l'opération de recensement.`);
        }
    }

    // =============================================================================================
    // SECTION: MÉTHODES CONSERVÉES POUR COMPATIBILITÉ
    // =============================================================================================

    // async toUtilitaire() {
    //     return `${await this.lire('Pseudo')} / ${await this.lire('Id')} / ${await this.lire('X')} / ${await this.lire('Y')}` + (await this.lire('Grade') ? ` / ${await this.lire('Grade')} / ${await this.lire('Ordre Grade')}` : "");
    // }

    async estJoueurCourant() {
        const estCourant = await this.lire('Pseudo') == await monProfilJoueur.lire('Pseudo');
        if (estCourant && this.idSujet) { //S'assurer que le chargement inclu bien le forum
            monProfilJoueur = this;
        }
        return estCourant;
    }

    async estAttaquable() {
        return await this.lire('Terrain de Chasse') >= ((Utils.terrain * 0.5) + 1) && await this.lire('Terrain de Chasse') <= ((Utils.terrain * 3) - 1);
    }

    async estAttaquant() {
        return ((await this.lire('Terrain de Chasse') * 0.5) + 1) <= Utils.terrain && ((await this.lire('Terrain de Chasse') * 3) - 1) >= Utils.terrain;
    }

    async getTDP() {
        const constr = await this.lire('Niveaux Constructions');
        const rech = await this.lire('Niveaux Recherches');
        return constr[3] + constr[4] + rech[0];
    }

    async getTempsParcours(x = monProfilJoueur.lire('X'), y = monProfilJoueur.lire('Y')) {
        // Resolve coords if they are promises
        const targetX = x instanceof Promise ? await x : x;
        const targetY = y instanceof Promise ? await y : y;

        const selfX = await this.lire('X');
        const selfY = await this.lire('Y');

        if (selfX === -1 || selfY === -1) {
            console.warn(`[Joueur] Calcul du temps de parcours pour ${await this.lire('Pseudo')} sans coordonnées chargées.`);
            return Infinity;
        }

        const nivRech = await this.lire('Niveaux Recherches');
        return Math.ceil(Math.pow(0.9, nivRech[6]) * 637200 * (1 - Math.exp(-(Math.sqrt(Math.pow(targetX - selfX, 2) + Math.pow(targetY - selfY, 2)) / 350))));
    }

    async getTempsParcours2(joueur) {
        const selfX = await this.lire('X');
        const selfY = await this.lire('Y');
        const targetX = await joueur.lire('X');
        const targetY = await joueur.lire('Y');

        console.log(`[Joueur] DEBUG: Coordonnées pour le calcul du temps de parcours: this.x=${selfX}, this.y=${selfY}, joueur.x=${targetX}, joueur.y=${targetY}`);
        if (selfX === -1 || selfY === -1 || targetX === -1 || targetY === -1) {
            console.warn(`[Joueur] Calcul du temps de parcours entre ${await this.lire('Pseudo')} et ${await joueur.lire('Pseudo')} sans coordonnées chargées.`);
            return Infinity;
        }

        const nivRech = await this.lire('Niveaux Recherches');
        return Math.ceil(Math.pow(0.9, nivRech[6]) * 637200 * (1 - Math.exp(-(Math.sqrt(Math.pow(targetX - selfX, 2) + Math.pow(targetY - selfY, 2)) / 350))));
    }

    async getLienFourmizzz() {
        const p = await this.lire('Pseudo');
        return p != "Vous" || p != "Ennemie" ? `<a href="Membre.php?Pseudo=${p}" class='o_lien'>${p}</a>` : p;
    }

    async attenteSynchro() {
        const time = await this.getTempsParcours();
        return 60 - (moment().add(time, 's').seconds() % 60);
    }

    // async getProfil() {
    //     const p = await this.lire('Pseudo');
    //     console.log(`[Joueur] (Legacy) Récupération du profil pour: ${p}`);
    //     return $.ajax({ url: "http://" + Utils.serveur + ".fourmizzz.fr/Membre.php?Pseudo=" + p });
    // }

    // async getProfilCourant() {
    //     // si on est le joueur courant on a peut etre les infos dans le storage
    //     if (await monProfilJoueur.lire('Pseudo') == await this.lire('Pseudo')) {
    //         // si on est le joueur courant on regarde dans le localstorage
    //         let data = JSON.parse(localStorage.getItem("outiiil_joueur")) || {};
    //         // Si des données sont deja presente et à jour on les charges
    //         if (data.hasOwnProperty('Id') && data.hasOwnProperty("X") && data.hasOwnProperty("Y")) {
    //             this.ecrire('Id', data.id);
    //             this.ecrire('X', data.x);
    //             this.ecrire('Y', data.y);
    //         }
    //     }
    //     // sinon
    //     if (await this.lire('X') == -1 || await this.lire('Y') == -1 || await this.lire('Id') == -1)
    //         return await this.getProfil();
    //     return null;
    // }

    // async chargerProfil(html) {
    //     const success = await this._chargerDonneesMembreDepuisPage(html);
    //     if (success) {
    //         console.log(`[Joueur.chargerProfil] Profil chargé avec succès pour ${await this.lire('Pseudo')}. Coordonnées: (${this._x}, ${this._y}), ID: ${this._id}`);
    //         if (await monProfilJoueur.lire('Pseudo') == await this.lire('Pseudo')) {
    //             await this.enregistrerLocalStorage();
    //         }
    //     } else {
    //         console.warn(`[Joueur.chargerProfil] Échec du chargement du profil pour ${await this.lire('Pseudo')}.`);
    //     }
    //     return success;
    // }

    /**
     * Charge les niveaux de construction.
     * Si l'argument html est fourni, il est utilisé pour le parsing.
     * Sinon, tente de charger depuis le localStorage ou via une requête AJAX si nécessaire.
     * @param {string} [html=null] - Contenu HTML de la page construction.php.
     * @returns {Promise<boolean>} Vrai si le chargement a réussi ou n'était pas nécessaire.
     */
    async chargerConstruction(html = null) {
        if (!html) {
            await this.chargerDepuisLocalStorage("outiiil_joueur");
            const levels = await this.lire('Niveaux Constructions');
            if (levels.every((elt) => elt == -1)) {
                try {
                    html = await $.ajax({ url: "http://" + Utils.serveur + ".fourmizzz.fr/construction.php" });
                } catch (error) {
                    console.error(`[Joueur] Erreur AJAX lors de la récupération des constructions.`, error);
                    return false;
                }
            } else {
                return true;
            }
        }

        let parsed = $("<div/>").append(html);
        const levels = await this.lire('Niveaux Constructions');
        parsed.find(".ligneAmelioration").each((i, elt) => { levels[i] = parseInt($(elt).find(".niveau_amelioration").text().split(" ")[1]); });
        await this.ecrire('Niveaux Constructions', levels);
        console.log(`[Joueur.chargerConstruction] Niveaux de construction chargés pour ${await this.lire('Pseudo')}:`, levels);

        let ligne = parsed.find("#centre strong").text(),
            construction = ligne.substring(2, ligne.indexOf("se termine") - 1),
            time = parseInt(ligne.split(',')[0].split('(')[1]);

        console.log(`[Joueur.chargerConstruction] Construction en cours: ${construction}, temps restant: ${time}s`);
        // si il y a une construction en cours les données expirent à la fin de cette construction
        if (construction) {
            let dataEvo = JSON.parse(localStorage.getItem("outiiil_evolution")) || {};
            // si on a pas de donné ou que la consutrction n'est pas deja enregistré
            if (!dataEvo.hasOwnProperty("construction")) {
                // si on pas les infos en localstorage
                dataEvo.construction = construction.substr(0, 1).toUpperCase() + construction.substr(1);
                dataEvo.expConstruction = moment().add(time, 's');
                dataEvo.startConstruction = moment();
                localStorage.setItem("outiiil_evolution", JSON.stringify(dataEvo));
            }
        }
        await this.enregistrerLocalStorage();
        return true;
    }

    /**
     * Charge les niveaux de recherche.
     * Si l'argument html est fourni, il est utilisé pour le parsing.
     * Sinon, tente de charger depuis le localStorage ou via une requête AJAX si nécessaire.
     * @param {string} [html=null] - Contenu HTML de la page laboratoire.php.
     * @returns {Promise<boolean>} Vrai si le chargement a réussi ou n'était pas nécessaire.
     */
    async chargerRecherche(html = null) {
        if (!html) {
            await this.chargerDepuisLocalStorage("outiiil_joueur");
            const levels = await this.lire('Niveaux Recherches');
            if (levels.every((elt) => elt == -1)) {
                try {
                    html = await $.ajax({ url: "http://" + Utils.serveur + ".fourmizzz.fr/laboratoire.php" });
                } catch (error) {
                    console.error(`[Joueur] Erreur AJAX lors de la récupération des recherches.`, error);
                    return false;
                }
            } else {
                return true;
            }
        }

        let parsed = $("<div/>").append(html);
        const levels = await this.lire('Niveaux Recherches');
        parsed.find(".ligneAmelioration").each((i, elt) => { levels[i] = parseInt($(elt).find(".niveau_amelioration").text().split(" ")[1]); });
        await this.ecrire('Niveaux Recherches', levels);
        console.log(`[Joueur.chargerRecherche] Niveaux de recherche chargés pour ${await this.lire('Pseudo')}:`, levels);

        let ligne = parsed.find("#centre strong").text();
        let recherche = ligne.substring(2, ligne.indexOf("termin") - 1),
            time = parseInt(ligne.split(",")[0].split("(")[1]);

        console.log(`[Joueur.chargerRecherche] Recherche en cours: ${recherche}, temps restant: ${time}s`);
        // si il y a une recherche en cours les données expirent à la fin de cette construction
        if (recherche) {
            let dataEvo = JSON.parse(localStorage.getItem("outiiil_evolution")) || {};
            // si on a pas de donné ou que la recherche n'est pas deja enregistré
            if (!dataEvo.hasOwnProperty("recherche")) {
                // si on pas les infos en localstorage
                dataEvo.recherche = recherche;
                dataEvo.expRecherche = moment().add(time, 's');
                dataEvo.startRecherche = moment();
                localStorage.setItem("outiiil_evolution", JSON.stringify(dataEvo));
            }
        }
        await this.enregistrerLocalStorage();
        return true;
    }
    /**
    *
    */
    getHistorique(id) {
        $.get("http://outiiil.fr/fzzz/" + Utils.serveur + "/player/" + $("a[href^='commerce.php?ID=']").attr("href").match(/\d+/g)[0], (data) => {
            // Creation du graphique
            let histoAlliance = new Array(), histoDate = new Array(), donnees = JSON.parse(data);
            let chart = new Highcharts.Chart({
                chart: {
                    renderTo: id,
                    type: "spline",
                    backgroundColor: null,
                    height: 320
                },
                data: {
                    csv: donnees.message,
                    itemDelimiter: ';',
                    parsed: (columns) => {
                        histoDate = columns.slice().splice(0, 1)[0];
                        histoAlliance = columns.splice(1, 1)[0];
                    },
                    firstRowAsNames: false
                },
                title: { text: '' },
                credits: { enabled: false },
                tooltip: {
                    crosshairs: [true],
                    formatter: function () {
                        let s = Highcharts.dateFormat("%A %e %b", this._x);
                        $.each(this.points, function () { s += "<br/><span style='color:" + this.series.color + "'>\u25CF</span> " + this.series.name + ": <b>" + numeral(this._y).format() + "</b>"; });
                        return s;
                    },
                    shared: true,
                    useHTML: true,
                },
                plotOptions: {
                    series: {
                        marker: {
                            radius: 3
                        }
                    }
                },
                xAxis: {
                    lineColor: "#333333",
                    startOnTick: true,
                    labels: { style: { color: "#222222" } },
                    min: moment().subtract(30, "days").valueOf()
                },
                yAxis: {
                    title: { text: null },
                    lineColor: "#333333",
                    gridLineColor: "#333333",
                    labels: { align: "left", x: 0, y: -2, style: { color: "#222222" } }
                },
                series: [
                    { name: "Terrain", color: "#21610B", type: "areaspline" },
                    { name: "Fourmilière", color: "#DF7401", type: "areaspline", visible: false },
                    { name: "Technologie", color: "#FF0000", type: "areaspline", visible: false },
                    { name: "Banni", color: "#6E6E6E", visible: false },
                    { name: "Vacance", color: "#013ADF", visible: false }
                ]
            });
            $("span[id^=o_selectHisto]").click((e) => {
                let chart = $("#o_chartJoueur").highcharts(), histo = $(e.currentTarget).attr("data");
                $("span[id^=o_selectHisto]").removeClass("active");
                $(e.currentTarget).addClass("active");
                if (histo == "all")
                    chart.xAxis[0].update({ min: moment("2016-01-01").valueOf() });
                else
                    chart.xAxis[0].update({ min: moment().subtract(histo, "days").valueOf() });
                // Style
                $("#o_bouton_range span.active").addClass("ligne_paire");
                $("#o_bouton_range span:not(.active)").removeClass("ligne_paire");
            });
            // ajout d'un tableau pour l'historique des alliance
            if (histoDate.length) {
                let html = "", ligne = "", i = 0, nbJour = 0, cDate = moment(histoDate[0]), cTeam = histoAlliance[0], fDate = moment(cDate);
                while (!moment().isSame(cDate, "day")) { // tant qu'on est pas arrivé à aujourd'hui
                    if (moment(histoDate[i]).isSame(cDate, "day")) { // si les dates sont continue
                        if (cTeam != histoAlliance[i]) { // si on a changé d'alli
                            html += `<tr><td class='left'>${fDate.format("DD/MM/YYYY")} -> ${cDate.format("DD/MM/YYYY")} (${(nbJour > 1 ? nbJour + " jours" : nbJour + " jour")})</td><td class='centre'>${cTeam != "0" ? `<a href='/classementAlliance.php?alliance=${cTeam}'>${cTeam}` : "Sans alliance"}</a></td></tr>`;
                            nbJour = 1;
                            cTeam = histoAlliance[i];
                            fDate = moment(cDate).add(1, "days");
                        } else
                            nbJour++;
                        i++;
                    }
                    cDate.add(1, "days");
                }
                if (nbJour != 1)
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
        const pseudoParam = await this.lire('Pseudo'); // Get the raw return value
        console.log(`[Joueur.getLigneRadar] Valeur brute de lireParametre('Pseudo'):`, pseudoParam, `Type: ${typeof pseudoParam}`);
        const pseudo = (typeof pseudoParam === 'object' && pseudoParam !== null && pseudoParam.hasOwnProperty('valeur')) ? pseudoParam.valeur : pseudoParam;
        console.log(`[Joueur.getLigneRadar] Début pour pseudo: ${pseudo}, ID: ${await this.lire('Id')}`);
        let enVacances = await this.lire('Activité') === 'vacances';
        let cellTerrain = await this.estAttaquable() ? `<a class="gras ${enVacances ? "blue_light" : ""} href="/ennemie.php?Attaquer=${await this.lire('Id')}&lieu=1">${numeral(await this.lire('Terrain de Chasse')).format()}</a>` : `<span ${enVacances ? `class="blue_light" title="En vacances"` : ""}>${numeral(await this.lire('Terrain de Chasse')).format()}</span>`;
        $(id).append(`<tr id="o_item_${indice}" class="lien"><td><a id="o_maj_${await this.lire('Id')}" class='o_actualiser' href=""><img src="${IMG_ACTUALISER}" alt="grade" height="20"/></a></td><td id="o_nom_${await this.lire('Id')}" class="left" title=""><a class="gras ${enVacances ? "blue_light" : ""}" href="Membre.php?Pseudo=${pseudo}">${pseudo}</a></td><td id="o_terrain_${await this.lire('Id')}" class="right reduce" title="">${cellTerrain}</td></tr>`);
        // event
        $("#o_maj_" + await this.lire('Id')).click(async (e) => {
            console.log(`[Joueur.getLigneRadar] Clic sur le bouton de rafraîchissement pour joueur: ${pseudo}, ID: ${await this.lire('Id')}`);
            e.preventDefault(); // Empêche le rechargement de la page
            console.log(`[Joueur.getLigneRadar] e.preventDefault() appelé pour joueur: ${pseudo}, ID: ${await this.lire('Id')}`);
            try {
                let oldTerrain = numeral($("#o_terrain_" + await this.lire('Id')).text()).value(), oldEtat = await this.lire('Activité'), bSave = false;
                $({ deg: 0 }).animate({ deg: 360 }, { duration: 600, step: (now) => { $(e.currentTarget).find("img").css({ transform: "rotate(" + now + "deg)" }); } });

                console.log(`[Joueur.getLigneRadar] Avant chargerDonneesMembre pour ${pseudo}. Pseudo actuel: ${pseudo}`);
                if (await this.chargerDonneesMembre()) {
                    console.log(`[Joueur.getLigneRadar] chargerDonneesMembre réussi pour ${pseudo}. Nouveau terrain: ${await this.lire('Terrain de Chasse')}, Nouvel état: ${await this.lire('Activité')}`);
                    // si il y une différence de terrain
                    let diff = await this.lire('Terrain de Chasse') - oldTerrain;
                    let enVacances = await this.lire('Activité') === 'vacances';
                    let cellTerrain = await this.estAttaquable() ? `<a class="gras ${enVacances ? "blue_light" : ""} href="/ennemie.php?Attaquer=${await this.lire('Id')}&lieu=1">${numeral(await this.lire('Terrain de Chasse')).format()}</a>` : `<span ${enVacances ? `class="blue_light" title="En vacances"` : ""}>${numeral(await this.lire('Terrain de Chasse')).format()}</span>`;
                    // si le joueur est sortie de MV ou si il a mis le MV
                    if (oldEtat != await this.lire('Activité')) {
                        console.log(`[Joueur.getLigneRadar] Changement de statut pour ${pseudo}. Ancien état: ${oldEtat}, Nouvel état: ${await this.lire('Activité')}`);
                        $("#o_terrain_" + await this.lire('Id')).html(cellTerrain);
                        if (enVacances)
                            $("#o_nom_" + await this.lire('Id') + " a").addClass("blue_light");
                        else
                            $("#o_nom_" + await this.lire('Id') + " a").removeClass("blue_light");
                        bSave = true;
                    }
                    if (diff) {
                        console.log(`[Joueur.getLigneRadar] Différence de terrain pour ${pseudo}. Diff: ${diff}`);
                        $("#o_terrain_" + await this.lire('Id'))
                            .html(cellTerrain)
                            .effect("highlight", { color: (diff > 0 ? "#458D58" : "#8D4545") }, 1000)
                            .attr("title", numeral(diff).format())
                            .tooltip({
                                position: { my: "left+10 center", at: "right center" },
                                content: `<span class='${diff > 0 ? "green_light" : "red_xlight"}'>${diff > 0 ? "+ " + $("#o_terrain_" + await this.lire('Id')).attr("title") : $("#o_terrain_" + await this.lire('Id')).attr("title")} cm²</span>`,
                                hide: { effect: "fade", duration: 10 },
                                tooltipClass: "warning-tooltip ui-tooltip-right"
                            }).tooltip("open");
                        bSave = true;
                    }
                    console.log(`[Joueur.getLigneRadar] bSave pour ${pseudo}: ${bSave}`);
                    bSave && await radar.sauvegarder();
                } else {
                    console.warn(`[Joueur.getLigneRadar] chargerProfil a échoué pour ${pseudo}.`);
                    $.toast({ ...TOAST_WARNING, text: `Le joueur ${pseudo} n'existe plus.` });
                    await radar.supprimeJoueur(this);
                    await radar.sauvegarder();
                    await radar.actualiser();
                }
            } catch (error) {
                console.error(`[Joueur.getLigneRadar] Erreur lors du rafraîchissement du profil pour ${pseudo}:`, error);
                $.toast({ ...TOAST_ERROR, text: `Erreur lors du rafraîchissement du joueur ${pseudo}.` });
            }
            console.log(`[Joueur.getLigneRadar] Fin du clic sur le bouton de rafraîchissement pour joueur: ${pseudo}.`);
            return false; // Assure que l'événement ne se propage pas et que le navigateur ne suit pas le lien
        });
        // tooltip vacance...
        $("#o_terrain_" + await this.lire('Id')).tooltip({ position: { my: "left+10 center", at: "right center" }, tooltipClass: "warning-tooltip" });
        // creation du tooltip sur les joueurs pour avoir le temps de trajet
        $("#o_nom_" + await this.lire('Id')).tooltip({
            position: { my: "left+10 bottom", at: "right center" },
            content: async (callback) => {
                console.log(`[Joueur.getLigneRadar] Tooltip 'content' function called for pseudo: ${pseudo}`);
                if (radar.joueurs.hasOwnProperty(pseudo)) {
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
            hide: { effect: "fade", duration: 10 },
            tooltipClass: "warning-tooltip ui-tooltip-right"
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
    /**
     * Surcharge pour gérer la visibilité dynamique du Rang si le Grade est présent.
     * @param {Array<String>} liste - Liste des noms de colonnes.
     * @returns {Object} Propriétés d'affichage.
     * @static
     */
    static recupererProprietesAffichage(liste) {
        const proprietes = super.recupererProprietesAffichage(liste);
        if (liste && liste.includes('Grade') && proprietes['Rang']) {
            proprietes['Rang'].visible = false;
        }
        return proprietes;
    }
})
