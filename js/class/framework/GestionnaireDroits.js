Utils.register(class GestionnaireDroits extends ObjetForum {
    /**
     * Configuration déclarative. Version de la logique de fonctionnement du gestionnaire de droits.
     * @type {String}
     */
    static VERSION_LOGIQUE = '1.0.0';

    /**
     * Liste ordonnée des niveaux de droits.
     * @private
     * @type {Array<String>}
     */
    static NIVEAUX_ORDONNES = ['B', 'R', 'N', 'A'];

    /**
     * Configuration déclarative. Historique des noms et lieux pour les paramètres de droits.
     * @type {Array<Object>}
     */
    static LOCATION_HISTORY = [{'section': 'Droits Outiiil', 'lieu': 'titre', 'nom': 'droit_{abrev}'}];

    /**
     * Contiendra la liste des instances d'ObjetForum représentant les droits pour chaque joueur.
     * @protected
     * @type {Array<ObjetForum>}
     */
    objetsForumContenus = [];

    /**
     * Cache qui associe un pseudo de joueur à son instance ObjetForumDroit pour un accès O(1).
     * @private
     * @type {Map<String, ObjetForum>}
     */
    mapDroits = new Map();

    /**
     * Spécifie le type d'objet contenu. La classe ObjetForumDroits créée dynamiquement sera assignée ici.
     * @protected
     * @type {typeof ObjetForum|null}
     */
    static classeObjetsForumContenus = null;

    /**
     * Découvre les fonctionnalités, crée dynamiquement les classes de droits et configure le gestionnaire.
     */
    constructor() {
        super(null); // Le GestionnaireDroits est global, pas de créateur direct.

        // Étape 1 : Création de la classe ObjetForumDroits
        class ObjetForumDroits extends ObjetForum {}
        ObjetForumDroits.VERSION_LOGIQUE = this.constructor.VERSION_LOGIQUE; // Peupler la VERSION_LOGIQUE de l'ObjetForumDroits
        const formatsLieuxUniques = [...new Map(this.constructor.LOCATION_HISTORY.map(item => [JSON.stringify({section: item.section, lieu: item.lieu}), {section: item.section, lieu: item.lieu}])).values()];
        ObjetForumDroits.LOCATION_HISTORY = formatsLieuxUniques;

        // Étape 2 : Découverte des Fonctionnalités et Création des ParametreDroit
        const parametresDroitClasses = [];

        // Ajout d'un paramètre pour le pseudo, essentiel pour la synchronisation
        const ParametrePseudo = class extends ParametreObjetForum { valeur = ''; };
        ParametrePseudo.NAME_HISTORY = ['Pseudo'];
        // ParametrePseudo.FORMATS will be inherited from ParametreObjetForum
        parametresDroitClasses.push(ParametrePseudo);

        const fonctionnalites = registreClasses.FonctionnaliteAlliance || new Map();

        for (const [nomFonctionnalite, classeFonctionnalite] of fonctionnalites) {
            
            // Création de la classe ParametreDroit sur mesure
            const ParametreDroit = class extends ParametreObjetForum {
                valeur = 'B'; // Droit par défaut
            };

            // Construction de NAME_HISTORY for ParametreDroit
            const uniqueNamesForParametreDroit = [];

            const abrevs = [...new Set(classeFonctionnalite.ABREVIATIONS_HISTORY || [])];
            const nomTemplates = [...new Set(this.constructor.LOCATION_HISTORY.map(item => item.nom))]; // Extract unique name templates

            abrevs.forEach(abrev => {
                nomTemplates.forEach(nomTemplate => {
                    const nomFinal = nomTemplate.replace('{abrev}', abrev);
                    uniqueNamesForParametreDroit.push(nomFinal);
                });
            });

            ParametreDroit.NAME_HISTORY = uniqueNamesForParametreDroit;
            // ParametreDroit.FORMATS will be inherited from ParametreObjetForum
            
            parametresDroitClasses.push(ParametreDroit);
        }

        // Étape 3 : Finalisation de la classe ObjetForumDroits
        ObjetForumDroits.CLASSES_PARAMETRES = [parametresDroitClasses];
        this.constructor.classeObjetsForumContenus = ObjetForumDroits;
    }

    /**
     * Détermine si le joueur actuel a un niveau de droit suffisant pour une fonctionnalité donnée.
     * @param {String} abrevFonctionnalite - L'abréviation de la fonctionnalité à vérifier.
     * @param {String} niveauRequis - Le niveau de droit requis ('B', 'R', 'N', 'A').
     * @returns {Boolean} - True si le joueur a le droit suffisant, false sinon.
     */
    async verifierDroit(abrevFonctionnalite, niveauRequis) {
        console.log(`[GestionnaireDroits.verifierDroit] Vérification du droit pour fonctionnalité: ${abrevFonctionnalite}, niveau requis: ${niveauRequis}`);

        // 1. Identifier le Joueur Actuel
        const pseudoJoueur = monProfilJoueur.pseudo; // Supposant que le pseudo est dans pseudo
        if (!pseudoJoueur) {
            console.log(`[GestionnaireDroits.verifierDroit] Pseudo du joueur non trouvé. Retourne false.`);
            return false;
        }
        console.log(`[GestionnaireDroits.verifierDroit] Pseudo du joueur actuel: ${pseudoJoueur}`);

        // 2. Trouver l'ObjetForum de Droits du Joueur
        const objetDroit = this.mapDroits.get(pseudoJoueur);
        if (!objetDroit) {
            console.log(`[GestionnaireDroits.verifierDroit] Pas de droits définis pour le joueur ${pseudoJoueur}. Retourne false.`);
            return false; // Pas de droits définis pour ce joueur
        }
        console.log(`[GestionnaireDroits.verifierDroit] ObjetForum de droits trouvé pour ${pseudoJoueur}.`);

        // 3. Trouver le Droit Spécifique à la Fonctionnalité
        const dernierFormat = this.constructor.LOCATION_HISTORY[this.constructor.LOCATION_HISTORY.length - 1];
        const nomParametre = dernierFormat.nom.replace('{abrev}', abrevFonctionnalite);
        const droitActuel = await objetDroit.lireParametre(nomParametre);
        if (droitActuel === null) {
            console.log(`[GestionnaireDroits.verifierDroit] Pas de paramètre de droit '${nomParametre}' pour la fonctionnalité ${abrevFonctionnalite}. Retourne false.`);
            return false; // Pas de paramètre de droit pour cette fonctionnalité
        }
        console.log(`[GestionnaireDroits.verifierDroit] Droit actuel pour ${abrevFonctionnalite}: ${droitActuel}`);

        // 4. Comparaison des Droits
        const indexDroitActuel = this.constructor.NIVEAUX_ORDONNES.indexOf(droitActuel);
        const indexDroitRequis = this.constructor.NIVEAUX_ORDONNES.indexOf(niveauRequis);

        if (indexDroitActuel === -1 || indexDroitRequis === -1) {
            console.log(`[GestionnaireDroits.verifierDroit] Niveau de droit invalide. Actuel: ${droitActuel} (index: ${indexDroitActuel}), Requis: ${niveauRequis} (index: ${indexDroitRequis}). Retourne false.`);
            return false; // Niveau de droit invalide
        }

        const resultat = indexDroitActuel >= indexDroitRequis;
        console.log(`[GestionnaireDroits.verifierDroit] Comparaison: ${droitActuel} (index ${indexDroitActuel}) >= ${niveauRequis} (index ${indexDroitRequis}) => ${resultat}.`);
        return resultat;
    }

    /**
     * Obtient un objet JavaScript simple représentant l'ensemble des droits pour un joueur spécifique.
     * @param {Joueur|String} joueur - L'instance Joueur ou le pseudo du joueur.
     * @returns {Object|null} - Un objet des droits (ex: { pseudo: 'Joueur1', sdc: 'N' }) ou null si le joueur n'est pas trouvé.
     */
    async lireChaqueParametre(joueur) {
        const objetDroit = await this._getObjetForumDroit(joueur);
        if (!objetDroit) {
            return null;
        }

        // On délègue à l'objet droit, puis on simplifie le résultat
        const pseudoCible = typeof joueur === 'string' ? joueur : await joueur.lireParametre('Pseudo');
        const droitsComplexes = await objetDroit.lireChaqueParametre();
        const droitsSimples = { pseudo: pseudoCible };

        const dernierFormat = this.constructor.LOCATION_HISTORY[this.constructor.LOCATION_HISTORY.length - 1];
        const templateNom = dernierFormat.nom; // e.g., 'droit_{abrev}'
        const prefix = templateNom.split('{')[0];
        const suffix = templateNom.split('}')[1] || '';

        for (const nomComplet in droitsComplexes) {
            if (nomComplet.startsWith(prefix) && nomComplet.endsWith(suffix)) {
                const abrev = nomComplet.substring(prefix.length, nomComplet.length - suffix.length);
                droitsSimples[abrev] = droitsComplexes[nomComplet].valeur;
            }
        }

        return droitsSimples;
    }

    /**
     * Met à jour les droits pour un seul joueur spécifique à partir d'un objet JavaScript.
     * @param {Joueur|String} joueur - L'instance Joueur ou le pseudo du joueur.
     * @param {Object} nouvellesValeurs - Un objet où les clés sont les abréviations des fonctionnalités (ex: { sdc: 'A' }).
     * @returns {Boolean} - True si le joueur a été trouvé et les droits mis à jour, false sinon.
     */
    async ecrireChaqueParametre(joueur, nouvellesValeurs) {
        const objetDroit = await this._getObjetForumDroit(joueur);
        if (!objetDroit) {
            return false;
        }

        const dernierFormat = this.constructor.LOCATION_HISTORY[this.constructor.LOCATION_HISTORY.length - 1];
        const templateNom = dernierFormat.nom; // e.g., 'droit_{abrev}'
        
        const donneesCompletes = {};
        for (const abrev in nouvellesValeurs) {
            const nomComplet = templateNom.replace('{abrev}', abrev);
            donneesCompletes[nomComplet] = nouvellesValeurs[abrev];
        }

        await objetDroit.ecrireChaqueParametre(donneesCompletes);
        return true;
    }

    /**
     * Obtient la structure HTML complète (en-tête et corps) pour un joueur spécifique.
     * @param {Joueur|String} joueur - L'instance Joueur ou le pseudo du joueur.
     * @returns {{en_tete_html: String, corps_html: String}|null} - Un objet contenant les chaînes HTML, or null if the player is not found.
     */
    async afficher(joueur) {
        const objetDroit = await this._getObjetForumDroit(joueur);
        if (!objetDroit) {
            return null;
        }
        return await objetDroit.afficher();
    }

    /**
     * Méthode privée pour récupérer l'objet de droits d'un joueur.
     * @param {Joueur|String} joueur - L'instance Joueur ou le pseudo du joueur.
     * @returns {ObjetForum|null} - L'objet de droits du joueur ou null s'il n'est pas trouvé.
     * @private
     */
    async _getObjetForumDroit(joueur) {
        const pseudoCible = typeof joueur === 'string' ? joueur : await joueur.lireParametre('Pseudo');
        if (!pseudoCible) {
            return null;
        }
        return this.mapDroits.get(pseudoCible) || null;
    }

    /**
     * Synchronise complètement la liste des droits en mémoire avec la liste officielle des membres.
     * @param {FonctionnaliteAlliance} fonctionnaliteAppelante - L'instance de la fonctionnalité qui demande le rafraîchissement.
     */
    async rafraichir(fonctionnaliteAppelante) {
        // 1. Chargement parallèle
        const [droitsActuels, membresOfficiels] = await Promise.all([
            fonctionnaliteAppelante.chargerObjetForumsMultiples(this.constructor.classeObjetsForumContenus),
            fonctionnaliteAppelante.chargerObjetForumsMultiples(JoueurTest) // Assurez-vous que la classe Joueur est disponible
        ]);

        // 2. Indexation et Synchronisation
        this.mapDroits.clear();
        for (const droit of droitsActuels) {
            const pseudo = await droit.lireParametre('Pseudo');
            console.log(`[GestionnaireDroits.rafraichir] Droits actuels - Pseudo: ${pseudo}, Droit:`, droit);
            if (pseudo) this.mapDroits.set(pseudo, droit);
        }

        const droitsSynchronises = [];
        const promessesEnregistrement = [];

        for (const membre of membresOfficiels) {
            const pseudoMembre = await membre.lireParametre('Pseudo');
            console.log(`[GestionnaireDroits.rafraichir] Membre officiel - Pseudo: ${pseudoMembre}`, membre);
            let objetDroit = this.mapDroits.get(pseudoMembre);

            if (objetDroit) {
                console.log(`[GestionnaireDroits.rafraichir] Membre existant trouvé: ${pseudoMembre}`);
                droitsSynchronises.push(objetDroit);
            } else {
                // Nouveau membre : créer et sauvegarder ses droits par défaut
                console.log(`[GestionnaireDroits.rafraichir] Nouveau membre, création des droits par défaut pour: ${pseudoMembre}`);
                const nouvelObjetForumDroit = new this.constructor.classeObjetsForumContenus(fonctionnaliteAppelante, { donneesInitiales: { Pseudo: pseudoMembre }, objetParent: this });
                promessesEnregistrement.push(await nouvelObjetForumDroit.enregistrerSurForum());
                droitsSynchronises.push(nouvelObjetForumDroit);
            }
        }

        // 3. Enregistrement parallèle des nouveaux membres
        console.log(`[GestionnaireDroits.rafraichir] Enregistrement de ${promessesEnregistrement.length} nouveaux droits...`);
        await Promise.all(promessesEnregistrement);
        console.log(`[GestionnaireDroits.rafraichir] Enregistrement terminé.`);

        // 4. Mise à jour finale
        this.objetsForumContenus = droitsSynchronises;
        this.mapDroits.clear();
        for (const droit of this.objetsForumContenus) {
            const pseudo = await droit.lireParametre('Pseudo');
            console.log(`[GestionnaireDroits.rafraichir] Mise à jour finale mapDroits - Pseudo: ${pseudo}, Droit:`, droit);
            if (pseudo) this.mapDroits.set(pseudo, droit);
        }
    }
})
