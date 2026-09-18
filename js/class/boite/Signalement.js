/*
 * BoiteSignalement.js
 * Hraesvelg
 * **********************************************************************/

/**
 * Classe permettant à un utilisateur de signaler un problème technique ou fonctionnel.
 *
 * @class BoiteSignalement
 * @constructor
 * @extends Boite
 */
Utils.register(class BoiteSignalement extends Boite {
    constructor() {
        const content = `<div id="o_boiteSignalementContent" style="padding: 10px; font-size: 12px; box-sizing: border-box;">
            <p style="margin: 0 0 10px 0; line-height: 1.4; width: 100%; box-sizing: border-box;">
                <strong>Information importante :</strong> Les erreurs techniques d'exécution sont capturées et transmises automatiquement (une notification s'affiche lorsqu'un rapport d'erreur est envoyé). Ce formulaire est destiné à signaler des dysfonctionnements en l'absence d'erreur notifiée (défauts d'interface, mauvais calculs de ressources, comportement inattendu). Le signalement doit être fait au moment et sur la page où le dysfonctionnement se produit, afin que les logs communiqués soient pertinents. Merci de décrire précisément le problème observé et les opérations y ayant mené ci-dessous. Veuillez noter que l'envoi peut être long.
            </p>
            <div style="margin-bottom: 10px; width: 100%; box-sizing: border-box;">
                <textarea id="o_inputBugDescription" style="width: 100%; height: 100px; box-sizing: border-box; resize: vertical; display: block;" placeholder="Décrivez le problème rencontré..."></textarea>
            </div>
            <div id="o_signalementError" style="color: red; margin-bottom: 10px; display: none; font-weight: bold; width: 100%; text-align: center;"></div>
            <div style="text-align: center; width: 100%; box-sizing: border-box; position: relative; min-height: 30px;">
                <a id="o_btnEnvoyerSignalement" class="dt-button" href="#"><span>Signaler</span></a>
                <div id="o_signalementProgressContainer" style="display: none; width: 100%; position: relative;">
                    <div id="o_signalementProgressBar" style="width: 100%; height: 22px;"></div>
                    <div id="o_signalementProgressText" style="position: absolute; top: 0; left: 0; width: 100%; height: 22px; line-height: 22px; text-align: center; font-weight: bold; color: #fff; text-shadow: 1px 1px 2px #000;">0%</div>
                </div>
            </div>
        </div>`;
        super("o_boiteSignalement", "Signaler un bug", content);
    }

    /**
     * Affiche la boite.
     *
     * @method afficher
     */
    async afficher() {
        if (await super.afficher()) {
            $("#o_signalementProgressContainer").hide();
            $("#o_btnEnvoyerSignalement").show().removeClass('processing').css('pointer-events', 'auto');
            $("#o_signalementError").hide();
            await this.css().event();
        }
        return this;
    }

    // /**
    //  * Applique le style propre à la boite.
    //  *
    //  * @private
    //  * @method css
    //  */
    // css() {
    //     super.css();
    //     return this;
    // }

    /**
     * Ajoute les evenements propres à la boite.
     *
     * @method event
     */
    event() {
        super.event();

        $("#o_btnEnvoyerSignalement").off("click").on("click", async (e) => {
            e.preventDefault();
            const bouton = $("#o_btnEnvoyerSignalement");
            if (bouton.hasClass('processing')) return false;

            const description = $("#o_inputBugDescription").val().trim();
            const errorContainer = $("#o_signalementError");

            if (!description) {
                errorContainer.text("Veuillez décrire le problème rencontré.").show();
                return false;
            }

            errorContainer.hide();
            bouton.addClass('processing').css('pointer-events', 'none');

            const progressContainer = $("#o_signalementProgressContainer");
            const progressBar = $("#o_signalementProgressBar");
            const progressText = $("#o_signalementProgressText");

            bouton.hide();
            progressBar.progressbar({ value: 0 });
            progressText.text("0%");
            progressContainer.show();

            try {
                // Appeler logger.posterLogs avec une nouvelle Erreur, la description et la callback de progression
                const succes = await logger.posterLogs(
                    new Error("Signalement manuel de l'utilisateur"),
                    description,
                    (actuel, total) => {
                        let percent = 0;
                        if (total === undefined || total === null) {
                            percent = Math.min(100, Math.max(0, Math.round(actuel)));
                        } else if (total > 0) {
                            percent = Math.min(100, Math.max(0, Math.round((actuel / total) * 100)));
                        }
                        progressBar.progressbar("value", percent);
                        progressText.text(percent + "%");
                    }
                );

                if (succes) {
                    progressBar.progressbar("value", 100);
                    progressText.text("100%");
                    $.toast({ ...TOAST_SUCCESS, text: "Merci pour votre signalement !" });
                    $("#o_inputBugDescription").val("");
                    await Utils.sleep(500);
                    this.masquer();
                } else {
                    $.toast({ ...TOAST_ERROR, text: "Une erreur est survenue lors de l'envoi du signalement." });
                }
            } catch (err) {
                console.error("Erreur lors de l'envoi du signalement:", err);
                $.toast({ ...TOAST_ERROR, text: "Une erreur est survenue lors de l'envoi du signalement." });
            } finally {
                progressContainer.hide();
                bouton.show().removeClass('processing').css('pointer-events', 'auto');
            }
        });

        return this;
    }
});
