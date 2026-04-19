/**
* Creer une boite radar pour la surveillance des joueurs/alliances.
*
* @class BoiteRadar
* @constructor
* @extends Boite
*/
class BoiteRadar {
    constructor() {
        /**
        * liste des joueurs
        */
        this._joueurs = {};
        /**
        * liste des alliances
        */
        this._alliances = {};
        // on recupére les données
        this.getData();
    }
    /**
    *
    */
    get joueurs() {
        return this._joueurs;
    }
    /**
    *
    */
    set joueurs(newJoueurs) {
        this._joueurs = newJoueurs;
    }
    /**
    *
    */
    get alliances() {
        return this._alliances;
    }
    /**
    *
    */
    set alliances(newAlliances) {
        this._alliances = newAlliances;
    }
    /**
    *
    */
    async ajouteJoueur(joueur) {
        this._joueurs[await joueur.lire('Pseudo')] = joueur;
        await this._joueurs[await joueur.lire('Pseudo')].ecrire('Ordre Radar', await this.getOrdreMax() + 1);
        return this;
    }
    /**
    *
    */
    async supprimeJoueur(joueur) {
        delete this._joueurs[await joueur.lire('Pseudo')];
        return this;
    }
    /**
    *
    */
    async ajouteAlliance(alliance) {
        this._alliances[alliance.tag] = alliance;
        this._alliances[alliance.tag].ordreRadar = await this.getOrdreMax() + 1;
        return this;
    }
    /**
    *
    */
    supprimeAlliance(alliance) {
        delete this._alliances[alliance.tag];
        return this;
    }
    /**
    *
    */
    async getOrdreMax() {
        let max = 0;
        for (let j in this._joueurs) {
            let ordre = await this._joueurs[j].lire('Ordre Radar');
            if (ordre > max)
                max = ordre;
        }
        for (let a in this._alliances) {
            let ordre = this._alliances[a].ordreRadar;
            if (ordre > max)
                max = ordre;
        }
        return max;
    }
    /**
    *
    */
    async calculeOrdre(serie) {
        let newOrdre = serie.split("&"), item = new Array(), lien = "";
        for (let i = 0; i < newOrdre.length; i++) {
            item = newOrdre[i].split("=");
            lien = $("#o_item_" + item[1]).find("a:eq(1)");
            // si l'item correspond à un joueur
            if (lien.attr("href").includes("Membre.php"))
                await this._joueurs[lien.text()].ecrire('Ordre Radar', i);
            else // sinon c'est une alliance
                this._alliances[lien.text()].ordreRadar = i;
        }
        return await this.sauvegarder();
    }
    /**
    * Récupére les données sur les joueurs sous surveillance.
    *
    * @method getRadar
    */
    getData() {
        let data = JSON.parse(localStorage.getItem("outiiil_radar")) || {};
        console.log("[BoiteRadar.getData] Données brutes du localStorage:", data);
        // Si des données sont deja presente et à jour on les charges
        if (data.hasOwnProperty("joueurs")) {
            for (let item in data.joueurs) {
                console.log(`[BoiteRadar.getData] Création Joueur pour item: ${item}, avec données:`, data.joueurs[item]);
                this._joueurs[item] = new Joueur(null, { donneesInitiales: data.joueurs[item] });
                console.log(`[BoiteRadar.getData] Joueur créé:`, this._joueurs[item]);
            }
            console.log("[BoiteRadar.getData] Boucle joueurs terminée.");
        }
        if (data.hasOwnProperty("alliances")) {
            for (let item in data.alliances) {
                console.log(`[BoiteRadar.getData] Création Alliance pour item: ${item}, avec données:`, data.alliances[item]);
                this._alliances[item] = new Alliance(data.alliances[item]);
                console.log(`[BoiteRadar.getData] Alliance créée:`, this._alliances[item]);
            }
            console.log("[BoiteRadar.getData] Boucle alliances terminée.");
        }
        console.log("[BoiteRadar.getData] Fin de getData.");
    }
    /**
    *
    */
    async toJSON() {
        let json = {}, joueurs = {}, alliances = {};
        for (let j in this._joueurs) {
            const joueur = this._joueurs[j];
            joueurs[j] = {
                pseudo: await joueur.lire("Pseudo"),
                id: await joueur.lire('Id'),
                x: await joueur.lire('X'),
                y: await joueur.lire('Y'),
                activite: await joueur.lire('Activité'),
                terrain: await joueur.lire('Terrain de Chasse'),
                ordreRadar: await joueur.lire('Ordre Radar')
            };
        }
        for (let a in this._alliances) alliances[a] = JSON.parse(JSON.stringify(this._alliances[a], ["tag", "terrain", "ordreRadar"]));
        // si on a des joueurs sous surveillance on ajoute à l'objet
        if (Object.keys(joueurs).length) json["joueurs"] = joueurs;
        // si on a des alliances sous surveillance on ajoute à l'objet
        if (Object.keys(alliances).length) json["alliances"] = alliances;
        return json;
    }
    /**
    *
    */
    async sauvegarder() {
        const dataToSave = await this.toJSON();
        localStorage.setItem("outiiil_radar", JSON.stringify(dataToSave));
        return this;
    }
    /**
    * Affiche la boie.
    *
    * @private
    * @method afficher
    */
    async afficher() {
        // si il y a des joueurs ou des alliances surveillés on affiche la boite
        if (Object.keys(this._joueurs).length || Object.keys(this._alliances).length) {
            // Modification de la boite compte plus pour faire apparaitre la boite radar
            $("#boiteComptePlus .titre_colonne_cliquable").replaceWith(() => { return `<div class='titre_colonne_cliquable'>${IMG_FLECHE} <span class='titre_compte_plus'>Outiiil ${VERSION.substring(0, 2)}<span class='reduce'>${VERSION.substring(2)}</span></span> ${IMG_FLECHE}</div>`; });
            // Event sur le titre si on utilise le radar
            $("#boiteComptePlus .titre_colonne_cliquable").click((e) => {
                if ($(e.currentTarget).next().find("table:visible").attr("id"))
                    localStorage.setItem("outiiil_boiteActive", "C");
                else
                    localStorage.setItem("outiiil_boiteActive", "R");
                $("#boiteComptePlus .contenu_boite_compte_plus table").toggle();
            });
            // Remplissage de la boite
            await this.actualiser();
        }
        return this;
    }
    /**
    * Rafraichie la boite radar quand un element est inséré ou retiré.
    *
    * @private
    * @method actualiseBoite
    */
    async actualiser() {
        let affiche = localStorage.getItem("outiiil_boiteActive"), html = `<table id='o_radar' ${!affiche || affiche == "C" ? `style="display:none"` : ""}><tbody></tbody></table>`;
        // on remplace le contenu ou l'ajoute
        if ($("#o_radar").length)
            $("#o_radar").replaceWith(html);
        else {
            $("#boiteComptePlus .contenu_boite_compte_plus table").after(html);
            $("#o_radar tbody").sortable({
                placeholder: "o_radarPlaceholder",
                update: (e, ui) => {
                    this.calculeOrdre($("#o_radar tbody").sortable("serialize"));
                }
            });
        }
        // Event pour mettre à jour les données d'un joueur ou une alliance
        $("#o_radar").off();
        // affichage des elements
        let j = 1;
        console.log("[BoiteRadar.actualiser] Début de l'actualisation. Joueurs:", this._joueurs, "Alliances:", this._alliances);
        let elements = [];
        for (let joueur in this._joueurs) elements.push({ nom: joueur, obj: this._joueurs[joueur], ordreRadar: await this._joueurs[joueur].lire('Ordre Radar') });
        for (let alliance in this._alliances) elements.push({ nom: alliance, obj: this._alliances[alliance], ordreRadar: this._alliances[alliance].ordreRadar });

        elements.sort((a, b) => (a.ordreRadar || 0) - (b.ordreRadar || 0));

        for (let el of elements) {
            console.log(`[BoiteRadar.actualiser] Appel getLigneRadar, ordre: ${el.ordreRadar}`);
            await el.obj.getLigneRadar(this, "#o_radar", j++);
        }
        console.log("[BoiteRadar.actualiser] Fin de l'actualisation.");
        return this;
    }
}
