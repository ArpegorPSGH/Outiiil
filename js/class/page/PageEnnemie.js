/*
 * Description.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe de fonction pour la page /ennemie.php.
*
* @class PageEnnemie
* @constructor
*/
Utils.register(class PageEnnemie extends Page {
    static URIs = { href: "/ennemie.php", search: "" };


    static FONCTIONNALITES = [
        this.prototype.ajouterTemps
    ];

    /**
     * Ajoute les temps de trajet au tableau des ennemies.
     * @returns {Promise<void>}
     */
    async ajouterTemps() {
        // Affichage des temps de trajet
        $("#tabEnnemie tr:eq(0) th:eq(5)").after("<th class='centre'>Temps</th>");
        $("#tabEnnemie tr:gt(0)").each(async (i, elt) => {
            let distance = parseInt($(elt).find("td:eq(5)").text());
            let recherches = await monProfilJoueur.niveauRecherche;
            $(elt).find("td:eq(5)").after(`<td class='centre'>${Utils.intToTime(Math.ceil(Math.pow(0.9, recherches[6]) * 637200 * (1 - Math.exp(-(distance / 350)))))}</td>`);
        });
    }
})
