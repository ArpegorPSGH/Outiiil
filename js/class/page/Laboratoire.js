/*
 * Laboratoire.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe de fonction pour la page /laboratoire.php.
*
* @class Laboratoire
* @constructor
*/
Utils.register(class Laboratoire extends Page {
    static URIs = "/laboratoire.php";


    static FONCTIONNALITES = [
        this.prototype.chargerRecherche,
        this.prototype.titleBouclier,
        this.prototype.titleArmes,
        this.prototype.plus,
    ];
    /**
    *
    */
    async chargerRecherche() {
        // verification des niveaux
        let niveau = new Array(10);
        let recherches = await monProfilJoueur.lire('Niveaux Recherches');
        $(".ligneAmelioration").each((i, elt) => { niveau[i] = parseInt($(elt).find(".niveau_amelioration").text().split(" ")[1]); });
        if (niveau.join(",") != recherches.join(",")) {
            recherches = niveau;
            await monProfilJoueur.ecrire("Niveaux Recherches", recherches);
            await monProfilJoueur.enregistrerLocalStorage();
        }
    }
    /**
    * Ajoute un title detaillé pour connaitre la rentabilité du niveau bouclier.
    *
    * @private
    * @method titleBouclier
    */
    async titleBouclier() {
        let recherches = await monProfilJoueur.lire('Niveaux Recherches');
        let armee = await monProfilJoueur.lire('Armée');
        let vieAB = armee.getBaseVie() + armee.getBonusVie(recherches[1]);
        let tOuv = numeral($(".ligneAmelioration:eq(1)").find(".ouvriere").text()).value() * (TEMPS_UNITE[0] * Math.pow(0.9, await monProfilJoueur.getTDP()));
        let apportPonte = Math.round(parseInt(tOuv / (TEMPS_UNITE[1] * Math.pow(0.9, await monProfilJoueur.getTDP()))) * (8 + 8 * recherches[1] / 10));
        let vieABSupp = armee.getBaseVie() + armee.getBonusVie(recherches[1] + 1);
        let bLigneGras = vieAB + apportPonte >= vieABSupp ? true : false;
        let title = `<table>
            <tr><td>Vie AB actuelle</td><td class='right'>${numeral(vieAB).format()}</td></tr>
            <tr${(bLigneGras ? " class='gras' " : "")}><td>Vie AB + ponte JSN</td><td class='right' style='padding-left:10px'>${numeral(vieAB + apportPonte).format()} (+ ${numeral(apportPonte).format()})</td></tr>
            <tr${(!bLigneGras ? " class='gras' " : "")}><td>Vie AB niveau ${(recherches[1] + 1)}</td><td class='right'>${numeral(vieABSupp).format()} (+ ${numeral(vieABSupp - vieAB).format()})</td></tr>
            </table>`;
        $(".desciption_amelioration:eq(1) h2").attr("title", title).tooltip({
            position: { my: "left+5 top", at: "right top" },
            content: title,
            tooltipClass: "ui-tooltip-brown ui-tooltip-lightBrown"
        });
        return this;
    }
    /**
    * Ajoute un title detaillé pour connaitre la rentabilité du niveau d'armes.
    *
    * @method titleArmes
    */
    async titleArmes() {
        let recherches = await monProfilJoueur.lire('Niveaux Recherches');
        let armee = await monProfilJoueur.lire('Armée');
        let attAB = armee.getTotalAtt(recherches[2]);
        let tOuv = numeral($(".ligneAmelioration:eq(2)").find(".ouvriere").text()).value() * (TEMPS_UNITE[0] * Math.pow(0.9, await monProfilJoueur.getTDP()));
        let apportPonteJS = Math.round(parseInt(tOuv / (TEMPS_UNITE[4] * Math.pow(0.9, await monProfilJoueur.getTDP()))) * (10 + 10 * recherches[1] / 10));
        let apportPonteTk = Math.round(parseInt(tOuv / (TEMPS_UNITE[11] * Math.pow(0.9, await monProfilJoueur.getTDP()))) * (55 + 55 * recherches[1] / 10));
        let attABSupp = armee.getTotalAtt(recherches[2] + 1);
        let bLigneGrasJS = attAB + apportPonteJS >= attABSupp ? true : false;
        let bLigneGrasTk = attAB + apportPonteTk >= attABSupp ? true : false;

        let defAB = armee.getTotalDef(recherches[2]);
        let apportPonteTuE = Math.round(parseInt(tOuv / (TEMPS_UNITE[14] * Math.pow(0.9, await monProfilJoueur.getTDP()))) * (55 + 55 * recherches[1] / 10));
        let defABSupp = armee.getTotalDef(recherches[2] + 1);
        let bLigneGrasTuE = defAB + apportPonteTuE >= defABSupp ? true : false;

        let title = `<table>
            <tr><td>Attaque AB actuelle</td><td class='right'>${numeral(attAB).format()}</td></tr>
            <tr${(bLigneGrasJS ? " class='gras' " : "")}><td>Attaque AB + ponte JS</td><td class='right' style='padding-left:10px'>${numeral(attAB + apportPonteJS).format()} (+ ${numeral(apportPonteJS).format()})</td></tr>
            <tr${(bLigneGrasTk ? " class='gras' " : "")}><td>Attaque AB + ponte Tank</td><td class='right' style='padding-left:10px'>${numeral(attAB + apportPonteTk).format()} (+ ${numeral(apportPonteTk).format()})</td></tr>
            <tr${(!bLigneGrasTk ? " class='gras' " : "")}><td>Attaque AB niveau ${(recherches[2] + 1)}</td><td class='right'>${numeral(attABSupp).format()} (+ ${numeral(attABSupp - attAB).format()})</td></tr></table><hr/><table>
            <tr><td>Défense AB actuelle</td><td class='right'>${numeral(defAB).format()}</td></tr>
            <tr${(bLigneGrasTuE ? " class='gras' " : "")}><td>Défense AB + ponte TuE</td><td class='right' style='padding-left:10px'>${numeral(defAB + apportPonteTuE).format()} (+ ${numeral(apportPonteTuE).format()})</td></tr>
            <tr${(!bLigneGrasTuE ? " class='gras' " : "")}><td>Défense AB niveau ${(recherches[2] + 1)}</td><td class='right'>${numeral(defABSupp).format()} (+ ${numeral(defABSupp - defAB).format()})</td></tr>
            </table>`;
        $(".desciption_amelioration:eq(2) h2").attr("title", title).tooltip({
            position: { my: "left+5 top", at: "right top" },
            content: title,
            tooltipClass: "ui-tooltip-brown ui-tooltip-lightBrown"
        });
        return this;
    }
    /**
    * Sauvegarde la recherche en cours.
    *
    * @private
    * @method plus
    */
    plus() {
        if (Utils.comptePlus) return;
        // Affichage de la fin de la recherche
        if ($("#centre > strong").length)
            $("#centre > strong").after(`<span class='small'> Terminé le ${Utils.roundMinute($("#centre > strong").text().split(',')[0].split('(')[1]).format("D MMM YYYY à HH[h]mm")}</span>`);
        // Sauvegarde de la recherche en cours
        this.saveRecherche();
        // Suppresion de la recherche en cours si on annule
        if ($("a:contains('Je confirme')").length)
            $("a:contains('Je confirme')").click((e) => {
                boiteComptePlus.expRecherche = 0;
                boiteComptePlus.recherche = "";
                boiteComptePlus.startRecherche = 0;
                boiteComptePlus.sauvegarder();
            });
        return this;
    }
    /**
    * Sauvegarde la recherche en cours.
    *
    * @private
    * @method saveRecherche
    * @return
    */
    saveRecherche() {
        let str = $("#centre strong").text();
        let recherche = str.substring(2, str.indexOf("termin") - 1);
        if (recherche && (!boiteComptePlus.recherche || moment().diff(moment(boiteComptePlus.expRecherche), 's') > 0) && !Utils.comptePlus && $("#boiteComptePlus").length) {
            boiteComptePlus.recherche = recherche.substr(0, 1).toUpperCase() + recherche.substr(1);
            boiteComptePlus.expRecherche = moment().add(parseInt(str.split(",")[0].split("(")[1]), 's');
            boiteComptePlus.startRecherche = moment();
            boiteComptePlus.sauvegarder().majRecherche();
        }
        return this;
    }
})
