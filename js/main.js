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
        $.fn.dataTable.ext.type.order["quantite-grade-pre"] = (d) => { return parseInt(d.replace(/\s/g, '')); };
        $.fn.dataTable.ext.type.order["moment-D MMM YYYY-pre"] = (d) => { return moment(d.replace('.', ''), "D MMM YYYY", "fr", true).unix(); };
        $.fn.dataTable.ext.type.order["time-unformat-pre"] = (d) => { return Utils.timeToInt(d); };

        await initialiserFrameworkGlobal(); // Ensure framework is initialized before anything else

        // Chargement du joueur courant et affichage des outils
        await monProfilJoueur.chargerJoueurCourant().then(async (isLoaded) => {
            if (!isLoaded) {
                console.error("Impossible de charger les données du joueur courant. Les outils ne seront pas affichés.");
                return;
            }
            console.log('monProfilJoueur: ', monProfilJoueur)

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

            let uri = location.pathname, page = null;
            // Routing
            switch (true) {
                case (uri == "/Reine.php"):
                    page = new PageReine(boiteComptePlus);
                    if (!Utils.comptePlus) await page.plus();
                    break;
                case (uri == "/construction.php"):
                    page = new PageConstruction(boiteComptePlus);
                    page.executer();
                    break;
                case (uri == "/laboratoire.php"):
                    page = new PageLaboratoire(boiteComptePlus);
                    await page.executer();
                    break;
                case (uri == "/Ressources.php"):
                    page = new PageRessource(boiteComptePlus);
                    await page.executer();
                    break;
                case (uri == "/Armee.php"):
                    page = new PageArmee(boiteComptePlus);
                    await page.init();
                    break;
                case (uri == "/commerce.php"):
                    page = new PageCommerce();
                    page.init();
                    break;
                case (uri == "/messagerie.php"):
                    page = new PageMessagerie();
                    page.executer();
                    break;
                case (uri == "/alliance.php" && location.search == ""):
                case (uri == "/chat.php"):
                    page = new PageChat();
                    page.executer();
                    break;
                case (location.href.indexOf("/alliance.php?forum_menu") > 0):
                    page = new PageForum();
                    page.init();
                    break;
                case (location.href.indexOf("/alliance.php?Membres") > 0):
                    page = new PageAlliance();
                    page.init();
                    break;
                case (location.href.indexOf("/Membre.php?Pseudo") > 0):
                case (uri == "/Membre.php"):
                    page = new PageProfil(boiteRadar);
                    page.executer();
                    break;
                case (uri == "/classementAlliance.php" && Utils.extractUrlParams()["alliance"] != "" && Utils.extractUrlParams()["alliance"] != undefined):
                    page = new PageDescription(boiteRadar);
                    page.executer();
                    break;
                case (uri == "/colonies.php"):
                    page = new TestPage();
                    await page.init();
                    break;
                case (location.href.indexOf("/ennemie.php?Attaquer") > 0):
                case (location.href.indexOf("/ennemie.php?annuler") > 0):
                    page = new PageAttaquer(boiteComptePlus);
                    page.executer();
                    break;
                case (uri == "/ennemie.php" && location.search == ""):
                    // Affichage des temps de trajet
                    $("#tabEnnemie tr:eq(0) th:eq(5)").after("<th class='centre'>Temps</th>");
                    $("#tabEnnemie tr:gt(0)").each(async (i, elt) => {
                        let distance = parseInt($(elt).find("td:eq(5)").text());
                        let recherches = await monProfilJoueur.niveauRecherche;
                        $(elt).find("td:eq(5)").after(`<td class='centre'>${Utils.intToTime(Math.ceil(Math.pow(0.9, recherches[6]) * 637200 * (1 - Math.exp(-(distance / 350)))))}</td>`);
                    });
                    break;
                default:
                    break;
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
        ObjetForum: new Map()
    };

    const manifestURL = chrome.runtime.getURL('manifest.json');
    const manifestResponse = await fetch(manifestURL);
    const manifest = await manifestResponse.json();

    const allScripts = manifest.content_scripts.flatMap(script => script.js);

    // Dossiers susceptibles de contenir des classes pour le framework
    const classFolders = ['js/class/'];

    const classFiles = allScripts.filter(path =>
        classFolders.some(folder => path.startsWith(folder))
    );

    // Regex pour trouver les déclarations de classes héritant de ObjetForum ou FonctionnaliteAlliance
    const classRegex = /class\s+([a-zA-Z0-9_]+)\s+extends\s+(ObjetForum|FonctionnaliteAlliance)/g;

    for (const filePath of classFiles) {
        try {
            const fileURL = chrome.runtime.getURL(filePath);
            const fileResponse = await fetch(fileURL);
            const fileContent = await fileResponse.text();

            let match;
            while ((match = classRegex.exec(fileContent)) !== null) {
                const className = match[1];
                const parentName = match[2];
                const ClassConstructor = window[className];

                if (typeof ClassConstructor === 'function') {
                    console.log(`  Found class ${className} extending ${parentName}`);
                    if (parentName === 'ObjetForum') {
                        registreClasses.ObjetForum.set(className, ClassConstructor);
                        console.log(`      Added ${className} to ObjetForum registry.`);
                    } else if (parentName === 'FonctionnaliteAlliance') {
                        registreClasses.FonctionnaliteAlliance.set(className, ClassConstructor);
                        console.log(`      Added ${className} to FonctionnaliteAlliance registry.`);
                    }
                } else {
                    console.warn(`  Found class declaration for ${className} but constructor is not on window object.`);
                }
            }
        } catch (error) {
            console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
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
    window.cacheObjetForums = new Map(); // Nouvelle variable globale
    window.sectionsEnCache = new Map();

    // Création de la liste globale des sections
    window.nomsSectionsRequis = new Set();
    registreClasses.ObjetForum.forEach(ClasseObjetForum => {
        if (Array.isArray(ClasseObjetForum.LOCATION_HISTORY) && ClasseObjetForum.LOCATION_HISTORY.length > 0) {
            const dernierLieu = ClasseObjetForum.LOCATION_HISTORY[ClasseObjetForum.LOCATION_HISTORY.length - 1];
            if (dernierLieu.section) {
                nomsSectionsRequis.add(dernierLieu.section);
            }
        }
    });
    nomsSectionsRequis.add('Versions Outiiil');
    console.log("Sections requises découvertes :", nomsSectionsRequis);

    // Initialisation du profil du joueur en cours
    window.monProfilUtilisateur = new ProfilUtilisateur();
    // chargement des parametre
    await monProfilUtilisateur.getParametre();

    window.monProfilJoueur = new Joueur()

    // Créer les instances globales des gestionnaires
    window.gestionnaireDroits = new GestionnaireDroits();
    window.gestionnaireVersions = new GestionnaireVersions();
    await gestionnaireVersions.rafraichir(); // Assurez-vous que les versions sont chargées avant utilisation

    console.log("Framework global initialisé.");
}
