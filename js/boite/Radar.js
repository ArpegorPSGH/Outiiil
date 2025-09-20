/**
* Creer une boite radar pour la surveillance des joueurs/alliances.
*
* @class BoiteRadar
* @constructor
* @extends Boite
*/
class BoiteRadar
{
    constructor()
    {
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
    get joueurs()
    {
        return this._joueurs;
    }
    /**
    *
    */
    set joueurs(newJoueurs)
    {
        this._joueurs = newJoueurs;
    }
    /**
    *
    */
    get alliances()
    {
        return this._alliances;
    }
    /**
    *
    */
    set alliances(newAlliances)
    {
        this._alliances = newAlliances;
    }
    /**
    *
    */
    async ajouteJoueur(joueur)
    {
        this._joueurs[await joueur.lireParametre('pseudo')] = joueur;
        this._joueurs[await joueur.lireParametre('pseudo')].ordreRadar = this.getOrdreMax() + 1;
        return this;
    }
    /**
    *
    */
    async supprimeJoueur(joueur)
    {
        delete this._joueurs[await joueur.lireParametre('pseudo')];
        return this;
    }
    /**
    *
    */
    ajouteAlliance(alliance)
    {
        this._alliances[alliance.tag] = alliance;
        this._alliances[alliance.tag].ordreRadar = this.getOrdreMax() + 1;
        return this;
    }
    /**
    *
    */
    supprimeAlliance(alliance)
    {
        delete this._alliances[alliance.tag];
        return this;
    }
    /**
    *
    */
    getOrdreMax()
    {
        let max = 0;
        for(let j in this._joueurs)
            if(this._joueurs[j].ordreRadar > max)
                max = this._joueurs[j].ordreRadar;
        for(let a in this._alliances)
            if(this._alliances[a].ordreRadar > max)
                max = this._alliances[a].ordreRadar;
        return max;
    }
    /**
    *
    */
    async calculeOrdre(serie)
    {
        let newOrdre = serie.split("&"), item = new Array(), lien = "";
        for(let i = 0 ; i < newOrdre.length ; i++){
            item = newOrdre[i].split("=");
            lien = $("#o_item_" + item[1]).find("a:eq(1)");
            // si l'item correspond à un joueur
            if(lien.attr("href").includes("Membre.php"))
                this._joueurs[lien.text()].ordreRadar = i;
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
	getData()
	{
		let data = JSON.parse(localStorage.getItem("outiiil_radar")) || {};
        console.log("[BoiteRadar.getData] Données brutes du localStorage:", data);
		// Si des données sont deja presente et à jour on les charges
        if(data.hasOwnProperty("joueurs")){
            for(let item in data.joueurs){
                console.log(`[BoiteRadar.getData] Création Joueur pour item: ${item}, avec données:`, data.joueurs[item]);
                this._joueurs[item] = new Joueur(data.joueurs[item]);
                console.log(`[BoiteRadar.getData] Joueur créé:`, this._joueurs[item]);
            }
            console.log("[BoiteRadar.getData] Boucle joueurs terminée.");
        }
        if(data.hasOwnProperty("alliances")){
            for(let item in data.alliances){
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
    async toJSON()
    {
        let json = {}, joueurs = {}, alliances = {};
        for(let j in this._joueurs) {
            const joueur = this._joueurs[j];
            joueurs[j] = {
                pseudo: await joueur.lireParametre("pseudo"),
                id: joueur.id,
                x: joueur.x,
                y: joueur.y,
                mv: joueur.mv,
                terrain: joueur.terrain,
                ordreRadar: joueur.ordreRadar
            };
        } 
        for(let a in this._alliances) alliances[a] = JSON.parse(JSON.stringify(this._alliances[a], ["tag", "terrain", "ordreRadar"]));
        // si on a des joueurs sous surveillance on ajoute à l'objet
        if(Object.keys(joueurs).length) json["joueurs"] = joueurs;
        // si on a des alliances sous surveillance on ajoute à l'objet
        if(Object.keys(alliances).length) json["alliances"] = alliances;
        return json;
    }
    /**
    *
    */
    async sauvegarder()
    {
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
	async afficher()
	{
        // si il y a des joueurs ou des alliances surveillés on affiche la boite
        if(Object.keys(this._joueurs).length || Object.keys(this._alliances).length){
            // Modification de la boite compte plus pour faire apparaitre la boite radar
            $("#boiteComptePlus .titre_colonne_cliquable").replaceWith(() => {return `<div class='titre_colonne_cliquable'>${IMG_FLECHE} <span class='titre_compte_plus'>Outiiil ${VERSION.substring(0, 2)}<span class='reduce'>${VERSION.substring(2)}</span></span> ${IMG_FLECHE}</div>`;});
            // Event sur le titre si on utilise le radar
            $("#boiteComptePlus .titre_colonne_cliquable").click((e) => {
                if($(e.currentTarget).next().find("table:visible").attr("id"))
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
	async actualiser()
	{
        let affiche = localStorage.getItem("outiiil_boiteActive"), html = `<table id='o_radar' ${!affiche || affiche == "C" ? `style="display:none"` : ""}><tbody></tbody></table>`;
        // on remplace le contenu ou l'ajoute
        if($("#o_radar").length)
            $("#o_radar").replaceWith(html);
        else{
            $("#boiteComptePlus .contenu_boite_compte_plus table").after(html);
            $("#o_radar tbody").sortable({
                placeholder : "o_radarPlaceholder",
                update : (e, ui) => {
                    this.calculeOrdre($("#o_radar tbody").sortable("serialize"));
                }
            });
        }
        // Event pour mettre à jour les données d'un joueur ou une alliance
        $("#o_radar").off();
        // affichage des elements
        let cptElt = 0, j = 1, ordreCourant = 0;
        console.log("[BoiteRadar.actualiser] Début de l'actualisation. Joueurs:", this._joueurs, "Alliances:", this._alliances);
        while(cptElt < Object.keys(this._joueurs).length + Object.keys(this._alliances).length){
            for(let joueur in this._joueurs)
                if(this._joueurs[joueur].ordreRadar == ordreCourant){
                    console.log(`[BoiteRadar.actualiser] Appel getLigneRadar pour joueur: ${joueur}, ordre: ${ordreCourant}`);
                    await this._joueurs[joueur].getLigneRadar(this, "#o_radar", j++);
                    cptElt++;
                }
            for(let alliance in this._alliances)
                if(this._alliances[alliance].ordreRadar == ordreCourant){
                    console.log(`[BoiteRadar.actualiser] Appel getLigneRadar pour alliance: ${alliance}, ordre: ${ordreCourant}`);
                    await this._alliances[alliance].getLigneRadar(this, "#o_radar", j++);
                    cptElt++;
                }
            ordreCourant++;
        }
        console.log("[BoiteRadar.actualiser] Fin de l'actualisation.");
        return this;
	}
}
