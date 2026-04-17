/*
 * Reine.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe de fonction pour la page /reine.php.
*
* @class PageReine
* @constructor
* @extends Page
*/
Utils.register(class PageReine extends Page {

    static URIs = "/Reine.php";

    static FONCTIONNALITES = [
        this.prototype.afficherFinPontes,
        this.prototype.ajouterStatistiqueUnite,
        this.prototype.switchInput,
        this.prototype.gestionTempsPonte,
        this.prototype.gestionNourriturePonte,
        this.prototype.savePonteEnCours
    ];

    async afficherFinPontes() {
        if (Utils.comptePlus) return;
        // Affichage de la fin des pontes
        $(".tableau_leger tr:eq(0)").append("<td><strong>Terminé le</strong></td>");
        $(".tableau_leger tr:gt(0)").each((i, elt) => { $(elt).append(`<td>${Utils.roundMinute($(elt).next().text().split(",")[0].split("(")[1]).format("D MMM YYYY à HH[h]mm")}</td>`); });
        $("span[id^='bouton_cout_nombre'], span[id^='bouton_cout_temps'], span[id^='bouton_cout_nourriture'], .icones_unite").addClass("cliquable3");
        $(".icones_unite").attr("onclick", "$('.tab_stat').toggle();");
    }

    async ajouterStatistiqueUnite() {
        if (Utils.comptePlus) return;
        // Ajout des statistiques des unités avec bonus
        $(".icones_unite").each(async (i, elt) => {
            let index = NOM_UNITE.indexOf($(elt).parent().find("h2").text());
            let recherches = await monProfilJoueur.niveauRecherche;
            $(elt).append(`<table class="tab_stat" style="display: none;"><tbody><tr><td style="text-align:center;font-size:0.8em;height:30px;" colspan="2"> Avec Bonus</td></tr><tr title="Vie avec Bouclier niveau ${recherches[1]}"><td class="icone_vie" style="position:relative; top:4px">${IMG_VIE}</td><td class="vie" style="white-space:nowrap">${(VIE_UNITE[index] + (VIE_UNITE[index] / 10 * recherches[1]).toFixed(1) / 1)}</td></tr><tr title="Dégâts en Attaque avec Armes niveau ${recherches[2]}"><td class="icone_degat_attaque" style="position:relative;top:3px">${IMG_ATT}</td><td class="degat_defense" style="white-space:nowrap">${(ATT_UNITE[index] + (ATT_UNITE[index] / 10 * recherches[2]).toFixed(1) / 1)}</td></tr><tr title="Dégâts en Défense avec Armes niveau ${recherches[2]}"><td class="icone_degat_defense" style="position:relative;top:3px">${IMG_DEF}</td><td class="degat_defense" style="white-space:nowrap">${(DEF_UNITE[index] + (DEF_UNITE[index] / 10 * recherches[2]).toFixed(1) / 1)}</td></tr><tr><td style="height:30px;" colspan="2"></td></tr></tbody></table>`);
        });
    }

    async switchInput() {
        if (Utils.comptePlus) return;
        // Switch entre les inputs
        let element = ["cout_nombre", "cout_temps", "cout_nourriture"];
        for (let i = 0; i < 3; i++) {
            $("span[id^='bouton_" + element[i] + "']").click((e) => {
                let j = $(e.currentTarget).attr("id").match(/\d+/) ? $(e.currentTarget).attr("id").match(/\d+/) : "";

                $("#input_" + element[i] + j).val($("#" + element[i] + j).text());
                $("#input_" + element[i] + j).show();

                $("#" + element[(i + 1) % 3] + j + ", #" + element[(i + 2) % 3] + j).css("display", "inline-block");
                $("#" + element[i] + j + ", #input_" + element[(i + 1) % 3] + j + ", #input_" + element[(i + 2) % 3] + j).hide();
            });
        }
    }

    async gestionTempsPonte() {
        if (Utils.comptePlus) return;
        // Gestion du temps pour la ponte
        $("span[id^='bouton_cout_temps']").each((i, elt) => { $(elt).append(`<input id="input_cout_temps${(i == 0 ? "" : i)}" class="tooltip_droite" type="text" style="height: 20px; width: 85px;display:none;" title="Ex: 1.5 jour, 1j 12h, 36h" value="${$(elt).find("span[id^='cout_temps']").text()}"/>`); });
        $("input[id^='input_cout_temps']").on("input", async (e) => {
            let i = $(e.currentTarget).attr("id").match(/\d+/) ? $(e.currentTarget).attr("id").match(/\d+/) : "",
                nombre = parseInt(Utils.timeToInt(e.currentTarget.value) / (TEMPS_UNITE[(i == "" ? 0 : i)] * Math.pow(0.9, await monProfilJoueur.getTDP())));
            $("#cout_nombre" + i).text(numeral(nombre).format());
            $("#nombre_de_ponte" + i).attr("value", nombre);
            $("#cout_temps" + i).text(e.currentTarget.value);
            $("#cout_nourriture" + i).text(numeral(nombre * COUT_UNITE[(i == "" ? 0 : i)]).format("0 a"));
        });
    }

    async gestionNourriturePonte() {
        if (Utils.comptePlus) return;
        // Gestion de la consommation pour la ponte
        $("span[id^='bouton_cout_nourriture']").each((i, elt) => { $(elt).append(`<input id="input_cout_nourriture${(i == 0 ? "" : i)}" class="tooltip_droite" type="tel" style="height: 20px; width: 85px; display: none;" title="Ex: 100 000, 100k, 0.1M" value="${$(elt).find("span[id^='cout_nourriture']").text()}"/>`); });
        $("input[id^='input_cout_nourriture']").on("input", async (e) => {
            let i = $(e.currentTarget).attr("id").match(/\d+/) ? $(e.currentTarget).attr("id").match(/\d+/) : "",
                nombre = Math.floor(numeral(e.currentTarget.value).value() / COUT_UNITE[(i == "" ? 0 : i)]);
            $("#cout_nombre" + i).text(numeral(nombre).format());
            $("#nombre_de_ponte" + i).attr("value", nombre);
            $("#cout_temps" + i).text(Utils.intToTime((nombre * (TEMPS_UNITE[(i == "" ? 0 : i)] * Math.pow(0.9, await monProfilJoueur.getTDP()))), nombre));
            $("#cout_nourriture" + i).text(e.currentTarget.value);
        });
    }
    /**
    * Modifie les champs de saisie, sauvegarde la ponte en cours.
    * @method plus
    */
    async savePonteEnCours() {
        if (Utils.comptePlus) return;
        // Sauvegarde de la ponte en cours
        let listePonte = new Array();
        for (let i = 1, l = $(".tableau_leger:eq(0) tr").length; i < l; i++) {
            let unite = $(".tableau_leger:eq(0) tr:eq(" + i + ") td:eq(0)").text().replace(/[0-9]+/g, '').trim(),
                nombre = parseInt($(".tableau_leger:eq(0) tr:eq(" + i + ") td:eq(0)").text().replace(/\D+/g, '')),
                temps = Utils.timeToInt($(".tableau_leger:eq(0) tr:eq(" + i + ") td:eq(3)").text());
            listePonte.push({ "unite": unite.substr(0, 1).toUpperCase() + unite.substr(1), "nombre": nombre, "exp": moment().add(temps, 's') });
        }
        await this.savePonte(listePonte);
    }
    /**
    * Sauvegarde la ponte en cours.
    * @method savePonte
    */
    async savePonte(listePonte) {
        boiteComptePlus.ponte = listePonte;
        boiteComptePlus.startPonte = moment();
        await boiteComptePlus.sauvegarder().majPonte();
        return this;
    }
})
