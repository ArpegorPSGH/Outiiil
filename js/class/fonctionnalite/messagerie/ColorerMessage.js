/*
 * FonctionnaliteMessagerieJoueurs.js
 * Hraesvelg
 **********************************************************************/

/**
 * Fonctionnalite pour colorer les messages des joueurs de l'alliance sur la page messagerie.
 * Remplace l'ancienne logique de Messagerie.chargerJoueurs.
 * 
 * @class ColorerMessage
 * @extends {FonctionnaliteAlliance}
 */
Utils.register(class ColorerMessage extends FonctionnaliteAlliance {

    static ABREVIATIONS_HISTORY = ['CM'];

    /**
     * Exécute le chargement des joueurs et applique la coloration des messages.
     */
    async run() {
        console.log("[FonctionnaliteMessagerieJoueurs] run()");

        let joueurs = [];
        await this.executerTransaction(async () => {
            // Récupération des joueurs de l'utilitaire via la nouvelle logique du framework
            joueurs = await this.chargerObjetsForum(Joueur, false);
        })

        // On convertit la liste en map pour compatibilité avec le reste de la page
        const mapJoueurs = {};
        for (const joueur of joueurs) {
            const pseudo = await joueur.lire('Pseudo');
            mapJoueurs[pseudo] = joueur;
        }

        $("tr[id^='conversation_']").each((i, elt) => {
            let titre = $(elt).find("td:eq(3) .intitule_message").text(), color = "";
            // une colonie perdue est toujours rouge
            // Attaque échouée contre xXx : votre armée...
            if (titre.includes("Colonie perdue") || titre.includes("conquis par") || titre.includes("Attaque échouée contre") || titre.includes("Rebellion échouée"))
                color = "red";
            // Colonie conquise est toujours verte
            // Butin chez Verratti : ...
            // Attaque réussie contre xXx : votre armée...
            else if (titre.includes("Colonie conquise") || titre.includes("Butin chez") || titre.includes("Attaque réussie contre") || titre.includes("Rebellion réussie"))
                color = "green";
            // Vol par XxX : .
            // Invasion de xXx: votre armée
            else if (titre.includes("Vol par") || titre.includes("Invasion"))
                color = mapJoueurs.hasOwnProperty(titre.split(" ")[2]) ? "green" : "red";
            if (color) $(elt).find("td:eq(3)").children().addClass(color);
        });
    }
});
