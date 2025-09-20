/*
 * BoiteParametre.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe permettant de choisir ses préférences.
*
* @class BoiteParametre
* @constructor
* @extends Boite
*/
class BoiteParametre extends Boite
{
    /**
    *
    */
    constructor()
    {
        super("o_boiteParametre", "Paramètres", `<div id='o_tabsParametre' class='o_tabs'><ul><li><a href='#o_tabsParametre1'>Général</a></li><li><a href='#o_tabsParametre2'>Utilitaire</a></li><li><a href='#o_tabsParametre3'>Apparence</a></li><li><a href='#o_tabsParametre4'>Traceur</a></li></ul><div id='o_tabsParametre1'/><div id='o_tabsParametre2'/><div id='o_tabsParametre3'/><div id='o_tabsParametre4'/></div>`);
        /**
        *
        */
        this._paramStyle = ["couleurTitre", "couleur1", "couleur2", "couleur3", "couleurTexte", "dockPosition", "dockVisible", "boiteShow", "boiteHide"];
        /**
        *
        */
        this._paramUtilitaire = [];
        /**
        *
        */
        this._paramGeneral = ["affectationRessource", "methodeFlood", "uniteAntisondeTerrain", "uniteAntisondeDome", "uniteSonde"];
        /**
        *
        */
        this._paramTraceur = ["etatTraceurJoueur", "intervalleTraceurJoueur", "nbPageTraceurJoueur", "etatTraceurAlliance", "intervalleTraceurAlliance"];
    }
	/**
    * Affiche la boite.
    *
    * @private
    * @method afficher
    */
	async afficher()
	{
        if(await super.afficher()){
            $("#o_tabsParametre").tabs({activate : (e, ui) => {this.css();}}).removeClass("ui-widget");
            if(!monProfilUtilisateur.parametre["cleTraceur"].valeur) $("#o_tabsParametre").tabs("disable", 3);
            this.parametreStyle().parametreUtilitaire().parametreGeneral().parametreTraceur().css().event();
        }
	}
	/**
	* Applique le style propre à la boite.
    *
	* @private
	* @method css
	*/
	css()
	{
        super.css();
        $(".o_tabs .ui-widget-header .ui-tabs-anchor").css("background-color", monProfilUtilisateur.parametre["couleur2"].valeur);
        $(".o_content a").unbind("mouseenter mouseleave").css("color", monProfilUtilisateur.parametre["couleurTexte"].valeur);
        $(".o_content li:not(.ui-state-active) a").css("color", "inherit")
        let matches = monProfilUtilisateur.parametre["couleurTexte"].valeur.match(/#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
        $(".o_content li:not(.ui-state-active):not(.ui-state-disabled) a").hover(
            (e) => {$(e.currentTarget).css("color", "rgba(" + matches.slice(1).map((m) => {return parseInt(m, 16);}).concat('0.5') + ")");},
            (e) => {$(e.currentTarget).css("color", "inherit");}
        );
        $(".o_content .ui-state-disabled a").css({cursor : "not-allowed", "pointer-events" : "all"});
        return this;
	}
	/**
	* Ajoute les evenements propres à la boite.
    *
	* @private
	* @method event
	*/
	event()
	{
        super.event();

        // Delegated event listener for text inputs (type 'input') and color inputs
        $("#o_boiteParametre").on("input", ".o_input:not([type='checkbox']):not([type='color']), .o_inputColor", function(e) {
            const paramId = this.id.replace('Picker', ''); // Handle color picker ID
            const param = monProfilUtilisateur.parametre[paramId];
            if (param) {
                if (param.type === 'color') {
                    param.valeur = e.currentTarget.value.padEnd(7, "0");
                    $(`#${param.id}Picker`).val(param.valeur);
                } else { // type 'input'
                    param.valeur = e.currentTarget.value;
                }
                param.sauvegarde();
            }
        });

        // Delegated event listener for checkboxes and selects
        $("#o_boiteParametre").on("change", ".o_checkbox, select.o_input", function(e) {
            const paramId = this.id;
            const param = monProfilUtilisateur.parametre[paramId];
            if (param) {
                if (param.type === 'checkbox') {
                    param.valeur = e.currentTarget.checked;
                } else if (param.type === 'select') {
                    param.valeur = parseInt(e.currentTarget.value);
                }
                param.sauvegarde();
            }
        });

        // Initialize spinners for number parameters and attach their events
        const numberParams = [
            "uniteAntisondeTerrain", "uniteAntisondeDome", "uniteSonde",
            "intervalleTraceurJoueur", "nbPageTraceurJoueur", "intervalleTraceurAlliance"
        ];

        for (const paramId of numberParams) {
            const param = monProfilUtilisateur.parametre[paramId];
            if (param && param.type === 'number') {
                let spinnerOptions = {
                    classes: { "ui-spinner": "o_number ui-corner-all" },
                    numberFormat: "i",
                    stop: (event, ui) => {
                        param.valeur = numeral(event.target.value).value();
                        param.sauvegarde();
                    }
                };

                if (paramId === "intervalleTraceurJoueur" || paramId === "intervalleTraceurAlliance") {
                    spinnerOptions.min = 5;
                    spinnerOptions.max = 1440;
                    spinnerOptions.step = 5;
                } else if (paramId === "nbPageTraceurJoueur") {
                    spinnerOptions.min = 1;
                    spinnerOptions.max = 5;
                } else {
                    spinnerOptions.min = 0;
                }
                
                $(`#${paramId}`).spinner(spinnerOptions);

                // Also add an input event for direct typing into spinner field
                $(`#${paramId}`).on("input", (e) => {
                    param.valeur = numeral(e.currentTarget.value).value();
                    $(e.currentTarget).spinner("value", param.valeur); // Update spinner display
                    param.sauvegarde();
                });
            }
        }

        return this;
	}
    /**
    *
    */
    parametreStyle()
    {
        let content = ``;
        for(let param of this._paramStyle) content += monProfilUtilisateur.parametre[param].getForm();
        $("#o_tabsParametre3").append(`<form>${content}</form>`);
        return this;
    }
    /**
    *
    */
    parametreUtilitaire()
    {
        console.log("[BoiteParametre] Entrée dans parametreUtilitaire()");
        console.log("[BoiteParametre] nomsSectionsRequis:", nomsSectionsRequis);

        if (nomsSectionsRequis) {
            this._paramUtilitaire = Array.from(nomsSectionsRequis);
            console.log("[BoiteParametre] _paramUtilitaire après Array.from:", this._paramUtilitaire);

            for (const nomSection of this._paramUtilitaire) {
                if (!monProfilUtilisateur.parametre[nomSection]) {
                    console.warn(`[BoiteParametre] Paramètre "${nomSection}" non trouvé dans monProfilUtilisateur.parametre. Création d'un nouveau.`);
                    monProfilUtilisateur.parametre[nomSection] = new ParametreUI(nomSection, nomSection, 'input'); // Use 'input' type and nomSection as label
                } else {
                    console.log(`[BoiteParametre] Paramètre "${nomSection}" trouvé dans monProfilUtilisateur.parametre.`);
                }
            }
        } else {
            console.warn("[BoiteParametre] nomsSectionsRequis est indéfini.");
        }

        let content = ``;
        // Trie les paramètres pour un affichage cohérent
        const sortedParams = [...this._paramUtilitaire].sort();
        console.log("[BoiteParametre] Paramètres triés pour affichage:", sortedParams);

        for(let param of sortedParams) {
            if(monProfilUtilisateur.parametre[param]) {
                content += monProfilUtilisateur.parametre[param].getForm();
            } else {
                console.error(`[BoiteParametre] Erreur: monProfilUtilisateur.parametre[${param}] est indéfini lors de la génération du formulaire.`);
            }
        }
        $("#o_tabsParametre2").append(`<p class='left reduce gras'>Saisissez les identifiants des sections de votre utilitaire</p><form>${content}</form>`);
        console.log("[BoiteParametre] Formulaire utilitaire généré.");
        return this;
    }
    /**
    *
    */
    parametreGeneral()
    {
        $("#o_tabsParametre1").append(`<form>
            <p class='left reduce gras'>L'affectation sera automatique lors de la consultation de la page ressource</p>
            ${monProfilUtilisateur.parametre[this._paramGeneral[0]].getForm()}
            <p class='left reduce gras'>La méthode sera sélectionnée par défaut dans le lanceur de flood</p>
            ${monProfilUtilisateur.parametre[this._paramGeneral[1]].getForm()}
            <p class='left reduce gras'>Indiquez le nombre d'unité selon l'objectif</p>
            <p class='left small'><em>Le nombre est choisi aléatoirement entre 90% du max et le max.</em></p>
            ${monProfilUtilisateur.parametre[this._paramGeneral[2]].getForm() + monProfilUtilisateur.parametre[this._paramGeneral[3]].getForm() + monProfilUtilisateur.parametre[this._paramGeneral[4]].getForm()}
        </form>`);
        return this;
    }
    /**
    *
    */
    parametreTraceur()
    {
        $("#o_tabsParametre4").append(`<form>
            <p class='left reduce gras'>Paramètres pour le traçage des joueurs</p>
            ${monProfilUtilisateur.parametre[this._paramTraceur[0]].getForm() + monProfilUtilisateur.parametre[this._paramTraceur[1]].getForm() + monProfilUtilisateur.parametre[this._paramTraceur[2]].getForm()}
            <p class='left reduce gras'>Paramètres pour le traçage des alliances</p>
            ${monProfilUtilisateur.parametre[this._paramTraceur[3]].getForm() + monProfilUtilisateur.parametre[this._paramTraceur[4]].getForm()}
        </form>`);
        return this;
    }
}
