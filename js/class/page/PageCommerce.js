/**
 * PageCommerce.js
 * Classe de page pour /commerce.php, utilisant le nouveau framework.
 */
class PageCommerce extends Page {
    /**
     * Liste des fonctionnalités à exécuter sur cette page.
     * L'ordre dicte l'ordre d'exécution.
     */
    static FONCTIONNALITES = [
        this.prototype.ajouterInfosEtable,
        this.prototype.ajouterBoutonsArrondi,
        this.prototype.plus,
        GestionCommandes,
        AffichageConvois
    ];

    /**
     * Ajoute les informations sur l'étable.
     */
    async ajouterInfosEtable() {
        let constructions = await monProfilJoueur.niveauConstruction;
        $("form table").append(`<tr class='centre'><td colspan=6>Info : Niveau d'étable <strong>${constructions[11]}</strong>, 1 ouvrière peut transporter : <strong>${(10 + (constructions[11] / 2))}</strong> ressources.</td></tr>`);
    }

    /**
     * Ajoute les boutons pour arrondir les quantités.
     */
    async ajouterBoutonsArrondi() {
        // Chargement unique de niveauConstruction avant l'attachement des handlers
        const constructions = await monProfilJoueur.niveauConstruction;
        const transportCapacity = 10 + (constructions[11] / 2);

        // Bouton arrondir nourriture
        $("#bouton_nourriture_max").html(`Nourriture donnée <span id="o_arrondirNou" class="gras small">arrondir...</span>`);
        $("#o_arrondirNou").click((e) => {
            e.preventDefault();
            const value = Math.floor($("#nbNourriture").val());
            const nbMat = Math.floor($("#nbMateriaux").val());
            const newValue = Utils.arrondiQuantite(value);
            $("#input_nbNourriture").val(numeral(newValue).format());
            $("#nbNourriture").val(newValue);
            $("#input_nbOuvriere").val(numeral(Math.floor((newValue + nbMat) / transportCapacity)).format());
            $("#nbOuvriere").val(Math.floor((newValue + nbMat) / transportCapacity));
            return false;
        });

        // Bouton arrondir matériaux
        $("#bouton_materiaux_max").html(`Matériaux donnés <span id="o_arrondirMat" class="gras small">arrondir...</span>`);
        $("#o_arrondirMat").click((e) => {
            e.preventDefault();
            const value = Math.floor($("#nbMateriaux").val());
            const nbNou = Math.floor($("#nbNourriture").val());
            const newValue = Utils.arrondiQuantite(value);
            $("#input_nbMateriaux").val(numeral(newValue).format());
            $("#nbMateriaux").val(newValue);
            $("#input_nbOuvriere").val(numeral(Math.floor((newValue + nbNou) / transportCapacity)).format());
            $("#nbOuvriere").val(Math.floor((newValue + nbNou) / transportCapacity));
            return false;
        });
    }

    /**
     * Fonctionnalité Compte+ : affiche les retours et sauvegarde les convois.
     */
    plus() {
        if (Utils.comptePlus) return;

        // Autocomplete sur le champ pseudo
        $("#pseudo_convoi").autocomplete({
            source: (request, response) => {
                Joueur.rechercher(request.term).then((data) => {
                    response(Utils.extraitRecherche(data, true, false));
                });
            },
            position: { my: "left top-5", at: "left bottom" },
            delay: 0,
            minLength: 3
        });

        // Sauvegarde des convois
        const listeConvoi = [];
        $("#centre > strong").each((i, elt) => {
            // Affichage du retour des convois
            if ($(elt).next().text().indexOf("Retour") == -1) {
                const tempsRestant = Utils.timeToInt($(elt).text().split("dans")[1].trim());
                $(elt).after(`<span class='small'>- Retour le ${Utils.roundMinute(tempsRestant).format("D MMM YYYY à HH[h]mm")}</span>`);
            }
            const nombres = $(elt).text().replace(/ /g, '').split("dans")[0].match(/^\d+|\d+\b|\d+(?=\w)/g);
            if (nombres) {
                const convoiData = {
                    "cible": $(elt).find("a").text(),
                    "sens": $(elt).text().includes("livrer"),
                    "nou": nombres[0],
                    "mat": nombres[1],
                    "exp": moment().add(Utils.timeToInt($(elt).text().split("dans")[1].trim()), 's')
                };
                listeConvoi.push(convoiData);
            }
        });

        // Tri par ordre d'arrivée
        listeConvoi.sort((a, b) => moment(a.exp).diff(moment(b.exp)));
        this.saveConvoi(listeConvoi);
    }

    /**
     * Sauvegarde les convois pour la boite compte+.
     */
    saveConvoi(liste) {
        if (boiteComptePlus) {
            boiteComptePlus.convoi = liste;
            boiteComptePlus.startConvoi = moment();
            boiteComptePlus.sauvegarder().majConvoi();
        }
    }
}
