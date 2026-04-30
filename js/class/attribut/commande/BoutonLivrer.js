class BoutonLivrer extends AttributObjet {
    static SORTABLE_PAR_DEFAUT = false;
    static NOM_AFFICHAGE = ['Livrer'];

    /**
     * Génère le bouton de livraison selon les conditions
     * @param {boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes
     * @returns {Promise<string>} HTML du bouton ou chaîne vide
     */
    async calculerValeur(peutVoirDonneesRestreintes) {
        const dateApres = await this.objetParent.lire('Date Après', peutVoirDonneesRestreintes);
        const etat = await this.objetParent.lire('État', peutVoirDonneesRestreintes);
        const apres = !dateApres || moment().isSameOrAfter(moment(dateApres));

        if (apres && etat == ETAT_COMMANDE["En cours"]) {
            const $btn = $(`<a id='o_commande${this.objetParent.idSujet}' href=''><img src='${IMG_LIVRAISON}' alt='livrer'/></a>`);
            $btn.on('click', async (e) => {
                e.preventDefault();
                const constructions = await monProfilJoueur.lire('Niveaux Constructions');
                const transportCapacity = Math.floor((Utils.ouvrieres - Utils.terrain) * (10 + (constructions[11] / 2)));
                const materiauxRestants = await this.objetParent.lire('Matériaux Restants');
                const nourritureRestante = await this.objetParent.lire('Nourriture Restante');

                let materialsToPrefill = Math.min(materiauxRestants, transportCapacity);
                let nourishmentToPrefill = Math.min(nourritureRestante, transportCapacity - materialsToPrefill);

                $("#input_nbMateriaux").val(numeral(materialsToPrefill).format());
                $("#nbMateriaux").val(materialsToPrefill);
                $("#input_nbNourriture").val(numeral(nourishmentToPrefill).format());
                $("#nbNourriture").val(nourishmentToPrefill);
                $("#pseudo_convoi").val(await this.objetParent.lire('Demandeur'));
                $("#o_idCommande").val(this.objetParent.idSujet);
                $("html").animate({ scrollTop: 0 }, 600);
                return false;
            });
            return $btn;
        }
        return "";
    }
}
