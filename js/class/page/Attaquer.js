/*
 * Attaquer.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe de fonction pour les pages d'attaques.
*
* @class Attaquer
* @constructor
*/
Utils.register(class Attaquer extends Page {
    static URIs = [{ href: "/ennemie.php?Attaquer" }, { href: "/ennemie.php?annuler" }];


    static FONCTIONNALITES = [
        this.prototype.chargerDonnees,
        this.prototype.ajouterOption,
        this.prototype.formulaireFlood,
        this.prototype.plus
    ];

    constructor() {
        super();
        /**
        * 
        */
        this._nbAttaque = 0;
        /**
        *
        */
        this._cible = new Joueur(null, { donneesInitiales: { Pseudo: $j("input[name=pseudoCible]").val() } });
        /**
        * Armee.
        */
        this._armee = null;
    }

    async chargerDonnees() {
        if ($j("#tabChoixArmee").length) {
            // récupération de l'armée
            this._armee = new Armee({ unite: this.#extraitArmee() });
            this.#majStatistique(this._armee);
            // ajoute event
            $j("input[id^=unite]").on("input", (e) => { this.#majStatistique(); });

            const niveauRecherche = await monProfilJoueur.lire('Niveaux Recherches');
            this._nbAttaque = niveauRecherche[6] + 2 - $j("#centre").text().split(/- Vous allez attaquer|- Des renforts arrivent/g).length;

            // on recupére le profil du joueur pour les coordonnées
            await this._cible.chargerDonneesMembre();
        }
    }
    /**
    * @private
    */
    #extraitArmee() {
        let unites = {};
        $j("input[id^='unite']").each((i, elt) => { unites[$j(elt).parent().parent().find("td:first").text()] = numeral($j(elt).val()).value(); });
        return unites;
    }
    /**
    * Affiche les données de l'armée selectionné.
    *
    * @private
    * @method #majStatistique
    */
    async #majStatistique(armee = null) {
        let recherche = await monProfilJoueur.lire('Niveaux Recherches');
        let tmp = armee ? armee : new Armee({ unite: this.#extraitArmee() }), html = `<table id="o_tableStatArmee" cellspacing=0>
            <tr class="gras centre"><td></td><td>HB</td><td>AB</td></tr>
            <tr><td>${IMG_VIE}</td><td>${numeral(tmp.getBaseVie()).format()}</td><td>${numeral(tmp.getTotalVie(recherche[1])).format()}</td></tr>
            <tr><td>${IMG_ATT}</td><td>${numeral(tmp.getBaseAtt()).format()}</td><td>${numeral(tmp.getTotalAtt(recherche[2])).format()}</td></tr>
            <tr><td>${IMG_DEF}</td><td>${numeral(tmp.getBaseDef()).format()}</td><td>${numeral(tmp.getTotalDef(recherche[2])).format()}</td></tr>
            <tr><td><img alt="Nombre" src="images/icone/fourmi.png" height="18"/></td><td colspan="2" class="centre">${numeral(tmp.getSommeUnite()).format()}</td></tr>
            </table>`;
        $j("#formulaireChoixArmee fieldset:eq(1)").tooltip({
            position: { my: "left+10", at: "right center" },
            content: html,
            items: "fieldset",
            hide: { effect: "fade", duration: 10 },
            tooltipClass: "ui-tooltip-right ui-tooltip-brown ui-tooltip-lightBrown"
        }).tooltip("open");
        $j("#formulaireChoixArmee fieldset:eq(1)").on("mouseout focusout", (e) => { e.stopImmediatePropagation(); });
    }
    /**
    *
    */
    async ajouterOption() {
        // on deplace le bouton standarf à droite
        $j("input[name='ChoixArmee']").unwrap().wrap("<div id='o_btnLancer' class='right'></div>");
        // Ajout du bouton pour la synchro simple
        // Ajout du temps de trajet
        $j("#o_btnLancer").before(`<div id="o_btnSynchro"><button id='o_synchro' class="o_button f_info">Synchroniser</button><button id='o_sonder' class="o_button f_error">Sonder</button></div>`).after(`<p class="centre reduce ligne_paire">Votre armée rentrera le <span id="o_retourArmee" class="gras">${moment().add(await monProfilJoueur.getTempsParcours2(this._cible), 's').format("D MMM à HH[h]mm[m]ss[s]")}</span> (RC : <span id="o_retourArmeeRC" class="gras">${Utils.roundMinute(await monProfilJoueur.getTempsParcours2(this._cible)).format("D MMM à HH[h]mm")}</span>).</p>`);
        $j("#o_synchro").click((e) => {
            e.preventDefault();
            this.#lancerSynchro(this._cible.attenteSynchro());
            return false;
        });
        // Bouton de sonde
        $j("#o_sonder").click((e) => {
            let premiereUnite = true;
            e.preventDefault();
            // on prepare le formulaire pour la sonde
            $j("#lieu").val(3);
            for (let i = 1; i < 15; i++)
                if ($j("#unite" + i).length) {
                    $j("#unite" + i).val(premiereUnite ? monProfilUtilisateur.parametre["uniteSonde"].valeur : 0);
                    premiereUnite = false;
                }
            // une sonde est forcement synchro
            this.#lancerSynchro(this._cible.attenteSynchro());
            return false;
        });
        Utils.incrementTime(await monProfilJoueur.getTempsParcours2(this._cible), "o_retourArmee", "o_retourArmeeRC");
    }
    /**
    * @private
    */
    #lancerSynchro(attente) {
        // Affichage du compte à rebours
        $j("#formulaireChoixArmee fieldset:eq(1)").append(`<p class="centre">Synchronisation en cours, veuillez attendre : <span id='o_decSyncA'></span>.</p>`);
        Utils.decreaseTime(attente, "o_decSyncA");
        setTimeout(() => { $j("input[name='ChoixArmee']").click(); }, attente * 1000);
    }
    /**
    * Formulaire de lancement de flood.
    *
    * @method formulaireFlood
    */
    async formulaireFlood() {
        let methode = monProfilUtilisateur.parametre["methodeFlood"].valeur;
        $j(".simulateur:eq(0)").append(`<fieldset id='o_prepaFlood' class='centre'><legend><span class='titre'>Lanceur de Flood</span></legend>
            <table id='o_simulationFlood' class='o_maxWidth' cellspacing=0>
			<tr class='gras'><td>Etape</td><td>Troupes</td><td>Supp.*</td><td>Mon Terrain</td><td>${await this._cible.lire('Pseudo')} (${Utils.intToTime(await monProfilJoueur.getTempsParcours2(this._cible))})</td></tr>
			<tr><td><select id='o_methodeFlood'><option value='0' ${methode == 0 ? "selected" : ""}>${METHODE_FLOOD[0]}</option><option value='1' ${methode == 1 ? "selected" : ""}>${METHODE_FLOOD[1]}</option><option value='2' ${methode == 2 ? "selected" : ""}>${METHODE_FLOOD[2]}</option><option value='3' ${methode == 3 ? "selected" : ""}>${METHODE_FLOOD[3]}</option></select></td><td colspan="2"></td><td><input value='${Utils.terrain}' size='12' id='o_floodTDCA'/></td><td><input value='${await this._cible.lire('Terrain de Chasse')}' size='12' id='o_floodTDCB'/></td></tr>
			<tr><td>Antisonde (<span id="o_pourcentAttaque0">0</span>%)</td><td><input value='0' size='12' id='o_floodAntiSonde'/></td><td></td><td>${numeral(Utils.terrain).format()}</td><td>${numeral(await this._cible.lire('Terrain de Chasse')).format()}</td></tr>
            <tr class="gras reduce"><td colspan="3"></td><td><span id="o_supprimeAttaque" class="souligne cursor" ${methode == 1 ? "style=display:none;" : ""}>Supprimer une attaque</span></td><td><span id="o_ajouteAttaque" class="souligne cursor" ${methode == 1 ? "style=display:none;" : ""}>Ajouter une attaque</span></td></tr>
            </table>
            <button id='o_lanceFlood' class='o_marginT15 o_button f_success'>Flooder</button>
            <p class="reduce left">* : place les unités restantes sur l'attaque selectionnée.</p>
            </fieldset>`);
        $j("#o_floodTDCA, #o_floodTDCB, #o_floodAntiSonde, input[id^='o_attaque']").spinner({ min: 0, numberFormat: "i" });
        $j("#o_simulationFlood tr:even").addClass("ligne_paire");
        for (let i = 1; i < Math.min(4, this._nbAttaque); i++) await this.#ajouterAttaque();
        // Si la methode par defaut est par standard on prepare
        if (methode)
            await this.#preparerFlood($j("#o_floodTDCA").spinner("value"), $j("#o_floodTDCB").spinner("value"));
        // event
        $j("#o_methodeFlood").change(async (e) => {
            await this.#preparerFlood($j("#o_floodTDCA").spinner("value"), $j("#o_floodTDCB").spinner("value"));
            if (e.currentTarget.value == "1") // en optimisee on peut ni ajouter ni supprimer d'attaques
                $j("#o_ajouteAttaque, #o_supprimeAttaque").hide();
            else
                $j("#o_ajouteAttaque, #o_supprimeAttaque").show();
        });
        $j("#o_floodTDCA").on("input spin", async (e, ui) => {
            let nombre = ui ? ui.value : $j(e.currentTarget).spinner("value");
            $j(e.currentTarget).spinner("value", nombre);
            await this.#preparerFlood(ui ? ui.value : $j(e.currentTarget).spinner("value"), $j("#o_floodTDCB").spinner("value"));
        });
        $j("#o_floodTDCB").on("input spin", async (e, ui) => {
            let nombre = ui ? ui.value : $j(e.currentTarget).spinner("value");
            $j(e.currentTarget).spinner("value", nombre);
            await this.#preparerFlood($j("#o_floodTDCA").spinner("value"), ui ? ui.value : $j(e.currentTarget).spinner("value"));
        });
        $j("#o_floodAntiSonde").on("input spin", async (e, ui) => {
            let nombre = ui ? ui.value : $j(e.currentTarget).spinner("value");
            $j(e.currentTarget).spinner("value", nombre);
            await this.#preparerFlood($j("#o_floodTDCA").spinner("value"), $j("#o_floodTDCB").spinner("value"));
        });
        $j("#o_lanceFlood").click(async (e) => { this._armee.envoyerFlood(await this._cible.lire('Id'), 0, $j("#t:last").attr("name") + "=" + $j("#t:last").attr("value")); });
        $j("#o_ajouteAttaque").click(async (e) => { await this.#ajouterAttaque(); });
        $j("#o_supprimeAttaque").click((e) => { this.#supprimerAttaque(); });
    }
    /**
* Lance une simulation si les données saisies sont correctes.
*
* @private
* @method #preparerFlood
*/
    async #preparerFlood(tdcAtt, tdcCible, bRecup = false) {
        // Si la cible est à porter
        if (tdcCible >= (tdcAtt * 0.5) && tdcCible <= (tdcAtt * 3)) {
            let methode = $j("#o_methodeFlood").val();
            // on recup les attaques manuellement
            let attaques = new Array();
            // on push au moins l'antisonde quelque soit le cas !
            attaques.push($j("#o_floodAntiSonde").spinner("value"));
            if (bRecup || methode == "0") {
                for (let i = 1; i < this._nbAttaque; i++)
                    if ($j("#o_attaque" + i).length)
                        attaques.push($j("#o_attaque" + i).spinner("value"));
            }
            // si attaques n'est pas vide c'est qu'on parametre soit meme les floods
            // si la methode est uniforme ou degressive on utilise que le nbAttaque dans le tableau
            let indSupp = $j("input[name='o_suppAttaque']:checked").length ? $j("input[name='o_suppAttaque']:checked").attr("id").replace("o_suppAttaque", "") : -1;
            let simulation = this._armee.simulerFlood(tdcAtt, tdcCible, methode, attaques, $j("#o_attaque1").spinner("value"), (methode == "2" || methode == "3") ? Math.min($j("input[id^='o_attaque']").length, this._nbAttaque) : this._nbAttaque, indSupp);
            // mise a jour de l'antisonde
            let priseMax = Math.floor(tdcCible * 0.2), pourcent = 0;
            if (simulation[0]) {
                priseMax = simulation[0] > priseMax ? priseMax : simulation[0];
                pourcent = Math.round(priseMax * 100 / tdcCible);
                tdcAtt += priseMax;
                tdcCible -= priseMax;
                $j("#o_pourcentAttaque" + 0).text(pourcent);
                $j("#o_simulationFlood tr:eq(2) td:eq(3)").text(numeral(tdcAtt).format());
                $j("#o_simulationFlood tr:eq(2) td:eq(4)").text(numeral(tdcCible).format());
            }
            // mise à jour des attaques
            for (let i = 1; i < simulation.length; i++) {
                if (!$j("#o_attaque" + i).length) await this.#ajouterAttaque();
                $j("#o_attaque" + i).spinner("value", simulation[i]);
                // Calcule des terrains
                if (tdcCible >= (tdcAtt * 0.5)) {
                    priseMax = Math.floor(tdcCible * 0.2);
                    priseMax = simulation[i] > priseMax ? priseMax : simulation[i];
                    pourcent = Math.round(priseMax * 100 / tdcCible);
                    tdcAtt += priseMax;
                    tdcCible -= priseMax;
                }
                $j("#o_pourcentAttaque" + i).text(pourcent);
                $j("#o_simulationFlood tr:eq(" + (i + 2) + ") td:eq(3)").text(numeral(tdcAtt).format());
                $j("#o_simulationFlood tr:eq(" + (i + 2) + ") td:eq(4)").text(numeral(tdcCible).format());
            }
            // supprime les attaques en trop si besoin
            for (let i = simulation.length; i < $j("#o_simulationFlood tr").length - 3; i++)
                this.#supprimerAttaque();
        }
    }
    /**
    * Ajoute une attaque au formulaire.
    * @private
    */
    async #ajouterAttaque() {
        let nbAttaque = $j("input[id^='o_attaque']").length + 1;
        // si le nombre d'attaque depasse la VA
        if (nbAttaque >= this._nbAttaque)
            $j.toast({ ...TOAST_WARNING, text: "Votre vitesse d'attaque ne vous permet d'envoyer plus d'attaques" });
        else {
            $j("#o_simulationFlood tr:last").before(`<tr class='ligne_paire'><td>Attaque ${nbAttaque} (<span id="o_pourcentAttaque${nbAttaque}">0</span>%)</td><td><input value='0' size='12' id='o_attaque${nbAttaque}'/></td><td><input type="checkbox" id="o_suppAttaque${nbAttaque}" name="o_suppAttaque"/></td><td>${numeral(Utils.terrain).format()}</td><td>${numeral(await this._cible.lire('Terrain de Chasse')).format()}</td></tr>`);
            $j("#o_attaque" + nbAttaque).spinner({ min: 0, numberFormat: "i" });
            $j("#o_simulationFlood tr").removeClass("ligne_paire");
            $j("#o_simulationFlood tr:even").addClass("ligne_paire");
            // Event
            $j("#o_attaque" + nbAttaque).on("input spin", async (e, ui) => {
                await this.#preparerFlood($j("#o_floodTDCA").spinner("value"), $j("#o_floodTDCB").spinner("value"), true);
            });
            $j("input[name='o_suppAttaque']").on("change", async (e) => {
                // une seule checkbox peut etre cocher
                $j("input[name='o_suppAttaque']").not(e.currentTarget).prop("checked", false);
                await this.#preparerFlood($j("#o_floodTDCA").spinner("value"), $j("#o_floodTDCB").spinner("value"));
            });
            // si la methode est uniforme ou degressive on utilise autocomplete la valeur de l'attaque
            let methode = $j("#o_methodeFlood").val();
            if (methode == "2" || methode == "3") await this.#preparerFlood($j("#o_floodTDCA").spinner("value"), $j("#o_floodTDCB").spinner("value"));
        }
    }
    /**
    * @private
    */
    #supprimerAttaque() {
        // si le nombre d'attaque est de 0
        let nbAttaque = $j("input[id^='o_attaque']").length + 1;
        if (nbAttaque == 1)
            $j.toast({ ...TOAST_WARNING, text: "Vous ne pouvez plus supprimer d'attaque" });
        else {
            $j("#o_attaque" + (nbAttaque - 1)).off();
            $j("#o_simulationFlood tr:eq(" + (nbAttaque + 1) + ")").remove();
            $j("#o_simulationFlood tr").removeClass("ligne_paire");
            $j("#o_simulationFlood tr:even").addClass("ligne_paire");
        }
    }
    /**
    * Ajoute les fonctionnalités du compte+. Affiche les infos sur l'armée et les fléches dans le tableau des unités.
    *
    * @method plus
    */
    plus() {
        if (Utils.comptePlus) return;
        // Sauvegarde des attaques en cours
        let listeAttaque = new Array();
        $j("span[id^='attaque_']").each((i, elt) => {
            if ($j(elt).prev().find("a").length) { // attaque normale
                listeAttaque.push({ "cible": $j(elt).prev().text(), "exp": moment().add($j(elt).next().text().split(",")[0].split("(")[1], 's') });
                // Affichage du retour
                $j(elt).after(`<span class='small'> - Retour le ${Utils.roundMinute($j(elt).next().text().split(",")[0].split("(")[1]).format("D MMM YYYY à HH[h]mm")}</span>`);
            } else // renfort
                $j(elt).after(`<span class='small'> - Retour le ${Utils.roundMinute($j(elt).next().next().text().split(",")[0].split("(")[1]).format("D MMM YYYY à HH[h]mm")}</span>`);
        });
        this.#saveAttaque(listeAttaque);
    }
    /**
    * Verifie les attaques en cours avec ce qui est sauvegarder.
    *
    * @private
    * @method #saveAttaque
    */
    #saveAttaque(listeAttaque) {
        let dataEvo = JSON.parse(localStorage.getItem("outiiil_evolution")) || {};
        dataEvo.attaque = listeAttaque;
        dataEvo.startAttaque = moment();
        localStorage.setItem("outiiil_evolution", JSON.stringify(dataEvo));
        if (!Utils.comptePlus && $j("#boiteComptePlus").length) {
            boiteComptePlus.attaque = dataEvo.attaque;
            boiteComptePlus.startAttaque = dataEvo.startAttaque;
            boiteComptePlus.majAttaque();
        }
    }
})
