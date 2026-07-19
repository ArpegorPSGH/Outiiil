/*
 * ProfilUtilisateur.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe pour gérer le profil de l'utilisateur (paramètres de l'extension).
*
* @class ProfilUtilisateur
*/
class ProfilUtilisateur {
    constructor() {
        console.log("[ProfilUtilisateur] Début du constructeur ProfilUtilisateur.");
        /**
        * Préférence de l'utilisateur.
        *
        * @private
        * @property _parametre
        * @type Object
        */
        this._parametre = {};
        // parametres style des boites
        this._parametre["couleur1"] = new ParametreUI("couleur1", "Couleur de fond", "color", "#d7c384");
        this._parametre["couleur2"] = new ParametreUI("couleur2", "Couleur secondaire", "color", "#c9ad63");
        this._parametre["couleur3"] = new ParametreUI("couleur3", "Couleur bordure", "color", "#bd8d46");
        this._parametre["couleurTexte"] = new ParametreUI("couleurTexte", "Couleur du texte", "color", "#000000");
        this._parametre["couleurTitre"] = new ParametreUI("couleurTitre", "Couleur des titres", "color", "#787423");
        this._parametre["dockPosition"] = new ParametreUI("dockPosition", "Position des outils", "select", 0, ["Droite", "Bas"]);
        this._parametre["dockVisible"] = new ParametreUI("dockVisible", "Outils toujours visible ?", "checkbox", true);
        this._parametre["boiteShow"] = new ParametreUI("boiteShow", "Effet appariation des boites", "select", 0, EFFET);
        this._parametre["boiteHide"] = new ParametreUI("boiteHide", "Effet disparition des boites", "select", 0, EFFET);
        // parametres utilitaires
        // Dynamically add parameters for required sections
        if (sectionsRequises) {
            console.log("[ProfilUtilisateur] Ajout dynamique des paramètres de section. Sections requises:", sectionsRequises);
            for (const sec of sectionsRequises) {
                const nomSection = sec.nom;
                // Only add if it's not already defined as a static parameter
                if (!this._parametre[nomSection]) {
                    this._parametre[nomSection] = new ParametreUI(nomSection, nomSection, 'input');
                    console.log(`[ProfilUtilisateur] Paramètre dynamique "${nomSection}" créé.`);
                } else {
                    console.log(`[ProfilUtilisateur] Paramètre dynamique "${nomSection}" déjà existant (statique).`);
                }
            }
        } else {
            console.warn("[ProfilUtilisateur] sectionsRequises est indéfini lors de la création des paramètres dynamiques.");
        }

        // parametres armée
        this._parametre["methodeFlood"] = new ParametreUI("methodeFlood", "Méthode de flood", "select", 0, METHODE_FLOOD);
        this._parametre["uniteAntisondeTerrain"] = new ParametreUI("uniteAntisondeTerrain", "Antisonde max en terrain", "number", 1);
        this._parametre["uniteAntisondeDome"] = new ParametreUI("uniteAntisondeDome", "Antisonde max en dôme", "number", 0);
        this._parametre["uniteSonde"] = new ParametreUI("uniteSonde", "Sonde vers l'ennemi", "number", 0);
        // parametre divers
        this._parametre["couleurChat"] = new ParametreUI("couleurChat", "Couleur chat", "color", "#000000");
        this._parametre["couleurMessagerie"] = new ParametreUI("couleurMessagerie", "Couleur messagerie", "color", "#000000");
        this._parametre["affectationRessource"] = new ParametreUI("affectationRessource", "Affectation des ressources", "select", 0, ["Non", "Materiaux", "Nourriture"]);
        // parametres pour traceur
        this._parametre["cleTraceur"] = new ParametreUI("cleTraceur", "Cle pour le serveur", "input");
        this._parametre["etatTraceurJoueur"] = new ParametreUI("etatTraceurJoueur", "Traceur joueur actif ?", "checkbox", false);
        this._parametre["intervalleTraceurJoueur"] = new ParametreUI("intervalleTraceurJoueur", "Intervalle entre chaque relevé (en mn)", "number", 5);
        this._parametre["nbPageTraceurJoueur"] = new ParametreUI("nbPageTraceurJoueur", "Nombre de page à relever", "number", 1);
        this._parametre["etatTraceurAlliance"] = new ParametreUI("etatTraceurAlliance", "Traceur alliance actif ?", "checkbox", false);
        this._parametre["intervalleTraceurAlliance"] = new ParametreUI("intervalleTraceurAlliance", "Intervalle entre chaque relevé (en mn)", "number", 5);
    }

    /**
    * Renvoie les paramètres de l'utilisateur.
    *
    * @method parametre
    * @return {Object} les paramètres format JSON.
    */
    get parametre() {
        return this._parametre;
    }

    /**
    * Charge les paramètres de l'utilisateur depuis localStorage.
    *
    * @method getParametre
    * @return {ProfilUtilisateur} L'instance de ProfilUtilisateur.
    */
    getParametre() {
        console.log("[ProfilUtilisateur] Entrée dans getParametre().");
        let data = JSON.parse(localStorage.getItem("outiiil_parametre")) || {};
        console.log("[ProfilUtilisateur] Données chargées depuis localStorage:", data);
        // Si des données sont deja presente et à jour on les charges
        for (let cle in data) {
            if (this._parametre[cle]) {
                this._parametre[cle].valeur = data[cle];
                console.log(`[ProfilUtilisateur] Paramètre "${cle}" mis à jour avec la valeur "${data[cle]}".`);
            } else {
                console.warn(`[ProfilUtilisateur] Paramètre "${cle}" trouvé dans localStorage mais non défini dans ProfilUtilisateur.parametre.`);
            }
        }
        console.log("[ProfilUtilisateur] ProfilUtilisateur.parametre après chargement:", this._parametre);
        return this;
    }

    /**
    * Sauvegarde les paramètres de l'utilisateur dans localStorage.
    *
    * @method sauvegarderParametres
    */
    sauvegarderParametres() {
        let paramsToSave = {};
        for (let key in this._parametre) {
            paramsToSave[key] = this._parametre[key].valeur;
        }
        localStorage.setItem("outiiil_parametre", JSON.stringify(paramsToSave));
        console.log("[ProfilUtilisateur] Paramètres sauvegardés dans localStorage.");
    }
}
