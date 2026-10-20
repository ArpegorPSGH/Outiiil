/**
 * Commerce.js
 * Classe de page pour /commerce.php, utilisant le nouveau framework.
 */
Utils.register(class Commerce extends Page {
    static URIs = "/commerce.php";

    /**
     * Liste des fonctionnalités à exécuter sur cette page.
     * L'ordre dicte l'ordre d'exécution.
     */
    static FONCTIONNALITES = [
        this.prototype.ajouterInfosEtable,
        this.prototype.ajouterBoutonsArrondi,
        this.prototype.plus,
        GererCommandes,
        AfficherConvois
    ];

    /**
     * Ajoute les informations sur l'étable.
     */
    async ajouterInfosEtable() {
        let constructions = await monProfilJoueur.lire('Niveaux Constructions');
        $j("form table").append(`<tr class='centre'><td colspan=6>Info : Niveau d'étable <strong>${constructions[11]}</strong>, 1 ouvrière peut transporter : <strong>${(10 + (constructions[11] / 2))}</strong> ressources.</td></tr>`);
    }

    /**
     * Ajoute les boutons pour arrondir les quantités.
     */
    async ajouterBoutonsArrondi() {
        // Chargement unique de niveauxConstructions avant l'attachement des handlers
        const constructions = await monProfilJoueur.lire('Niveaux Constructions');
        const transportCapacity = 10 + (constructions[11] / 2);

        // Bouton arrondir nourriture
        $j("#bouton_nourriture_max").html(`Nourriture donnée <span id="o_arrondirNou" class="gras small">arrondir...</span>`);
        $j("#o_arrondirNou").click((e) => {
            e.preventDefault();
            const value = Math.floor($j("#nbNourriture").val());
            const nbMat = Math.floor($j("#nbMateriaux").val());
            const newValue = Utils.arrondiQuantite(value);
            $j("#input_nbNourriture").val(numeral(newValue).format());
            $j("#nbNourriture").val(newValue);
            $j("#input_nbOuvriere").val(numeral(Math.floor((newValue + nbMat) / transportCapacity)).format());
            $j("#nbOuvriere").val(Math.floor((newValue + nbMat) / transportCapacity));
            return false;
        });

        // Bouton arrondir matériaux
        $j("#bouton_materiaux_max").html(`Matériaux donnés <span id="o_arrondirMat" class="gras small">arrondir...</span>`);
        $j("#o_arrondirMat").click((e) => {
            e.preventDefault();
            const value = Math.floor($j("#nbMateriaux").val());
            const nbNou = Math.floor($j("#nbNourriture").val());
            const newValue = Utils.arrondiQuantite(value);
            $j("#input_nbMateriaux").val(numeral(newValue).format());
            $j("#nbMateriaux").val(newValue);
            $j("#input_nbOuvriere").val(numeral(Math.floor((newValue + nbNou) / transportCapacity)).format());
            $j("#nbOuvriere").val(Math.floor((newValue + nbNou) / transportCapacity));
            return false;
        });
    }

    /**
     * Fonctionnalité Compte+ : affiche les retours et sauvegarde les convois.
     */
    plus() {
        if (Utils.comptePlus) return;

        // Autocomplete sur le champ pseudo
        $j("#pseudo_convoi").autocomplete({
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
        $j("#centre > strong").each((i, elt) => {
            // Affichage du retour des convois
            if ($j(elt).next().text().indexOf("Retour") == -1) {
                const tempsRestant = Utils.timeToInt($j(elt).text().split("dans")[1].trim());
                $j(elt).after(`<span class='small'>- Retour le ${Utils.roundMinute(tempsRestant).format("D MMM YYYY à HH[h]mm")}</span>`);
            }
            const nombres = $j(elt).text().replace(/ /g, '').split("dans")[0].match(/^\d+|\d+\b|\d+(?=\w)/g);
            if (nombres) {
                const convoiData = {
                    "cible": $j(elt).find("a").text(),
                    "sens": $j(elt).text().includes("livrer"),
                    "nou": nombres[0],
                    "mat": nombres[1],
                    "exp": moment().add(Utils.timeToInt($j(elt).text().split("dans")[1].trim()), 's')
                };
                listeConvoi.push(convoiData);
            }
        });

        // Tri par ordre d'arrivée
        listeConvoi.sort((a, b) => moment(a.exp).diff(moment(b.exp)));
        this.#saveConvoi(listeConvoi);
    }

    /**
     * Sauvegarde les convois pour la boite compte+.
     * @private
     */
    #saveConvoi(liste) {
        if (boiteComptePlus) {
            boiteComptePlus.convoi = liste;
            boiteComptePlus.startConvoi = moment();
            boiteComptePlus.sauvegarder().majConvoi();
        }
    }
})
