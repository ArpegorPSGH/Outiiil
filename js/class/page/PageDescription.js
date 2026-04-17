/*
 * Description.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe de fonction pour la page /classementAlliance.php?alliance=?.
*
* @class PageDescription
* @constructor
*/
Utils.register(class PageDescription extends Page {
    static URIs = "/classementAlliance.php?alliance=";


    static FONCTIONNALITES = [
        this.prototype.constructionAlliance,
        this.prototype.ajoutFooter,
    ];

    constructor() {
        super();
        /**
        * Creation de la classe modele d'une alliance
        */
        this._alliance = new Alliance({ tag: Utils.extractUrlParams()["alliance"] });
    }

    async constructionAlliance() {
        // Suppression du cadre classement
        $("#centre center:first").remove();
        // construction de l'alliance
        let tmpJoueurs = {};
        await $("#tabMembresAlliance tr:gt(0)").each(async (i, elt) => {
            let pseudo = $(elt).find("td:eq(2)").text(), terrain = numeral($(elt).find("td:eq(4)").text()).value();
            tmpJoueurs[pseudo] = new Joueur({
                pseudo: pseudo,
                terrain: terrain,
                fourmiliere: ~~($(elt).find("td:eq(7)").text()),
                technologie: ~~($(elt).find("td:eq(6)").text())
            });
            if (!Utils.comptePlus && ! await tmpJoueurs[pseudo].estJoueurCourant()) {
                if (await tmpJoueurs[pseudo].estAttaquable())
                    $(elt).find("td:eq(5)").html(IMG_ATT);
                if (await tmpJoueurs[pseudo].estAttaquant())
                    $(elt).find("td:eq(3)").html(IMG_DEF);
            }
        });
        this._alliance.joueurs = tmpJoueurs;
    }
    /**
    *
    * @private
    * @method initialize
    * @return
    */
    async ajoutFooter() {
        $("#tabMembresAlliance tr:first").remove();
        $("#tabMembresAlliance")
            .append(`<tfoot><tr class='gras centre'><td colspan='8'>Terrain : <span id='totalTerrain'>${numeral(await this._alliance.calculTerrain()).format()}</span> cm² | Fourmilière : ${numeral(await this._alliance.calculFourmiliere()).format()} | Technologie : ${numeral(await this._alliance.calculTechnologie()).format()}.</td></tr></tfoot>`)
            .wrap("<div class='simulateur'>")
            .css({ "border": "0px", "width": "100%", "padding": "0px" })
            .prepend(`<thead><tr class='alt'><th></th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmiliere</span></th></tr></thead>`)
            .after(`<div id='o_bouton_alliance' class='o_group_bouton'><span id='o_historique' class='option_gestion'><img src="${IMG_HISTORIQUE}" alt="historique"/> Historique</span><span id='o_surveiller' class='option_gestion'><img src="${IMG_RADAR}" alt="surveiller"/>${boiteRadar.alliances.hasOwnProperty(this._alliance.tag) ? " Ignorer" : " Surveiller"}</span></div><div id='o_separation_graph' class='clear'></div>`);
        this.tableau();

        $("#o_historique").click((e) => {
            $(e.currentTarget).off().css("backgroundColor", "#bbb");
            this.historique();
        });
        $("#o_surveiller").click(async (e) => {
            if (!boiteRadar.alliances.hasOwnProperty(this._alliance.tag)) {
                $(e.currentTarget).html($(e.currentTarget).html().replace(/Surveiller/, "Ignorer"));
                await boiteRadar.ajouteAlliance(this._alliance);
            } else {
                $(e.currentTarget).html($(e.currentTarget).html().replace(/Ignorer/, "Surveiller"));
                await boiteRadar.supprimeAlliance(this._alliance);
            }
            await boiteRadar.sauvegarder(); // Await the promise to get the BoiteRadar instance
            boiteRadar.actualiser();       // Call actualiser on the BoiteRadar instance
        });
    }
    /**
    * Ajoute le tri sur le tableau des membres.
    *
    * @private
    * @method tableau
    */
    tableau() {
        $("#tabMembresAlliance").DataTable({
            bInfo: false,
            bPaginate: false,
            bAutoWidth: false,
            dom: "Bfrti",
            order: [],
            buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
            responsive: true,
            language: {
                zeroRecords: "Aucun joueur trouvé",
                info: "Page _PAGE_ de _PAGES_",
                infoEmpty: "Aucun enregistrement",
                infoFiltered: "(Filtré par _MAX_ enregistrements)",
                search: "Rechercher : ",
                buttons: { colvis: "Colonne" }
            },
            columnDefs: [
                { type: "quantite-grade", targets: 4 },
                { sortable: false, targets: [0, 3, 5] }
            ]
        });
        return this;
    }
    /**
    * Récupére et Affiche l'historique de l'alliance.
    *
    * @private
    * @method historique
    */
    historique() {
        $("#o_separation_graph").after(`<div id='o_boiteAlliance' class='simulateur o_marginT15'><div id='o_bouton_range' class='o_group_bouton'><span id='o_selectHisto_1' class='active option_gestion ligne_paire' data='30'>30J</span><span id='o_selectHisto_2' class='option_gestion' data='90'>90J</span><span id='o_selectHisto_3' class='option_gestion' data='180'>180J</span><span id='o_selectHisto_4' class='option_gestion' data='all'>Tout</span></div><div id='o_chartAlliance'></div></div>`);
        this._alliance.getHistorique("o_chartAlliance");
        return this;
    }
})
