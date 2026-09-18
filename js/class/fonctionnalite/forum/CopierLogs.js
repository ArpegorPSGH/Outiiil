/*
 * CopierLogs.js
 * Hraesvelg
 **********************************************************************/

/**
 * Fonctionnalité d'alliance : Copie ordonnée des logs du forum dans le presse-papier.
 *
 * @class CopierLogs
 * @extends {FonctionnaliteAlliance}
 */
Utils.register(class CopierLogs extends FonctionnaliteAlliance {

    static ABREVIATIONS_HISTORY = ['CLF'];

    static NIVEAU_DROIT_OUTIIIL_REQUIS = 'A';

    static NIVEAU_DROIT_FOURMIZZZ_REQUIS = 'Administrer le forum';

    /**
     * @returns {Promise<void>}
     */
    async run() {
        const elementActive = $("#alliance").find("span[class^='forum'][class$='ligne_paire']");
        const estSurLogsOutiiil = elementActive.html() === "Logs Outiiil";

        if (estSurLogsOutiiil) {
            if ($("#form_cat").length && !$("#o_copierLogs").length) {
                $("#form_cat td:last")
                    .prepend(`<img class="cursor" id="o_copierLogs" src="${IMG_COPIER}" height="16" alt="copier" title="Copier les logs sélectionnés dans le presse-papier"/>`);

                $("#o_copierLogs").click(async (e) => {
                    const sujetsCoches = $("#form_cat tr:gt(0) input[name='topic[]']:checked");

                    if (!sujetsCoches.length) {
                        return;
                    }

                    try {
                        let contenuGlobal = "";

                        for (let i = 0; i < sujetsCoches.length; i++) {
                            const idSujet = parseInt($(sujetsCoches[i]).val(), 10);
                            if (!idSujet) continue;

                            const { titre, messages } = await AccesForum.consulterSujetAvecMessagesEtIds(idSujet);

                            if (titre !== null && Array.isArray(messages)) {
                                messages.sort((a, b) => a.id - b.id);

                                if (contenuGlobal.length > 0) {
                                    contenuGlobal += "\n\n";
                                }
                                contenuGlobal += titre + "\n";
                                contenuGlobal += messages.map(m => m.contenu).join("\n");
                            }
                        }

                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(contenuGlobal);
                        } else {
                            const $temp = $("<textarea>")
                                .val(contenuGlobal)
                                .appendTo("body")
                                .select();
                            document.execCommand("copy");
                            $temp.remove();
                        }

                        $.toast({
                            ...TOAST_SUCCESS,
                            text: sujetsCoches.length > 1 ? "Les logs ont été copiés dans le presse-papier." : "Le log a été copié dans le presse-papier."
                        });
                    } catch (error) {
                        console.error("[CopierLogs] Erreur lors de la copie des logs :", error);
                        $.toast({
                            ...TOAST_ERROR,
                            text: "Une erreur est survenue lors de la copie des logs."
                        });
                    }
                });
            }
        }
    }
});
