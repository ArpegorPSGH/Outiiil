Utils.register(class Logger {

    historique = [];
    idSujet = null;
    sujetCreeParCetteInstance = false;
    dernierLogEnvoye = null;
    #lockAcquired = false;
    #lockQueue = [];
    #enTrainDePoster = false;
    #promessePosteEnCours = null;

    serialisationsVues = new Map();
    nextRefKeyIndex = 1;
    clesPublieesAvecRefKey = new Set();
    registreEmplacementsRefKeys = new Map();
    messagesPublies = new Map();
    snapshotsMap = new Map();
    instancesVisibles = new Set();

    instanceIds = new WeakMap();
    metaMap = new WeakMap();
    promiseStates = new WeakMap();
    nextInstanceId = 0;

    /**
     * Suivi de l'état d'une promesse.
     * @param {Promise} p
     * @private
     */
    #suivrePromise(p) {
        if (!p || (typeof p !== "object" && typeof p !== "function") || typeof p.then !== "function") return;
        if (this.promiseStates.has(p)) return;

        this.promiseStates.set(p, { state: "pending", value: undefined, reason: undefined });
        try {
            p.then(
                v => { this.promiseStates.set(p, { state: "fulfilled", value: v, reason: undefined }); },
                r => { this.promiseStates.set(p, { state: "rejected", value: undefined, reason: r }); }
            );
        } catch (e) {
            // Ignorer
        }
    }

    /**
     * Associe des métadonnées de sérialisation à un objet.
     * @param {Object} obj
     * @param {Object} meta
     * @private
     */
    #setMeta(obj, meta) {
        if (obj && typeof obj === "object") {
            const existing = this.metaMap.get(obj) || {};
            this.metaMap.set(obj, { ...existing, ...meta });
        }
    }

    /**
     * Récupère les métadonnées de sérialisation d'un objet.
     * @param {Object} obj
     * @returns {Object|undefined}
     * @private
     */
    #getMeta(obj) {
        if (obj && typeof obj === "object") {
            return this.metaMap.get(obj);
        }
        return undefined;
    }


    /**
     * Acquire le verrou pour accéder au gestionnaire de logs.
     * @returns {Promise} - Promise qui sera résolue lorsque le verrou sera acquis.
     * @private
     */
    #acquireLock() {
        return new Promise(resolve => {
            const tryAcquire = () => {
                if (this.#lockAcquired) {
                    this.#lockQueue.push(tryAcquire);
                } else {
                    this.#lockAcquired = true;
                    resolve();
                }
            };
            tryAcquire();
        });
    }

    /**
     * Libère le verrou du gestionnaire de logs.
     * @private
     */
    #releaseLock() {
        this.#lockAcquired = false;
        if (this.#lockQueue.length > 0) {
            const nextInQueue = this.#lockQueue.shift();
            nextInQueue();
        }
    }

    constructor() {
        sectionsRequises.add({
            nom: 'Logs Outiiil',
            visibilite: 'caché', // Réservé aux administrateurs de l'alliance pour préserver la confidentialité
            estDerniere: true
        });
    }

    get estEnTrainDePoster() {
        return this.#enTrainDePoster || this.#promessePosteEnCours !== null;
    }

    /**
     * Verifie si l'objet est une classe de base.
     * @param {Objet} val - L'objet à vérifier.
     * @returns {Boolean} - True si l'objet est une classe de base, false sinon.
     * @private
     */
    #estObjetBase(val) {
        if (!val || typeof val !== "object") return false;
        const ctor = val.constructor;
        if (!ctor) return true;
        const name = ctor.name;
        return !name || name === "Object" || name === "Array" || name === "Set" || name === "Map" || name === "WeakSet" || name === "WeakMap" || name === "Promise";
    }

    /**
     * Verifie si l'objet est une classe d'extension.
     * @param {Objet} val - L'objet à vérifier.
     * @returns {Boolean} - True si l'objet est une classe d'extension, false sinon.
     * @private
     */
    #estClasseExtension(val) {
        if (!val || typeof val !== "object") return false;
        const ctor = val.constructor;
        const name = (ctor && ctor.name) ? ctor.name : null;
        if (name && !this.#estObjetBase(val)) {
            if (window.classesCache && window.classesCache.has(name)) return true;
            if (window[name] === ctor || globalThis[name] === ctor) return true;
        }
        return false;
    }

    /**
     * Assigne un identifiant unique à chaque instance d'objet.
     * @param {Objet} val - L'objet à assigner.
     * @returns {Number} - L'identifiant de l'objet.
     * @private
     */
    #assurerInstanceId(val) {
        if (!val || typeof val !== "object") {
            return undefined;
        }
        if (!this.instanceIds.has(val)) {
            this.instanceIds.set(val, this.nextInstanceId++);
        }
        return this.instanceIds.get(val);
    }

    /**
     * Traite un element serialise.
     * @param {Objet} item - L'element à traiter.
     * @param {Set} pile - La pile d'elements.
     * @param {Boolean} parentHorsExtension - Si le parent est hors extension.
     * @param {Number} [profondeur=0] - La profondeur actuelle de sérialisation.
     * @returns {String|Object|Array} - L'element serialise.
     * @private
     */
    #traiterElementSerialise(item, pile, parentHorsExtension, profondeur = 0) {
        if (parentHorsExtension) {
            if (item !== null && typeof item === "object") {
                const name = (item.constructor && item.constructor.name) ? item.constructor.name : "Object";
                const instanceId = this.#assurerInstanceId(item);
                const idStr = instanceId !== undefined ? ` (ID: ${instanceId})` : "";
                return `[Class: ${name}${idStr}]`;
            } else {
                return this.#serialiser(item, pile, true, profondeur);
            }
        }
        return this.#serialiser(item, pile, false, profondeur);
    }

    /**
     * Serialise un element.
     * @param {Objet} val - L'element à #serialiser.
     * @param {Set} pile - La pile d'elements.
     * @param {Boolean} parentHorsExtension - Si le parent est hors extension.
     * @param {Number} [profondeur=0] - La profondeur actuelle de sérialisation.
     * @returns {String|Object|Array} - L'element serialise.
     * @private
     */
    #serialiser(val, pile = new Set(), parentHorsExtension = false, profondeur = 0) {
        if (val === null) return "null";
        if (val === undefined) return "undefined";
        if (typeof val === "function") {
            const fnStr = Function.prototype.toString.call(val);
            const estClasse = /^\s*class\s+/.test(fnStr) ||
                (val.prototype && (val.prototype.constructor === val || val.prototype.constructor?.name === val.name)) ||
                /^[A-Z]/.test(val.name || "");
            return estClasse ? `[Class: ${val.name || 'Object'}]` : `[Function: ${val.name || 'anonymous'}]`;
        }
        if (typeof val === "symbol") return val.toString();
        if (typeof val === "bigint") return `${val}n`;
        if (typeof val === "string") {
            if (val.length > MAX_STR_LEN) {
                return `${val.substring(0, MAX_STR_LEN)}... [tronqué, longueur totale : ${val.length}]`;
            }
            return val;
        }
        if (typeof val !== "object") return val;

        if (val instanceof Boolean || Object.prototype.toString.call(val) === "[object Boolean]") {
            return val.valueOf();
        }

        if (val instanceof Number || Object.prototype.toString.call(val) === "[object Number]") {
            return val.valueOf();
        }

        if (val instanceof String || Object.prototype.toString.call(val) === "[object String]") {
            const str = val.valueOf();
            if (str.length > MAX_STR_LEN) {
                return `${str.substring(0, MAX_STR_LEN)}... [tronqué, longueur totale : ${str.length}]`;
            }
            return str;
        }

        const estMoment = val && typeof val === "object" && (
            val._isAMomentObject === true ||
            (val.constructor && val.constructor.name === "Moment") ||
            (typeof val.isValid === "function" && typeof val.toISOString === "function" && typeof val.format === "function")
        );
        if (estMoment) {
            const className = (val.constructor && val.constructor.name) ? val.constructor.name : "Moment";
            const isValide = typeof val.isValid === "function" ? val.isValid() : (val._d instanceof Date ? !isNaN(val._d.getTime()) : true);
            let dateStr = "Invalid Date";
            if (isValide) {
                if (typeof val.toISOString === "function") {
                    try { dateStr = val.toISOString(); } catch (e) { dateStr = String(val); }
                } else if (val._d instanceof Date) {
                    dateStr = val._d.toISOString();
                } else {
                    dateStr = String(val);
                }
            }
            return `[${className}: ${dateStr}]`;
        }

        if (val instanceof Date || Object.prototype.toString.call(val) === "[object Date]") {
            return `[Date: ${isNaN(val.getTime()) ? "Invalid Date" : val.toISOString()}]`;
        }

        if (val instanceof RegExp || Object.prototype.toString.call(val) === "[object RegExp]") {
            return `[RegExp: ${val.toString()}]`;
        }

        if (val instanceof WeakSet || Object.prototype.toString.call(val) === "[object WeakSet]") {
            return "[WeakSet]";
        }

        if (val instanceof WeakMap || Object.prototype.toString.call(val) === "[object WeakMap]") {
            return "[WeakMap]";
        }

        const estPromise = val instanceof Promise || Object.prototype.toString.call(val) === "[object Promise]" || (val && typeof val === "object" && typeof val.then === "function");
        if (estPromise) {
            this.#suivrePromise(val);
            const info = this.promiseStates.get(val) || { state: "pending", value: undefined, reason: undefined };
            const name = (val.constructor && val.constructor.name) ? val.constructor.name : "Promise";

            const res = {
                state: info.state
            };

            const estDansExtension = this.#estObjetBase(val) || this.#estClasseExtension(val);
            const doitLimiterSousObjets = parentHorsExtension || !estDansExtension;

            if (info.state === "fulfilled") {
                const s = this.#traiterElementSerialise(info.value, pile, doitLimiterSousObjets, profondeur + 1);
                res.value = s !== undefined ? s : undefined;
            } else if (info.state === "rejected") {
                const s = this.#traiterElementSerialise(info.reason, pile, doitLimiterSousObjets, profondeur + 1);
                res.reason = s !== undefined ? s : undefined;
            } else {
                res.value = undefined;
            }

            const instanceId = this.#assurerInstanceId(val);
            if (instanceId !== undefined) {
                this.#setMeta(res, { class: name, id: instanceId });
            }
            return res;
        }

        if (val instanceof Error || Object.prototype.toString.call(val) === "[object Error]") {
            const keys = Array.from(new Set([...Object.keys(val), ...Object.getOwnPropertyNames(val)]));
            const customKeys = keys.filter(k => !["name", "message", "stack", "fileName", "lineNumber", "columnNumber"].includes(k));
            if (customKeys.length === 0) {
                return val.stack ? this.#nettoyerStacktrace(val.stack) : `${val.name || 'Error'}: ${val.message}`;
            }

            const name = (val.constructor && val.constructor.name) ? val.constructor.name : "Error";
            const instanceId = this.#assurerInstanceId(val);
            const idStr = instanceId !== undefined ? ` (ID: ${instanceId})` : "";

            if (pile.has(val)) {
                return `[Circular: ${name}${idStr}]`;
            }
            if (profondeur >= LOGGER_PROFONDEUR_MAX) {
                return `[Class: ${name}${idStr}]`;
            }

            pile.add(val);

            const errObj = {
                name: val.name || name,
                message: val.message
            };
            if (val.stack) {
                errObj.stack = this.#nettoyerStacktrace(val.stack);
            }

            if (instanceId !== undefined) {
                this.#setMeta(errObj, { class: name, id: instanceId });
            }

            const estBase = this.#estObjetBase(val);
            const estDansExtension = estBase || this.#estClasseExtension(val);
            const estClasseHorsExtension = !estDansExtension;
            const doitLimiterSousObjets = parentHorsExtension || estClasseHorsExtension;

            for (const key of customKeys) {
                let subVal;
                try {
                    subVal = val[key];
                } catch (e) {
                    continue;
                }
                if (typeof subVal === "function") continue;
                const s = this.#traiterElementSerialise(subVal, pile, doitLimiterSousObjets, profondeur + 1);
                if (s !== undefined) {
                    errObj[key] = s;
                }
            }

            pile.delete(val);
            return errObj;
        }

        let name = "Object";
        if (val.constructor && val.constructor.name) {
            name = val.constructor.name;
        }

        const instanceId = this.#assurerInstanceId(val);
        const idStr = instanceId !== undefined ? ` (ID: ${instanceId})` : "";

        // 1. Détection de circularité (objet en cours de parcours dans la branche parente active)
        if (pile.has(val)) {
            return `[Circular: ${name}${idStr}]`;
        }

        // 2. Limite de profondeur de sérialisation
        if (profondeur >= LOGGER_PROFONDEUR_MAX) {
            return `[Class: ${name}${idStr}]`;
        }

        pile.add(val);

        if (typeof jQuery !== "undefined" && val instanceof jQuery) {
            let summary = `[jQuery: length=${val.length}`;
            if (val.selector) summary += `, selector='${val.selector}'`;
            summary += `]`;
            pile.delete(val);
            return summary;
        }

        if (typeof HTMLElement !== "undefined" && val instanceof HTMLElement) {
            const tag = val.tagName ? val.tagName.toLowerCase() : "element";
            const id = val.id ? `#${val.id}` : "";
            const cls = val.className ? `.${val.className.split(/\s+/).filter(Boolean).join(".")}` : "";
            pile.delete(val);
            return `[DOM: ${tag}${id}${cls}]`;
        }

        const estBase = this.#estObjetBase(val);
        const estDansExtension = estBase || this.#estClasseExtension(val);
        const estClasseHorsExtension = !estDansExtension;

        // La limitation au niveau N+1 ne s'active que si on était DÉJÀ sous une classe hors-extension
        // OU si le présent objet est lui-même une classe hors-extension.
        const doitLimiterSousObjets = parentHorsExtension || estClasseHorsExtension;

        let entrees = [];
        const estTableauOuSet = Array.isArray(val) || val instanceof Set || Object.prototype.toString.call(val) === "[object Set]";
        const estMap = val instanceof Map || Object.prototype.toString.call(val) === "[object Map]";

        if (estTableauOuSet) {
            let iterable = [];
            if (typeof val[Symbol.iterator] === "function") {
                iterable = val;
            } else if (typeof val.values === "function") {
                iterable = val.values();
            }
            try {
                for (const item of iterable) {
                    entrees.push([null, item]);
                }
            } catch (e) { }
        } else if (estMap) {
            let entriesIterable = [];
            if (typeof val.entries === "function") {
                entriesIterable = val.entries();
            } else if (typeof val[Symbol.iterator] === "function") {
                entriesIterable = val;
            }
            try {
                for (const [k, v] of entriesIterable) {
                    let keyStr;
                    if (typeof k === "object" && k !== null) {
                        const sKey = this.#serialiser(k, pile, doitLimiterSousObjets, profondeur + 1);
                        keyStr = typeof sKey === "object" ? JSON.stringify(sKey) : String(sKey);
                    } else {
                        keyStr = String(k);
                    }
                    entrees.push([keyStr, v]);
                }
            } catch (e) { }
        } else {
            for (const key of Object.keys(val)) {
                const subVal = val[key];
                if (typeof subVal === "function") continue;
                entrees.push([key, subVal]);
            }
        }

        let res;
        if (estTableauOuSet) {
            res = [];
            if (instanceId !== undefined) {
                this.#setMeta(res, { class: name, id: instanceId });
            }
            for (const [, item] of entrees) {
                const s = this.#traiterElementSerialise(item, pile, doitLimiterSousObjets, profondeur + 1);
                if (s !== undefined) {
                    res.push(s);
                }
            }
        } else {
            res = {};
            if (instanceId !== undefined) {
                this.#setMeta(res, { class: name, id: instanceId });
            }
            for (const [key, item] of entrees) {
                const s = this.#traiterElementSerialise(item, pile, doitLimiterSousObjets, profondeur + 1);
                if (s !== undefined) {
                    res[key] = s;
                }
            }
        }

        pile.delete(val);
        return res;
    }

    /**
     * Extrait les frames pertinentes d'une stacktrace (sous forme de tableau de clés 'fichier:fonction').
     * Ignorer les numéros de ligne permet d'avoir une distance de 0 pour les logs situés dans la même fonction que l'erreur.
     * @param {String} stack
     * @returns {Array<String>}
     * @private
     */
    #extraireFramesStack(stack) {
        if (!stack) return [];
        const className = this.constructor.name;
        const lines = String(stack).split("\n");
        const frames = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            if (line.includes(className) || line.includes("console")) continue;

            let match = line.match(/at\s+(?:async\s+)?([^\s(]+)\s+\((.+):(\d+):(\d+)\)/);
            if (match) {
                const fn = match[1].startsWith("Proxy.") ? match[1].substring(6) : match[1];
                const chemin = match[2].split("/").pop();
                frames.push(`${chemin}:${fn}`);
            } else {
                match = line.match(/at\s+(?:async\s+)?(.+):(\d+):(\d+)/);
                if (match) {
                    const urlOuChemin = match[1];
                    const chemin = urlOuChemin.split("/").pop();
                    frames.push(`${chemin}:anonymous`);
                }
            }
        }
        return frames;
    }

    /**
     * Calcule la distance dans l'arbre d'appel (nombre de montées + descentes via l'ancêtre commun) entre deux piles de frames.
     * Les tableaux de frames vont du frame appelant direct (index 0) vers le fond de la pile (index max).
     * @param {Array<String>} stackA - Frames de l'erreur
     * @param {Array<String>} stackB - Frames du log cible
     * @returns {Number}
     * @private
     */
    #calculerDistanceStack(stackA, stackB) {
        if (!stackA || !stackB || stackA.length === 0 || stackB.length === 0) {
            return Infinity;
        }

        // On inverse les tableaux pour partir de la racine commune (fond de pile) vers les sommets
        const rootA = stackA.slice().reverse();
        const rootB = stackB.slice().reverse();

        let lcaIndex = 0; // plus grand indice d'ancêtre commun depuis la racine
        while (lcaIndex < rootA.length && lcaIndex < rootB.length && rootA[lcaIndex] === rootB[lcaIndex]) {
            lcaIndex++;
        }

        if (lcaIndex === 0) {
            // Aucun ancêtre commun trouvé
            return Infinity;
        }

        const montees = rootA.length - lcaIndex;
        const descentes = rootB.length - lcaIndex;
        return montees + descentes;
    }

    /**
     * Nettoie un stacktrace.
     * @param {String} stack - Le stacktrace à nettoyer.
     * @returns {String} - Le stacktrace nettoyé.
     * @private
     */
    #nettoyerStacktrace(stack) {
        if (!stack) return "";
        const className = this.constructor.name;
        const lines = String(stack).split("\n");
        if (lines.length === 0) return "";
        const filteredLines = [lines[0]];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(className) || line.includes("console")) {
                continue;
            }
            filteredLines.push(line);
        }
        return filteredLines.join("\n");
    }

    /**
     * Extrait les informations du stacktrace.
     * @param {String} stack - Le stacktrace.
     * @returns {Object} - Les informations extraites.
     * @private
     */
    #extraireInfosStack(stack) {
        if (!stack) return { fichier: "unknown", fonction: "anonymous", ligne: "0" };
        const className = this.constructor.name;
        const lines = stack.split("\n");
        let targetLine = null;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            // Ignore Logger methods and monkey-patched console methods
            if (line.includes(className) || line.includes("console")) {
                continue;
            }
            if (!targetLine) {
                targetLine = line;
                break;
            }
        }

        if (!targetLine) targetLine = lines[1] || "";

        let fonction = "anonymous";
        let fichier = "unknown";
        let ligne = "0";

        let match = targetLine.match(/at\s+(?:async\s+)?([^\s(]+)\s+\((.+):(\d+):(\d+)\)/);
        if (match) {
            fonction = match[1];
            const cheminComplet = match[2];
            ligne = match[3];
            const parties = cheminComplet.split("/");
            fichier = parties[parties.length - 1];
        } else {
            match = targetLine.match(/at\s+(?:async\s+)?(.+):(\d+):(\d+)/);
            if (match) {
                const cheminComplet = match[1];
                ligne = match[2];
                const parties = cheminComplet.split("/");
                fichier = parties[parties.length - 1];
            } else {
                match = targetLine.match(/at\s+(?:async\s+)?([^\s(]+)\s+\(<anonymous>\)/);
                if (match) {
                    fonction = match[1];
                    fichier = "native:code";
                }
            }
        }

        if (fonction.startsWith("Proxy.")) {
            fonction = fonction.substring(6);
        }
        if (fichier === "unknown") {
            fichier = "native:code";
        }

        return { fichier, fonction, ligne };
    }

    /**
     * surcharge les methodes de console.
     * @static
     */
    static surcharge() {
        if (!LOGGER_ACTIF) return;
        const className = this.name;

        // Augmenter la limite par défaut de V8/Chromium (10 frames par défaut) pour capturer l'intégralité de l'arbre d'appel
        if (typeof Error.stackTraceLimit === "number" && Error.stackTraceLimit < 100) {
            Error.stackTraceLimit = 100;
        }

        if (typeof Promise !== "undefined" && !Promise._resolve) {
            Promise._resolve = Promise.resolve;
            Promise.resolve = function (val) {
                const p = Promise._resolve.call(Promise, val);
                if (window.logger) {
                    logger.promiseStates.set(p, { state: "fulfilled", value: val, reason: undefined });
                }
                return p;
            };

            Promise._reject = Promise.reject;
            Promise.reject = function (reason) {
                const p = Promise._reject.call(Promise, reason);
                if (window.logger) {
                    logger.promiseStates.set(p, { state: "rejected", value: undefined, reason: reason });
                }
                return p;
            };
        }

        if (console._log) return; // Déjà surchargé

        console._log = console.log;
        console._warn = console.warn;
        console._error = console.error;

        console.log = function (...args) {
            if (window.logger) logger.enregistrerLog("info", args);
            console._log.apply(console, args);
        };

        console.warn = function (...args) {
            if (window.logger) logger.enregistrerLog("warn", args);
            console._warn.apply(console, args);
        };

        console.error = function (...args) {
            if (window.logger) logger.enregistrerLog("error", args);
            console._error.apply(console, args);

            if (window.logger) {
                // Remontée automatique des erreurs
                try {
                    let errorObj = args.find(arg => arg instanceof Error);
                    if (!errorObj) {
                        const message = args.map(arg => {
                            if (typeof arg === "object" && arg !== null) {
                                try { return JSON.stringify(arg); } catch (e) { return String(arg); }
                            }
                            return String(arg);
                        }).join(" ");
                        errorObj = new Error(message || "Console error");
                    }
                    if (errorObj.stack) {
                        errorObj.stack = logger.#nettoyerStacktrace(errorObj.stack);
                    }
                    logger.posterLogs(errorObj).then(postes => {
                        if (postes) {
                            $.toast({ ...TOAST_INFO, text: "Erreur technique transmise automatiquement." });
                        }
                    }).catch(e => {
                        if (console._error) {
                            console._error(`[${className}.surcharge] Erreur lors de posterLogs depuis console.error:`, e);
                        }
                    });
                } catch (err) {
                    if (console._error) {
                        console._error(`[${className}.surcharge] Erreur critique dans console.error surcharge:`, err);
                    }
                }
            }
        };
    }

    /**
     * Vider l'historique des logs enregistrés.
     * @async
     */
    async viderHistorique() {
        if (this.#promessePosteEnCours) {
            try {
                await this.#promessePosteEnCours;
            } catch (e) { }
        }
        await this.#acquireLock();
        try {
            this.historique = [];
            this.idSujet = null;
            this.sujetCreeParCetteInstance = false;
            this.dernierLogEnvoye = null;
            this.#enTrainDePoster = false;
            this.#promessePosteEnCours = null;
            this.serialisationsVues = new Map();
            this.nextRefKeyIndex = 1;
            this.clesPublieesAvecRefKey = new Set();
            this.registreEmplacementsRefKeys = new Map();
            this.messagesPublies = new Map();
            this.snapshotsMap = new Map();
            this.instancesVisibles = new Set();
            this.instanceIds = new WeakMap();
            this.metaMap = new WeakMap();
            this.promiseStates = new WeakMap();
            this.nextInstanceId = 0;
        } finally {
            this.#releaseLock();
        }
    }

    /**
     * Vérifie si un log provient d'une classe ou procédure à ignorer (Logger, BoiteSignalement, Signalement).
     * @param {Object|null} infos - Les informations d'extraireInfosStack.
     * @param {Array} [args=[]] - Les arguments transmis.
     * @returns {Boolean}
     * @private
     */
    #estLogAIgnorer(infos, args = []) {
        const className = this.constructor.name;
        const targetClasses = ["BoiteSignalement", "Signalement", className];

        if (infos && infos.fichier) {
            if (targetClasses.some(cls => infos.fichier.includes(cls))) {
                return true;
            }
        }

        if (args && args.length > 0) {
            const premierArg = String(args[0] || "");
            if (premierArg.startsWith("[Entrée]") || premierArg.startsWith("[Sortie]") || premierArg.startsWith("[Sortie Exception]")) {
                if (targetClasses.some(cls => premierArg.includes(` ${cls}.`))) {
                    return true;
                }
            }
            for (const arg of args) {
                if (arg && typeof arg === "object" && arg.constructor && arg.constructor.name) {
                    if (targetClasses.includes(arg.constructor.name)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Vérifie si un objet log stocké dans l'historique provient d'une classe ou procédure à ignorer.
     * @param {Object} log - Objet log dans l'historique.
     * @returns {Boolean}
     * @private
     */
    #estLogAIgnorerDansHistorique(log) {
        if (!log) return false;
        const className = this.constructor.name;
        const targetClasses = ["BoiteSignalement", "Signalement", className];

        if (log.fichier && targetClasses.some(cls => log.fichier.includes(cls))) return true;

        if (Array.isArray(log.arguments) && log.arguments.length > 0) {
            const premierArg = String(log.arguments[0] || "");
            if (premierArg.startsWith("[Entrée]") || premierArg.startsWith("[Sortie]") || premierArg.startsWith("[Sortie Exception]")) {
                if (targetClasses.some(cls => premierArg.includes(` ${cls}.`))) {
                    return true;
                }
            }
            for (const arg of log.arguments) {
                if (arg && typeof arg === "object") {
                    const meta = this.#getMeta(arg);
                    if (meta && targetClasses.includes(meta.class)) {
                        return true;
                    }
                } else if (typeof arg === "string") {
                    if (targetClasses.some(cls => arg.includes(`[${cls}`) || arg.includes(`[Class: ${cls}`) || arg.includes(` ${cls}.`))) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    async enregistrerLog(type, args) {
        const date = Date.now();
        const stackConsole = new Error().stack;
        const errorObj = args.find(arg => arg instanceof Error || (arg && Object.prototype.toString.call(arg) === "[object Error]"));
        const stackUtilisee = (errorObj && errorObj.stack) ? errorObj.stack : stackConsole;

        if (this.#estLogAIgnorer(null, args)) {
            return;
        }

        // Sérialisation synchrone immédiate pour figer l'état au moment de l'appel
        const argsSerialises = args.map(arg => this.#serialiser(arg, new Set()));

        await this.#acquireLock();
        try {
            const infos = this.#extraireInfosStack(stackUtilisee);
            if (!infos) return;

            if (this.#estLogAIgnorer(infos, args)) {
                return;
            }

            const logObj = {
                date,
                type,
                fichier: infos.fichier,
                fonction: infos.fonction,
                ligne: infos.ligne,
                stackFrames: this.#extraireFramesStack(stackUtilisee),
                arguments: argsSerialises,
                fullStack: (type === "error" && (!errorObj || !errorObj.stack)) ? this.#nettoyerStacktrace(stackUtilisee) : undefined
            };

            this.historique.push(logObj);
        } catch (e) {
            if (console._error) {
                console._error(`Erreur lors de la journalisation du ${this.constructor.name}:`, e);
            }
        } finally {
            this.#releaseLock();
        }
    }

    /**
     * Duplique profondément la structure d'un objet/snapshot en préservant les métadonnées de WeakMap
     * et en évitant les récursions infinies sur cycles.
     * @param {*} val
     * @param {Map} [visited=new Map()]
     * @returns {*}
     * @private
     */
    #clonerSnapshot(val, visited = new Map()) {
        if (val === null || typeof val !== "object") return val;
        if (visited.has(val)) return visited.get(val);

        let clone;
        if (Array.isArray(val)) {
            clone = [];
            visited.set(val, clone);
            for (let i = 0; i < val.length; i++) {
                clone[i] = this.#clonerSnapshot(val[i], visited);
            }
        } else {
            clone = {};
            visited.set(val, clone);
            for (const k of Object.keys(val)) {
                clone[k] = this.#clonerSnapshot(val[k], visited);
            }
        }

        const meta = this.#getMeta(val);
        if (meta) {
            this.#setMeta(clone, meta);
        }
        return clone;
    }

    /**
     * Extrait l'identifiant d'instance d'une chaîne représentant une référence circulaire ou une instance.
     * @param {String} str
     * @returns {Number|undefined}
     * @private
     */
    #extraireIdDeChaine(str) {
        if (typeof str !== "string") return undefined;
        const match = str.match(/\(ID:\s*(\d+)\)/);
        return match ? Number(match[1]) : undefined;
    }

    /**
     * Vérifie si une valeur ou une de ses sous-propriétés contient une forme de troncature (de profondeur ou de longueur).
     * @param {*} val - La valeur sérialisée à vérifier.
     * @param {Set} [visite=new Set()] - Garde contre les récursions.
     * @returns {Boolean}
     * @private
     */
    #estEtatTronque(val, visite = new Set(), estRacine = true) {
        if (val === null || val === undefined) return false;
        if (typeof val === "string") {
            if (val.includes("[tronqué, longueur totale :")) return true;
            if (/^\[Class:\s+[^\n\]]+\]$/.test(val)) return true;
            if (/^\[Circular:\s+[^\n\]]+\]$/.test(val)) return estRacine;
            return false;
        }
        if (typeof val !== "object") return false;
        if (visite.has(val)) return false;
        visite.add(val);

        if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
                if (this.#estEtatTronque(val[i], visite, false)) return true;
            }
        } else {
            for (const k of Object.keys(val)) {
                if (this.#estEtatTronque(val[k], visite, false)) return true;
            }
        }
        return false;
    }

    #sontElementsApparies(itemA, itemB) {
        const idA = (typeof itemA === "object" && itemA !== null ? this.#getMeta(itemA)?.id : undefined) ?? this.#extraireIdDeChaine(itemA);
        const idB = (typeof itemB === "object" && itemB !== null ? this.#getMeta(itemB)?.id : undefined) ?? this.#extraireIdDeChaine(itemB);

        if (idA !== undefined || idB !== undefined) {
            return idA !== undefined && idB !== undefined && idA === idB;
        }

        const estObjetA = typeof itemA === "object" && itemA !== null;
        const estObjetB = typeof itemB === "object" && itemB !== null;

        if (estObjetA || estObjetB) {
            if (!estObjetA || !estObjetB) return false;
            try {
                return JSON.stringify(itemA) === JSON.stringify(itemB);
            } catch (e) {
                return false;
            }
        }

        // Deux primitives sans ID d'instance peuvent être appariées (alignées par position/modification)
        return true;
    }

    #sontElementsEquivalents(itemA, itemB) {
        if (itemA === itemB) return true;
        if (itemA === null || itemA === undefined || itemB === null || itemB === undefined) return false;

        const idA = (typeof itemA === "object" && itemA !== null ? this.#getMeta(itemA)?.id : undefined) ?? this.#extraireIdDeChaine(itemA);
        const idB = (typeof itemB === "object" && itemB !== null ? this.#getMeta(itemB)?.id : undefined) ?? this.#extraireIdDeChaine(itemB);

        if (idA !== undefined || idB !== undefined) {
            return idA !== undefined && idB !== undefined && idA === idB;
        }

        if (typeof itemA !== "object" || typeof itemB !== "object") {
            return false;
        }

        try {
            return JSON.stringify(itemA) === JSON.stringify(itemB);
        } catch (e) {
            return false;
        }
    }

    /**
     * Fusionne la nouvelle valeur sérialisée avec le snapshot précédent pour conserver
     * systématiquement le dernier état connu sans perdre les sous-objets non tronqués.
     * @param {*} val - La nouvelle valeur sérialisée.
     * @param {*} prev - Le snapshot précédent.
     * @returns {*}
     * @private
     */
    #fusionnerSnapshot(val, prev) {
        if (val === null || val === undefined) return val;
        if (typeof val !== "object") return val;
        if (!prev || typeof prev !== "object") return this.#clonerSnapshot(val);

        const metaVal = this.#getMeta(val);
        const metaPrev = this.#getMeta(prev);

        let res;
        if (Array.isArray(val)) {
            res = [];
            for (let i = 0; i < val.length; i++) {
                const curSub = val[i];
                let prevSub;
                if (Array.isArray(prev)) {
                    if (prev[i] !== undefined && this.#sontElementsEquivalents(curSub, prev[i])) {
                        prevSub = prev[i];
                    } else {
                        prevSub = prev.find(p => this.#sontElementsEquivalents(curSub, p));
                    }
                }
                if (this.#estEtatTronque(curSub) && prevSub !== undefined && !this.#estEtatTronque(prevSub)) {
                    res[i] = this.#clonerSnapshot(prevSub);
                } else if (typeof curSub === "object" && curSub !== null && typeof prevSub === "object" && prevSub !== null) {
                    res[i] = this.#fusionnerSnapshot(curSub, prevSub);
                } else {
                    res[i] = this.#clonerSnapshot(curSub);
                }
            }
        } else {
            res = {};
            for (const k of Object.keys(val)) {
                const curSub = val[k];
                const prevSub = prev[k];
                if (this.#estEtatTronque(curSub) && prevSub !== undefined && !this.#estEtatTronque(prevSub)) {
                    res[k] = this.#clonerSnapshot(prevSub);
                } else if (typeof curSub === "object" && curSub !== null && typeof prevSub === "object" && prevSub !== null) {
                    res[k] = this.#fusionnerSnapshot(curSub, prevSub);
                } else {
                    res[k] = this.#clonerSnapshot(curSub);
                }
            }
        }

        const meta = metaVal || metaPrev;
        if (meta) {
            this.#setMeta(res, meta);
        }
        return res;
    }

    /**
     * Parcoure récursivement un objet sérialisé et enregistre dans snapshotsMap toutes les sous-instances
     * identifiées (ayant un `id` + `class` dans leurs métadonnées) qui n'y sont pas encore présentes.
     * Cela permet d'éviter les faux-positifs de delta lors d'une réapparition après troncature de profondeur.
     * @param {*} val - L'objet sérialisé à inspecter.
     * @param {Map} snapshotsMap - La map de snapshots à alimenter.
     * @param {Set} [visite=new Set()] - Ensemble des objets déjà visités (anti-circularité).
     * @private
     */
    #enregistrerSousSnapshotsInconnus(val, snapshotsMap, visite = new Set()) {
        if (val === null || typeof val !== "object") return;
        if (visite.has(val)) return;
        visite.add(val);

        const meta = this.#getMeta(val);
        const id = meta?.id;
        const cls = meta?.class;

        if (id !== undefined && cls !== undefined && !snapshotsMap.has(id)) {
            snapshotsMap.set(id, this.#clonerSnapshot(val));
        }

        if (Array.isArray(val)) {
            for (const item of val) {
                this.#enregistrerSousSnapshotsInconnus(item, snapshotsMap, visite);
            }
        } else {
            for (const k of Object.keys(val)) {
                this.#enregistrerSousSnapshotsInconnus(val[k], snapshotsMap, visite);
            }
        }
    }

    /**
     * Calcule le delta entre deux tableaux ou sets sérialisés via l'algorithme LCS (diff minimal).
     * @param {Array} curArr - Le tableau ou set courant.
     * @param {Array} prevArr - Le tableau ou set précédent.
     * @param {Map} snapshotsMap - Map des snapshots.
     * @param {Set} pileDelta - Pile anti-circularité.
     * @param {Set} instancesVisibles - Ensemble des instances visibles.
     * @returns {Array|undefined} - Le delta contenant uniquement les entrées ajoutées, supprimées ou modifiées.
     * @private
     */
    #calculerDeltaTableau(curArr, prevArr, snapshotsMap, pileDelta, instancesVisibles, logCourant = null) {
        const curMeta = this.#getMeta(curArr);
        const prevMeta = this.#getMeta(prevArr);
        const cls = curMeta?.class || prevMeta?.class;
        const estSet = cls === "Set";
        const aUnOrdre = !estSet;

        const M = prevArr.length;
        const N = curArr.length;

        const dp = Array.from({ length: M + 1 }, () => new Uint32Array(N + 1));

        for (let i = 1; i <= M; i++) {
            for (let j = 1; j <= N; j++) {
                if (this.#sontElementsApparies(prevArr[i - 1], curArr[j - 1])) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = dp[i - 1][j] >= dp[i][j - 1] ? dp[i - 1][j] : dp[i][j - 1];
                }
            }
        }

        let i = M;
        let j = N;
        const ops = [];

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && this.#sontElementsApparies(prevArr[i - 1], curArr[j - 1])) {
                ops.push({ type: "match", prevIndex: i - 1, curIndex: j - 1 });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                ops.push({ type: "insert", curIndex: j - 1 });
                j--;
            } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
                ops.push({ type: "delete", prevIndex: i - 1 });
                i--;
            }
        }

        ops.reverse();

        let elementModifie = false;
        const arrayDelta = [];

        for (const op of ops) {
            if (op.type === "delete") {
                const prevItem = prevArr[op.prevIndex];
                const prevMetaItem = this.#getMeta(prevItem);
                const prevId = prevMetaItem?.id ?? (typeof prevItem === "string" ? this.#extraireIdDeChaine(prevItem) : undefined);
                const prevCls = prevMetaItem?.class;
                const estPrevMetier = Boolean(prevCls && prevCls !== "Object" && prevCls !== "Array" && prevCls !== "Set" && prevCls !== "Map" && prevCls !== "WeakSet" && prevCls !== "WeakMap" && prevCls !== "Promise");
                let supprItem;
                if (prevId !== undefined) {
                    supprItem = estPrevMetier ? `[${prevCls} (ID: ${prevId})]` : `[ID: ${prevId}]`;
                } else if (typeof prevItem === "object" && prevItem !== null) {
                    supprItem = this.#clonerSnapshot(prevItem);
                } else {
                    supprItem = prevItem;
                }
                const idx = aUnOrdre ? op.prevIndex : undefined;
                if (typeof supprItem === "object" && supprItem !== null) {
                    this.#setMeta(supprItem, { deltaOp: "-", index: idx });
                } else {
                    supprItem = { _val: supprItem, _deltaOpWrapper: true };
                    this.#setMeta(supprItem, { deltaOp: "-", index: idx });
                }
                arrayDelta.push(supprItem);
                elementModifie = true;
            } else if (op.type === "insert") {
                const curItem = curArr[op.curIndex];
                const itemDelta = this.#calculerDeltaValeur(curItem, undefined, snapshotsMap, pileDelta, instancesVisibles);
                let ajoutItem = itemDelta !== undefined ? itemDelta : curItem;
                const idx = aUnOrdre ? op.curIndex : undefined;
                if (typeof ajoutItem === "object" && ajoutItem !== null) {
                    this.#setMeta(ajoutItem, { deltaOp: "+", index: idx });
                } else {
                    ajoutItem = { _val: ajoutItem, _deltaOpWrapper: true };
                    this.#setMeta(ajoutItem, { deltaOp: "+", index: idx });
                }
                arrayDelta.push(ajoutItem);
                elementModifie = true;
            } else {
                // op.type === "match"
                const curItem = curArr[op.curIndex];
                const prevItem = prevArr[op.prevIndex];
                const itemDelta = this.#calculerDeltaValeur(curItem, prevItem, snapshotsMap, pileDelta, instancesVisibles);
                if (itemDelta !== undefined) {
                    let modifItem = itemDelta;
                    const idx = aUnOrdre ? op.curIndex : undefined;
                    if (typeof modifItem === "object" && modifItem !== null) {
                        this.#setMeta(modifItem, { index: idx });
                    } else {
                        modifItem = { _val: modifItem, _deltaOpWrapper: true };
                        this.#setMeta(modifItem, { index: idx });
                    }
                    arrayDelta.push(modifItem);
                    elementModifie = true;
                }
            }
        }

        const curMetaOut = curMeta || prevMeta;
        if (curMetaOut) {
            this.#setMeta(arrayDelta, curMetaOut);
        }

        return elementModifie ? arrayDelta : undefined;
    }

    /**
     * Détermine le delta entre la valeur courante et la précédente.
     * @param {*} curSub - La valeur courante.
     * @param {*} prevSub - La valeur précédente.
     * @param {Map<Object, Object>} snapshotsMap - Map des snapshots.
     * @param {Set} [pileDelta=new Set()] - Pile de garde contre les récursions sur deltas.
     * @param {Set} [instancesVisibles=this.instancesVisibles] - Ensemble des ID d'instances rendues visibles dans la sérialisation.
     * @returns {*} Le delta entre la valeur courante et la précédente.
     * @private
     */
    #calculerDeltaValeur(curSub, prevSub, snapshotsMap, pileDelta = new Set(), instancesVisibles = this.instancesVisibles, logCourant = null) {
        if (curSub === null || curSub === undefined) {
            return curSub === prevSub ? undefined : curSub;
        }

        // Si curSub est une forme compressée/tronquée (par exemple [Class: Foo (ID: 123)] ou [Circular: ...])
        // ou si l'une des deux valeurs est compressée, vérifier si elles désignent la même instance connue
        const curIdStr = typeof curSub === "string" ? this.#extraireIdDeChaine(curSub) : undefined;
        const prevIdStr = typeof prevSub === "string" ? this.#extraireIdDeChaine(prevSub) : undefined;
        const curMeta = typeof curSub === "object" && curSub !== null ? this.#getMeta(curSub) : undefined;
        const prevMeta = typeof prevSub === "object" && prevSub !== null ? this.#getMeta(prevSub) : undefined;
        const idCur = curMeta?.id ?? curIdStr;
        const idPrev = prevMeta?.id ?? prevIdStr;

        if (idCur !== undefined && idPrev !== undefined && idCur === idPrev) {
            if (typeof curSub === "object" && curSub !== null) {
                return this.#calculerDeltaInstance(curSub, false, snapshotsMap, pileDelta, instancesVisibles, prevSub, logCourant);
            }
            return undefined;
        }

        // Si curSub est tronqué par limite de profondeur sans identifiant ([Class: Foo]),
        // et que prevSub correspond (ou si curSub est tronqué par longueur et n'a pas changé par rapport à prevSub)
        if (this.#estEtatTronque(curSub) && prevSub !== undefined) {
            if (typeof curSub === "string" && /^\[Class:\s+[^\n\]]+\]$/.test(curSub)) {
                return undefined;
            }
        }

        if (typeof curSub !== "object") {
            if (curSub === prevSub) return undefined;
            return curSub;
        }

        const curId = curMeta?.id;
        let prevId = idPrev;

        // Sous-instance d'extension avec identifiant
        if (curId !== undefined && curMeta?.class !== undefined) {
            if (prevId === curId) {
                // Même instance : déduire les deltas internes
                return this.#calculerDeltaInstance(curSub, false, snapshotsMap, pileDelta, instancesVisibles, prevSub, logCourant);
            } else {
                // Instance différente ou apparition sous une nouvelle propriété
                const instanceDelta = this.#calculerDeltaInstance(curSub, false, snapshotsMap, pileDelta, instancesVisibles, prevSub, logCourant);
                if (instanceDelta !== undefined) {
                    return instanceDelta;
                }
                // Si l'instance curSub est 100% inchangée par rapport à son propre snapshot,
                // on ne recrée pas le fullObj complet : elle est simplement représentée par son en-tête d'instance.
                const estCurMetier = Boolean(curMeta.class && curMeta.class !== "Object" && curMeta.class !== "Array" && curMeta.class !== "Set" && curMeta.class !== "Map" && curMeta.class !== "WeakSet" && curMeta.class !== "WeakMap" && curMeta.class !== "Promise");
                return estCurMetier ? `[${curMeta.class} (ID: ${curId})]` : `[ID: ${curId}]`;
            }
        }

        // Si prevSub était une instance identifiée mais curSub ne l'est pas
        if (prevId !== undefined) {
            const subRes = this.#calculerDeltaInstance(curSub, false, snapshotsMap, pileDelta, instancesVisibles, prevSub, logCourant);
            return subRes !== undefined ? subRes : curSub;
        }

        // Tableau
        if (Array.isArray(curSub)) {
            if (!Array.isArray(prevSub)) {
                return this.#calculerDeltaInstance(curSub, false, snapshotsMap, pileDelta, instancesVisibles, prevSub, logCourant);
            }
            return this.#calculerDeltaTableau(curSub, prevSub, snapshotsMap, pileDelta, instancesVisibles, logCourant);
        }

        // Objet simple sans ID d'instance
        if (prevSub === null || typeof prevSub !== "object" || Array.isArray(prevSub)) {
            const resObj = {};
            let aDesCles = false;
            for (const subKey of Object.keys(curSub)) {
                const subDelta = this.#calculerDeltaValeur(curSub[subKey], undefined, snapshotsMap, pileDelta, instancesVisibles, logCourant);
                let ajoutSub = subDelta !== undefined ? subDelta : curSub[subKey];
                if (typeof ajoutSub === "object" && ajoutSub !== null) {
                    this.#setMeta(ajoutSub, { deltaOp: "+" });
                } else {
                    ajoutSub = { _val: ajoutSub, _deltaOpWrapper: true };
                    this.#setMeta(ajoutSub, { deltaOp: "+" });
                }
                resObj[subKey] = ajoutSub;
                aDesCles = true;
            }
            if (curMeta) this.#setMeta(resObj, curMeta);
            return aDesCles ? resObj : undefined;
        }

        const objDelta = {};
        let aDesModifs = false;

        const allSubKeys = Array.from(new Set([...Object.keys(curSub), ...Object.keys(prevSub)]));

        for (const subKey of allSubKeys) {
            const aCur = subKey in curSub;
            const aPrev = subKey in prevSub;

            if (aCur && !aPrev) {
                // Clé ajoutée
                const subDelta = this.#calculerDeltaValeur(curSub[subKey], undefined, snapshotsMap, pileDelta, instancesVisibles, logCourant);
                let ajoutSub = subDelta !== undefined ? subDelta : curSub[subKey];
                if (typeof ajoutSub === "object" && ajoutSub !== null) {
                    this.#setMeta(ajoutSub, { deltaOp: "+" });
                } else {
                    ajoutSub = { _val: ajoutSub, _deltaOpWrapper: true };
                    this.#setMeta(ajoutSub, { deltaOp: "+" });
                }
                objDelta[subKey] = ajoutSub;
                aDesModifs = true;
            } else if (!aCur && aPrev) {
                // Clé supprimée
                const prevVal = prevSub[subKey];
                const prevMeta = this.#getMeta(prevVal);
                const prevId = prevMeta?.id ?? (typeof prevVal === "string" ? this.#extraireIdDeChaine(prevVal) : undefined);
                const prevCls = prevMeta?.class;
                const estPrevMetier = Boolean(prevCls && prevCls !== "Object" && prevCls !== "Array" && prevCls !== "Set" && prevCls !== "Map" && prevCls !== "WeakSet" && prevCls !== "WeakMap" && prevCls !== "Promise");
                let supprSub;
                if (prevId !== undefined) {
                    supprSub = estPrevMetier ? `[${prevCls} (ID: ${prevId})]` : `[ID: ${prevId}]`;
                } else if (typeof prevVal === "object" && prevVal !== null) {
                    supprSub = this.#clonerSnapshot(prevVal);
                } else {
                    supprSub = prevVal;
                }
                if (typeof supprSub === "object" && supprSub !== null) {
                    this.#setMeta(supprSub, { deltaOp: "-" });
                } else {
                    supprSub = { _val: supprSub, _deltaOpWrapper: true };
                    this.#setMeta(supprSub, { deltaOp: "-" });
                }
                objDelta[subKey] = supprSub;
                aDesModifs = true;
            } else {
                // Clé présente dans les deux : modification de valeur
                const prevVal = prevSub[subKey];
                const subDelta = this.#calculerDeltaValeur(curSub[subKey], prevVal, snapshotsMap, pileDelta, instancesVisibles, logCourant);
                if (subDelta !== undefined) {
                    objDelta[subKey] = subDelta;
                    aDesModifs = true;
                }
            }
        }

        if (curMeta) {
            this.#setMeta(objDelta, curMeta);
        }

        return aDesModifs ? objDelta : undefined;
    }

    /**
     * Détermine le delta entre la valeur courante et la précédente.
     * @param {*} val - La valeur courante.
     * @param {Boolean} estRacine - Indique si la valeur est la racine.
     * @param {Map<Object, Object>} snapshotsMap - Map des snapshots.
     * @param {Set} [pileDelta=new Set()] - Pile de garde contre les récursions sur deltas.
     * @param {Set} [instancesVisibles=this.instancesVisibles] - Ensemble des ID d'instances rendues visibles dans la sérialisation.
     * @param {*} [prevOverride=undefined] - Snapshot d'état précédent provenant du parent (pour conserver le delta relatif au parent).
     * @returns {*} Le delta entre la valeur courante et la précédente.
     * @private
     */
    #calculerDeltaInstance(val, estRacine, snapshotsMap, pileDelta = new Set(), instancesVisibles = this.instancesVisibles, prevOverride = undefined, logCourant = null) {
        if (val === null || val === undefined) return val;
        if (typeof val !== "object") return val;

        // Protection contre la circularité pendant le calcul de delta
        if (pileDelta.has(val)) {
            return undefined;
        }
        pileDelta.add(val);

        try {
            const meta = this.#getMeta(val);
            const id = meta?.id;
            const cls = meta?.class;

            // Si ce n'est pas un objet d'extension identifié (pas de ID)
            if (id === undefined || !cls) {
                if (Array.isArray(val)) {
                    const resArr = val.map((item, idx) => this.#calculerDeltaInstance(item, false, snapshotsMap, pileDelta, instancesVisibles, Array.isArray(prevOverride) ? prevOverride[idx] : undefined, logCourant));
                    if (meta) this.#setMeta(resArr, meta);
                    return resArr;
                }

                const resObj = {};
                let aDesCles = false;
                for (const k of Object.keys(val)) {
                    const prevSubOverride = (prevOverride && typeof prevOverride === "object") ? prevOverride[k] : undefined;
                    const subRes = this.#calculerDeltaInstance(val[k], false, snapshotsMap, pileDelta, instancesVisibles, prevSubOverride, logCourant);
                    if (subRes !== undefined) {
                        resObj[k] = subRes;
                        aDesCles = true;
                    }
                }
                if (meta) this.#setMeta(resObj, meta);
                return aDesCles ? resObj : (estRacine ? "{}" : undefined);
            }

            const prev = snapshotsMap.get(id);
            const estVisibleEnAmont = instancesVisibles.has(id);
            instancesVisibles.add(id);

            // Mettre à jour systématiquement le snapshot avec le dernier état, en conservant les données non tronquées
            const nouveauSnapshot = this.#fusionnerSnapshot(val, prev);
            snapshotsMap.set(id, nouveauSnapshot);
            this.#enregistrerSousSnapshotsInconnus(val, snapshotsMap);

            let prevPourDelta = (prevOverride !== undefined && typeof prevOverride === "object" && prevOverride !== null)
                ? prevOverride
                : (prev || nouveauSnapshot);
            if (typeof prevPourDelta !== "object" || prevPourDelta === null) {
                prevPourDelta = nouveauSnapshot;
            }

            if (!estVisibleEnAmont) {
                if (Array.isArray(val)) {
                    const res = [];
                    for (let i = 0; i < val.length; i++) {
                        const subRes = this.#calculerDeltaValeur(val[i], undefined, snapshotsMap, pileDelta, instancesVisibles, logCourant);
                        if (subRes !== undefined) {
                            res.push(subRes);
                        }
                    }
                    this.#setMeta(res, { class: cls, id: id });
                    return res;
                } else {
                    const res = {};
                    for (const k of Object.keys(val)) {
                        const subRes = this.#calculerDeltaValeur(val[k], undefined, snapshotsMap, pileDelta, instancesVisibles, logCourant);
                        if (subRes !== undefined) {
                            res[k] = subRes;
                        }
                    }
                    this.#setMeta(res, { class: cls, id: id });
                    return res;
                }
            }

            if (Array.isArray(val)) {
                if (!Array.isArray(prevPourDelta)) {
                    const res = [];
                    for (let i = 0; i < val.length; i++) {
                        const subRes = this.#calculerDeltaValeur(val[i], undefined, snapshotsMap, pileDelta, instancesVisibles);
                        if (subRes !== undefined) {
                            res.push(subRes);
                        }
                    }
                    this.#setMeta(res, { class: cls, id: id });
                    return res;
                }

                const arrayDelta = this.#calculerDeltaTableau(val, prevPourDelta, snapshotsMap, pileDelta, instancesVisibles);

                if (arrayDelta !== undefined) {
                    this.#setMeta(arrayDelta, { class: cls, id: id });
                    return arrayDelta;
                }

                if (estRacine) {
                    const estClasseMetier = Boolean(cls && cls !== "Object" && cls !== "Array" && cls !== "Set" && cls !== "Map" && cls !== "WeakSet" && cls !== "WeakMap" && cls !== "Promise");
                    if (estClasseMetier) {
                        return `[${cls} (ID: ${id})]`;
                    } else {
                        return `[ID: ${id}]`;
                    }
                }
                return undefined;
            }

            // Apparition ultérieure : Calcul du Delta minimal par rapport au snapshot précédent (prev)
            const deltaObj = {};
            let aDesModifs = false;

            const curKeys = Object.keys(val);
            const prevKeys = Object.keys(prevPourDelta);
            const allKeys = Array.from(new Set([...curKeys, ...prevKeys]));

            for (const k of allKeys) {
                const aCur = k in val;
                const aPrev = k in prevPourDelta;

                if (aCur && !aPrev) {
                    // Clé ajoutée
                    const curSub = val[k];
                    const subDelta = this.#calculerDeltaValeur(curSub, undefined, snapshotsMap, pileDelta, instancesVisibles);
                    let ajoutSub = subDelta !== undefined ? subDelta : curSub;
                    if (typeof ajoutSub === "object" && ajoutSub !== null) {
                        this.#setMeta(ajoutSub, { deltaOp: "+" });
                    } else {
                        ajoutSub = { _val: ajoutSub, _deltaOpWrapper: true };
                        this.#setMeta(ajoutSub, { deltaOp: "+" });
                    }
                    deltaObj[k] = ajoutSub;
                    aDesModifs = true;
                } else if (!aCur && aPrev) {
                    // Clé supprimée
                    if (this.#estEtatTronque(val)) {
                        // Si val est tronqué ou compressé, on ne conclut pas à une suppression de clé
                        continue;
                    }
                    const prevSub = prevPourDelta[k];
                    const prevMeta = this.#getMeta(prevSub);
                    const prevId = prevMeta?.id ?? (typeof prevSub === "string" ? this.#extraireIdDeChaine(prevSub) : undefined);
                    const prevCls = prevMeta?.class;
                    const estPrevMetier = Boolean(prevCls && prevCls !== "Object" && prevCls !== "Array" && prevCls !== "Set" && prevCls !== "Map" && prevCls !== "WeakSet" && prevCls !== "WeakMap" && prevCls !== "Promise");
                    let supprSub;
                    if (prevId !== undefined) {
                        supprSub = estPrevMetier ? `[${prevCls} (ID: ${prevId})]` : `[ID: ${prevId}]`;
                    } else if (typeof prevSub === "object" && prevSub !== null) {
                        supprSub = this.#clonerSnapshot(prevSub);
                    } else {
                        supprSub = prevSub;
                    }
                    if (typeof supprSub === "object" && supprSub !== null) {
                        this.#setMeta(supprSub, { deltaOp: "-" });
                    } else {
                        supprSub = { _val: supprSub, _deltaOpWrapper: true };
                        this.#setMeta(supprSub, { deltaOp: "-" });
                    }
                    deltaObj[k] = supprSub;
                    aDesModifs = true;
                } else {
                    // Clé présente dans les deux : modification de valeur
                    const curSub = val[k];
                    const prevSub = prevPourDelta[k];

                    const subDelta = this.#calculerDeltaValeur(curSub, prevSub, snapshotsMap, pileDelta, instancesVisibles, logCourant);
                    if (subDelta !== undefined) {
                        deltaObj[k] = subDelta;
                        aDesModifs = true;
                    }
                }
            }

            this.#setMeta(deltaObj, { class: cls, id: id });

            if (aDesModifs) {
                return deltaObj;
            }

            // Instance 100% inchangée :
            if (estRacine) {
                const estClasseMetier = Boolean(cls && cls !== "Object" && cls !== "Array" && cls !== "Set" && cls !== "Map" && cls !== "WeakSet" && cls !== "WeakMap" && cls !== "Promise");
                if (estClasseMetier) {
                    return `[${cls} (ID: ${id})]`;
                } else {
                    return `[ID: ${id}]`;
                }
            }
            return undefined; // Omise si la même sous-instance enfante conserve sa valeur
        } finally {
            pileDelta.delete(val);
        }
    }

    /**
     * Traite la duplication et la circularité en parallèle sur l'arbre de delta.
     * @param {*} val - Valeur (delta) à traiter.
     * @param {Set} [pile=new Set()] - Pile de détection de circularité (ancêtres actifs).
     * @param {Set} [dejaVus=new Set()] - Ensemble d'instances déjà vues dans ce log (duplication).
     * @returns {*}
     * @private
     */
    #traiterDuplicationEtCircularite(val, pile = new Set(), dejaVus = new Set()) {
        if (val === null || val === undefined) return val;
        if (typeof val !== "object") return val;

        const meta = this.#getMeta(val);
        const cls = meta?.class;
        const id = meta?.id;
        const estClasseMetier = Boolean(cls && cls !== "Object" && cls !== "Array" && cls !== "Set" && cls !== "Map" && cls !== "WeakSet" && cls !== "WeakMap" && cls !== "Promise");
        const idStr = id !== undefined ? ` (ID: ${id})` : "";
        const name = cls || (Array.isArray(val) ? "Array" : "Object");

        if (typeof val === "string") {
            return val;
        }

        // 1. Circularité (présent dans la pile parente active)
        if (pile.has(val)) {
            return `[Circular: ${name}${idStr}]`;
        }

        // 2. Duplication (instance déjà vue ailleurs dans la même entrée de log)
        if (id !== undefined && dejaVus.has(id)) {
            return `[Duplicate: ${name}${idStr}]`;
        }

        pile.add(val);
        if (id !== undefined) {
            dejaVus.add(id);
        }

        let res;
        if (Array.isArray(val)) {
            res = [];
            for (let i = 0; i < val.length; i++) {
                res.push(this.#traiterDuplicationEtCircularite(val[i], pile, dejaVus));
            }
        } else {
            res = {};
            for (const k of Object.keys(val)) {
                res[k] = this.#traiterDuplicationEtCircularite(val[k], pile, dejaVus);
            }
        }

        if (meta) {
            this.#setMeta(res, meta);
        }

        pile.delete(val);
        return res;
    }

    /**
     * Traite tout objet non primitif (instances d'extension, tableaux/listes, dictionnaires, Map, Set, etc.)
     * à sérialisation identique après l'application des deltas et de dejaVus.
     * @param {*} val - Valeur formatée/delta à inspecter.
     * @param {Set<String>} clesCitees - Ensemble des clés de référence effectivement citées.
     * @param {Object} ctx - Contexte de traitement des références ({ map, nextIndex, estDetection }).
     * @returns {*}
     * @private
     */
    #traiterSerialisationsIdentiques(val, clesCitees, ctx) {
        if (val === null || val === undefined) return val;
        if (typeof val !== "object") return val;

        const meta = this.#getMeta(val);
        const cls = meta?.class || (Array.isArray(val) ? "Array" : "Object");
        const id = meta?.id;
        const idStr = id !== undefined ? ` (ID: ${id})` : "";
        const deltaOp = meta?.deltaOp;

        // Si l'objet est un simple wrapper pour une valeur primitive marquée deltaOp
        if (val._deltaOpWrapper) {
            return val;
        }

        let hasContent = false;
        let payload;

        if (Array.isArray(val)) {
            hasContent = val.length > 0;
            payload = val;
        } else {
            const keys = Object.keys(val);
            hasContent = keys.length > 0;
            if (hasContent) {
                payload = {};
                for (const k of keys) {
                    payload[k] = val[k];
                }
            }
        }

        if (hasContent) {
            const jsonStr = JSON.stringify(payload);
            const existing = id !== undefined ? undefined : ctx.map.get(jsonStr);

            if (existing) {
                const existingRefKey = typeof existing === "object" ? existing.refKey : existing;
                const existingId = typeof existing === "object" ? existing.id : undefined;

                const isSameInstance = id !== undefined && existingId !== undefined && id === existingId;

                const prefixOp = deltaOp ? `${deltaOp} ` : "";

                if (isSameInstance) {
                    if (cls && cls !== "Object" && cls !== "Array" && cls !== "Set" && cls !== "Map") {
                        return `${prefixOp}[${cls}${idStr}]`;
                    }
                    if (id !== undefined) {
                        return `${prefixOp}[ID: ${id}]`;
                    }
                } else {
                    if (ctx.estDetection) {
                        clesCitees.add(existingRefKey);
                    }
                    const estBase = !cls || cls === "Object" || cls === "Array" || cls === "Set" || cls === "Map";
                    if (estBase) {
                        const refDetails = [];
                        if (id !== undefined) refDetails.push(`ID: ${id}`);
                        refDetails.push(`Key: ${existingRefKey}`);
                        return `${prefixOp}[Ref: ${cls || "Object"}, ${refDetails.join(", ")}]`;
                    }
                    return `${prefixOp}[Ref: ${cls}${idStr}, Key: ${existingRefKey}]`;
                }
            } else {
                const refKey = ctx.nextIndex();
                ctx.map.set(jsonStr, { refKey, id, cls });

                if (Array.isArray(val)) {
                    const resArr = val.map(item => this.#traiterSerialisationsIdentiques(item, clesCitees, ctx));
                    this.#setMeta(resArr, { ...meta, class: cls, id: id, refKey: refKey });

                    if (!ctx.estDetection) {
                        const sansRefStr = this.#formaterValeur(resArr, new Set());
                        const avecRefStr = this.#formaterValeur(resArr, new Set([refKey]));
                        const cleanSansRefStr = sansRefStr.replace(/^[+-]\s+/, "");
                        const cleanAvecRefStr = avecRefStr.replace(/^[+-]\s+/, "");
                        const publiee = Boolean(clesCitees && clesCitees.has(refKey));
                        if (publiee) {
                            this.clesPublieesAvecRefKey.add(refKey);
                        }
                        if (!this.registreEmplacementsRefKeys.has(refKey)) {
                            this.registreEmplacementsRefKeys.set(refKey, {
                                refKey,
                                sansRefStr: cleanSansRefStr,
                                avecRefStr: cleanAvecRefStr,
                                idMessage: null,
                                publiee
                            });
                        }
                    }
                    return resArr;
                } else {
                    const resObj = {};
                    for (const k of Object.keys(val)) {
                        resObj[k] = this.#traiterSerialisationsIdentiques(val[k], clesCitees, ctx);
                    }
                    this.#setMeta(resObj, { ...meta, class: cls, id: id, refKey: refKey });

                    if (!ctx.estDetection) {
                        const sansRefStr = this.#formaterValeur(resObj, new Set());
                        const avecRefStr = this.#formaterValeur(resObj, new Set([refKey]));
                        const cleanSansRefStr = sansRefStr.replace(/^[+-]\s+/, "");
                        const cleanAvecRefStr = avecRefStr.replace(/^[+-]\s+/, "");
                        const publiee = Boolean(clesCitees && clesCitees.has(refKey));
                        if (publiee) {
                            this.clesPublieesAvecRefKey.add(refKey);
                        }
                        if (!this.registreEmplacementsRefKeys.has(refKey)) {
                            this.registreEmplacementsRefKeys.set(refKey, {
                                refKey,
                                sansRefStr: cleanSansRefStr,
                                avecRefStr: cleanAvecRefStr,
                                idMessage: null,
                                publiee
                            });
                        }
                    }

                    return resObj;
                }
            }
        }

        return val;
    }

    /**
     * Formate récursivement un objet ou un tableau avec les en-têtes d'instance entre crochets.
     * @param {*} val - La valeur à formater.
     * @param {Set<String>} [clesCitees] - Ensemble des clés de référence citées.
     * @param {Number} [depth=0] - Niveau d'indentation (profondeur dans l'arborescence).
     * @returns {String}
     * @private
     */
    #formaterValeur(val, clesCitees, depth = 0) {
        if (val === null) return "null";
        if (val === undefined) return "undefined";
        if (typeof val === "string") {
            if (val.startsWith("[") || val.startsWith("+ [") || val.startsWith("- [")) {
                return val;
            }
            return JSON.stringify(val);
        }
        if (typeof val !== "object") {
            return JSON.stringify(val);
        }

        const meta = this.#getMeta(val);
        const deltaOp = meta?.deltaOp;
        const prefixOp = deltaOp ? `${deltaOp} ` : "";

        if (val._deltaOpWrapper) {
            const rawVal = val._val;
            if (rawVal === null) return `${prefixOp}null`;
            if (rawVal === undefined) return `${prefixOp}undefined`;
            if (typeof rawVal === "string") {
                if (rawVal.startsWith("[")) {
                    return `${prefixOp}${rawVal}`;
                }
                return `${prefixOp}${JSON.stringify(rawVal)}`;
            }
            if (typeof rawVal !== "object") {
                return `${prefixOp}${JSON.stringify(rawVal)}`;
            }
            // Si rawVal est un objet
            return `${prefixOp}${this.#formaterValeur(rawVal, clesCitees, depth)}`;
        }

        const indent = "  ".repeat(depth);
        const subIndent = "  ".repeat(depth + 1);

        const cls = meta?.class;
        const id = meta?.id;
        const refKey = meta?.refKey;
        const inclureRef = Boolean(refKey && clesCitees && clesCitees.has(refKey));

        const estClasseMetier = Boolean(cls && cls !== "Object" && cls !== "Array" && cls !== "Set" && cls !== "Map" && cls !== "WeakSet" && cls !== "WeakMap" && cls !== "Promise");

        let enteteStr = "";
        if (estClasseMetier) {
            let details = [];
            if (id !== undefined) details.push(`ID: ${id}`);
            if (inclureRef && refKey) details.push(`Ref: ${refKey}`);

            if (details.length > 0) {
                enteteStr = `${prefixOp}[${cls} (${details.join(", ")})]`;
            } else {
                enteteStr = `${prefixOp}[${cls}]`;
            }
        } else {
            let details = [];
            if (id !== undefined) details.push(`ID: ${id}`);
            if (inclureRef && refKey) details.push(`Ref: ${refKey}`);

            if (details.length > 0) {
                enteteStr = `${prefixOp}[${details.join(", ")}]`;
            }
        }

        let body = "";
        if (Array.isArray(val)) {
            if (val.length === 0) {
                body = `${prefixOp}[]`;
            } else {
                const itemsFormatted = val.map(item => {
                    const itemMeta = typeof item === "object" && item !== null ? this.#getMeta(item) : undefined;
                    const itemDeltaOp = itemMeta?.deltaOp;
                    const itemIndex = itemMeta?.index;

                    let prefix = "";
                    if (itemDeltaOp) {
                        prefix += `${itemDeltaOp} `;
                    }
                    if (itemIndex !== undefined) {
                        prefix += `${itemIndex}: `;
                    }

                    if (item && item._deltaOpWrapper) {
                        const rawVal = item._val;
                        let formattedRaw;
                        if (rawVal === null) formattedRaw = "null";
                        else if (rawVal === undefined) formattedRaw = "undefined";
                        else if (typeof rawVal === "string") {
                            formattedRaw = rawVal.startsWith("[") ? rawVal : JSON.stringify(rawVal);
                        } else if (typeof rawVal !== "object") {
                            formattedRaw = JSON.stringify(rawVal);
                        } else {
                            formattedRaw = this.#formaterValeur(rawVal, clesCitees, depth + 1);
                        }
                        return `${subIndent}${prefix}${formattedRaw}`;
                    }

                    if (itemDeltaOp || itemIndex !== undefined) {
                        this.#setMeta(item, { deltaOp: undefined, index: undefined });
                        const formattedVal = this.#formaterValeur(item, clesCitees, depth + 1);
                        this.#setMeta(item, { deltaOp: itemDeltaOp, index: itemIndex });
                        return `${subIndent}${prefix}${formattedVal}`;
                    }

                    return `${subIndent}${this.#formaterValeur(item, clesCitees, depth + 1)}`;
                });
                body = `${prefixOp}[\n${itemsFormatted.join(",\n")}\n${indent}]`;
            }
        } else {
            const keys = Object.keys(val);
            if (keys.length === 0) {
                body = `${prefixOp}{}`;
            } else {
                const propsFormatted = keys.map(k => {
                    const subVal = val[k];
                    const subMeta = typeof subVal === "object" && subVal !== null ? this.#getMeta(subVal) : undefined;
                    const subDeltaOp = subMeta?.deltaOp;

                    if (subDeltaOp) {
                        // Supprimer temporairement deltaOp pour le formatage de la valeur elle-même afin d'éviter "+ " en double
                        this.#setMeta(subVal, { deltaOp: undefined });
                        let formattedVal;
                        if (subVal && subVal._deltaOpWrapper) {
                            formattedVal = this.#formaterValeur(subVal._val, clesCitees, depth + 1);
                        } else {
                            formattedVal = this.#formaterValeur(subVal, clesCitees, depth + 1);
                        }
                        this.#setMeta(subVal, { deltaOp: subDeltaOp });
                        return `${subIndent}${subDeltaOp} ${JSON.stringify(k)}: ${formattedVal}`;
                    } else {
                        const formattedVal = this.#formaterValeur(subVal, clesCitees, depth + 1);
                        return `${subIndent}${JSON.stringify(k)}: ${formattedVal}`;
                    }
                });
                body = `${prefixOp}{\n${propsFormatted.join(",\n")}\n${indent}}`;
            }
        }

        if (enteteStr) {
            if (Object.keys(val).length === 0 && (!Array.isArray(val) || val.length === 0)) {
                return `${enteteStr} ${body}`;
            }
            return `${enteteStr}\n${indent}${body}`;
        }
        return body;
    }

    /**
     * @private
     */
    #formaterLogAvecDeltas(log, snapshotsMap, clesCitees, ctx, instancesVisibles = this.instancesVisibles) {
        const typeStr = log.type.toUpperCase();
        const formattedArgs = [];
        const dejaVusLog = new Set();
        const logTitre = Array.isArray(log.arguments) && typeof log.arguments[0] === "string" ? log.arguments[0] : "";

        for (let i = 0; i < log.arguments.length; i++) {
            const arg = log.arguments[i];
            let strVal = "";
            if (typeof arg === "object" && arg !== null) {
                try {
                    // 1. Appliquer le delta en premier
                    const deltaVal = this.#calculerDeltaInstance(arg, true, snapshotsMap, new Set(), instancesVisibles, undefined, log);
                    // 2. Duplication et circularité en parallèle
                    const dupCircVal = this.#traiterDuplicationEtCircularite(deltaVal, new Set(), dejaVusLog);
                    // 3. Référencement
                    const finalVal = this.#traiterSerialisationsIdentiques(dupCircVal, clesCitees, ctx);

                    if (typeof finalVal === "string") {
                        strVal = finalVal;
                    } else if (finalVal !== undefined) {
                        strVal = this.#formaterValeur(finalVal, clesCitees);
                    }
                } catch (e) {
                    if (console._error) {
                        console._error("[Logger.#formaterLogAvecDeltas] Erreur formatage arg:", e);
                    }
                    strVal = String(arg);
                }
            } else {
                strVal = String(arg);
            }

            if (!strVal && strVal !== "0" && strVal !== "false") continue;

            formattedArgs.push(strVal);
        }

        const argsStr = formattedArgs.filter(Boolean).join("\n");
        const entete = `[${typeStr}] [${log.fichier}:${log.ligne} - ${log.fonction}]`;
        let body = entete;
        if (argsStr) {
            body += `\n${argsStr}`;
        }
        if (log.fullStack) {
            body += `\nStacktrace:\n${log.fullStack}`;
        }
        return {
            entete,
            args: formattedArgs.filter(Boolean),
            fullStack: log.fullStack,
            body
        };
    }

    /**
     * Met à jour la progression de la jauge via la callback de manière fluide.
     * @param {Function|null} callback
     * @param {Number} pct - Pourcentage courant (0 à 100).
     * @param {Object} [state] - Objet d'état conservant le dernier pourcentage notifié ({ lastPct: Number }).
     * @private
     */
    async #notifyProgress(callback, pct, state = null) {
        if (typeof callback !== 'function') return;
        const rounded = Math.min(100, Math.max(0, Math.floor(pct)));
        if (!state || state.lastPct === undefined || rounded > state.lastPct) {
            if (state) state.lastPct = rounded;
            callback(rounded, 100);
            await Utils.sleep(0);
        }
    }

    /**
     * @private
     */

    /**
     * @private
     */
    async #obtenirLogsFormates(logsAformater, callbackProgression = null, rangeStart = 1.0, rangeEnd = 3.7, progressState = null) {
        if (!logsAformater || logsAformater.length === 0) return [];
        const totalLogs = logsAformater.length;
        const rangeSpan = rangeEnd - rangeStart;

        // Passe 1 : ~53.6% du temps de formatage
        const pass1Start = rangeStart;
        const pass1Span = rangeSpan * 0.536;
        const pass2Start = rangeStart + pass1Span;
        const pass2Span = rangeSpan * 0.464;

        // Passe 1 : Détecter toutes les clés de référence citées (dans les posts précédents ou dans logsAformater)
        const clesCitees = new Set();
        const tempMap = new Map(this.serialisationsVues);
        const tempHolder = { index: this.nextRefKeyIndex };
        const ctxPass1 = {
            map: tempMap,
            nextIndex: () => "R" + (tempHolder.index++),
            estDetection: true
        };

        // Copie profonde de snapshotsMap et de instancesVisibles pour le pass1 : évite toute contamination des snapshots réels
        const snapshotsMapPass1 = new Map();
        for (const [key, val] of this.snapshotsMap) {
            snapshotsMapPass1.set(key, this.#clonerSnapshot(val));
        }
        const instancesVisiblesPass1 = new Set(this.instancesVisibles);
        for (let i = 0; i < totalLogs; i++) {
            this.#formaterLogAvecDeltas(logsAformater[i], snapshotsMapPass1, clesCitees, ctxPass1, instancesVisiblesPass1);
            if (callbackProgression && totalLogs > 0) {
                const currentPct = pass1Start + ((i + 1) / totalLogs) * pass1Span;
                await this.#notifyProgress(callbackProgression, currentPct, progressState);
            }
        }

        // Passe 2 : Appliquer le formatage final en mettant à jour this.serialisationsVues, this.nextRefKeyIndex, this.snapshotsMap et this.instancesVisibles
        const ctxPass2 = {
            map: this.serialisationsVues,
            nextIndex: () => "R" + (this.nextRefKeyIndex++),
            estDetection: false
        };

        const groupes = [];
        let groupeCourant = null;
        for (let i = 0; i < totalLogs; i++) {
            const log = logsAformater[i];
            const logFormatte = this.#formaterLogAvecDeltas(log, this.snapshotsMap, clesCitees, ctxPass2, this.instancesVisibles);
            const corps = logFormatte.body;
            if (!groupeCourant) {
                groupeCourant = { corps, logFormatte, dateDebut: log.date, dateFin: log.date, count: 1 };
            } else if (groupeCourant.corps === corps) {
                groupeCourant.count++;
                groupeCourant.dateFin = log.date;
            } else {
                groupes.push(groupeCourant);
                groupeCourant = { corps, logFormatte, dateDebut: log.date, dateFin: log.date, count: 1 };
            }
            if (callbackProgression && totalLogs > 0) {
                const currentPct = pass2Start + ((i + 1) / totalLogs) * pass2Span;
                await this.#notifyProgress(callbackProgression, currentPct, progressState);
            }
        }
        if (groupeCourant) {
            groupes.push(groupeCourant);
        }

        const logsStructures = groupes.map(g => {
            const dateDebutStr = new Date(g.dateDebut).toISOString().replace("T", " ").substring(0, 23);
            let entetePrefixee = `[${dateDebutStr}] ${g.logFormatte.entete}`;
            if (g.count > 1) {
                const dateFinStr = new Date(g.dateFin).toISOString().replace("T", " ").substring(0, 23);
                entetePrefixee = `[${dateDebutStr} -> ${dateFinStr}] (répété ${g.count} fois) ${g.logFormatte.entete}`;
            }
            const texteComplet = entetePrefixee + (g.logFormatte.args.length > 0 ? "\n" + g.logFormatte.args.join("\n") : "") + (g.logFormatte.fullStack ? `\nStacktrace:\n${g.logFormatte.fullStack}` : "");
            return {
                entete: entetePrefixee,
                args: g.logFormatte.args,
                fullStack: g.logFormatte.fullStack,
                texteComplet
            };
        });

        return logsStructures;
    }

    /**
     * @private
     */

    #obtenirUrlRelative() {
        return (location.pathname + location.search + location.hash).replace(/^\/+/, '');
    }

    #genererHashHFTA() {
        const vus = new Set();
        for (let i = this.historique.length - 1; i >= 0; i--) {
            const log = this.historique[i];
            if (this.#estLogAIgnorerDansHistorique(log)) {
                continue;
            }
            const sig = `${log.type}:${log.fichier}:${log.fonction}:${log.ligne}`;
            if (!vus.has(sig)) {
                vus.add(sig);
                if (vus.size === 100) break;
            }
        }
        const signaturesTriees = Array.from(vus).sort();
        const compositeStr = signaturesTriees.join("|") + "|" + this.#obtenirUrlRelative();
        return Utils.genererHash(compositeStr);
    }

    /**
     * Poste les logs d'erreurs ou de signalements sur le forum.
     * @async
     * @param {Error|null} erreurCatchée - L'erreur interceptée ou nulle s'il s'agit d'un signalement manuel.
     * @param {String|null} [messageOptionnel=null] - Un message optionnel fourni par l'utilisateur.
     * @param {Function|null} [callbackProgression=null] - Callback de progression.
     */
    async posterLogs(erreurCatchée, messageOptionnel = null, callbackProgression = null) {
        if (!LOGGER_ACTIF) return false;

        const executerPoste = async () => {
            await this.#acquireLock();
            this.#enTrainDePoster = true;

            try {
                const progressState = { lastPct: -1 };
                await this.#notifyProgress(callbackProgression, 0, progressState);

                // Déterminer si l'appel provient d'un signalement manuel
                let stack = "";
                let estManuel = false;

                if (erreurCatchée) {
                    const rawStack = erreurCatchée.stack || String(erreurCatchée);
                    stack = this.#nettoyerStacktrace(rawStack);
                    // Si l'erreur est celle d'un appel manuel (du bouton de signalement)
                    if (erreurCatchée.message === "Signalement manuel de l'utilisateur") {
                        estManuel = true;
                    }
                } else {
                    estManuel = true;
                }

                // 1. Liaison par instance de Logger (uniquement pour les signalements automatiques)
                if (!estManuel && this.idSujet) {
                    if (this.sujetCreeParCetteInstance) {
                        // Procéder directement à la mise à jour des logs
                        return await this.#mettreAJourLogsSujetExistant(this.idSujet, messageOptionnel);
                    } else {
                        // Ignorer les erreurs ultérieures si le sujet n'a pas été créé par cette instance
                        return false;
                    }
                }

                // 2. Collecte des données
                const pseudo = await monProfilJoueur.lire('Pseudo');

                let hashcode = "";
                if (estManuel) {
                    hashcode = this.#genererHashHFTA();
                } else {
                    hashcode = Utils.genererHash(stack);
                }

                // 3. Recherche de sujet existant
                const idSection = monProfilUtilisateur.parametre['Logs Outiiil'].valeur;
                if (!idSection) {
                    if (console._error) {
                        console._error(`[${this.constructor.name}.posterLogs] ID de section 'Logs Outiiil' non trouvé.`);
                    }
                    return null;
                }

                // Récupérer les sujets existants
                const { sujets } = await AccesForum.recupererSujetsSection(idSection);
                await this.#notifyProgress(callbackProgression, 0.3, progressState);

                let sujetTrouve = null;

                for (const sujet of sujets) {
                    try {
                        const titreObj = JSON.parse(sujet.titre);
                        if (titreObj && titreObj.hash === hashcode) {
                            sujetTrouve = {
                                id: sujet.id,
                                titreObj: titreObj
                            };
                            break;
                        }
                    } catch (e) {
                        // Si le titre n'est pas du JSON valide, on l'ignore (sujet d'un autre type ou ancien format)
                    }
                }

                if (sujetTrouve) {
                    // Doublon trouvé : Incrémentation du nombre d'occurrences
                    sujetTrouve.titreObj.occurrences++;
                    const nouveauTitre = JSON.stringify(sujetTrouve.titreObj);

                    // Mettre à jour le titre du sujet
                    await AccesForum.modifierSujet(sujetTrouve.id, nouveauTitre);
                    await this.#notifyProgress(callbackProgression, 50.0, progressState);

                    if (!estManuel) {
                        this.idSujet = sujetTrouve.id;
                        this.sujetCreeParCetteInstance = false;
                    }

                    // Pour un signalement automatique ou si un message optionnel est fourni, compléter la description
                    if (messageOptionnel) {
                        const sujetInfos = await AccesForum.consulterSujetAvecMessagesEtIds(sujetTrouve.id);
                        if (sujetInfos && sujetInfos.messages && sujetInfos.messages.length > 0) {
                            let contenuMsgDesc = sujetInfos.messages[0].contenu;
                            contenuMsgDesc += `\n[Auteur: ${pseudo}] : ${messageOptionnel}`;
                            const idMsgDesc = sujetInfos.messages[0].id;
                            if (idMsgDesc) {
                                await AccesForum.modifierMessage(idMsgDesc, contenuMsgDesc);
                            }
                        } else {
                            if (console._error) {
                                console._error(`[${this.constructor.name}.posterLogs] Impossible de consulter les messages pour le sujet ID ${sujetTrouve.id}`);
                            }
                        }
                    }
                    await this.#notifyProgress(callbackProgression, 100, progressState);
                    return true;
                } else {
                    // Aucun doublon trouvé : Création d'un nouveau sujet
                    const titreObj = {
                        version: VERSION,
                        pseudo: pseudo,
                        url: this.#obtenirUrlRelative(),
                        hash: hashcode,
                        occurrences: 1
                    };

                    const titreSujet = JSON.stringify(titreObj);

                    const idSujet = await AccesForum.creerSujetEtRetournerId(idSection, titreSujet);
                    await this.#notifyProgress(callbackProgression, 0.5, progressState);

                    if (!idSujet) {
                        if (console._error) {
                            console._error(`[${this.constructor.name}.posterLogs] Échec de la création du sujet sur le forum.`);
                        }
                        return null;
                    }

                    if (!estManuel) {
                        this.idSujet = idSujet;
                        this.sujetCreeParCetteInstance = true;
                    }

                    // Envoi du premier message descriptif
                    let premierMessage = estManuel ? "Signalement manuel de l'utilisateur." : "Signalement automatique.";
                    if (messageOptionnel) {
                        premierMessage = `[Auteur: ${pseudo}] : ${messageOptionnel}`;
                    }
                    await AccesForum.envoyerMessageEtRetournerId(idSujet, premierMessage);
                    await this.#notifyProgress(callbackProgression, 0.8, progressState);

                    // Découpage et envoi des logs (uniquement lors de la création initiale du sujet)
                    await this.#envoyerTousLesLogs(idSujet, estManuel ? null : erreurCatchée, callbackProgression, progressState);

                    return true;
                }
            } catch (error) {
                if (console._error) {
                    console._error(`[${this.constructor.name}.posterLogs] Erreur critique lors du postage des logs:`, error);
                }
                throw error;
            } finally {
                this.#enTrainDePoster = false;
                this.#releaseLock();
            }
        };

        const promesse = executerPoste();
        this.#promessePosteEnCours = promesse;
        try {
            return await promesse;
        } finally {
            if (this.#promessePosteEnCours === promesse) {
                this.#promessePosteEnCours = null;
            }
        }
    }

    /**
     * Attend la fin du postage des logs en cours ou en attente.
     * @param {Number} [timeoutMs=60000] - Délai maximal d'attente en millisecondes pour éviter tout blocage.
     * @returns {Promise<void>}
     */
    async attendreFinPosteLogs(timeoutMs = 60000) {
        if (!LOGGER_ACTIF) return;

        const attente = async () => {
            if (this.#promessePosteEnCours) {
                try {
                    await this.#promessePosteEnCours;
                } catch (e) {
                    // Ignorer les erreurs pour ne pas bloquer le flux appelant
                }
            }
            await this.#acquireLock();
            this.#releaseLock();

            if (this.#promessePosteEnCours) {
                try {
                    await this.#promessePosteEnCours;
                } catch (e) {
                }
            }
        };

        let timerId;
        const timeoutPromise = new Promise(resolve => {
            timerId = setTimeout(resolve, timeoutMs);
        });

        try {
            await Promise.race([attente(), timeoutPromise]);
        } finally {
            clearTimeout(timerId);
        }
    }

    /**
     * Enregistre un message posté et associe son ID aux clés de référence qu'il contient.
     * @param {Number} idMessage
     * @param {String} chunk
     * @private
     */
    #enregistrerMessagesEtRefs(idMessage, chunk) {
        if (!idMessage || !chunk) return;
        this.messagesPublies.set(idMessage, chunk);
        for (const info of this.registreEmplacementsRefKeys.values()) {
            if (!info.idMessage) {
                if (this.#contenuContientRef(chunk, info.sansRefStr) || this.#contenuContientRef(chunk, info.avecRefStr)) {
                    info.idMessage = idMessage;
                    info.chunk = chunk;
                }
            }
        }
    }

    /**
     * Construit une regex pour détecter ou remplacer un fragment JSON indenté dans un texte,
     * même s'il est précédé d'un nom de propriété ("key": ).
     * @param {String} refStr
     * @returns {RegExp|null}
     * @private
     */
    #construireRegexFragment(refStr) {
        if (!refStr) return null;
        const lines = refStr.split(/\r?\n/);
        if (lines.length === 0) return null;
        const escapedLines = lines.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (lines.length === 1) {
            return new RegExp('(^|[^"a-zA-Z0-9_-])' + escapedLines[0], 'm');
        }
        // Capture l'indentation de base (\1) et le préfixe éventuel (\2, ex: `"cle": `) avant le début du bloc
        const pattern = '^([ \\t]*)(.*?)(?:' + escapedLines[0] + ')\\r?\\n' + escapedLines.slice(1).map(l => '\\1' + l).join('\\r?\\n');
        return new RegExp(pattern, 'm');
    }

    /**
     * Vérifie si un fragment de sérialisation est contenu dans un message de logs.
     * @param {String} contenu
     * @param {String} refStr
     * @returns {Boolean}
     * @private
     */
    #contenuContientRef(contenu, refStr) {
        if (!contenu || !refStr) return false;
        if (contenu.includes(refStr)) return true;
        const regex = this.#construireRegexFragment(refStr);
        return regex ? regex.test(contenu) : false;
    }

    /**
     * Remplace la représentation sans clé de référence d'un objet par sa représentation avec clé dans le contenu d'un message.
     * @param {String} contenu
     * @param {String} sansRefStr
     * @param {String} avecRefStr
     * @returns {String}
     * @private
     */
    #injecterRefKeyDansContenu(contenu, sansRefStr, avecRefStr) {
        if (!contenu || !sansRefStr || !avecRefStr) return contenu;
        if (contenu.includes(sansRefStr)) {
            return contenu.replace(sansRefStr, avecRefStr);
        }

        const sansLines = sansRefStr.split(/\r?\n/);
        if (sansLines.length === 1) {
            return contenu.replace(sansRefStr, avecRefStr);
        }

        const escapedLines = sansLines.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        // Capture l'indentation de base (\1) et le préfixe éventuel (\2, ex: `"propriete": `)
        const pattern = '^([ \\t]*)(.*?)' + escapedLines[0] + '\\r?\\n' + escapedLines.slice(1).map(l => '\\1' + l).join('\\r?\\n');
        const regex = new RegExp(pattern, 'm');

        const match = contenu.match(regex);
        if (match) {
            const indent = match[1] || "";
            const prefix = match[2] || "";
            const avecLines = avecRefStr.split(/\r?\n/);
            const avecIndented = prefix + avecLines[0] + "\n" + avecLines.slice(1).map(l => indent + l).join("\n");
            return contenu.replace(regex, indent + avecIndented);
        }

        return contenu;
    }

    /**
     * Identifie les clés citées dans les nouveaux logs qui n'avaient pas été publiées avec leur clé de référence lors d'un post précédent,
     * et met à jour les messages antérieurs correspondants sur le forum.
     * @param {Number} idSujet
     * @param {Array} logsAEnvoyer
     * @param {Object|null} sujetInfos
     * @private
     */
    async #mettreAJourReferencesRetroactives(idSujet, logsAEnvoyer, sujetInfos) {
        if (!logsAEnvoyer || logsAEnvoyer.length === 0) return;

        // Passe de détection sur logsAEnvoyer pour trouver les clés citées
        const clesCitees = new Set();
        const tempMap = new Map(this.serialisationsVues);
        const tempHolder = { index: this.nextRefKeyIndex };
        const ctxPass = {
            map: tempMap,
            nextIndex: () => "R" + (tempHolder.index++),
            estDetection: true
        };
        const snapshotsMapPass = new Map();
        for (const [key, val] of this.snapshotsMap) {
            snapshotsMapPass.set(key, this.#clonerSnapshot(val));
        }
        const instancesVisiblesPass = new Set(this.instancesVisibles);
        const totalLogs = logsAEnvoyer.length;
        for (let i = 0; i < totalLogs; i++) {
            this.#formaterLogAvecDeltas(logsAEnvoyer[i], snapshotsMapPass, clesCitees, ctxPass, instancesVisiblesPass);
        }

        // Remplir messagesPublies depuis sujetInfos si nécessaire
        if (sujetInfos && sujetInfos.messages) {
            for (const msg of sujetInfos.messages) {
                if (msg.id && !this.messagesPublies.has(msg.id)) {
                    this.messagesPublies.set(msg.id, msg.contenu);
                }
            }
        }

        // Identifier les clés citées qui n'ont pas encore été publiées avec leur clé de référence
        const messagesAModifier = new Map(); // idMessage -> contenuModifie
        for (const refKey of clesCitees) {
            if (!this.clesPublieesAvecRefKey.has(refKey)) {
                const info = this.registreEmplacementsRefKeys.get(refKey);
                if (info && info.idMessage) {
                    let contenu = messagesAModifier.get(info.idMessage) || this.messagesPublies.get(info.idMessage);
                    if (!contenu && sujetInfos && sujetInfos.messages) {
                        const found = sujetInfos.messages.find(m => m.id === info.idMessage);
                        if (found) contenu = found.contenu;
                    }
                    if (contenu) {
                        const nouveauContenu = this.#injecterRefKeyDansContenu(contenu, info.sansRefStr, info.avecRefStr);
                        if (nouveauContenu !== contenu) {
                            messagesAModifier.set(info.idMessage, nouveauContenu);
                        }
                    }
                    this.clesPublieesAvecRefKey.add(refKey);
                    info.publiee = true;
                }
            }
        }

        // Appliquer les modifications sur le forum
        for (const [idMsg, nouveauContenu] of messagesAModifier.entries()) {
            await AccesForum.modifierMessage(idMsg, nouveauContenu);
            this.messagesPublies.set(idMsg, nouveauContenu);
            await Utils.sleep(10);
        }
    }

    /**
     * Met à jour les logs d'un sujet existant (uniquement par la même instance de Logger)
     * @private
     * @async
     * @param {Number} idSujet
     * @param {String|null} [messageOptionnel=null]
     */
    async #mettreAJourLogsSujetExistant(idSujet, messageOptionnel = null) {
        const pseudo = await monProfilJoueur.lire('Pseudo');
        const sujetInfos = await AccesForum.consulterSujetAvecMessagesEtIds(idSujet);

        // Si messageOptionnel est fourni, modifier le message de description
        if (messageOptionnel) {
            let contenuMsgDesc = sujetInfos.messages[0].contenu;
            contenuMsgDesc += `\n[Auteur: ${pseudo}] : ${messageOptionnel}`;
            const idMsgDesc = sujetInfos.messages[0].id;
            await AccesForum.modifierMessage(idMsgDesc, contenuMsgDesc);
        }

        let indexDeJonction = -1;
        if (this.dernierLogEnvoye) {
            indexDeJonction = this.historique.lastIndexOf(this.dernierLogEnvoye);
        }

        let logsAEnvoyer = [];

        if (indexDeJonction !== -1) {
            // Cas 1 : Présence d'un chevauchement dans l'historique des logs
            logsAEnvoyer = this.historique.slice(indexDeJonction + 1);
        } else {
            // Cas 2 : Absence de chevauchement (historique réinitialisé suite à une action sécurisée ou rechargement)
            if (this.dernierLogEnvoye) {
                await AccesForum.envoyerMessageEtRetournerId(idSujet, "... [RÉINITIALISATION DE L'HISTORIQUE / ACTION SÉCURISÉE] ...");
            }
            logsAEnvoyer = this.historique;
        }

        logsAEnvoyer = logsAEnvoyer.filter(log => !this.#estLogAIgnorerDansHistorique(log));

        if (logsAEnvoyer.length > 0) {
            await this.#mettreAJourReferencesRetroactives(idSujet, logsAEnvoyer, sujetInfos);
            const logsFormates = await this.#obtenirLogsFormates(logsAEnvoyer);
            const chunks = await this.#decouperLogsEnChunks(logsFormates);
            const validChunks = chunks.filter(c => c.trim());

            for (const chunk of validChunks) {
                const idMessage = await AccesForum.envoyerMessageEtRetournerId(idSujet, chunk);
                if (idMessage) {
                    this.#enregistrerMessagesEtRefs(idMessage, chunk);
                }
                await Utils.sleep(10);
            }
            this.dernierLogEnvoye = logsAEnvoyer[logsAEnvoyer.length - 1];
        }
        return true;
    }

    /**
     * Envoie tous les logs d'une traite (pour un nouveau sujet).
     * Si 'erreurCatchée' est fournie (signalement automatique), seuls les logs dans le périmètre
     * défini par LOGGER_PERIMETRE_STACK_DISTANCE sont envoyés.
     * @private
     * @async
     * @param {Number} idSujet
     * @param {Error|null} [erreurCatchée=null]
     * @param {Function|null} [callbackProgression=null]
     * @param {Object|null} [progressState=null]
     */
    async #envoyerTousLesLogs(idSujet, erreurCatchée = null, callbackProgression = null, progressState = null) {
        if (!progressState) progressState = { lastPct: -1 };

        if (this.historique.length === 0) {
            await this.#notifyProgress(callbackProgression, 100, progressState);
            return true;
        }

        let logsAEnvoyer = this.historique.filter(log => !this.#estLogAIgnorerDansHistorique(log));

        // Filtrage par périmètre de distance dans l'arbre d'appel pour un signalement automatique
        if (erreurCatchée) {
            const rawStackErr = erreurCatchée.stack || String(erreurCatchée);
            const stackFramesErr = this.#extraireFramesStack(rawStackErr);

            if (stackFramesErr.length > 0) {
                logsAEnvoyer = logsAEnvoyer.filter(log => {
                    const dist = this.#calculerDistanceStack(stackFramesErr, log.stackFrames);
                    return dist <= LOGGER_PERIMETRE_STACK_DISTANCE;
                });
            }
        }

        const logsFormates = await this.#obtenirLogsFormates(logsAEnvoyer, callbackProgression, 0.8, 3.5, progressState);

        const chunks = await this.#decouperLogsEnChunks(logsFormates, callbackProgression, 3.5, 13.0, progressState);
        const validChunks = chunks.filter(c => c.trim());

        const total = validChunks.length;
        let envoyes = 0;

        const rangeStartEnvoi = 13.0;
        const rangeEndEnvoi = 100.0;
        const rangeSpanEnvoi = rangeEndEnvoi - rangeStartEnvoi;

        await this.#notifyProgress(callbackProgression, rangeStartEnvoi, progressState);

        for (const chunk of validChunks) {
            const idMessage = await AccesForum.envoyerMessageEtRetournerId(idSujet, chunk);
            if (idMessage) {
                this.#enregistrerMessagesEtRefs(idMessage, chunk);
            }
            envoyes++;
            if (callbackProgression && total > 0) {
                const currentPct = rangeStartEnvoi + (envoyes / total) * rangeSpanEnvoi;
                await this.#notifyProgress(callbackProgression, currentPct, progressState);
            }
            await Utils.sleep(10);
        }

        if (total === 0) {
            await this.#notifyProgress(callbackProgression, 100, progressState);
        }
        this.dernierLogEnvoye = this.historique[this.historique.length - 1];
        return true;
    }

    #estimerTailleCombinee(a, b, sep = "\n") {
        if (!a) return Utils.estimerTailleEchappee(b);
        if (!b) return Utils.estimerTailleEchappee(a);
        return Utils.estimerTailleEchappee(a + sep + b);
    }

    #estLigneEnTeteObjet(line) {
        if (!line) return false;
        const trimmed = line.trim();
        return trimmed === "{" || trimmed === "["
            || /^(?:[+-]\s+)?\[(?:[A-Z][a-zA-Z0-9_]*\s+)?\((?:ID:\s*\d+|Ref:\s*R\d+)[^)]*\)\]$/.test(trimmed)
            || /^(?:[+-]\s+)?\[ID:\s*\d+\]$/.test(trimmed)
            || /^(?:[+-]\s+)?\[(?:[A-Z][a-zA-Z0-9_]*)\]$/.test(trimmed)
            || /^(?:[+-]\s+)?[A-Z][a-zA-Z0-9_]*\s+\[.*\]$/.test(trimmed)
            || /^(?:[+-]\s+)?(?:"[^"]+"|\w+):\s*\[(?:[A-Z][a-zA-Z0-9_]*\s+)?\((?:ID:\s*\d+|Ref:\s*R\d+)[^)]*\)\]$/.test(trimmed)
            || /^(?:[+-]\s+)?(?:"[^"]+"|\w+):\s*\[ID:\s*\d+\]$/.test(trimmed);
    }

    #estLigneFinStructure(line) {
        if (!line) return false;
        const trimmed = line.trim();
        return trimmed === "}" || trimmed === "}," || trimmed === "]" || trimmed === "]," || trimmed === "};";
    }

    #estLigneInseparableFinOuEnTete(line) {
        return this.#estLigneEnTeteObjet(line) || this.#estLigneFinStructure(line);
    }

    #extraireFinInseparable(lns) {
        if (!lns || lns.length === 0) return null;
        const derLigne = lns[lns.length - 1];

        // Une ligne de fermeture seule (}, ], etc.) ne doit pas être détachée pour devenir le début d'un nouveau chunk
        if (this.#estLigneFinStructure(derLigne)) {
            return null;
        }

        // Cas d'une en-tête en deux lignes : line-2 = [Class (ID: ...)], line-1 = { ou [
        if (lns.length >= 2) {
            const avantDerniere = lns[lns.length - 2];
            if ((derLigne.trim() === "{" || derLigne.trim() === "[") && this.#estLigneEnTeteObjet(avantDerniere)) {
                const line1 = lns.pop();
                const line2 = lns.pop();
                return `${line2}\n${line1}`;
            }
        }

        // Cas général : en-tête d'objet seule
        if (this.#estLigneEnTeteObjet(derLigne)) {
            return lns.pop();
        }

        return null;
    }

    /**
     * Découpe un fragment de texte en sous-morceaux hiérarchiques selon la priorité :
     * 1. Entre lignes de même niveau d'indentation (jonction entre objets de niveau 1, 2, etc.)
     * 2. Si indivisible, au niveau caractère
     * @private
     * @param {String} texte
     * @param {Number} tailleMax
     * @param {Number} profondeurIndentation - Profondeur de recherche d'indentation ("  ".repeat(p))
     * @returns {Array<String>}
     */
    #decouperFragmentRecursif(texte, tailleMax, profondeurIndentation = 1) {
        if (Utils.estimerTailleEchappee(texte) <= tailleMax) {
            return [texte];
        }

        const lines = texte.split("\n");
        if (lines.length <= 1) {
            // Ligne unique dépassant tailleMax : découpage caractère
            const sousChunks = [];
            let remaining = texte;
            while (Utils.estimerTailleEchappee(remaining) > tailleMax) {
                let subLen = Math.floor(tailleMax / 2);
                while (subLen < remaining.length && Utils.estimerTailleEchappee(remaining.substring(0, subLen + 1)) <= tailleMax) {
                    subLen++;
                }
                if (subLen === 0) subLen = 1;
                sousChunks.push(remaining.substring(0, subLen));
                remaining = remaining.substring(subLen);
            }
            if (remaining) sousChunks.push(remaining);
            return sousChunks;
        }

        // Recherche de points de scission aux délimitations de niveau `profondeurIndentation`
        const prefixeNiveau = "  ".repeat(profondeurIndentation);
        // Une ligne appartient à ce niveau si elle commence par exactement `prefixeNiveau` suivi d'un caractère non-espace
        const indicesScission = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith(prefixeNiveau) && !line.startsWith(prefixeNiveau + " ")) {
                // Ne pas scinder juste après une en-tête d'objet ou avant une ligne de fermeture seule afin d'éviter qu'elles se retrouvent orphelines
                if (i > 0 && this.#estLigneInseparableFinOuEnTete(lines[i - 1])) {
                    continue;
                }
                if (this.#estLigneFinStructure(line)) {
                    continue;
                }
                indicesScission.push(i);
            }
        }

        if (indicesScission.length > 0) {
            // Découpage en blocs selon ces indices
            const blocs = [];
            let dernierIdx = 0;
            for (const idx of indicesScission) {
                blocs.push(lines.slice(dernierIdx, idx).join("\n"));
                dernierIdx = idx;
            }
            if (dernierIdx < lines.length) {
                blocs.push(lines.slice(dernierIdx).join("\n"));
            }

            // Assembler les blocs dans la limite de tailleMax
            const resultats = [];
            let courant = "";
            for (const bloc of blocs) {
                if (Utils.estimerTailleEchappee(bloc) > tailleMax) {
                    if (courant) {
                        // Vérifier si la dernière ligne ou bloc de `courant` est une en-tête / fermeture à détacher
                        const lns = courant.split("\n");
                        const blocOrphelin = this.#extraireFinInseparable(lns);
                        if (blocOrphelin) {
                            resultats.push(lns.join("\n"));
                            courant = blocOrphelin;
                        } else {
                            resultats.push(courant);
                            courant = "";
                        }
                    }
                    // Descente au niveau de profondeur suivant
                    const sousBlocs = this.#decouperFragmentRecursif(bloc, tailleMax, profondeurIndentation + 1);
                    for (const sb of sousBlocs) {
                        if (this.#estimerTailleCombinee(courant, sb) <= tailleMax) {
                            courant = courant ? courant + "\n" + sb : sb;
                        } else {
                            if (courant) {
                                const lns = courant.split("\n");
                                const blocOrphelin = this.#extraireFinInseparable(lns);
                                if (blocOrphelin) {
                                    resultats.push(lns.join("\n"));
                                    courant = blocOrphelin;
                                    if (this.#estimerTailleCombinee(courant, sb) <= tailleMax) {
                                        courant = courant + "\n" + sb;
                                        continue;
                                    } else {
                                        resultats.push(courant);
                                        courant = "";
                                    }
                                } else {
                                    resultats.push(courant);
                                }
                            }
                            courant = sb;
                        }
                    }
                } else if (this.#estimerTailleCombinee(courant, bloc) <= tailleMax) {
                    courant = courant ? courant + "\n" + bloc : bloc;
                } else {
                    if (courant) {
                        const lns = courant.split("\n");
                        const blocOrphelin = this.#extraireFinInseparable(lns);
                        if (blocOrphelin) {
                            resultats.push(lns.join("\n"));
                            courant = blocOrphelin;
                            if (this.#estimerTailleCombinee(courant, bloc) <= tailleMax) {
                                courant = courant + "\n" + bloc;
                                continue;
                            } else {
                                resultats.push(courant);
                                courant = "";
                            }
                        } else {
                            resultats.push(courant);
                        }
                    }
                    courant = bloc;
                }
            }
            if (courant) resultats.push(courant);
            return resultats;
        }

        // Si aucun point de scission au niveau d'indentation courant, essayer le niveau suivant s'il y a de l'indentation plus profonde
        const aIndentationPlusProfonde = lines.some(l => l.startsWith(prefixeNiveau + " "));
        if (aIndentationPlusProfonde && profondeurIndentation < 50) {
            return this.#decouperFragmentRecursif(texte, tailleMax, profondeurIndentation + 1);
        }

        // Sinon découper ligne par ligne
        const chunksLignes = [];
        let curChunk = "";
        for (const line of lines) {
            if (Utils.estimerTailleEchappee(line) > tailleMax) {
                if (curChunk) {
                    const lns = curChunk.split("\n");
                    const blocOrphelin = this.#extraireFinInseparable(lns);
                    if (blocOrphelin) {
                        chunksLignes.push(lns.join("\n"));
                        curChunk = blocOrphelin;
                    } else {
                        chunksLignes.push(curChunk);
                        curChunk = "";
                    }
                }
                const sc = this.#decouperFragmentRecursif(line, tailleMax, profondeurIndentation + 1);
                for (const s of sc) {
                    if (this.#estimerTailleCombinee(curChunk, s) <= tailleMax) {
                        curChunk = curChunk ? curChunk + "\n" + s : s;
                    } else {
                        if (curChunk) chunksLignes.push(curChunk);
                        curChunk = s;
                    }
                }
            } else if (this.#estimerTailleCombinee(curChunk, line) <= tailleMax) {
                curChunk = curChunk ? curChunk + "\n" + line : line;
            } else {
                if (curChunk) {
                    const lns = curChunk.split("\n");
                    const blocOrphelin = this.#extraireFinInseparable(lns);
                    if (blocOrphelin) {
                        chunksLignes.push(lns.join("\n"));
                        curChunk = blocOrphelin;
                        if (this.#estimerTailleCombinee(curChunk, line) <= tailleMax) {
                            curChunk = curChunk + "\n" + line;
                            continue;
                        } else {
                            chunksLignes.push(curChunk);
                            curChunk = "";
                        }
                    } else {
                        chunksLignes.push(curChunk);
                    }
                }
                curChunk = line;
            }
        }
        if (curChunk) chunksLignes.push(curChunk);
        return chunksLignes;
    }

    /**
     * Découpe un log individuel (en-tête + arguments) en respectant la hiérarchie :
     * 1. Entre arguments de log
     * 2. Entre objets sérialisés de premier niveau, second niveau, etc.
     * @private
     * @param {Object} logStructure - Structure { entete: String, args: Array<String>, fullStack: String|undefined }
     * @param {Number} tailleMax
     * @returns {Array<String>}
     */
    #decouperLogEnChunks(logStructure, tailleMax) {
        const entete = logStructure.entete;
        const elements = [...logStructure.args];
        if (logStructure.fullStack) {
            elements.push(`Stacktrace:\n${logStructure.fullStack}`);
        }

        const logEntier = entete + (elements.length > 0 ? "\n" + elements.join("\n") : "");
        if (Utils.estimerTailleEchappee(logEntier) <= tailleMax) {
            return [logEntier];
        }

        // Si l'en-tête + premier argument dépasse déjà ou si on doit scinder entre arguments
        const fragments = [];
        let premierMorceau = entete;

        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const elEstime = Utils.estimerTailleEchappee(el);

            if (premierMorceau) {
                if (this.#estimerTailleCombinee(premierMorceau, el) <= tailleMax) {
                    premierMorceau += "\n" + el;
                    continue;
                } else {
                    // Si premierMorceau ne peut pas accueillir el
                    if (Utils.estimerTailleEchappee(premierMorceau) > tailleMax) {
                        // L'en-tête seul dépasserait tailleMax (extrêmement rare)
                        const sc = this.#decouperFragmentRecursif(premierMorceau, tailleMax, 1);
                        fragments.push(...sc);
                    } else {
                        fragments.push(premierMorceau);
                    }
                    premierMorceau = "";
                }
            }

            // Traitement de l'élément el
            if (elEstime <= tailleMax) {
                if (fragments.length > 0) {
                    const dernierFragment = fragments[fragments.length - 1];
                    const lns = dernierFragment.split("\n");
                    const blocOrphelin = this.#extraireFinInseparable(lns);
                    if (blocOrphelin && this.#estimerTailleCombinee(dernierFragment, el) > tailleMax) {
                        if (lns.length > 0) {
                            fragments[fragments.length - 1] = lns.join("\n");
                        } else {
                            fragments.pop();
                        }
                        const elAvecEntete = blocOrphelin + "\n" + el;
                        if (Utils.estimerTailleEchappee(elAvecEntete) <= tailleMax) {
                            fragments.push(elAvecEntete);
                        } else {
                            fragments.push(blocOrphelin);
                            fragments.push(el);
                        }
                    } else if (this.#estimerTailleCombinee(dernierFragment, el) <= tailleMax) {
                        fragments[fragments.length - 1] += "\n" + el;
                    } else {
                        fragments.push(el);
                    }
                } else {
                    fragments.push(el);
                }
            } else {
                // el dépasse tailleMax : découpage hiérarchique au niveau 1 (2 espaces), niveau 2 (4 espaces), etc.
                const sousFragments = this.#decouperFragmentRecursif(el, tailleMax, 1);
                for (const sf of sousFragments) {
                    if (fragments.length > 0) {
                        const dernierFragment = fragments[fragments.length - 1];
                        const lns = dernierFragment.split("\n");
                        const blocOrphelin = this.#extraireFinInseparable(lns);
                        if (blocOrphelin && this.#estimerTailleCombinee(dernierFragment, sf) > tailleMax) {
                            if (lns.length > 0) {
                                fragments[fragments.length - 1] = lns.join("\n");
                            } else {
                                fragments.pop();
                            }
                            const sfAvecEntete = blocOrphelin + "\n" + sf;
                            if (Utils.estimerTailleEchappee(sfAvecEntete) <= tailleMax) {
                                fragments.push(sfAvecEntete);
                            } else {
                                fragments.push(blocOrphelin);
                                fragments.push(sf);
                            }
                        } else if (this.#estimerTailleCombinee(dernierFragment, sf) <= tailleMax) {
                            fragments[fragments.length - 1] += "\n" + sf;
                        } else {
                            fragments.push(sf);
                        }
                    } else {
                        fragments.push(sf);
                    }
                }
            }
        }

        if (premierMorceau) {
            fragments.push(premierMorceau);
        }

        return fragments.length > 0 ? fragments : [logEntier];
    }

    /**
     * Découpe la liste de logs formatés en chunks respectant la priorité :
     * 1. Entre logs
     * 2. Entre arguments de log
     * 3. À la jonction entre objets sérialisés de 1er niveau, puis 2e niveau, etc.
     * @private
     * @param {Array<Object>|String} logs - Liste de logs structurés ou chaîne brute (rétro-compatibilité)
     * @param {Function|null} [callbackProgression=null]
     * @param {Number} [rangeStart=0.8]
     * @param {Number} [rangeEnd=4.0]
     * @param {Object|null} [progressState=null]
     * @returns {Array<String>}
     */
    async #decouperLogsEnChunks(logs, callbackProgression = null, rangeStart = 0.8, rangeEnd = 4.0, progressState = null) {
        const tailleMaxChunk = Math.floor(MESSAGE_MAX_LENGTH * 0.5);
        const chunks = [];

        // Rétrocompatibilité si logs est déjà une chaîne
        if (typeof logs === "string") {
            const lines = logs.split("\n");
            let currentChunk = "";
            const totalLines = lines.length;
            const rangeSpan = rangeEnd - rangeStart;

            for (let i = 0; i < totalLines; i++) {
                const line = lines[i];
                const lineEstimee = Utils.estimerTailleEchappee(line);
                if (lineEstimee > tailleMaxChunk) {
                    if (currentChunk) {
                        chunks.push(currentChunk);
                        currentChunk = "";
                    }
                    const sousChunks = this.#decouperFragmentRecursif(line, tailleMaxChunk, 1);
                    for (const sc of sousChunks) {
                        chunks.push(sc);
                    }
                } else if (this.#estimerTailleCombinee(currentChunk, line) > tailleMaxChunk) {
                    chunks.push(currentChunk);
                    currentChunk = line;
                } else {
                    currentChunk = currentChunk ? currentChunk + "\n" + line : line;
                }

                if (callbackProgression && totalLines > 0) {
                    const currentPct = rangeStart + ((i + 1) / totalLines) * rangeSpan;
                    await this.#notifyProgress(callbackProgression, currentPct, progressState);
                }
            }
            if (currentChunk) {
                chunks.push(currentChunk);
            }
            return chunks;
        }

        // Structure riche : tableau de logs { entete, args, fullStack, texteComplet }
        const listeLogs = Array.isArray(logs) ? logs : [];
        const totalLogs = listeLogs.length;
        const rangeSpan = rangeEnd - rangeStart;
        let currentChunk = "";

        for (let i = 0; i < totalLogs; i++) {
            const logItem = listeLogs[i];
            const logTexte = logItem.texteComplet || (logItem.entete + (logItem.args?.length > 0 ? "\n" + logItem.args.join("\n") : ""));
            const logTaille = Utils.estimerTailleEchappee(logTexte);

            if (logTaille <= tailleMaxChunk) {
                // Priorité 1 : Le log entier tient-il dans le chunk courant ?
                if (this.#estimerTailleCombinee(currentChunk, logTexte) <= tailleMaxChunk) {
                    currentChunk = currentChunk ? currentChunk + "\n" + logTexte : logTexte;
                } else {
                    // Scission entre logs : on archive le chunk courant et démarre avec ce log
                    if (currentChunk) {
                        chunks.push(currentChunk);
                    }
                    currentChunk = logTexte;
                }
            } else {
                // Le log individuel dépasse tailleMaxChunk : scission prioritaire 2 (entre arguments) et 3 (entre objets/sous-objets)
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = "";
                }

                const fragmentsLog = this.#decouperLogEnChunks(logItem, tailleMaxChunk);
                for (const fragment of fragmentsLog) {
                    if (this.#estimerTailleCombinee(currentChunk, fragment) <= tailleMaxChunk) {
                        currentChunk = currentChunk ? currentChunk + "\n" + fragment : fragment;
                    } else {
                        if (currentChunk) {
                            const lns = currentChunk.split("\n");
                            const blocOrphelin = this.#extraireFinInseparable(lns);
                            if (blocOrphelin) {
                                chunks.push(lns.join("\n"));
                                currentChunk = blocOrphelin;
                                if (this.#estimerTailleCombinee(currentChunk, fragment) <= tailleMaxChunk) {
                                    currentChunk = currentChunk + "\n" + fragment;
                                    continue;
                                } else {
                                    chunks.push(currentChunk);
                                    currentChunk = "";
                                }
                            } else {
                                chunks.push(currentChunk);
                            }
                        }
                        currentChunk = fragment;
                    }
                }
            }

            if (callbackProgression && totalLogs > 0) {
                const currentPct = rangeStart + ((i + 1) / totalLogs) * rangeSpan;
                await this.#notifyProgress(callbackProgression, currentPct, progressState);
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    /**
     * Analyse une liste de paramètres entre parenthèses dans une chaîne de code JS.
     * @param {String} src - Le code source nettoyé.
     * @param {Number} idxOuvrante - L'indice de la parenthèse ouvrante '('.
     * @returns {Array<String>} - Les noms des paramètres.
     * @private
     */
    #extraireParamsDepuisChaine(src, idxOuvrante) {
        let depth = 0;
        let idxFermante = -1;
        let inString = false;
        let stringChar = '';

        for (let i = idxOuvrante; i < src.length; i++) {
            const char = src[i];
            if (inString) {
                if (char === stringChar && src[i - 1] !== '\\') {
                    inString = false;
                }
            } else if (char === '"' || char === "'" || char === '`') {
                inString = true;
                stringChar = char;
            } else if (char === '(') {
                depth++;
            } else if (char === ')') {
                depth--;
                if (depth === 0) {
                    idxFermante = i;
                    break;
                }
            }
        }

        if (idxFermante === -1) return [];

        const paramsStr = src.substring(idxOuvrante + 1, idxFermante).trim();
        if (!paramsStr) return [];

        const params = [];
        let current = '';
        let depthParen = 0;
        let depthBracket = 0;
        let depthBrace = 0;
        inString = false;
        stringChar = '';

        for (let i = 0; i < paramsStr.length; i++) {
            const c = paramsStr[i];
            if (inString) {
                current += c;
                if (c === stringChar && paramsStr[i - 1] !== '\\') {
                    inString = false;
                }
            } else if (c === '"' || c === "'" || c === '`') {
                inString = true;
                stringChar = c;
                current += c;
            } else if (c === '(') {
                depthParen++;
                current += c;
            } else if (c === ')') {
                depthParen--;
                current += c;
            } else if (c === '[') {
                depthBracket++;
                current += c;
            } else if (c === ']') {
                depthBracket--;
                current += c;
            } else if (c === '{') {
                depthBrace++;
                current += c;
            } else if (c === '}') {
                depthBrace--;
                current += c;
            } else if (c === ',' && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
                params.push(current.trim());
                current = '';
            } else {
                current += c;
            }
        }
        if (current.trim()) {
            params.push(current.trim());
        }

        return params.map(p => {
            let pClean = p.trim();
            if (pClean.startsWith('...')) {
                pClean = pClean.substring(3).trim();
            }
            let eqIdx = -1;
            let dP = 0, dB = 0, dBr = 0, inStr = false, sCh = '';
            for (let j = 0; j < pClean.length; j++) {
                const char = pClean[j];
                if (inStr) {
                    if (char === sCh && pClean[j - 1] !== '\\') inStr = false;
                } else if (char === '"' || char === "'" || char === '`') {
                    inStr = true;
                    sCh = char;
                } else if (char === '(') dP++;
                else if (char === ')') dP--;
                else if (char === '[') dB++;
                else if (char === ']') dB--;
                else if (char === '{') dBr++;
                else if (char === '}') dBr--;
                else if (char === '=' && dP === 0 && dB === 0 && dBr === 0) {
                    eqIdx = j;
                    break;
                }
            }
            if (eqIdx !== -1) {
                pClean = pClean.substring(0, eqIdx).trim();
            }
            return pClean;
        }).filter(Boolean);
    }

    /**
     * Extrait les noms des paramètres d'une fonction ou d'une classe (en remontant la chaîne de prototype si besoin).
     * @param {Function} fn - La fonction ou la classe dont on veut extraire les noms de paramètres.
     * @returns {Array<String>} - Les noms des paramètres.
     * @private
     */
    #extraireNomsParametres(fn) {
        if (typeof fn !== "function") return [];

        let current = fn;
        while (current && typeof current === "function" && current !== Function.prototype && current !== Object) {
            let src = current.toString();
            src = src.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();

            const estClasse = /^\s*class\b/.test(src);

            if (estClasse) {
                const matchCtor = src.match(/constructor\s*\(/);
                if (matchCtor) {
                    const idxOuvrante = matchCtor.index + matchCtor[0].length - 1;
                    return this.#extraireParamsDepuisChaine(src, idxOuvrante);
                }
                const parent = Object.getPrototypeOf(current);
                if (!parent || parent === current) break;
                current = parent;
            } else {
                const idxOuvrante = src.indexOf('(');
                if (idxOuvrante === -1) {
                    const matchFleche = src.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/);
                    return matchFleche ? [matchFleche[1]] : [];
                }
                return this.#extraireParamsDepuisChaine(src, idxOuvrante);
            }
        }

        return [];
    }

    /**
     * @private
     */

    #instrumenterConstructeur(classe, nomClasse) {
        if (typeof classe !== 'function' || !classe.prototype) return classe;

        const self = this;
        const proxyClass = new Proxy(classe, {
            construct(target, args, newTarget) {
                const paramNames = self.#extraireNomsParametres(target);
                const maxLen = Math.max(args.length, paramNames.length);
                const entreeArgs = [];
                for (let i = 0; i < maxLen; i++) {
                    const val = i < args.length ? args[i] : undefined;
                    const pName = i < paramNames.length ? paramNames[i] : ("param" + (i + 1));
                    entreeArgs.push(`${pName}:`, val);
                }

                console.log(`[Entrée] ${nomClasse}.constructor`, ...entreeArgs);
                try {
                    const instance = Reflect.construct(target, args, newTarget);
                    console.log(`[Sortie] ${nomClasse}.constructor`, "this:", instance);
                    return instance;
                } catch (error) {
                    console.error(`[Sortie Exception] ${nomClasse}.constructor`, "erreur:", error);
                    throw error;
                }
            }
        });

        return proxyClass;
    }

    /**
     * @private
     */

    #instrumenterObject(classe, nomClasse) {
        if (!classe) return;

        const self = this;
        const IGNORED_PROPERTIES = new Set(['constructor', 'prototype', 'name', 'length', 'caller', 'arguments']);

        const instrumenterMembres = (obj, estStatique = false) => {
            if (!obj) return;
            Object.getOwnPropertyNames(obj).forEach(nomMethode => {
                if (IGNORED_PROPERTIES.has(nomMethode)) return;

                const desc = Object.getOwnPropertyDescriptor(obj, nomMethode);
                if (!desc || desc.writable === false || desc.configurable === false) return;

                if (typeof desc.value === 'function') {
                    if (/^\s*class\s+/.test(desc.value.toString())) return;

                    const original = desc.value;
                    const paramNames = self.#extraireNomsParametres(original);

                    obj[nomMethode] = function (...args) {
                        const estInstance = !estStatique && Boolean(this) && typeof this === "object";

                        const entreeArgs = [];
                        const maxLen = Math.max(args.length, paramNames.length);
                        for (let i = 0; i < maxLen; i++) {
                            const val = i < args.length ? args[i] : undefined;
                            const pName = i < paramNames.length ? paramNames[i] : ("param" + (i + 1));
                            entreeArgs.push(`${pName}:`, val);
                        }

                        if (estInstance && !args.includes(this)) {
                            entreeArgs.push("this:", this);
                        }

                        console.log(`[Entrée] ${nomClasse}.${nomMethode}`, ...entreeArgs);
                        try {
                            const res = original.apply(this, args);
                            const estPromise = res && (typeof res === "object" || typeof res === "function") && typeof res.then === "function";
                            if (estPromise) {
                                return Promise.resolve(res).then(
                                    resolvedVal => {
                                        if (estInstance && resolvedVal !== this) {
                                            console.log(`[Sortie] ${nomClasse}.${nomMethode} (Resolved)`, "résultat:", resolvedVal, "this:", this);
                                        } else {
                                            console.log(`[Sortie] ${nomClasse}.${nomMethode} (Resolved)`, "résultat:", resolvedVal);
                                        }
                                        return resolvedVal;
                                    },
                                    rejectedError => {
                                        if (estInstance && rejectedError !== this) {
                                            console.error(`[Sortie Exception] ${nomClasse}.${nomMethode} (Rejected)`, "erreur:", rejectedError, "this:", this);
                                        } else {
                                            console.error(`[Sortie Exception] ${nomClasse}.${nomMethode} (Rejected)`, "erreur:", rejectedError);
                                        }
                                        throw rejectedError;
                                    }
                                );
                            }
                            if (estInstance && res !== this) {
                                console.log(`[Sortie] ${nomClasse}.${nomMethode}`, "résultat:", res, "this:", this);
                            } else {
                                console.log(`[Sortie] ${nomClasse}.${nomMethode}`, "résultat:", res);
                            }
                            return res;
                        } catch (error) {
                            if (estInstance && error !== this) {
                                console.error(`[Sortie Exception] ${nomClasse}.${nomMethode}`, "erreur:", error, "this:", this);
                            } else {
                                console.error(`[Sortie Exception] ${nomClasse}.${nomMethode}`, "erreur:", error);
                            }
                            throw error;
                        }
                    };
                }
            });
        };

        instrumenterMembres(classe.prototype, false);
        instrumenterMembres(classe, true);
    }

    async instrumenterClassesFramework() {
        const excludedClasses = [this.constructor.name];
        const classesMap = await Utils.decouvrirClasses();

        for (const [prop, val] of classesMap.entries()) {
            if (excludedClasses.includes(prop)) continue;
            try {
                let targetClass = this.#instrumenterConstructeur(val, prop);
                if (targetClass && window[prop] === val) {
                    window[prop] = targetClass;
                }
                if (targetClass && globalThis[prop] === val) {
                    globalThis[prop] = targetClass;
                }
                classesMap.set(prop, targetClass);

                if (window.registreClasses) {
                    for (const cat of Object.keys(registreClasses)) {
                        if (registreClasses[cat].has(prop)) {
                            registreClasses[cat].set(prop, targetClass);
                        }
                    }
                }

                this.#instrumenterObject(targetClass, prop);
            } catch (e) {
                // Ignorer
            }
        }
    }
});

// surcharge automatique au chargement du fichier
Logger.surcharge();
