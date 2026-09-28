/*
 * Boite.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe abstraite pour la creation de boite.
 *
 * @class Boite
 * @constructor
 */
Utils.register(class Boite {
    constructor(idBoite, titre, content = "") {
        /**
        * id de la boite.
        *
        * @private
        * @property titre
        * @type string
        */
        this._id = idBoite;
        /**
        * titre de la boite.
        *
        * @private
        * @property titre
        * @type string
        */
        this._titre = titre;
        /**
        * Contenue html de la boite.
        *
        * @private
        * @property content
        * @type string
        */
        this._content = content;
    }
    /**
    * Supprime la boite.
    *
    * @method desctructor
    */
    destructor() {
        $j("#" + this._id).remove();
    }
    /**
    * Affiche la boite.
    *
    * @method afficher
    */
    async afficher() {
        let bCreate = false;
        if (!$j("#" + this._id).length) {
            $j("body").append(`<div id='${this._id}' class='o_content'><span class='o_titre'>${this._titre}</span><div id="${this._id}Close" class='o_close'><b/><b/><b/><b/></div>${this._content}</div>`);
            $j("#" + this._id)
                .css({ top: (Math.random() * 100 + 50) + "px", left: (Math.random() * 250 + 100) + "px" })
                .draggable({ handle: ".o_titre", stack: "div" });
            bCreate = true;
        }
        $j("#" + this._id).show(EFFET[monProfilUtilisateur.parametre["boiteShow"].valeur].toLowerCase(), () => {
            $j(".o_content").css({
                "background-color": monProfilUtilisateur.parametre["couleur1"].valeur,
                "border-color": monProfilUtilisateur.parametre["couleur3"].valeur
            });
        });
        return bCreate;
    }
    /**
    * Cache la boite avec un effet de slide.
    *
    * @method masquer
    * @private
    */
    masquer() {
        $j("#" + this._id).hide(EFFET[monProfilUtilisateur.parametre["boiteHide"].valeur].toLowerCase());
        return this;
    }
    /**
    * Applique le style propre à la boite.
    *
    * @method css
    */
    css() {
        $j(".o_titre").css("color", monProfilUtilisateur.parametre["couleurTitre"].valeur);
        $j(".o_content").css({
            "background-color": monProfilUtilisateur.parametre["couleur1"].valeur,
            "border-color": monProfilUtilisateur.parametre["couleur3"].valeur
        });
        $j(".o_close b:nth-child(1)").css("border-top-color", monProfilUtilisateur.parametre["couleur1"].valeur);
        $j(".o_close b:nth-child(2)").css("border-left-color", monProfilUtilisateur.parametre["couleur1"].valeur);
        $j(".o_close b:nth-child(3)").css("border-bottom-color", monProfilUtilisateur.parametre["couleur1"].valeur);
        $j(".o_close b:nth-child(4)").css("border-right-color", monProfilUtilisateur.parametre["couleur1"].valeur);
        $j(".o_close").css("background-color", monProfilUtilisateur.parametre["couleur2"].valeur).hover(
            (e) => { $j(e.currentTarget).animate({ "background-color": "#bb3333" }, 400); },
            (e) => { $j(e.currentTarget).animate({ "background-color": monProfilUtilisateur.parametre["couleur2"].valeur }, 400); }
        );
        $j(".o_tabs > .ui-widget-header").css("border-bottom-color", monProfilUtilisateur.parametre["couleur2"].valeur);
        $j(".o_content p, .o_content .o_label, .o_content label, .o_content table").css("color", monProfilUtilisateur.parametre["couleurTexte"].valeur);
        return this;
    }
    /**
    * Ajoute les evenements propres à la boite.
    *
    * @method event
    */
    event() {
        $j("#" + this._id + "Close").click((e) => { this.masquer(); });
        return this;
    }
});
