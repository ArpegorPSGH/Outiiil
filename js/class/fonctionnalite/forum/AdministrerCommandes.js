/*
 * AdministrerCommandes.js
 * Hraesvelg
 **********************************************************************/

/**
 * Fonctionnalité d'alliance : Ajout des boutons de changement d'état massif pour les commandes.
 *
 * @class AdministrerCommandes
 * @extends {FonctionnaliteAlliance}
 */
Utils.register(class AdministrerCommandes extends FonctionnaliteAlliance {

    static ABREVIATIONS_HISTORY = ['ACF'];

    static NIVEAU_DROIT_OUTIIIL_REQUIS = 'A';

    static NIVEAU_DROIT_FOURMIZZZ_REQUIS = 'Administrer le forum';

    /**
     * @returns {Promise<void>}
     */
    async run() {
        const elementActive = $j("#alliance").find("span[class^='forum'][class$='ligne_paire']");
        const estSurCommandesOutiiil = elementActive.html() === "Commandes Outiiil";

        if (estSurCommandesOutiiil) {
            // on verifie si on n'est pas dans un sujet mais bien sur la liste des topics
            if ($j("#form_cat").length && !$j("#o_afficherEtat").length && $j("img[src='images/icone/outil.gif']").length) {
                let options = "";
                for (let etat in ETAT_COMMANDE) options += `<option value="${ETAT_COMMANDE[etat]}">${etat}</option>`;
                $j("#form_cat td:last")
                    .prepend(`<img class="cursor" id="o_afficherEtat" src="${IMG_CHANGE}" height="16" alt="changer" title="Changer l'etat des commandes selectionnées"/>`)
                    .append(`<select id="o_selectEtatCommande" style="display:none;">${options}</select> <button type="button" id="o_changerEtat" style="display:none;">Modifier l'état</button>`);
                $j("#o_afficherEtat").click((e) => { $j("#o_changerEtat, #o_selectEtatCommande").toggle(); });
                $j("#o_changerEtat").click((e) => {
                    if (!$j("#form_cat tr:gt(0) input[name='topic[]']:checked").length) {
                        e.stopImmediatePropagation();
                        return false;
                    }
                });
                $j("#o_changerEtat").onActionSecurisee('click', this, async (e) => {
                    let promiseCmdModif = new Array();
                    $j("#form_cat tr:gt(0)").each((i, elt) => {
                        // si la commande est selectionnée
                        if ($j(elt).find("input[name='topic[]']:checked").length) {
                            let id = $j(elt).find("input[name='topic[]']").val();
                            if (id) {
                                let commande = new Commande(this);
                                commande.idSujet = parseInt(id, 10);
                                promiseCmdModif.push((async () => {
                                    await commande.rafraichir(false);
                                    await commande.ecrire('État', $j("#o_selectEtatCommande").val());
                                    return commande.enregistrerSurForum();
                                })());
                            }
                        }
                    });
                    await Promise.all(promiseCmdModif);
                    $j.toast({ ...TOAST_SUCCESS, text: promiseCmdModif.length > 1 ? "Commandes mises à jour avec succès." : "Commande mise à jour avec succès." });
                    return false;
                });
            }
        }
    }
});
