/*
 * Profil.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe de fonction pour la page /Membre.php?Pseudo=?.
*
* @class PageProfil
* @constructor
*/
Utils.register(class PageProfil extends Page {
    static URIs = ["/Membre.php", { href: "/Membre.php?Pseudo" }];


    static FONCTIONNALITES = [
        this.prototype.chargerData,
        this.prototype.afficherTrajet,
        this.prototype.ajouterOptions,
    ];
    /**
    *
    */
    constructor() {
        super();
        /**
        * Creation du modele profil
        */
        this._profil = null;
    }
    /**
    *
    */
    async chargerData() {
        this._profil = new Joueur(null, { donneesInitiales: { Pseudo: $("h2").text() } });
        let regexp = new RegExp("x=(\\d*) et y=(\\d*)"), ligne = $(".boite_membre").find("a[href^='carte2.php?']").text();
        await this._profil.ecrire('X', ~~(ligne.replace(regexp, "$1")));
        await this._profil.ecrire('Y', ~~(ligne.replace(regexp, "$2")));
        await this._profil.ecrire('Activité', $(".boite_membre table:eq(0) tr:eq(0) td:eq(0)").text().includes("Joueur en vacances"));
        await this._profil.ecrire('Id', $("a[href^='commerce.php?ID=']").attr("href").match(/\d+/g)[0]);
        await this._profil.ecrire('Terrain de Chasse', numeral($(".tableau_score tr:eq(1) td:eq(1)").text()).value());
    }
    /**
   *
   */
    async afficherTrajet() {
        // si on consulte un profil différent du sien
        if (! await this._profil.estJoueurCourant()) {
            // si on a pas de compte+ on affiche le temps de trajet
            !Utils.comptePlus && await this.plus();
            // Affichage du retour dynamique
            $(".boite_membre:first div:first table").append(`<tr><td class='right'>Retour le :</td><td id='o_tempsRetour'>${moment().add(await monProfilJoueur.getTempsParcours2(this._profil), 's').format("D MMM à HH[h]mm[m]ss[s]")}</td></tr><tr><td class='right'>Rapport :</td><td id='o_tempsRetourRapport'>${Utils.roundMinute(await monProfilJoueur.getTempsParcours2(this._profil)).format("D MMM à HH[h]mm")}</td></tr>`);
            Utils.incrementTime(await monProfilJoueur.getTempsParcours2(this._profil), "o_tempsRetour", "o_tempsRetourRapport");
        }
    }
    /**
   *
   */
    async ajouterOptions() {
        // Ajout des options pour ajouter au radar et utiliser l'historique
        $(".boite_membre:eq(1) table tr td:eq(0)").append(`${Utils.comptePlus ? "<br/>" : ""}- <span id='o_surveiller' class='cursor gras'>${boiteRadar.joueurs.hasOwnProperty(await this._profil.lire('Pseudo')) ? "Supprimer la surveillance" : "Surveiller ce joueur"}</span><br/>- <span id='o_historique' class='cursor gras'>Historique</span>`);

        $("#o_historique").click((e) => {
            $(e.currentTarget).off().css("color", "#555555");
            this.historique();
        });
        $("#o_surveiller").click(async (e) => {
            if (!boiteRadar.joueurs.hasOwnProperty(await this._profil.lire('Pseudo'))) {
                $(e.currentTarget).text("Supprimer la surveillance");
                await boiteRadar.ajouteJoueur(this._profil);
            } else {
                $(e.currentTarget).text("Surveiller ce joueur");
                await boiteRadar.supprimeJoueur(this._profil);
            }
            await boiteRadar.sauvegarder();
            boiteRadar.actualiser();
        });
    }
    /**
    * Récupére et Affiche l'historique du joueur.
    *
    * @private
    * @method historique
    */
    historique() {
        $("#centre center .boite_membre:eq(1)").after(`<div class='boite_membre' id='o_boiteHistorique'>
            <div id='o_bouton_range' class='o_group_bouton'><span id='o_selectHisto_1' class='active option_gestion ligne_paire' data='30'>30J</span><span id='o_selectHisto_2' class='option_gestion' data='90'>90J</span><span id='o_selectHisto_3' class='option_gestion' data='180'>180J</span><span id='o_selectHisto_4' class='option_gestion' data='all'>Tout</span></div>
            <div id='o_chartJoueur'></div></div>`);
        this._profil.getHistorique("o_chartJoueur");
        return this;
    }
    /**
    *
    */
    async plus() {
        // Affichage du temps de trajet
        $(".boite_membre:first div:first table").append(`<tr><td style='text-align:right'>Temps de trajet :</td><td>${Utils.intToTime(await monProfilJoueur.getTempsParcours2(this._profil))}</td></tr>`);
        return this;
    }
})
