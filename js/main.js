/*
 * main.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe principale du projet : appelle les classes en fonction de la route.
*
* @class Main
*/
!async function () {

    // si l'utilisateur est identifié
    if ($(".boite_connexion_titre:first").text() != "Connexion") {
        // Récupération de la version depuis manifest.json
        const manifestURL = chrome.runtime.getURL('manifest.json');
        const manifestResponse = await fetch(manifestURL);
        const manifest = await manifestResponse.json();
        window.VERSION = manifest.version;

        // Modification du theme jquery humanity
        $("head").append("<link rel='stylesheet' href='http://code.jquery.com/ui/1.12.1/themes/humanity/jquery-ui.min.css'/>");
        // Chargement du language francais
        numeral.locale("fr");
        moment.locale("fr");

        Highcharts.setOptions({ lang: { months: MOIS_FR, shortMonths: MOIS_RAC_FR, weekdays: JOUR_FR, decimalPoint: ',', thousandsSep: ' ' } });
        // Ajout du tri pour les nombres
        $.fn.dataTable.ext.type.order["quantite-grade-pre"] = (d) => { return d ? parseInt(d.replace(/\s/g, '')) : 0; };
        $.fn.dataTable.ext.type.order["moment-D MMM YYYY-pre"] = (d) => { return d ? moment(d.replace('.', ''), "D MMM YYYY", "fr", true).unix() : 0; };
        $.fn.dataTable.ext.type.order["moment-D MMM [à] HH[h]mm-pre"] = (d) => { return d ? moment(d.replace('.', ''), "D MMM [à] HH[h]mm", "fr", true).unix() : 0; };
        $.fn.dataTable.ext.type.order["time-unformat-pre"] = (d) => { return d ? Utils.timeToInt(d) : 0; };

        // Configuration globale de DataTables (Français)
        $.extend(true, $.fn.dataTable.defaults, {
            bInfo: false,
            bAutoWidth: false,
            responsive: true,
            language: {
                zeroRecords: "Aucun résultat trouvé",
                info: "Page _PAGE_ de _PAGES_",
                infoEmpty: "Aucun enregistrement disponible",
                infoFiltered: "(filtré de _MAX_ enregistrements au total)",
                search: "Rechercher : ",
                paginate: {
                    first: "Premier",
                    last: "Dernier",
                    next: "Suivant",
                    previous: "Précédent"
                },
                buttons: {
                    colvis: "Colonnes",
                    copy: "Copier",
                    csv: "CSV",
                    excel: "Excel",
                    pdf: "PDF",
                    print: "Imprimer"
                }
            }
        });

        await initialiserFrameworkGlobal(); // Ensure framework is initialized before anything else

        // Charger et synchroniser les sections
        window.gestionnaireSections = new GestionnaireSections();

        window.gestionnaireVersions = new GestionnaireVersions();

        // Initialisation du profil du joueur en cours
        window.monProfilUtilisateur = new ProfilUtilisateur();
        // chargement des parametre
        await monProfilUtilisateur.getParametre();

        window.monProfilJoueur = new Joueur()

        // Chargement du joueur courant et affichage des outils
        await monProfilJoueur.chargerJoueurCourant().then(async (isLoaded) => {
            if (!isLoaded) {
                console.error("Impossible de charger les données du joueur courant. Les outils ne seront pas affichés.");
                return;
            }
            console.log('monProfilJoueur: ', monProfilJoueur)

            await gestionnaireSections.chargerSections();

            window.gestionnaireDroits = new GestionnaireDroits();

            // Ajout des outils
            let boite = new Dock();
            await boite.afficher();
            // boite compte plus
            window.boiteComptePlus = new BoiteComptePlus();
            await boiteComptePlus.afficher();
            // Boite radar
            window.boiteRadar = new BoiteRadar();
            await boiteRadar.afficher();

            // Traceur
            if (monProfilUtilisateur.parametre["cleTraceur"].valeur) {
                let traceur1 = new TraceurJoueur(monProfilUtilisateur.parametre["etatTraceurJoueur"].valeur, monProfilUtilisateur.parametre["intervalleTraceurJoueur"].valeur, monProfilUtilisateur.parametre["nbPageTraceurJoueur"].valeur);
                traceur1.tracer();
                let traceur2 = new TraceurAlliance(monProfilUtilisateur.parametre["etatTraceurAlliance"].valeur, monProfilUtilisateur.parametre["intervalleTraceurAlliance"].valeur);
                traceur2.tracer();
            }

            // Routing automatique via la fabrique Page
            let page = new Page();
            if (page) {
                console.log(`Page détectée : ${page.constructor.name}`);
                page.init();
            } else {
                console.log("Aucune classe de page correspondante trouvée pour cette URL.");
            }
        });
    }
}();

/**
 * Initialise les composants centraux du framework d'alliance.
 * Cette fonction est conçue pour être appelée au démarrage de l'extension
 * ou pour réparer un état global corrompu.
 */
async function initialiserFrameworkGlobal() {
    console.log("Initialisation du framework global...");

    // 1a. Construire le registre global de classes
    window.registreClasses = {
        FonctionnaliteAlliance: new Map(),
        ObjetForum: new Map(),
        Page: new Map()
    };

    // Parcours de l'objet window pour identifier les classes enregistrées via Utils.register
    for (const key of Object.getOwnPropertyNames(window)) {
        try {
            const ClassConstructor = window[key];
            if (typeof ClassConstructor === 'function' && ClassConstructor.prototype) {
                if (ClassConstructor.prototype instanceof ObjetForum) {
                    registreClasses.ObjetForum.set(key, ClassConstructor);
                    console.log(`  Added ${key} to ObjetForum registry (detected via prototype).`);
                } else if (ClassConstructor.prototype instanceof FonctionnaliteAlliance) {
                    registreClasses.FonctionnaliteAlliance.set(key, ClassConstructor);
                    console.log(`  Added ${key} to FonctionnaliteAlliance registry (detected via prototype).`);
                } else if (ClassConstructor.prototype instanceof Page) {
                    registreClasses.Page.set(key, ClassConstructor);
                    console.log(`  Added ${key} to Page registry (detected via prototype).`);
                }
            }
        } catch (error) {
            // Ignorer les erreurs d'accès sur certaines propriétés sécurisées de window
        }
    }

    console.log("Registre des classes 'ObjetForum':", registreClasses.ObjetForum);
    console.log("Registre des classes 'FonctionnaliteAlliance':", registreClasses.FonctionnaliteAlliance);


    // 1b. Créer la "carte des types" des variables globales
    window.carteDesTypes = new Map();
    const initURL = chrome.runtime.getURL('js/main.js');
    const initResponse = await fetch(initURL);
    const initContent = await initResponse.text();

    try {
        const ast = acorn.parse(initContent, { ecmaVersion: 2020 });

        // Simple AST traversal to find assignments to 'global'
        function traverse(node) {
            if (!node) return;

            if (node.type === 'AssignmentExpression' &&
                node.left.type === 'MemberExpression' &&
                node.left.object.type === 'Identifier' &&
                node.left.object.name === 'window' &&
                node.right.type === 'NewExpression') {

                const globalVarName = `window.${node.left.property.name}`;
                const className = node.right.callee.name;
                carteDesTypes.set(globalVarName, className);
            }

            for (const key in node) {
                if (node[key] && typeof node[key] === 'object') {
                    if (Array.isArray(node[key])) {
                        node[key].forEach(traverse);
                    } else {
                        traverse(node[key]);
                    }
                }
            }
        }

        traverse(ast);
    } catch (error) {
        console.error("Erreur lors de l'analyse AST de init.js:", error);
    }

    console.log("Carte des types des variables globales:", carteDesTypes);

    // 1c. Initialiser les caches globaux
    window.dependancesObjetForumsCache = new Map();
    window.appelsChargementCache = new Map();
    window.cacheObjetForums = new Map(); // Nouvelle variable globale
    window.sectionsEnCache = new Map();

    // Création de la liste globale des sections
    const sectionsMap = new Map();

    registreClasses.ObjetForum.forEach(ClasseObjetForum => {
        if (Array.isArray(ClasseObjetForum.LOCATION_HISTORY) && ClasseObjetForum.LOCATION_HISTORY.length > 0) {
            const classSections = new Map();
            const lastLieu = ClasseObjetForum.getLastLocation();
            const lastSectionName = lastLieu.section;

            ClasseObjetForum.LOCATION_HISTORY.forEach((lieu, index) => {
                if (lieu.section) {
                    const isMostRecentForSection = ClasseObjetForum.LOCATION_HISTORY.map(l => l.section).lastIndexOf(lieu.section) === index;
                    if (isMostRecentForSection) {
                        classSections.set(lieu.section, {
                            visibilite: lieu.visibilite || 'caché',
                            estDerniere: lieu.section === lastSectionName
                        });
                    }
                }
            });

            classSections.forEach((info, nom) => {
                if (sectionsMap.has(nom)) {
                    const existing = sectionsMap.get(nom);
                    const resolvedVisibilite = GestionnaireSections.getPlusRestrictif(existing.visibilite, info.visibilite);
                    const resolvedEstDerniere = existing.estDerniere || info.estDerniere;
                    sectionsMap.set(nom, {
                        nom: nom,
                        visibilite: resolvedVisibilite,
                        estDerniere: resolvedEstDerniere
                    });
                } else {
                    sectionsMap.set(nom, {
                        nom: nom,
                        visibilite: info.visibilite,
                        estDerniere: info.estDerniere
                    });
                }
            });
        }
    });

    window.sectionsRequises = new Set(sectionsMap.values());

    console.log("Sections requises découvertes :", sectionsRequises);

    // Création de la variable globale des transactions
    window.transaction = null;
    // window.transaction2 = null;
    // window.transaction3 = null;

    console.log("Framework global initialisé.");
}
