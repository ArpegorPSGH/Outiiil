/*
 * BoiteDocumentation.js
 * Hraesvelg
 **********************************************************************/

// URL de repli GitHub (branche par défaut) pour les liens de doc inconnus dans le bundle.
const OUTIIIL_DOC_GITHUB_BASE_URL = 'https://github.com/ArpegorPSGH/Outiiil/blob/dev/documentation/';

/**
 * Boîte du dock permettant de consulter la documentation intégrée au bundle
 * (versionné avec le runtime, listé dans version.json sous la clé "docs").
 *
 * Chaque fichier de documentation donne lieu à un onglet (titre = title du fichier).
 * Le markdown est rendu côté client via la lib `marked` et accompagne un plan
 * (table des matières) arbre repliable : seuls les titres h2 sont visibles par
 * défaut, les niveaux inférieurs (h3, h4…) se développent via un chevron à gauche
 * de chaque titre (▶ collapsé → ▼ développé). Le plan est placé dans une colonne
 * à gauche du contenu et peut être masqué/affiché via une bande verticale sur
 * son bord droit (chevron > / <). La boîte est entièrement redimensionnable.
 *
 * Le contenu est résolu par le background (DOCUMENTATION runtime message) car le
 * runtime, injecté dans le monde MAIN de fourmizzz.fr, est soumis au CSP/CORS de la
 * page et ne peut pas fetch() le markdown directement.
 *
 * @class BoiteDocumentation
 * @constructor
 * @extends Boite
 */
Utils.register(class BoiteDocumentation extends Boite {
    constructor() {
        const content = `<div id="o_tabsDoc" class="o_tabs">
            <ul class="o_docTabsNav"></ul>
        </div>`;
        super("o_boiteDocumentation", "Documentation", content);
        /**
         * Liste des documents {file, title} issue de version.json (cache).
         * @type {?Array}
         */
        this._docs = null;
        /**
         * Cache texte brut des documents déjà téléchargés {file: text}.
         * @type {Map}
         */
        this._cache = new Map();
        /**
         * Index du document déjà rendu (évite de re-rendre).
         * @type {Set}
         */
        this._rendered = new Set();
        /**
         * Tabs jQuery UI déjà initialisées.
         * @type {boolean}
         */
        this._tabsReady = false;
    }

    /**
     * Affiche la boîte. À la première création, charge la liste des documents
     * (version.json) et construit les onglets.
     *
     * @method afficher
     */
    async afficher() {
        const bCreate = await super.afficher();
        if (bCreate) {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            const initW = Math.min(1100, Math.max(750, Math.floor(vw * 0.75)));
            const initH = Math.min(750, Math.max(500, Math.floor(vh * 0.70)));
            const initTop = 30;
            const initLeft = Math.max(60, Math.floor((vw - initW) / 2 + 100));

            $j("#o_boiteDocumentation").css({
                width: initW + "px",
                height: initH + "px",
                top: initTop + "px",
                left: initLeft + "px"
            });

            await this.#loadList();
            this.#initResizable();
        }
        await this.css().event();
        return this;
    }

    /**
     * Applique le style propre à la boîte (thème utilisateur + contenus markdown).
     *
     * @method css
     */
    css() {
        super.css();
        const couleurTexte = monProfilUtilisateur.parametre["couleurTexte"].valeur;
        const couleur2 = monProfilUtilisateur.parametre["couleur2"].valeur;
        const couleur1 = monProfilUtilisateur.parametre["couleur1"].valeur;

        $j("#o_boiteDocumentation .o_tabs .ui-widget-header .ui-tabs-anchor").css({
            "background-color": couleur2,
            "color": couleurTexte
        });
        $j("#o_boiteDocumentation .o_docToc").css({
            "background-color": couleur1,
            "color": couleurTexte
        });
        $j("#o_boiteDocumentation .o_docTocHandle").css({
            "background-color": couleur2,
            "color": couleurTexte
        });
        $j("#o_boiteDocumentation .o_docTocHandleChevron, #o_boiteDocumentation .o_docTocChevron").css("color", couleurTexte);
        $j("#o_boiteDocumentation .o_docTocItemHeader a, #o_boiteDocumentation .o_docContent a").css("color", couleurTexte);
        $j("#o_boiteDocumentation .o_docContent h1, #o_boiteDocumentation .o_docContent h2, " +
            "#o_boiteDocumentation .o_docContent h3, #o_boiteDocumentation .o_docContent h4, " +
            "#o_boiteDocumentation .o_docContent h5, #o_boiteDocumentation .o_docContent h6").css("color", couleurTexte);
        $j("#o_boiteDocumentation .o_docContent p, #o_boiteDocumentation .o_docContent li, " +
            "#o_boiteDocumentation .o_docContent td, #o_boiteDocumentation .o_docContent th, " +
            "#o_boiteDocumentation .o_docContent code, #o_boiteDocumentation .o_docContent blockquote, " +
            "#o_boiteDocumentation .o_docToc").css("color", couleurTexte);
        return this;
    }

    /**
     * Ajoute les événements propres à la boîte.
     *
     * @method event
     */
    event() {
        super.event();
        // Toggle de la visibilité du plan via la bande verticale sur son bord droit
        $j("#o_tabsDoc").off("click", ".o_docTocHandle").on("click", ".o_docTocHandle", (e) => {
            e.preventDefault();
            const $handle = $j(e.currentTarget);
            const $inner = $handle.closest(".o_docInner");
            const hide = !$inner.hasClass("o_docTocHidden");
            $inner.toggleClass("o_docTocHidden", hide);
            $handle.find(".o_docTocHandleChevron").text(hide ? ">" : "<");
            $handle.attr("title", hide ? "Afficher le plan" : "Masquer le plan");
            this.#updateTocWidth();
        });
        // Expand / collapse des titres du plan (chevron à gauche de chaque titre)
        $j("#o_tabsDoc").off("click", ".o_docTocChevron").on("click", ".o_docTocChevron", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const $chevron = $j(e.currentTarget);
            if ($chevron.hasClass("o_docTocChevronPlaceholder")) return;
            $chevron.closest(".o_docTocItem").toggleClass("open");
            this.#updateTocWidth();
        });
        // Navigation vers une ancre dans le contenu du document
        $j("#o_tabsDoc").off("click", ".o_docTocLink").on("click", ".o_docTocLink", (e) => {
            const href = $j(e.currentTarget).attr("href");
            if (href && href.indexOf("#") === 0) {
                e.preventDefault();
                const id = href.substring(1);
                const $target = $j("#o_tabsDoc .o_docContent [id='" + id + "']");
                if ($target.length) {
                    $target[0].scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        });
        // Recalcul du plan sur redimensionnement de la fenêtre
        $j(window).off("resize.o_doc").on("resize.o_doc", () => {
            this.#updateTocWidth();
        });
        return this;
    }

    /**
     * Ajuste la largeur de la colonne du plan : conserve un pourcentage fixe de la
     * largeur totale de la boîte, plafonné à la largeur de la plus longue ligne de titre visible.
     *
     * @method #updateTocWidth
     * @private
     * @param {jQuery} [panel]
     */
    #updateTocWidth(panel) {
        const $panel = panel || $j("#o_tabsDoc .o_docPanel:visible");
        if (!$panel.length) return;
        const $wrapper = $panel.find(".o_docTocWrapper");
        if (!$wrapper.length || $wrapper.closest(".o_docInner").hasClass("o_docTocHidden")) return;

        const $box = $j("#o_boiteDocumentation");
        const boxWidth = $box.outerWidth() || 800;
        const targetWidth = boxWidth * 0.28; // 28% de la largeur totale

        // Mesurer la largeur sans retour à la ligne de la plus longue ligne de titre visible
        let maxTitleWidth = 0;
        $panel.find(".o_docTocItemHeader:visible").each((_, header) => {
            const $link = $j(header).find(".o_docTocLink");
            const oldWS = $link.css("white-space");
            $link.css("white-space", "nowrap");
            const width = header.scrollWidth + 24;
            $link.css("white-space", oldWS);
            if (width > maxTitleWidth) maxTitleWidth = width;
        });

        if (maxTitleWidth > 0) {
            const finalWidth = Math.min(targetWidth, maxTitleWidth);
            $wrapper.css("width", Math.max(120, finalWidth) + "px");
        } else {
            $wrapper.css("width", targetWidth + "px");
        }
    }

    /**
     * Récupère la liste des documents en mode dev (découverte dynamique background)
     * ou en mode prod (manifeste bundle issu de version.json).
     *
     * @method #loadList
     * @private
     */
    async #loadList() {
        const devModeAttr = document.documentElement.getAttribute('data-outiiil-dev-mode');
        const devModeReadyVal = (window.browserAPI && window.browserAPI._devModeReady)
            ? await window.browserAPI._devModeReady
            : false;
        const devMode = devModeAttr === 'true' ||
            (window.browserAPI && window.browserAPI._isDevMode === true) ||
            devModeReadyVal === true;

        let docs = [];

        if (devMode) {
            // Mode dev : découverte dynamique des fichiers locaux via le background
            docs = await this.#fetchDocListFromBackground();
        } else {
            // Mode prod : utiliser directement la liste intégrée au bundle (OUTIIIL_DOC_MANIFEST)
            docs = window.OUTIIIL_DOC_MANIFEST || [];
        }

        this._docs = Array.isArray(docs) ? docs : [];
        this.#buildTabs();
    }

    /**
     * Construit les onglets jQuery UI (un par document) et ouvre le premier.
     *
     * @method #buildTabs
     * @private
     */
    #buildTabs() {
        const nav = $j("#o_tabsDoc > ul.o_docTabsNav");
        nav.empty();
        $j("#o_tabsDoc > .o_docPanel").remove();

        const pageUrl = window.location.href.split("#")[0];

        if (!this._docs.length) {
            const emptyHref = pageUrl + "#o_doc_empty";
            nav.append('<li class="o_docNavItem"><a href="' + emptyHref + '">Documentation</a></li>');
            $j("#o_tabsDoc").append('<div class="o_docPanel" data-file="" id="o_doc_empty">' +
                '<p style="padding:12px;">Aucune documentation disponible. Lancez <code>python scripts/lib/build_bundle.py</code> puis rechargez la page.</p></div>');
            if (!this._tabsReady) {
                $j("#o_tabsDoc").tabs({
                    hide: { duration: 0 },
                    beforeLoad: (event, ui) => { event.preventDefault(); }
                }).removeClass("ui-widget");
                this._tabsReady = true;
            }
            return;
        }

        this._docs.forEach((doc, i) => {
            const tabId = "o_doc_" + i;
            const fullHref = pageUrl + "#" + tabId;
            nav.append('<li class="o_docNavItem" data-idx="' + i + '"><a href="' + fullHref + '">' +
                BoiteDocumentation.escape(doc.title || doc.file) + '</a></li>');
            $j("#o_tabsDoc").append('<div id="' + tabId + '" class="o_docPanel" data-idx="' + i + '" ' +
                'data-file="' + BoiteDocumentation.escape(doc.file) + '" ' +
                'style="padding:0;border:0;outline:none;"></div>');
        });

        $j("#o_tabsDoc").tabs({
            hide: { duration: 0 },
            show: { duration: 0 },
            beforeLoad: (event, ui) => {
                event.preventDefault();
            },
            activate: (e, ui) => {
                this.#onTabActivated(ui.newPanel);
                this.css();
            }
        }).removeClass("ui-widget");
        this._tabsReady = true;
        // rendu du premier onglet (l'événement activate n'est pas toujours déclenché
        // lors de l'initialisation si l'onglet 0 est déjà actif).
        const activeIdx = $j("#o_tabsDoc").tabs("option", "active");
        this.#onTabActivated($j("#o_doc_" + activeIdx));
    }

    /**
     * Initialise le redimensionnement multi-directionnel de la boîte sur ses 4 bords
     * et 4 angles, modifiant la forme du curseur de la souris (flèches).
     *
     * @method #initResizable
     * @private
     */
    #initResizable() {
        const $box = $j("#o_boiteDocumentation");
        if ($box.find(".o_resizer").length) return;

        const directions = ["n", "s", "e", "w", "nw", "ne", "se", "sw"];
        directions.forEach((dir) => {
            $box.append('<div class="o_resizer o_resizer_' + dir + '" data-dir="' + dir + '"></div>');
        });

        let activeDir = null;
        let startX, startY, startW, startH, startTop, startLeft;

        $box.on("mousedown", ".o_resizer", (e) => {
            e.preventDefault();
            e.stopPropagation();
            activeDir = $j(e.currentTarget).data("dir");

            const box = $box[0];
            startX = e.clientX;
            startY = e.clientY;
            startW = box.offsetWidth;
            startH = box.offsetHeight;
            startTop = box.offsetTop;
            startLeft = box.offsetLeft;

            const minW = 450;
            const minH = 300;

            const onMove = (ev) => {
                if (!activeDir) return;
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                let newW = startW;
                let newH = startH;
                let newTop = startTop;
                let newLeft = startLeft;

                if (activeDir.indexOf("e") !== -1) {
                    newW = Math.max(minW, startW + dx);
                }
                if (activeDir.indexOf("s") !== -1) {
                    newH = Math.max(minH, startH + dy);
                }
                if (activeDir.indexOf("w") !== -1) {
                    newW = Math.max(minW, startW - dx);
                    newLeft = startLeft + (startW - newW);
                }
                if (activeDir.indexOf("n") !== -1) {
                    newH = Math.max(minH, startH - dy);
                    newTop = startTop + (startH - newH);
                }

                $box.css({
                    width: newW + "px",
                    height: newH + "px",
                    top: newTop + "px",
                    left: newLeft + "px"
                });

                this.#updateTocWidth();
            };

            const onUp = () => {
                activeDir = null;
                $j(document).off("mousemove", onMove).off("mouseup", onUp);
            };

            $j(document).on("mousemove", onMove).on("mouseup", onUp);
        });
    }

    /**
     * Rendu différé d'un onglet au moment de sa sélection.
     *
     * @method #onTabActivated
     * @private
     */
    async #onTabActivated(panel) {
        const idx = parseInt(panel.data("idx"));
        if (isNaN(idx) || !this._docs[idx]) return;
        // éviter de rendre plusieurs fois
        if (this._rendered.has(idx)) return;
        this._rendered.add(idx);
        panel.html('<p style="padding:12px;">Chargement de la documentation…</p>');
        await this.#renderDoc(this._docs[idx], panel);
    }

    /**
     * Résout le texte du document (cache ou globale bundle) puis le rend.
     *
     * @method #renderDoc
     * @private
     */
    async #renderDoc(doc, panel) {
        let text = this._cache.get(doc.file);
        if (text === undefined) {
            const texts = window.OUTIIIL_DOC_TEXTS || {};
            if (doc.file && texts[doc.file] !== undefined) {
                text = texts[doc.file];
            } else if (doc.file) {
                // En mode dev (sans bundle), récupérer le fichier via le background
                // qui peut fetch() un chrome-extension:// URL (le monde MAIN ne peut pas).
                text = await BoiteDocumentation.#fetchDocViaBackground(doc.file);
            } else {
                text = "";
            }
            if (text) this._cache.set(doc.file, text);
        }
        const wrapper = this.#renderMarkdown(text, doc);
        panel.html(wrapper);
        // on réapplique le thème sur le contenu fraîchement injecté
        this.css();
        this.#updateTocWidth(panel);
    }

    /**
     * Récupère la liste des documents depuis le background (récupération dynamique).
     *
     * @method #fetchDocListFromBackground
     * @private
     * @returns {Promise<Array>} Liste des documents {file, title}
     */
    async #fetchDocListFromBackground() {
        const requestId = '__outiiil_doc_list_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        return new Promise((resolve) => {
            const handler = (event) => {
                const data = event.data;
                if (!data || data.target !== 'outiiil' || data.type !== 'GET_DOC_LIST_RESPONSE') return;
                if (data.requestId !== requestId) return;
                window.removeEventListener('message', handler);
                resolve(data.docs || []);
            };
            window.addEventListener('message', handler);
            window.postMessage({
                type: 'GET_DOC_LIST',
                target: 'outiiil',
                requestId: requestId
            }, '*');
            // Timeout de secours
            setTimeout(() => {
                window.removeEventListener('message', handler);
                resolve([]);
            }, 15000);
        });
    }

    /**
     * Récupère le texte brut d'un fichier de documentation auprès du background.
     *
     * @static
     * @method #fetchDocViaBackground
     * @private
     * @param {string} file Chemin du fichier
     * @returns {Promise<string>} Contenu markdown du document
     */
    static async #fetchDocViaBackground(file) {
        const requestId = '__outiiil_doc_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        return new Promise((resolve) => {
            const handler = (event) => {
                const data = event.data;
                if (!data || data.target !== 'outiiil' || data.type !== 'GET_DOC_RESPONSE') return;
                if (data.requestId !== requestId) return;
                window.removeEventListener('message', handler);
                if (data.ok && data.result) {
                    resolve(data.result.text || "");
                } else {
                    resolve("");
                }
            };
            window.addEventListener('message', handler);
            window.postMessage({
                type: 'GET_DOC',
                target: 'outiiil',
                file: file,
                requestId: requestId
            }, '*');
            setTimeout(() => {
                window.removeEventListener('message', handler);
                resolve("");
            }, 10000);
        });
    }

    /**
     * Rendu markdown vers HTML avec extraction du plan et réécriture des liens.
     *
     * @method #renderMarkdown
     * @private
     * @param {string} md
     * @param {Object} doc
     * @returns {string} HTML complet
     */
    #renderMarkdown(md, doc) {
        let html = "";
        if (typeof marked !== "undefined" && typeof marked.parse === "function") {
            // marked n'ajoute pas d'id aux titres par défaut ; on les génère nous-même
            // (slufigiés) pour garantir la cohérence titre ↔ ancre ↔ plan.
            html = marked.parse(md || "", { gfm: true, breaks: true });
        } else {
            // repli très basique si la lib est manquante
            html = "<pre>" + BoiteDocumentation.escape(md || "") + "</pre>";
        }

        const $root = $j("<div>").html(html);
        const usedHeadings = new Set();
        const tocEntries = [];

        // 1) id d'ancre sur chaque titre + collecte du plan
        $root.find("h1,h2,h3,h4,h5,h6").each((_, h) => {
            const $h = $j(h);
            const text = $h.text();
            let id = BoiteDocumentation.slugify(text);
            let base = id, n = 1;
            while (usedHeadings.has(id)) { id = base + "-" + (n++); }
            usedHeadings.add(id);
            $h.attr("id", id);
            tocEntries.push({ level: parseInt(h.tagName.charAt(1), 10), id: id, text: text });
        });

        // 2) réécriture des liens (ancres internes + navigation inter-documents)
        this.#rewriteLinks($root, usedHeadings, doc);

        // 3) construction du plan arbre collapsable (h2 visibles par défaut)
        const tocHtml = this.#buildTocTree(tocEntries);

        return '<div class="o_docInner">' +
            '<div class="o_docTocWrapper">' +
                '<nav class="o_docToc">' + tocHtml + '</nav>' +
            '</div>' +
            '<div class="o_docTocHandle" title="Masquer le plan">' +
                '<span class="o_docTocHandleChevron">&lt;</span>' +
            '</div>' +
            '<div class="o_docContent">' + $root.html() + "</div>" +
            "</div>";
    }

    /**
     * Construit l'arbre hiérarchique du plan de lecture à partir de la liste
     * plate des titres. Seuls les titres de niveau ≥ 2 (h2…) apparaissent dans
     * le plan — le h1 est le titre du document (déjà utilisé comme titre d'onglet).
     * Les sous-niveaux (h3, h4…) sont encapsulés dans des <ul> collapsables
     * masqués par défaut et développables via un chevron à gauche de chaque titre.
     *
     * @method #buildTocTree
     * @private
     * @param {Array<{level:number,id:string,text:string}>} entries
     * @returns {string} HTML du plan
     */
    #buildTocTree(entries) {
        // Ne garder que les titres de niveau ≥ 2 (h1 = titre du document)
        const items = entries.filter(e => e.level >= 2);
        if (!items.length) return "";

        // Construction de l'arbre hiérarchique via une pile
        const root = { level: 1, children: [] };
        const stack = [root];

        for (const entry of items) {
            // Remonter dans la pile jusqu'au parent (dernier titre de niveau inférieur)
            while (stack.length > 1 && stack[stack.length - 1].level >= entry.level) {
                stack.pop();
            }
            const node = { level: entry.level, id: entry.id, text: entry.text, children: [] };
            stack[stack.length - 1].children.push(node);
            stack.push(node);
        }

        return this.#renderTocNodes(root.children, true);
    }

    /**
     * Rendu récursif des nœuds du plan (arbre collapsable).
     *
     * @method #renderTocNodes
     * @private
     * @param {Array} nodes Nœuds à rendre.
     * @param {boolean} [isRoot=false] True pour le niveau racine (h2).
     * @returns {string} HTML du <ul>
     */
    #renderTocNodes(nodes, isRoot = false) {
        if (!nodes.length) return "";
        const listClass = isRoot ? "o_docTocList" : "o_docTocSub";
        let html = '<ul class="' + listClass + '">';
        for (const node of nodes) {
            const hasChildren = node.children.length > 0;
            html += '<li class="o_docTocItem">';
            html += '<div class="o_docTocItemHeader">';
            if (hasChildren) {
                html += '<span class="o_docTocChevron"></span>';
            } else {
                html += '<span class="o_docTocChevronPlaceholder"></span>';
            }
            html += '<a href="#' + node.id + '" class="o_docTocLink">' + BoiteDocumentation.escape(node.text) + '</a>';
            html += '</div>';
            html += this.#renderTocNodes(node.children);
            html += '</li>';
        }
        html += "</ul>";
        return html;
    }

    /**
     * Réécrit les ancres/links markdown pour qu'ils fonctionnent dans la boîte.
     *  - ancre intra-fichier (#frag) → #mon-id-de-titre
     *  - lien vers un .md connu (autre document) → navigation interne (chargement de l'onglet)
     *  - lien vers un .md inconnu → GitHub blob (branche dev)
     *
     * @method #rewriteLinks
     * @private
     */
    #rewriteLinks($root, usedHeadings, doc) {
        const docs = this._docs || [];
        const knownFiles = new Map(); // basename -> {file, idx}
        docs.forEach((d, idx) => {
            const base = d.file ? d.file.split("/").pop().toLowerCase() : "";
            if (base) knownFiles.set(base, { file: d.file, idx: idx });
        });
        const currentFile = (doc && doc.file) ? doc.file : "";
        const currentBase = currentFile ? currentFile.split("/").pop().toLowerCase() : "";

        $root.find("a[href]").each((_, a) => {
            const $a = $j(a);
            const href = $a.attr("href") || "";
            if (!href || href.indexOf("://") !== -1 || href.indexOf("mailto:") === 0) return;

            const fragIdx = href.indexOf("#");
            const filePart = fragIdx >= 0 ? href.substring(0, fragIdx) : href;
            let frag = fragIdx >= 0 ? href.substring(fragIdx + 1) : "";
            const qIdx = frag.indexOf("?");
            if (qIdx >= 0) frag = frag.substring(0, qIdx);

            const fileBase = filePart ? filePart.split("/").pop().toLowerCase() : "";

            // intra-fichier (pas de fichier, ou même fichier) → ancre interne
            if (!filePart || fileBase === currentBase) {
                if (frag) {
                    const id = BoiteDocumentation.slugify(decodeURIComponent(frag));
                    if (usedHeadings.has(id)) {
                        $a.attr("href", "#" + id);
                    } else {
                        $a.get(0).removeAttribute("href");
                    }
                } else {
                    // lien vers le fichier lui-même sans ancre → retire (déjà affiché)
                    $a.get(0).removeAttribute("href");
                }
                return;
            }

            // lien vers un autre document du bundle → navigation dans la boîte
            if (knownFiles.has(fileBase)) {
                const target = knownFiles.get(fileBase);
                $a.attr("href", "#" + (frag ? encodeURIComponent(frag) : ""));
                $a.off("click.doc").on("click.doc", (e) => {
                    e.preventDefault();
                    this.#switchToDoc(target.idx, frag);
                });
                return;
            }

            // document inconnu → GitHub blob (branche par défaut)
            $a.attr("href", OUTIIIL_DOC_GITHUB_BASE_URL + (filePart || "") + (frag ? "#" + frag : ""));
        });
    }

    /**
     * Passe à l'onglet d'un autre document (et y rend le fragment ancré si possible).
     *
     * @method #switchToDoc
     * @private
     */
    async #switchToDoc(idx, frag) {
        if (!this._docs[idx]) {
            $j.toast({ ...TOAST_ERROR, text: "Document introuvable dans la documentation." });
            return;
        }
        const $tabs = $j("#o_tabsDoc");
        $tabs.tabs("option", "active", idx);
        const panel = $j("#o_doc_" + idx);
        if (!this._rendered.has(idx)) {
            await this.#renderDoc(this._docs[idx], panel);
        }
        if (frag) {
            const id = BoiteDocumentation.slugify(decodeURIComponent(frag));
            const $target = $j("#o_doc_" + idx + " .o_docContent [id='" + id + "']");
            if ($target.length) {
                $target[0].scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    }

    /**
     * Slugifie un texte en ancre (identique à l'algorithme appliqué aux fragments
     * de liens), ce qui garantit la cohérence titre ↔ ancre dans la boîte.
     *
     * @static
     * @method slugify
     */
    static slugify(str) {
        return String(str || "")
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    /**
     * Échappe un texte pour l'insérer en tant que texte (et attribut) HTML.
     *
     * @static
     * @method escape
     */
    static escape(html) {
        return String(html == null ? "" : html)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
});
