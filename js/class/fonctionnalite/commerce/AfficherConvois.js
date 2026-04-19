/**
 * AfficherConvois.js
 * Fonctionnalité d'alliance pour l'affichage des convois en cours.
 */
Utils.register(class AfficherConvois extends FonctionnaliteAlliance {
    static ABREVIATIONS_HISTORY = ['AC'];

    /** @type {Array<Convoi>} */
    convois = [];



    /**
     * Point d'entrée principal de la fonctionnalité.
     */
    async run() {
        // Charger les convois depuis les commandes
        await this.chargerConvois();

        // Afficher le tableau des convois
        await this.afficherTableauConvois();
    }

    /**
     * Charge tous les convois en cours depuis les commandes.
     */
    async chargerConvois() {
        const commandes = await this.chargerObjetsForum(Commande, true);
        this.convois = [];

        for (const commande of commandes) {
            if (commande.objetsForumContenus && commande.objetsForumContenus.length > 0) {
                for (const convoi of commande.objetsForumContenus) {
                    // Ne garder que les convois non terminés
                    if (!(await convoi.estTermine())) {
                        this.convois.push(convoi);
                    }
                }
            }
        }
    }

    /**
     * Affiche le tableau des convois en cours.
     */
    async afficherTableauConvois() {
        if ($("#o_tableListeConvoi").length === 0) {
            const en_tete_html = await Convoi.afficherEntete();

            let contenu = `<div id="o_listeConvoi" class="simulateur centre o_marginT15"><h2>Convois en cours</h2><table id='o_tableListeConvoi' class="o_maxWidth" cellspacing=0>
                <thead><tr class="ligne_paire">${en_tete_html}</tr></thead>
                <tbody></tbody></table></div><br/>`;

            $("#centre .Bas").before(contenu);

            // Générer la configuration DataTables à partir des propriétés de l'objet Convoi
            const proprietes = Convoi.recupererProprietesAffichage();
            const columnDefs = Object.values(proprietes).map((prop, index) => {
                const def = { targets: index };
                def.visible = prop.visible;
                def.sortable = prop.sortable;
                def.type = prop.type;
                return def;
            });

            // Trouver l'index de la colonne d'arrivée pour le tri par défaut
            const indexArrivee = Object.keys(proprietes).indexOf('Date Arrivée');

            $("#o_tableListeConvoi").DataTable({
                data: [],
                bInfo: false,
                bPaginate: false,
                bAutoWidth: false,
                dom: "Bfrti",
                buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
                order: [[indexArrivee, "asc"]],
                stripeClasses: ["", "ligne_paire"],
                responsive: true,
                language: {
                    zeroRecords: "Aucun convoi en cours",
                    infoEmpty: "Aucun enregistrement",
                    infoFiltered: "(Filtré par _MAX_ enregistrements)",
                    search: "Rechercher : ",
                    buttons: { colvis: "Colonne" }
                },
                columnDefs: columnDefs
            });
        }

        await this.actualiserConvois();
    }

    /**
     * Actualise le tableau des convois.
     */
    async actualiserConvois() {
        const tableRows = [];
        for (const convoi of this.convois) {
            // Utiliser la fonction afficher de l'objet pour générer la ligne
            const corps_html = await convoi.afficherCorps();
            tableRows.push(corps_html);
        }
        console.log('tableRows', tableRows)
        // Optimisation : Utiliser l'API DataTables sans détruire/recréer la table
        if ($.fn.DataTable.isDataTable('#o_tableListeConvoi')) {
            const table = $("#o_tableListeConvoi").DataTable();

            // Effacer les données actuelles sans redessiner
            table.clear();

            if (tableRows.length > 0) {
                // Ajouter les nouvelles lignes via l'API pour qu'elles soient indexées et affichées
                table.rows.add($(tableRows.join('')));
            }

            // Redessiner la table avec les nouvelles données
            table.draw();
        } else {
            // Si la DataTable n'existe pas encore, juste mettre à jour le HTML
            const tbody = tableRows.join('');
            $("#o_tableListeConvoi tbody").html(tbody);
        }
    }
})
