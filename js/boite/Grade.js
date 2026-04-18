/*
 * BoiteGrade.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe permettant de modifier le grade d'un membre sur l'utilitaire.
*
* @class BoiteGrade
* @constructor
* @extends Boite
*/
class BoiteGrade extends Boite {
    constructor(joueur, page, joueurId) {
        super("o_boiteGrade" + joueurId, "Attribuer un grade", "");
        /**
        *
        */
        this._joueur = joueur;
        /**
        *
        */
        this._page = page;
    }
    /**
    * Affiche la boite.
    *
    * @method afficher
    */
    async afficher() {
        const grade = await this._joueur.lire('Grade');
        console.log('grade boite: ', grade)
        const ordreGrade = await this._joueur.lire('Ordre Grade');
        const pseudo = await this._joueur.lire('Pseudo');

        this._content = `<form id="o_form${await this._joueur.lire('Id')}" class="o_rangForm">
            <div class="group"><input id="o_libGrade${await this._joueur.lire('Id')}" name="o_rang" type="text" class="o_input" value="${grade}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Grade de ${pseudo}</label></div>
            <div class="group"><input id="o_ordGrade${await this._joueur.lire('Id')}" name="o_ordre" class="o_input" type="text" value="${ordreGrade}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Prioritè du grade</label></div><br/>
            <button name="o_btnGrade" class="o_button f_success">Valider</button>
            </form>`;

        if (await super.afficher())
            await this.css().event();
        return this;
    }
    /**
    * Applique le style propre à la boite.
    *
    * @private
    * @method css
    */
    css() {
        super.css();
        return this;
    }
    /**
    * Ajoute les evenements propres à la boite.
    *
    * @private
    * @method event
    */
    async event() {
        super.event();
        $("#o_form" + await this._joueur.lire('Id') + " button[name='o_btnGrade']").click(async (e) => {
            e.preventDefault();
            try {
                // on sauvegarde le grade du joueur
                await this._joueur.ecrire('Grade', $("#o_libGrade" + await this._joueur.lire('Id')).val());
                await this._joueur.ecrire('Ordre Grade', $("#o_ordGrade" + await this._joueur.lire('Id')).val());
                console.log('step 1 ');
                // mise a jour de forum
                await this._joueur.enregistrerSurForum();
                console.log('step 2');
                const fonctionnaliteDonneesPrivees = new FonctionnaliteDonneesPrivees(this._page);
                console.log('step 3');
                await fonctionnaliteDonneesPrivees.init();
                $.toast({ ...TOAST_INFO, text: "Mise à jour correctement effectuée." });
            }
            catch (err) {
                $.toast({ ...TOAST_ERROR, text: "Une erreur réseau a été rencontrée lors de la mise à jour des membres de l'alliance." });
                console.error(err)
            }
            this.masquer();
            return false;
        });
        return this;
    }
}
