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
    static LOCATION_HISTORY = [{section: 'Droits Outiiil', lieu: 'titre'}];

    /**
     * Formats historiques pour les paramètres de pseudo et de droits.
     * Le nom 'droit_{abrev}' sert de template.
     * @type {Array<Object>}
     */
    static FORMAT_HISTORY = [{ nom_pseudo: 'pseudo_droits', nom_droit: 'droit_{abrev}', format: '(nom): (valeur) | ' }];

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
        console.log('Construction du gestionnaire droits')
        // Étape 1 : Création de la classe ObjetForumDroits
        class ObjetForumDroits extends ObjetForum {}
        ObjetForumDroits.VERSION_LOGIQUE = this.constructor.VERSION_LOGIQUE; // Peupler la VERSION_LOGIQUE de l'ObjetForumDroits
        ObjetForumDroits.LOCATION_HISTORY = [...new Map(this.constructor.LOCATION_HISTORY.map(item => [JSON.stringify(item), item])).values()];

        // Étape 2 : Découverte des Fonctionnalités et Création des ParametreDroit
        const parametresDroitClasses = [];

        // Ajout d'un paramètre pour le pseudo, essentiel pour la synchronisation
        const ParametrePseudo = class extends ParametreObjetForum { valeur = ''; };
        ParametrePseudo.VERSION_LOGIQUE = this.constructor.VERSION_LOGIQUE;
        ParametrePseudo.FORMAT_HISTORY = this.constructor.FORMAT_HISTORY.map(f => ({ nom: f.nom_pseudo, format: f.format }));
        parametresDroitClasses.push(ParametrePseudo);

        const fonctionnalites = registreClasses.FonctionnaliteAlliance || new Map();

        for (const [nomFonctionnalite, classeFonctionnalite] of fonctionnalites) {
            
            // Création de la classe ParametreDroit sur mesure
            const ParametreDroit = class extends ParametreObjetForum {
                valeur = 'B'; // Droit par défaut
            };
            ParametreDroit.VERSION_LOGIQUE = this.constructor.VERSION_LOGIQUE;

            // Construction de FORMAT_HISTORY for ParametreDroit
            const formatHistory = [];
            const abrevs = [...new Set(classeFonctionnalite.ABREVIATIONS_HISTORY || [])];
            const formatTemplates = [...new Set(this.constructor.FORMAT_HISTORY.map(f => ({ nom: f.nom_droit, format: f.format })))];
            
            formatTemplates.forEach(formatInfo => {
                abrevs.forEach(abrev => {
                    const nomFinal = formatInfo.nom.replace('{abrev}', abrev);
                    formatHistory.push({ nom: nomFinal, format: formatInfo.format });
                });
            });

            ParametreDroit.FORMAT_HISTORY = formatHistory;
            parametresDroitClasses.push(ParametreDroit);
        }

        // Étape 3 : Finalisation de la classe ObjetForumDroits
        ObjetForumDroits.CLASSES_PARAMETRES = [parametresDroitClasses];
        this.constructor.classeObjetsForumContenus = ObjetForumDroits;
        window.ObjetForumDroits = ObjetForumDroits;
    }

    /**
     * Détermine si le joueur actuel a un niveau de droit suffisant pour une fonctionnalité donnée.
     * @param {String} abrevFonctionnalite - L'abréviation de la fonctionnalité à vérifier.
     * @param {String} niveauRequis - Le niveau de droit requis ('B', 'R', 'N', 'A').
     * @returns {Boolean} - True si le joueur a le droit suffisant, false sinon.
     */
    async verifierDroit(abrevFonctionnalite, niveauRequis) {
        // 1. Identifier le Joueur Actuel
        const pseudoJoueur = await monProfilJoueur.lireParametre('pseudo'); // Supposant que le pseudo est dans pseudo
        if (!pseudoJoueur) {
            console.warn(`[GestionnaireDroits] Pseudo du joueur non trouvé.`);
            return false;
        }

        // 2. Trouver l'ObjetForum de Droits du Joueur
        const objetDroit = this.mapDroits.get(pseudoJoueur);
        if (!objetDroit) {
            return false; // Pas de droits définis pour ce joueur
        }

        // 3. Trouver le Droit Spécifique à la Fonctionnalité
        const nomParametre = this.constructor.FORMAT_HISTORY[this.constructor.FORMAT_HISTORY.length - 1].nom_droit.replace('{abrev}', abrevFonctionnalite);
        const droitActuel = await objetDroit.lireParametre(nomParametre);
        if (droitActuel === null) {
            return false; // Pas de paramètre de droit pour cette fonctionnalité
        }

        // 4. Comparaison des Droits
        const indexDroitActuel = this.constructor.NIVEAUX_ORDONNES.indexOf(droitActuel);
        const indexDroitRequis = this.constructor.NIVEAUX_ORDONNES.indexOf(niveauRequis);

        if (indexDroitActuel === -1 || indexDroitRequis === -1) {
            console.warn(`[GestionnaireDroits] Niveau de droit invalide. Actuel: ${droitActuel}, Requis: ${niveauRequis}.`);
            return false; // Niveau de droit invalide
        }

        return indexDroitActuel >= indexDroitRequis;
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

        const formatInfo = this.constructor.FORMAT_HISTORY[this.constructor.FORMAT_HISTORY.length - 1];
        const nomParametrePseudo = formatInfo.nom_pseudo;

        // On délègue à l'objet droit, puis on simplifie le résultat
        const pseudoCible = typeof joueur === 'string' ? joueur : await joueur.lireParametre('pseudo');
        const droitsComplexes = await objetDroit.lireChaqueParametre();
        const droitsSimples = { [nomParametrePseudo]: pseudoCible };

        const templateNom = formatInfo.nom_droit; // e.g., 'droit_{abrev}'
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

        const templateNom = this.constructor.FORMAT_HISTORY[this.constructor.FORMAT_HISTORY.length - 1].nom_droit; // e.g., 'droit_{abrev}'
        
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
        const pseudoCible = typeof joueur === 'string' ? joueur : await joueur.lireParametre('pseudo');
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
        console.log('Rafraichissement gstionnaire droits')
        // 1. Chargement parallèle
        const [droitsActuels, membresOfficiels] = await Promise.all([
            fonctionnaliteAppelante.chargerObjetForumsMultiples(this.constructor.classeObjetsForumContenus),
            fonctionnaliteAppelante.chargerObjetForumsMultiples(Joueur) // Assurez-vous que la classe Joueur est disponible
        ]);

        // 2. Indexation et Synchronisation
        const nomParametrePseudo = this.constructor.FORMAT_HISTORY[this.constructor.FORMAT_HISTORY.length - 1].nom_pseudo;
        this.mapDroits.clear();
        for (const droit of droitsActuels) {
            const pseudo = await droit.lireParametre(nomParametrePseudo);
            if (pseudo) this.mapDroits.set(pseudo, droit);
        }

        const droitsSynchronises = [];
        const promessesEnregistrement = [];
        const membresTraites = new Set();

        // Détecter les droits obsolètes et les mettre en file pour ré-enregistrement
        for (const droit of droitsActuels) {
            const versionChargée = droit._determinerVersionChargee();
            const derniereVersionIndex = droit.constructor.CLASSES_PARAMETRES.length - 1;
            
            if (versionChargée < derniereVersionIndex) {
                console.log(`[GestionnaireDroits.rafraichir] Droit obsolète détecté pour le sujet ID ${droit.idSujet} (Version: ${versionChargée}, Attendu: ${derniereVersionIndex}). Ré-enregistrement planifié.`);
                promessesEnregistrement.push(droit.enregistrerSurForum());
            }
        }

        for (const membre of membresOfficiels) {
            const pseudoMembre = await membre.lireParametre('pseudo');
            if (membresTraites.has(pseudoMembre)) {
                continue;
            }
            membresTraites.add(pseudoMembre);

            let objetDroit = this.mapDroits.get(pseudoMembre);

            if (objetDroit) {
                droitsSynchronises.push(objetDroit);
            } else {
                // Nouveau membre : créer et sauvegarder ses droits par défaut
                console.log(`[GestionnaireDroits.rafraichir] Nouveau membre, création des droits par défaut pour: ${pseudoMembre}`);
                const donneesInitiales = {};
                donneesInitiales[nomParametrePseudo] = pseudoMembre;
                const nouvelObjetForumDroit = new this.constructor.classeObjetsForumContenus(fonctionnaliteAppelante, { donneesInitiales: donneesInitiales, objetParent: this });
                promessesEnregistrement.push(nouvelObjetForumDroit.enregistrerSurForum());
                droitsSynchronises.push(nouvelObjetForumDroit);
            }
        }

        // 3. Enregistrement parallèle des nouveaux membres et des droits corrigés
        if (promessesEnregistrement.length > 0) {
            console.log(`[GestionnaireDroits.rafraichir] Enregistrement de ${promessesEnregistrement.length} droits (nouveaux et/ou corrigés)...`);
            await Promise.all(promessesEnregistrement);
        }

        // 4. Mise à jour finale
        this.objetsForumContenus = droitsSynchronises;
        this.mapDroits.clear();
        console.log('droitsSynchronises', droitsSynchronises)
        cacheObjetForums.set(this.constructor.classeObjetsForumContenus.name, droitsSynchronises)
        for (const droit of this.objetsForumContenus) {
            const pseudo = await droit.lireParametre(nomParametrePseudo);
            if (pseudo) this.mapDroits.set(pseudo, droit);
        }
    }
})
