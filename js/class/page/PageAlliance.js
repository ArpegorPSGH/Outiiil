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
    static URIs = { href: "/alliance.php?Membres" };

    /**
     * Liste unifiée des fonctionnalités à exécuter sur la page Alliance.
     * L'ordre est crucial.
     * @type {Array<Function|typeof FonctionnaliteAlliance>}
     */
    static FONCTIONNALITES = [
        // Étape 1: Ajout des lignes des joueurs extérieurs
        FonctionnaliteJoueursExterieurs,

        // Étape 2: Mise en forme et enrichissement du tableau (membres intérieurs)
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
     * Constructeur de la classe PageAlliance.
     */
    constructor() {
        super();
        this._alliance = new Alliance({ tag: Utils.alliance });
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
        const headerIndices = [];
        let currentIdx = 0;
        $("#tabMembresAlliance thead th").each((i, th) => {
            const text = $(th).text().trim().replace(/\s+/g, ' ');
            const colspan = parseInt($(th).attr('colspan') || 1);
            allHeaderTexts.push(text);
            headerIndices.push(currentIdx);
            currentIdx += colspan;
        });

        const findIndicesForSingleHeader = (singleNomEnTete) => {
            const cleanedNomEnTete = singleNomEnTete.trim().replace(/\s+/g, ' ');
            const foundIndices = [];
            allHeaderTexts.forEach((headerText, i) => {
                if (headerText === cleanedNomEnTete) {
                    foundIndices.push(headerIndices[i]);
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
            // Nettoyage complet : on enlève thead, tfoot et l'ancienne ligne d'en-tête de Fourmizzz (tr class='alt')
            $("#tabMembresAlliance thead").remove();
            $("#tabMembresAlliance tfoot").remove();
            $("#tabMembresAlliance tr.alt:first").remove(); // Préférer supprimer par classe pour cibler l'en-tête original

            // Ajouter le thead avec les en-têtes de base (12 colonnes couvertes via 11 <th>)
            $("#tabMembresAlliance").prepend(`<thead><tr class='alt'><th></th><th></th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain de Chasse</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmilière</span></th><th colspan='2'>État</th><th></th></tr></thead>`);
            await super.init();
        } else {
            // Observer le DOM pour l'apparition du tableau
            let observer = new MutationObserver(async (mutationsList) => {
                if ($("#tabMembresAlliance").length) {
                    $("#tabMembresAlliance thead").remove();
                    $("#tabMembresAlliance tfoot").remove();
                    $("#tabMembresAlliance tr.alt:first").remove();
                    $("#tabMembresAlliance").prepend(`<thead><tr class='alt'><th></th><th></th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain de Chasse</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmilière</span></th><th colspan='2'>État</th><th></th></tr></thead>`);
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

        const pseudoColIndex = this.getColonneIndex('Pseudo');
        const etatColIndex = this.getColonneIndex('État');
        console.log(`[PageAlliance] synchroniserDepuisDOM: Pseudo index=${pseudoColIndex}, État index=${etatColIndex}`);

        const promises = $("#tabMembresAlliance tbody tr").map(async (i, elt) => {
            const pseudo = $(elt).find(`td:eq(${pseudoColIndex})`).text().trim().split(' ')[0];
            const etatImage = $(elt).find(`td:eq(${etatColIndex}) img`).attr('src');

            // Créer une instance de Joueur ou mettre à jour une existante
            let joueur = this._alliance.joueurs[pseudo];
            if (!joueur && pseudo.length > 0) {
                joueur = new Joueur(this, {
                    donneesInitiales: {
                        'Pseudo': pseudo,
                        'Activité': etatImage || '' // Ajouter la pastille d'état aux données initiales
                    }
                });
                await joueur.completerRafraichissement();
            }

            if (joueur) {
                joueursDansDOM[pseudo] = joueur;
            }
        }).get();

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

        // Insérer les en-têtes pour TdT et Retour après la colonne "Fourmilière" dans le thead
        const thFourmiliere = $("#tabMembresAlliance thead tr th:contains('Fourmilière')");
        if (thFourmiliere.length) {
            thFourmiliere.after(`<th class="dt-head-center">TdT</th><th class="dt-head-center">Retour</th>`);
        } else {
            console.error("[PageAlliance] Impossible de trouver la colonne 'Fourmilière' pour insérer TdT/Retour.");
        }

        const pseudoColIndex = this.getColonneIndex('Pseudo');
        const fourmiliereColIndex = this.getColonneIndex('Fourmilière');

        const itemsPromises = $("#tabMembresAlliance tbody tr").map(async (i, elt) => {
            const pseudo = $(elt).find(`td:eq(${pseudoColIndex})`).text().split(' ')[0];
            console.log('[PageAlliance] pseudo:', pseudo)
            const joueur = this._alliance.joueurs[pseudo];
            console.log('[PageAlliance] joueur:', joueur)

            if (joueur) {
                // Insérer les cellules TdT et Retour après la colonne "Fourmilière"
                const tempsParcours = await monProfilJoueur.getTempsParcours2(joueur);
                const tdtDisplay = Utils.intToTime(tempsParcours);
                const retourDisplay = Utils.roundMinute(tempsParcours).format("D MMM à HH[h]mm");
                $(elt).find(`td:eq(${fourmiliereColIndex})`).after(`<td align="center">${tdtDisplay}</td><td align="center">${retourDisplay}</td>`);
            } else {
                // Si le joueur n'est pas trouvé dans l'alliance (cas inattendu après synchronisation),
                // ajouter des valeurs par défaut pour éviter les erreurs d'affichage.
                $(elt).find(`td:eq(${fourmiliereColIndex})`).after(`<td align="center">N/C</td><td align="center">N/C</td>`);
            }
        }).get();

        await Promise.all(itemsPromises);
    }

    /**
     * Parcourt toutes les lignes et ajoute les icônes d'attaque/défense.
     * @returns {Promise<void>}
     */
    async afficherIndicateursAttaqueDefense() {
        if (!Utils.comptePlus) {
            await this.synchroniserJoueursDepuisDOM();
            console.log('this._alliance.joueurs :', this._alliance.joueurs)
            const pseudoColIndex = this.getColonneIndex('Pseudo');
            const TerrainColIndex = this.getColonneIndex('Terrain de Chasse');

            const indicatorsPromises = $("#tabMembresAlliance tbody tr").map(async (i, elt) => {
                const pseudo = $(elt).find(`td:eq(${pseudoColIndex})`).text();
                const joueur = this._alliance.joueurs[pseudo];

                if (joueur && !await joueur.estJoueurCourant()) {
                    if (await joueur.estAttaquable()) {
                        $(elt).find(`td:eq(${TerrainColIndex + 1})`).html(IMG_ATT);
                    }
                    if (await joueur.estAttaquant()) {
                        $(elt).find(`td:eq(${TerrainColIndex - 1})`).html(IMG_DEF);
                    }
                }
            }).get();

            await Promise.all(indicatorsPromises);
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
        const totalTerrain = await this._alliance.calculTerrain();
        const totalFourmiliere = await this._alliance.calculFourmiliere();
        const totalTechnologie = await this._alliance.calculTechnologie();
        const nbJoueurs = Object.keys(this._alliance.joueurs).length;

        console.log('totalTerrain :', totalTerrain)
        console.log('totalFourmiliere :', totalFourmiliere)
        console.log('totalTechnologie :', totalTechnologie)
        console.log('nbJoueurs :', nbJoueurs)

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
                <tr style='display: none;'>
                    ${Array(colspanValue).fill('<th></th>').join('')}
                </tr>
                <tr class='gras centre'>
                    <td colspan='${colspanValue}'>Terrain de Chasse : <span id='totalTerrain'>${numeral(totalTerrain).format()}</span> cm² | Fourmilière : ${numeral(totalFourmiliere).format()} | Technologie : ${numeral(totalTechnologie).format()}.</td>
                </tr>
                <tr class='gras centre'>
                    <td colspan='${colspanValue}'>Moyenne par joueur : Terrain de Chasse : ${numeral(moyenneTerrain).format()} cm² | Fourmilière : ${numeral(moyenneFourmiliere).format()} | Technologie : ${numeral(moyenneTechnologie).format()}.</td>
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
        console.log("[PageAlliance] ajouterBoutonsDataTable: Début");
        const allHeaderTexts = [];
        const colspans = [];
        $("#tabMembresAlliance thead th").each((i, th) => {
            const text = $(th).text().trim().replace(/\s+/g, ' ');
            allHeaderTexts.push(text);
            colspans.push(parseInt($(th).attr('colspan') || 1));
            console.log(`[PageAlliance] Header detected: "${text}" (colspan=${$(th).attr('colspan') || 1})`);
        });

        const proprietes = Joueur.recupererProprietesAffichage(allHeaderTexts);
        console.log("[PageAlliance] Properties retrieved:", proprietes);

        const columnDefs = (() => {
            const defs = [{ className: "dt-body-center", targets: "_all" }];

            let currentColumnIndex = 0;
            allHeaderTexts.forEach((header, index) => {
                const prop = proprietes[header] || { visible: true, sortable: header !== "", type: null };
                const colspan = colspans[index];

                const targets = [];
                for (let j = 0; j < colspan; j++) {
                    targets.push(currentColumnIndex + j);
                }

                defs.push({
                    targets: targets,
                    orderable: prop.sortable,
                    visible: prop.visible,
                    type: prop.type
                });
                currentColumnIndex += colspan;
            });
            console.log("[PageAlliance] Generated columnDefs:", defs);
            return defs;
        })();

        const terrainIndex = this.getColonneIndex('Terrain de Chasse');
        console.log(`[PageAlliance] Index de tri (Terrain de Chasse): ${terrainIndex}`);

        // ── LOGS DE DIAGNOSTIC : contenu du header et des lignes ──────────────────────
        const nbColonnesAttendues = $("#tabMembresAlliance thead th").get().reduce((acc, th) => acc + parseInt($(th).attr('colspan') || 1), 0);
        console.log(`[PageAlliance] DIAGNOSTIC: thead couvre ${nbColonnesAttendues} colonnes (via ${$("#tabMembresAlliance thead th").length} <th>) :`, allHeaderTexts);

        let lignesIncaherentes = 0;
        $("#tabMembresAlliance tbody tr").each((i, tr) => {
            const $tds = $(tr).find("td");
            const nbTd = $tds.length;
            const cellsContent = $tds.map((j, td) => $(td).text().trim()).get();
            const pseudo = $(tr).find(`td:eq(${this.getColonneIndex('Pseudo') >= 0 ? this.getColonneIndex('Pseudo') : 3})`).text().trim().split(' ')[0] || `ligne_${i}`;

            if (nbTd !== nbColonnesAttendues) {
                console.warn(`[PageAlliance] DIAGNOSTIC INCOHÉRENCE ligne ${i} (${pseudo}): ${nbTd} <td> vs ${nbColonnesAttendues} attendues. Contenu:`, cellsContent);
                lignesIncaherentes++;
            } else {
                console.log(`[PageAlliance] DIAGNOSTIC ligne ${i} (${pseudo}): OK. Contenu:`, cellsContent);
            }
        });

        if (lignesIncaherentes > 0) {
            console.error(`[PageAlliance] DIAGNOSTIC: ${lignesIncaherentes} ligne(s) incohérente(s) détectée(s) (nbTd !== ${nbColonnesAttendues}) → DataTables va échouer !`);
        } else {
            console.log(`[PageAlliance] DIAGNOSTIC: Toutes les lignes sont cohérentes avec le thead (${nbColonnesAttendues} colonnes).`);
        }
        // ── FIN LOGS DE DIAGNOSTIC ──────────────────────────────────────────

        // Initialiser DataTable
        $("#tabMembresAlliance").DataTable({
            bInfo: false,
            bPaginate: false,
            bAutoWidth: false,
            bDestroy: true,
            dom: "Bfrti",
            buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
            order: [[terrainIndex, "desc"]],
            stripeClasses: ["", "alt"],
            responsive: true,
            language: {
                zeroRecords: "Aucun joueur trouvé",
                infoEmpty: "Aucun enregistrement",
                infoFiltered: "(Filtré par _MAX_ enregistrements)",
                search: "Rechercher : ",
                buttons: { colvis: "Colonne" }
            },
            columnDefs: columnDefs
        });
        console.log("[PageAlliance] DataTable initialisé.");
    }
});
