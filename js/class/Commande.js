/*
 * Commande.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe pour creer et gérer une commande
*
* @class Commande
*/
class Commande
{
    constructor(parametres = {})
    {
        /**
        * id de la commande
        */
        this._id = parametres["id"] || moment().valueOf();
        /**
        * date de la commande (date de création du sujet sur le forum)
        */
        this._dateCreationSujet = parametres["dateCreationSujet"] || null;
        /**
        * date à laquelle on souhaite être livré
        */
        this._dateSouhaite = parametres["dateSouhaite"] || null;
        /**
        * date à partir de quand livrer
        */
        this._dateApres = parametres["dateApres"] || null;
        /**
        * personne qui fait la commande
        */
        this._demandeur = parametres.hasOwnProperty("demandeur") ? new Joueur(parametres["demandeur"]) : monProfil;
        /**
        * contruction ou recherche demanndée
        */
        this._evolution = parametres["evolution"] || -1;
        /**
        * materiaux ou nourriture
        */
        this._totalNourritureDemandee = parametres["totalNourritureDemandee"] || parametres["nourriture"] || 0; // Keep 'nourriture' for backward compatibility during transition
        /**
         * quantité totale de materiaux demandée
         */
        this._totalMateriauxDemandes = parametres["totalMateriauxDemandes"] || parametres["materiaux"] || 0; // Keep 'materiaux' for backward compatibility during transition
        /**
         * quantité de nourriture déjà livrée
         */
        this._nourritureLivree = parametres["nourritureLivree"] || 0;
        /**
         * quantité de materiaux déjà livrée
         */
        this._materiauxLivres = parametres["materiauxLivres"] || 0;
        /**
        * etat de la commande
        */
        this._etat = parametres["etat"] || ETAT_COMMANDE["Nouvelle"];
        /**
        * date de la derniere mise à jour
        */
        this._derniereMiseAJour = parametres["miseAJour"] || moment();
    }
    /**
    *
    */
    get id()
    {
        return this._id;
    }
    /**
    *
    */
    set id(newId)
    {
        this._id = newId;
    }
    /**
    *
    */
    get dateCreationSujet()
    {
        return this._dateCreationSujet;
    }
    /**
    *
    */
    set dateCreationSujet(newDate)
    {
        this._dateCreationSujet = newDate;
    }
    /**
    *
    */
    get dateSouhaite()
    {
        return this._dateSouhaite;
    }
    /**
    *
    */
    set dateSouhaite(newDate)
    {
        this._dateSouhaite = newDate;
    }
    /**
    *
    */
    get dateApres()
    {
        return this._dateApres;
    }
    /**
    *
    */
    set dateApres(newDate)
    {
        this._dateApres = newDate;
    }
    /**
    *
    */
    get demandeur()
    {
        return this._demandeur;
    }
    /**
    *
    */
    set demandeur(newJoueur)
    {
        this._demandeur = newJoueur;
    }
    /**
    *
    */
    get evolution()
    {
        return this._evolution;
    }
    /**
    *
    */
    set evolution(newEvo)
    {
        this._evolution = newEvo;
    }
    /**
     * Quantité restante de nourriture à livrer
     */
    get nourriture()
    {
        return this._totalNourritureDemandee - this._nourritureLivree;
    }
    /**
     * Quantité restante de materiaux à livrer
     */
    get materiaux()
    {
        return this._totalMateriauxDemandes - this._materiauxLivres;
    }
    /**
     * Quantité totale de nourriture demandée
     */
    get totalNourritureDemandee()
    {
        return this._totalNourritureDemandee;
    }
    /**
     *
     */
    set totalNourritureDemandee(newTotal)
    {
        this._totalNourritureDemandee = newTotal;
    }
    /**
     * Quantité totale de materiaux demandés
     */
    get totalMateriauxDemandes()
    {
        return this._totalMateriauxDemandes;
    }
    /**
     *
     */
    set totalMateriauxDemandes(newTotal)
    {
        this._totalMateriauxDemandes = newTotal;
    }
    /**
     * Quantité de nourriture déjà livrée
     */
    get nourritureLivree()
    {
        return this._nourritureLivree;
    }
    /**
     *
     */
    set nourritureLivree(newLivree)
    {
        this._nourritureLivree = newLivree;
    }
    /**
     * Quantité de materiaux déjà livrée
     */
    get materiauxLivres()
    {
        return this._materiauxLivres;
    }
    /**
     *
     */
    set materiauxLivres(newLivres)
    {
        this._materiauxLivres = newLivres;
    }
    /**
     *
     */
    get etat()
    {
        return this._etat;
    }
    /**
    *
    */
    set etat(newEtat)
    {
        this._etat = newEtat;
    }
    /**
    *
    */
    get dernierMiseAJour()
    {
        return this._derniereMiseAJour;
    }
    /**
    *
    */
    set dernierMiseAJour(newDernier)
    {
        this._derniereMiseAJour = newDernier;
    }
    /**
    *
    */
    toUtilitaire()
    {
        return "[" + Object.keys(ETAT_COMMANDE).find(key => ETAT_COMMANDE[key] == this._etat) + "] " + this._demandeur.x + " / " + this._demandeur.y + " / " + EVOLUTION[this._evolution] + " / " + this._totalMateriauxDemandes + " / " + this._materiauxLivres + " / " + this._totalNourritureDemandee + " / " + this._nourritureLivree + " / " + moment(this._dateSouhaite).format(("D MMM YYYY")) + (this._dateApres ? " / " + moment(this._dateApres).format(("D MMM YYYY")) : "");
    }
    /**
     *
     */
    parseUtilitaire(id, demandeur, etat, infos, dernierConvoi, dateCreationSujetStr)
    {
        this._id = id;
        this._demandeur = new Joueur({pseudo : demandeur, x : infos[0], y : infos[1]});
        this._evolution = EVOLUTION.indexOf(infos[2]);
        this._totalMateriauxDemandes = parseInt(infos[3]) || 0;
        this._materiauxLivres = parseInt(infos[4]) || 0;
        this._totalNourritureDemandee = parseInt(infos[5]) || 0;
        this._nourritureLivree = parseInt(infos[6]) || 0;
        this._dateSouhaite = moment(infos[7], "D MMM YYYY");
        this._dateApres = infos.length > 8 ? moment(infos[8], "D MMM YYYY") : "";
        this._etat = ETAT_COMMANDE[etat];
        this._derniereMiseAJour = moment(dernierConvoi, "D MMM [à] HH[h]mm");
        // Extract date part (day and month) from the string
        let datePart = dateCreationSujetStr.split(' ')[1] + ' ' + dateCreationSujetStr.split(' ')[2];
        let parsedDate = moment(datePart, "D MMMM"); // Parse the extracted date part

        // Check if the parsed date is in the future. If so, subtract a year.
        if (parsedDate.isAfter(moment())) {
            parsedDate.subtract(1, 'year');
        }

        this._dateCreationSujet = parsedDate;
        return this;
    }
    /**
     *
     */
    estHorsTard()
    {
        return moment().diff(moment(this._dateSouhaite), "days") > 0;
    }
    /**
    *
    */
    getAttente()
    {
        return moment().diff(moment(this._dateSouhaite), "days");
    }
    /**
    *
    */
    estTermine()
    {
        return !this._nourriture && !this.materiaux;
    }
    /**
    *
    */
    estTermineRecent()
    {
        return this._derniereMiseAJour.isAfter(moment().subtract(1, 'days'));
    }
    /**
    *
    */
    estAFaire()
    {
        return !(this._etat == ETAT_COMMANDE["Supprimée"] || this._etat == ETAT_COMMANDE["Annulée"] || this._etat == ETAT_COMMANDE["Terminée"] || (this._etat == ETAT_COMMANDE["Nouvelle"] && this._demandeur.pseudo != monProfil.pseudo));
    }
    /**
    *
    */
    estValide()
    {
        if(this._totalNourritureDemandee < 0)
            return "Quantité totale de nourriture demandée incorrecte.";
        if(this._totalMateriauxDemandes < 0)
            return "Quantité totale de materiaux demandés incorrecte.";
        if(this._nourritureLivree < 0 || this._nourritureLivree > this._totalNourritureDemandee)
             return "Quantité de nourriture livrée incorrecte.";
        if(this._materiauxLivres < 0 || this._materiauxLivres > this._totalMateriauxDemandes)
             return "Quantité de materiaux livrés incorrecte.";
        if(!this._dateSouhaite.isValid())
            return "Date de la demande invalide.";
        if(this._dateApres && !moment(this._dateApres, "YYYY-MM-DD").isValid())
            return "Date de commencement livraison invalide.";
        return "";
    }
    /**
     *
     */
    toHTML()
    {
        let apres = !this._dateApres || moment().isSameOrAfter(moment(this._dateApres));
        let html = `<tr data="${this._id}">
            <td>${this._demandeur.getLienFourmizzz()}</a></td><td>${this._dateCreationSujet ? moment(this._dateCreationSujet).format("D MMM YYYY") : ''}</td><td>${EVOLUTION[this._evolution]}</td><td>${numeral(this._totalNourritureDemandee).format()}</td><td class='centre'>${numeral(this._totalMateriauxDemandes).format()}</td><td>${numeral(this.nourriture).format()}</td><td class='centre'>${numeral(this.materiaux).format()}</td>
            <td>${moment(this._dateSouhaite).format("D MMM YYYY")}</td>`;
        if(apres){
            let attente = this.getAttente();
            switch(true){
                case attente > 0 :
                    html += `<td><img src='images/icone/3rondrouge.gif'/></td>`;
                    break;
                case attente > -3 :
                    html += `<td><img src='images/icone/2rondorange.gif'/></td>`;
                    break;
                default :
                    html += `<td><img src='images/icone/1rondvert.gif'/></td>`;
                    break;
            }
        }else
            html += `<td><img src="${IMG_CROIX}" alt='supprimer' title='Ne pas livrer avant le ${moment(this._dateApres).format("DD-MM-YYYY")}'/></td>`;
        // Etat
        html += `<td ${this._etat == ETAT_COMMANDE.Nouvelle ? "title='Un chef doit valider cette commande.'" : ""}>${Object.keys(ETAT_COMMANDE).find(key => ETAT_COMMANDE[key] === this._etat)}</td>`;
        // Temps de trajet
        html += `<td>${Utils.intToTime(monProfil.getTempsParcours2(this._demandeur))}</td>
            ${apres && this._etat == ETAT_COMMANDE["En cours"] ? "<td><a id='o_commande" + this._id + "' href=''><img src='" + IMG_LIVRAISON + "' alt='livrer'/></a></td>" : "<td></td>"}
            ${(this._demandeur.pseudo == monProfil.pseudo) ? "<td><a id='o_modifierCommande" + this._id + "' href=''><img src='" + IMG_CRAYON + "' alt='modifier'/></a> <a id='o_supprimerCommande" + this._id + "' href=''><img src='" + IMG_CROIX + "' alt='supprimer'/></a></td></tr>" : "<td></td></tr>"}`;
        return html;
    }
    /**
    *
    */
    ajouterEvent(page, utilitaire)
    {
        $("#o_commande" + this._id).click((e) => {
            let transportCapacity = Math.floor((Utils.ouvrieres - Utils.terrain) * (10 + (monProfil.niveauConstruction[11] / 2)));
            let materialsToPrefill = Math.min(this.materiaux, transportCapacity);
            let nourishmentToPrefill = Math.min(this.nourriture, transportCapacity - materialsToPrefill);

            $("#input_nbMateriaux").val(numeral(materialsToPrefill).format());
            $("#nbMateriaux").val(materialsToPrefill);

            $("#input_nbNourriture").val(numeral(nourishmentToPrefill).format());
            $("#nbNourriture").val(nourishmentToPrefill);
            $("#pseudo_convoi").val(this._demandeur.pseudo);
            $("#o_idCommande").val(this._id);
            $("html").animate({scrollTop : 0}, 600);
            return false;
        });
        $("#o_modifierCommande" + this._id).click((e) => {
            let boiteCommande = new BoiteCommande(this, utilitaire, page);
            boiteCommande.afficher();
            return false;
        });
        $("#o_supprimerCommande" + this._id).click((e) => {
            if(confirm("Supprimer cette commande ?")){
                this._etat = ETAT_COMMANDE.Supprimée;
                utilitaire.modifierSujet(this.toUtilitaire(), " ", this._id).then((data) => {
                    $.toast({...TOAST_INFO, text : "Commande supprimée avec succès."});
                    page.actualiserCommande();
                }, (jqXHR, textStatus, errorThrown) => {
                    $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la mise à jour des commandes."});
                });
            }
            return false;
        });
    }
    /**
    *
    */
    ajouteConvoi(convoi)
    {
        // Si le convoi est nul ou ne contient rien, on ne fait rien
        if (!convoi || (convoi.nourriture === 0 && convoi.materiaux === 0)) {
            return this;
        }

        // on ajoute la nourriture livrée
        this._nourritureLivree += convoi.nourriture;
        if (this._nourritureLivree > this._totalNourritureDemandee) this._nourritureLivree = this._totalNourritureDemandee;
        // on ajoute les materiaux livrés
        this._materiauxLivres += convoi.materiaux;
        if (this._materiauxLivres > this._totalMateriauxDemandes) this._materiauxLivres = this._totalMateriauxDemandes;
        // on met a jour le status si tout est livré
        if(!this.nourriture && !this.materiaux) this._etat = ETAT_COMMANDE.Terminée;
        return this;
    }
}
