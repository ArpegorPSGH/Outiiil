/*
 * Chat.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe de fonction pour les chats.
*
* @class Chat
* @constructor
*/
Utils.register(class Chat extends Page {

    static URIs = ["/chat.php", { href: "/alliance.php", search: "" }];


    static FONCTIONNALITES = [
        this.prototype.plus,
        this.prototype.couleur,
        this.prototype.emoticone,
        this.prototype.afficheMessage,
        this.prototype.envoiFormulaire,
    ];

    constructor() {
        super();
        /**
        * Compteur pour l'autoactualisation
        */
        this._timeoutChat = -1;
    }
    /**
    *
    */
    envoiFormulaire() {
        // Modification pour l'envoie du formulaire
        $j("#message").on("keypress", (e) => {
            let code = e.keyCode || e.which;
            if (code == 13)
                this.#parserMessage();
        });
        $j("input[name='Envoyer']").click((e) => { this.#parserMessage(); });
    }
    /**
    * Change l'apparance de l'affichage des messages, "Pseudo (datetime) :" au lieu de "datetime pseudo :"
    *
    * @method afficheMessage
    */
    afficheMessage() {
        // ajoute du cite sur les anciens messages
        $j("#anciensMessages p, #nouveauxMessages p").each((i, elt) => {
            $j(elt).html((i, html) => {
                let nth = 0;
                return html.replace(/:/g, (match, j) => {
                    nth++;
                    return nth == 3 ? ` <span id="o_cite${$j(elt).attr("id")}" class="reduce souligne cursor">citer</span> :` : match;
                });
            });
        });
        // event sur les anciens message
        $j("span[id^='o_cite']").click((e) => {
            let texte = this.#citerMessage(e);
            texte.length && $j("#message").val(`[i]${texte}[/i] // `).focus();
        });
        // MutationObserver pour les nouveaux messages
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        let element = $j(node);
                        if (element.is("p") && !element.hasClass("o_parsed")) {
                            element.addClass("o_parsed");
                            element.html((i, html) => {
                                let nth = 0;
                                return html.replace(/:/g, (match, i) => {
                                    nth++;
                                    return nth == 3 ? ` <span id="o_cite${element.attr("id")}" class="reduce souligne cursor">citer</span> :` : match;
                                });
                            });
                            $j(`#o_cite${element.attr("id")}`).click((e) => {
                                let texte = this.#citerMessage(e);
                                texte.length && $j("#message").val(`[i]${texte}[/i] // `).focus();
                            });
                        }
                    }
                });
            });
        });
        // Configurer l'observateur pour observer les enfants de #nouveauxMessages et #anciensMessages
        const observerConfig = { childList: true, subtree: false };
        const nouveauxMessages = document.getElementById("nouveauxMessages");
        const anciensMessages = document.getElementById("anciensMessages");
        if (nouveauxMessages) observer.observe(nouveauxMessages, observerConfig);
        if (anciensMessages) observer.observe(anciensMessages, observerConfig);
        return this;
    }
    /**
    * @private
    */
    #getMessage() {
        return $j.ajax({ url: "http://" + Utils.serveur + ".fourmizzz.fr/appelAjax.php", data: "actualiserChat=" + ($j(".titre:first").text().includes("Alliance") ? "alliance" : "general") });
    }
    /**
    * Ajoute la Couleur, options de chat.
    *
    * @method plus
    */
    plus() {
        if (Utils.comptePlus) return
        // ajout de l'auto actualisation
        $j("#actualiser").after(" --- <label><input id='o_autoActualiser' type='checkbox' name='autoActualiser'/>auto</label> ");
        $j("#o_autoActualiser").change(() => {
            if ($j("#o_autoActualiser").prop("checked"))
                this.#actualiserMessage();
            else
                clearTimeout(this._timeoutChat);
        });
        // Ajout des fonctions de mise en forme
        $j("#formulaireChat").append(`<div class='o_group_bouton o_group_bouton_chat'><span id='o_msgUp' class='option_gestion'>aA</span><span id='o_msgDown' class='option_gestion'>Aa</span></div>
            <div class='o_group_bouton o_group_bouton_chat'><span id='o_msgB' class='option_gestion gras' onclick="miseEnForme('message','gras');">B</span><span id='o_msgI' class='option_gestion' onclick="miseEnForme('message','italic');"><em>I</em></span><span id='o_msgU' class='option_gestion' onclick="miseEnForme('message','souligne');" style='text-decoration:underline'>U</span></div>
            <div class='o_group_bouton o_group_bouton_chat'><span id='o_msgImg' class='option_gestion' onclick="miseEnForme('message','img');"><img height='12' src='images/BBCode/picture.png' title='Image' /></span><span id='o_msgLink' class='option_gestion' class='btn' onclick="miseEnForme('message','url');"><img height='12' src='images/BBCode/link.png' title='Lien' /></span><span id='o_msgPlay' class='option_gestion' onclick="miseEnForme('message','player');"><img height='12' src='images/BBCode/membre.gif' title='Pseudo'/></span><span id='o_msgAlly' class='option_gestion' onclick="miseEnForme('message','ally');"><img height='12' src='images/BBCode/groupe.gif' title='Alliance'/></span></div>`);
        $j(".o_group_bouton span").css("background-color", monProfilJoueur.couleur1);

        $j("#o_msgUp").click((e) => {
            e.preventDefault();
            $j("#message").val("[size=4]" + $j("#message").val() + "[/size]");
            $j("#message")[0].selectionStart += 8;
            $j("#message")[0].selectionEnd -= 7;
            $j("#message").focus();
        });
        $j("#o_msgDown").click((e) => {
            e.preventDefault();
            $j("#message").val("[size=2]" + $j("#message").val() + "[/size]");
            $j("#message")[0].selectionStart += 8;
            $j("#message")[0].selectionEnd -= 7;
            $j("#message").focus();
        });
        $j("#o_msgB, #o_msgI, #o_msgU, #o_msgImg, #o_msgLink, #o_msgPlay, #o_msgAlly").click((e) => { e.preventDefault(); });
        // Ajout des emoticone
        $j("#listeSmiley20").html(LISTESMILEY1);
        $j("#listeSmiley30").html(LISTESMILEY2);
        $j("#listeSmiley40").html(LISTESMILEY3);
        $j("#listeSmiley50").html(LISTESMILEY4);
        $j("#listeSmiley60").html(LISTESMILEY5);
        $j("#listeSmiley70").html(LISTESMILEY6);
    }
    /**
    * @private
    */
    #actualiserMessage(nbTour = 40) {
        if (nbTour) {
            this.#getMessage().then((data) => {
                $j("#anciensMessages").prepend($j('#nouveauxMessages').html());
                $j("#nouveauxMessages").html(data.message);
                $j("#NonLuMess").html(data.NonLuMess);
                $j("#NonLuRapComb").html(data.NonLuRapComb);
                $j("#NonLuRapChass").html(data.NonLuRapChass);
            }, (jqXHR, textStatus, errorThrown) => {
                $j.toast({ ...TOAST_ERROR, text: "Mise à jour des messages impossible." });
            });
            this._timeoutChat = setTimeout(() => { this.#actualiserMessage(--nbTour); }, 5000);
        } else
            $j("#o_autoActualiser").prop("checked", false);
        return this;
    }
    /**
    * @private
    */
    #citerMessage(e) {
        let clone = $j(e.currentTarget).parent().clone();
        $j("span", clone).remove();
        let texte = clone.text();
        if (texte.length > 80) texte = texte.substring(0, 80) + "...";
        return texte;
    }
    /**
    * Parse le message pour convertir les smiley par le bbcode correspondant.
    *
    * @private
    * @method #parserMessage
    */
    #parserMessage() {
        let color = $j("#inputCouleur").val();
        if (color != "000000" && color != "0000000")
            $j("#message").val("[color=#" + color + "]" + $j("#message").val() + "[/color]");
        $j("#message").val($j("#message").val().replace(/\{outiiil([1-9]|1[0-9]|2[0-6])\}/g, "[img]http://outiiil.fr/images/outiiil/$1.gif[/img]"));
        return this;
    }
    /**
    * Ajoute/modifie le color picker.
    *
    * @method couleur
    */
    couleur() {
        $j("#inputCouleur").val(monProfilUtilisateur.parametre["couleurChat"].valeur.substring(1));
        $j("#boutonCouleur").remove();
        $j("#smileySuivant0").after(`<span><input id='color' type='color' name='couleur' value='${monProfilUtilisateur.parametre["couleurChat"].valeur}'/></span>`);
        $j("#color").change((e) => {
            let color = e.currentTarget.value;
            $j("#inputCouleur").val(color.substring(1));
            monProfilUtilisateur.parametre["couleurChat"].valeur = color;
            monProfilUtilisateur.parametre["couleurChat"].sauvegarde();
        });
    }
    /**
    * Ajoute les emoticones de base pour les non compte+.
    *
    * @method emoticone
    */
    emoticone() {
        // Ajout des emoticones d'outiiil
        let ligne = `<div id='listeSmiley80' style='display:none'>`;
        for (let i = 0; ++i < 27; ligne += `<img id='smiley_${i}' src='http://outiiil.fr/images/outiiil/${i}.gif'>`);
        $j("#tousLesSmiley0").append(ligne + `</div>`);
        $j("img[id^=smiley_]").click((e) => { $j("#message").val($j("#message").val() + "{outiiil" + $j(e.currentTarget).attr("id").slice(7) + "}"); });
        // Modification de la fleche preedante
        $j("#smileyPrecedent0").replaceWith(() => { return `<span id="smileyPrecedent0"><img title='Précédent' class='cursor' src='images/bouton/fleche-champs-gauche.gif'/></span>`; });
        // Event sur la fleche preedante
        $j("#smileyPrecedent0").click((e) => {
            let div = $j("#tousLesSmiley0 > div:visible");
            div.hide();
            div.is(':first-child') ? $j("#tousLesSmiley0 div:last").show() : div.prev().show();
        });
        // Modification de la fleche suivante
        $j("#smileySuivant0").replaceWith(() => { return `<span id="smileySuivant0"><img title='Suivant' class='cursor' src='images/bouton/fleche-champs-droite.gif'/></span>`; });
        // Event sur la fleche suivante
        $j("#smileySuivant0").click((e) => {
            let div = $j("#tousLesSmiley0 > div:visible");
            div.hide();
            div.is(':last-child') ? $j("#tousLesSmiley0 div:first").show() : div.next().show();
        });
    }
})


