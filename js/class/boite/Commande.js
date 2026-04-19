/*
 * BoiteCommande.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe permettant d'ajouter et modifier une commande.
*
* @class BoiteCommande
* @constructor
* @extends Boite
*/
class BoiteCommande extends Boite {
    constructor(commande, page) {
        super("o_boiteCommande" + commande.idSujet, "Commander des ressources");
        /**
        * @type {Commande} Instance de la commande (ObjetForum)
        */
        this._commande = commande;
        /**
        * @type {Page} Instance de la page Commerce
        */
        this._page = page;
        /**
        * @type {boolean} Indique si la commande est nouvelle (pas encore enregistrée)
        */
        this._estNouvelle = !commande.idSujet;
    }
    /**
    * Affiche la boite.
    *
    * @method afficher
    */
    async afficher() {
        if (await super.afficher())
            await this.getForm().then(async () => await this.css().event());
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
        $("input[name='o_dateCommande'], input[name='o_dateApres']").datepicker({ ...DATEPICKER_OPTION, minDate: new Date(), dateFormat: "dd-mm-yy" });

        // Autocomplete des champs en fonction de l'évolution (uniquement pour les nouvelles commandes)
        if (this._estNouvelle) {
            $("#o_form" + await this._commande.idSujet + " select[name='o_evolution']").change(async (e) => {
                let qte = await Utils.calculQuantite(parseInt(e.currentTarget.value));
                $("#o_form" + await this._commande.idSujet + " input[name='o_quantiteNou']").val(numeral(qte[0]).format());
                $("#o_form" + await this._commande.idSujet + " input[name='o_quantiteMat']").val(numeral(qte[1]).format());
            });
        }

        $("#o_form" + await this._commande.idSujet + " input[name^='o_quantite']").on("input", (e) => {
            return $(e.currentTarget).val(numeral($(e.currentTarget).val()).format());
        });

        $("#o_commander" + await this._commande.idSujet).click(async (e) => {
            e.preventDefault();

            // Récupérer les valeurs du formulaire
            const evolution = parseInt($("#o_form" + await this._commande.idSujet + " select[name='o_evolution']").val());
            const nourritureDemandee = numeral($("#o_form" + await this._commande.idSujet + " input[name='o_quantiteNou']").val()).value();
            const materiauxDemandes = numeral($("#o_form" + await this._commande.idSujet + " input[name='o_quantiteMat']").val()).value();
            const dateSouhaiteeStr = $("#o_form" + await this._commande.idSujet + " input[name='o_dateCommande']").val();
            const dateApresStr = $("#o_form" + await this._commande.idSujet + " input[name='o_dateApres']").val();

            // Mettre à jour les paramètres de la commande
            await this._commande.ecrire({
                'Évolution': evolution,
                'Nourriture Demandée': nourritureDemandee,
                'Matériaux Demandés': materiauxDemandes,
                'Date Souhaitée': moment(dateSouhaiteeStr, "DD-MM-YYYY"),
                'Date Après': dateApresStr ? moment(dateApresStr, "DD-MM-YYYY") : null
            });

            // Si c'est une nouvelle commande, définir les paramètres initiaux
            if (this._estNouvelle) {
                await this._commande.ecrire({
                    'Demandeur': await monProfilJoueur.lire('Pseudo'),
                    'Date Commande': moment()
                });
            }

            // Valider la commande
            let message = await this._commande.estValide();
            if (!message) {
                try {
                    // Enregistrer sur le forum via le framework
                    await this._commande.enregistrerSurForum();

                    if (this._estNouvelle) {
                        $.toast({ ...TOAST_SUCCESS, text: "Commande ajoutée avec succès." });
                    } else {
                        $.toast({ ...TOAST_INFO, text: "Commande mise à jour avec succès." });
                    }

                    // Actualiser l'affichage via GererCommandes
                    const gestionCommandes = this._commande.fonctionnaliteCreatrice;
                    if (gestionCommandes) {
                        await gestionCommandes.actualiserCommandes();
                    }

                    this.masquer();
                } catch (error) {
                    console.error("[BoiteCommande] Erreur lors de l'enregistrement:", error);
                    $.toast({
                        ...TOAST_ERROR,
                        text: `Une erreur est survenue lors de ${this._estNouvelle ? "l'ajout" : "la mise à jour"} de la commande.`
                    });
                }
            } else {
                $.toast({ ...TOAST_ERROR, text: message });
            }
            return false;
        });
        return this;
    }
    /**
    * Génère le formulaire de la boite.
    *
    * @private
    * @method getForm
    */
    async getForm() {
        // Récupérer les paramètres actuels de la commande de manière asynchrone
        const donneesCommande = await this._commande.lire([
            'Évolution',
            'Nourriture Demandée',
            'Matériaux Demandés',
            'Date Souhaitée',
            'Date Après'
        ]);

        const evolution = donneesCommande['Évolution'] || 0;
        const nourritureDemandee = donneesCommande['Nourriture Demandée'] || 0;
        const materiauxDemandes = donneesCommande['Matériaux Demandés'] || 0;
        const dateSouhaite = moment.isMoment(donneesCommande['Date Souhaitée']) ? donneesCommande['Date Souhaitée'].format("DD-MM-YYYY") : (donneesCommande['Date Souhaitée'] || "");
        const dateApres = moment.isMoment(donneesCommande['Date Après']) ? donneesCommande['Date Après'].format("DD-MM-YYYY") : (donneesCommande['Date Après'] || "");

        // Générer les options d'évolution
        let select = "";
        let qte = await Utils.calculQuantite(evolution);
        for (let i = 0; i < EVOLUTION.length; i++) {
            select += `<option value="${i}" ${i == evolution ? "selected" : ""}>${EVOLUTION[i]}</option>`;
        }

        $("#" + this._id).append(`<div class="o_commandeForm"><form id="o_form${await this._commande.idSujet}">
            <div class="group"><select name="o_evolution" class="o_input" required>${select}</select><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Evolution</label></div>
            <div class="group"><input name="o_quantiteNou" class="o_input" type="text" value="${nourritureDemandee}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Nourriture</label></div>
            <div class="group"><input name="o_quantiteMat" class="o_input" type="text" value="${materiauxDemandes}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Materiaux</label></div>
            <div class="group"><input name="o_dateCommande" class="o_input" type="text" value="${dateSouhaite}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Pour le*</label></div>
            <div class="group"><input name="o_dateApres" class="o_input" type="text" value="${dateApres}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>&Agrave; Partir du</label></div>
            <br/><button id="o_commander${await this._commande.idSujet}" name="o_btnCommande" class="o_button f_success">Commander</button>
            </form></div>`);
        return this;
    }
}
