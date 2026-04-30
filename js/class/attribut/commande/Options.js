class Options extends AttributObjet {
    static SORTABLE_PAR_DEFAUT = false;
    static NOM_AFFICHAGE = ['Options'];

    /**
     * Génère les boutons modifier/supprimer selon droits
     * @param {boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes
     * @returns {Promise<string>} HTML des boutons ou chaîne vide
     */
    async calculerValeur(peutVoirDonneesRestreintes) {
        const demandeur = await this.objetParent.lire('Demandeur', peutVoirDonneesRestreintes);
        const pseudoActuel = await monProfilJoueur.lire('Pseudo');

        if (demandeur == pseudoActuel) {
            const $modifier = $(`<a id='o_modifierCommande${this.objetParent.idSujet}' href=''><img src='${IMG_CRAYON}' alt='modifier'/></a>`);
            const $supprimer = $(`<a id='o_supprimerCommande${this.objetParent.idSujet}' href=''><img src='${IMG_CROIX}' alt='supprimer'/></a>`);

            $modifier.on('click', async (e) => {
                e.preventDefault();
                let boiteCommande = new BoiteCommande(this.objetParent, this.objetParent.fonctionnaliteCreatrice.page);
                await boiteCommande.afficher();
                return false;
            });

            $supprimer.on('click', async (e) => {
                e.preventDefault();
                if (confirm("Supprimer cette commande ?")) {
                    await this.objetParent.ecrire('État', ETAT_COMMANDE.Supprimée);
                    await this.objetParent.enregistrerSurForum();
                    $.toast({ ...TOAST_INFO, text: "Commande supprimée avec succès." });
                    if (this.objetParent.fonctionnaliteCreatrice && typeof this.objetParent.fonctionnaliteCreatrice.actualiserCommandes === 'function') {
                        await this.objetParent.fonctionnaliteCreatrice.actualiserCommandes();
                    }
                }
                return false;
            });

            return $('<span></span>').append($modifier, " ", $supprimer);
        }
        return "";
    }
}
