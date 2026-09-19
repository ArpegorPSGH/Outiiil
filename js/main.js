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
        window.manifest = manifest;
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

        window.logger = new Logger();
        await logger.instrumenterClassesFramework();

        // Charger et synchroniser les sections
        window.gestionnaireSections = new GestionnaireSections();

        window.gestionnaireVersions = new GestionnaireVersions();

        console.log("Sections requises découvertes :", sectionsRequises);

        // Initialisation du profil du joueur en cours
        window.monProfilUtilisateur = new ProfilUtilisateur();
        // chargement des parametre
        await monProfilUtilisateur.getParametre();

        window.monProfilJoueur = new Joueur()

        // Chargement du joueur courant et affichage des outils
        await monProfilJoueur.chargerJoueurCourant().then(async (isLoaded) => {
            try {
                if (!isLoaded) {
                    console.error("Impossible de charger les données du joueur courant. Les outils ne seront pas affichés.");
                    return;
                }
                console.log('monProfilJoueur: ', monProfilJoueur);
                // od = new OrdreRadar(null);
                // monProfilJoueur.attributs[5] = od;
                // monProfilJoueur.attributs.splice(8, 0, 'test');
                // monProfilJoueur.attributs.splice(13, 1);
                // console.error('test modifications:', monProfilJoueur);
                // console.log('monProfilUtilisateur', monProfilUtilisateur);
                // console.error('test verrouillage 2');
                // commandeTest = new Commande(null);
                // console.log('test duplication:', commandeTest);
                // await commandeTest.ecrire('Matériaux Demandés', 1000);
                // console.error('test');
                // listetest = ['Objet 1', 'Objet 2'];
                // dictest = { 'Objet 1': 'Objet 1', 'Objet 2': 'Objet 2' };
                // console.error('test duplication:', [{ 'listetest': listetest, 'dictest': dictest }, 'supplément']);
                // console.error('test duplication2:', [{ 'listetest': listetest, 'dictest': dictest }, 'supplément']);
                // console.error('test duplication2:', { base: [listetest, dictest], complement: 'supplément' });
                // console.error('test duplication2:', commandeTest);

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
                    await page.init();
                } else {
                    console.log("Aucune classe de page correspondante trouvée pour cette URL.");
                }
            } catch (e) {
                console.error("Erreur dans le main :", e);
                throw e;
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

    // 1a. Construire le registre global de classes
    window.registreClasses = {
        FonctionnaliteAlliance: new Map(),
        ObjetForum: new Map(),
        Page: new Map()
    };

    const classesMap = await Utils.decouvrirClasses();

    for (const [key, ClassConstructor] of classesMap.entries()) {
        try {
            if (ClassConstructor.prototype instanceof ObjetForum) {
                registreClasses.ObjetForum.set(key, ClassConstructor);
                // console.log(`  Added ${key} to ObjetForum registry (detected via prototype).`);
            } else if (ClassConstructor.prototype instanceof FonctionnaliteAlliance) {
                registreClasses.FonctionnaliteAlliance.set(key, ClassConstructor);
                // console.log(`  Added ${key} to FonctionnaliteAlliance registry (detected via prototype).`);
            } else if (ClassConstructor.prototype instanceof Page) {
                registreClasses.Page.set(key, ClassConstructor);
                // console.log(`  Added ${key} to Page registry (detected via prototype).`);
            }
        } catch (error) {
            // Ignorer
        }
    }

    console.log("Registre des classes 'ObjetForum':", registreClasses.ObjetForum);
    console.log("Registre des classes 'FonctionnaliteAlliance':", registreClasses.FonctionnaliteAlliance);
    console.log("Registre des classes 'Page':", registreClasses.Page);


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

    // Création de la variable globale des transactions
    window.transaction = null;
    // window.transaction2 = null;
    // window.transaction3 = null;

    // Déclenchement asynchrone de la vérification de mise à jour au chargement de page
    function afficherNotificationManuelle() {
        const releaseUrl = 'https://github.com/ArpegorPSGH/Outiiil/releases/latest';
        $.toast({
            heading: 'Mise à jour Outiiil',
            text: `La mise à jour automatique a échoué.<br/>Veuillez télécharger et installer manuellement la nouvelle version.<br/><a href="${releaseUrl}" target="_blank" style="display:inline-block; margin-top:8px; padding:4px 8px; background:#4CAF50; color:white; border-radius:3px; text-decoration:none; font-weight:bold;">Télécharger la nouvelle version</a>`,
            icon: 'error',
            loader: false,
            position: 'top-right',
            hideAfter: 15000
        });
    }

    chrome.runtime.sendMessage({ action: "requestUpdateCheck" }, (response) => {
        if (chrome.runtime.lastError) {
            console.log("Mise à jour Outiiil : canal fermé ou extension en cours de rechargement.");
            return;
        }
        if (response && (response.status === 'not_available' || response.status === 'error')) {
            const isWindows = navigator.platform.indexOf('Win') > -1;
            const scriptPath = isWindows ? 'scripts/autoriser_maj_windows.bat' : 'scripts/autoriser_maj_unix.sh';
            const aEteExecute = localStorage.getItem("outiiil_script_maj_execute") === "true";

            if (!aEteExecute) {
                // Étape 1 : Proposer d'exécuter le script de modification des autorisations sur l'hôte
                $.toast({
                    heading: 'Mise à jour Outiiil',
                    text: `La mise à jour automatique nécessite d'autoriser l'hôte.<br/><button id="outiiil-btn-script-maj" type="button" style="display:inline-block; margin-top:8px; padding:4px 8px; background:#2196F3; color:white; border:none; border-radius:3px; cursor:pointer; font-weight:bold;">Autoriser la mise à jour</button>`,
                    icon: 'warning',
                    loader: false,
                    position: 'top-right',
                    hideAfter: 15000
                });

                $(document).one('click', '#outiiil-btn-script-maj', (e) => {
                    e.preventDefault();
                    localStorage.setItem("outiiil_script_maj_execute", "true");
                    chrome.runtime.sendMessage({ action: "executerScriptAutorisation", scriptPath: scriptPath }, (res) => {
                        if (res && res.success) {
                            $.toast({
                                heading: 'Mise à jour Outiiil',
                                text: "Le script a été lancé. Validation en cours...",
                                icon: 'info',
                                loader: false,
                                position: 'top-right',
                                hideAfter: 5000
                            });

                            // Retenter une vérification de mise à jour après l'exécution du script
                            setTimeout(() => {
                                chrome.runtime.sendMessage({ action: "requestUpdateCheck", force: true }, (retryResponse) => {
                                    if (chrome.runtime.lastError) {
                                        console.log("Mise à jour Outiiil : canal fermé ou extension en cours de rechargement.");
                                        return;
                                    }
                                    if (retryResponse && (retryResponse.status === 'not_available' || retryResponse.status === 'error')) {
                                        afficherNotificationManuelle();
                                    } else if (retryResponse && (retryResponse.status === 'no_update' || retryResponse.status === 'throttled')) {
                                        localStorage.removeItem("outiiil_script_maj_execute");
                                    }
                                });
                            }, 5000);
                        } else {
                            console.error("Erreur lors de l'exécution du script d'autorisation :", res ? res.error : "inconnue");
                            afficherNotificationManuelle();
                        }
                    });
                });
            } else {
                // Étape 2 : Le script hôte a déjà été exécuté auparavant et la mise à jour échoue toujours
                afficherNotificationManuelle();
            }
        } else if (response && (response.status === 'throttled' || response.status === 'no_update' || response.status === 'throttled_locally')) {
            // Si la vérification a réussi ou qu'aucune mise à jour n'est en attente bloquée, réinitialiser le flag
            localStorage.removeItem("outiiil_script_maj_execute");
        }
    });

}
