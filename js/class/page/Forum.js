/*
 * Forum.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe de fonction pour la page /alliance.php?forum_menu.
 *
 * @class Forum
 * @extends {Page}
 */
Utils.register(class Forum extends Page {
    static URIs = { href: "/alliance.php?forum_menu" };

    /**
     * Liste unifiée des fonctionnalités à exécuter sur la page Forum.
     * @type {Array<Function|typeof FonctionnaliteAlliance>}
     */
    static FONCTIONNALITES = [
        this.prototype.majIdsSections,
        AdministrerForum,
        AdministrerCommandes
    ];

    constructor() {
        super();
        /**
        * liste des joueurs.
        */
        this._monAlliance = null;
    }

    get alliance() {
        return this._monAlliance;
    }

    set alliance(newAlliance) {
        this._monAlliance = newAlliance;
    }

    /**
     * Surcharge la méthode pour détecter les droits d'admin sur la base de l'outil de fourmizzz
     * @returns {boolean}
     */
    estAdminFourmizzz() {
        return $("img[src='images/icone/outil.gif']").length > 0;
    }

    /**
     * Initialisation spécifique au forum :
     * lance init() native, puis installe un MutationObserver pour réévaluer 
     * le chargement des sections Ajax.
     */
    async init() {
        // Exécution initiale du framework
        await super.init();

        // Récupération des données du forum pour communiquer (mutation observer)
        // Utile parce que l'arborescence Ajax (clic sur une catégorie) remplace 
        // une partie de #alliance ou de l'intérieur de #alliance.
        let observer = new MutationObserver(async (mutationsList) => {
            // Lors d'une mutation, on réexécute init() simplifié (ou majIdsSections + les fonctionnalités admin)
            // Pour être propre avec le framework, on peut simplement rejouer les fonctionnalités.
            // On s'assure de ne pas boucler avec l'observer.
            observer.disconnect();
            await super.init();
            observer.observe($("#alliance")[0], { childList: true });
        });
        if ($("#alliance").length) {
            observer.observe($("#alliance")[0], { childList: true });
        }
    }

    /**
     * Fonction locale pour vérifier et mettre à jour les IDs des sections requises en local
     */
    async majIdsSections() {
        console.log("[Forum] majIdsSections()");
        let idsUpdated = false;
        let element = window.document.getElementById('alliance'); // Fallback

        if (nomsSectionsRequis && element) {
            const allForumSpans = $(element).find("span[class^='forum']");

            for (const nomSection of nomsSectionsRequis) {
                if (!monProfilUtilisateur || !monProfilUtilisateur.parametre[nomSection]) continue;

                const storedId = monProfilUtilisateur.parametre[nomSection].valeur;
                let sectionActuelleValide = false;

                // 1. On vérifie si l'id actuel pointe vers une section accessible dont le nom contient celui de la section cible
                if (storedId) {
                    const currentSectionElement = allForumSpans.filter(function () {
                        const classMatch = $(this).attr("class").match(/\d+/);
                        return classMatch && classMatch[0] == storedId;
                    });

                    if (currentSectionElement.length) {
                        const currentName = currentSectionElement.text().trim();
                        if (currentName.includes(nomSection)) {
                            sectionActuelleValide = true;
                        }
                    }
                }

                // 2. Si l'id actuel n'est pas/plus valide, on cherche une section avec le nom exact
                if (!sectionActuelleValide) {
                    const exactMatchElement = allForumSpans.filter(function () {
                        return $(this).text().trim() === nomSection;
                    });

                    if (exactMatchElement.length) {
                        const newPageId = exactMatchElement.attr("class").match(/\d+/)[0];
                        if (storedId != newPageId) {
                            monProfilUtilisateur.parametre[nomSection].valeur = newPageId;
                            monProfilUtilisateur.parametre[nomSection].sauvegarde();
                            idsUpdated = true;
                            console.log(`ID section ${nomSection} mis à jour vers ${newPageId} (match exact).`);
                        }
                        sectionActuelleValide = true;
                    }
                }

                // 3. Si aucune section correspondante n'est trouvée (nom exact introuvable), on vide l'id si la section actuelle était invalide
                if (!sectionActuelleValide && storedId) {
                    monProfilUtilisateur.parametre[nomSection].valeur = '';
                    monProfilUtilisateur.parametre[nomSection].sauvegarde();
                    idsUpdated = true;
                    console.log(`ID section ${nomSection} vidé car introuvable.`);
                }
            }
        }

        // Afficher une notification si des IDs ont été mis à jour
        if (idsUpdated) {
            $.toast({ ...TOAST_SUCCESS, text: "IDs des sections forum Outiiil mis à jour." });
        }
    }
});
