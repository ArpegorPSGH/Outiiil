/*
 * Convoi.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe pour creer et gérer un convoi
*
* @class Convoi
*/
class Convoi
{
    constructor(parametres)
    {
        /**
        * id du convoi
        */
        this._id = parametres["id"] || moment().valueOf();
        /**
        * qui envoie le convoi
        */
        this._expediteur = parametres["expediteur"];
        /**
        * qui recoit les ressources
        */
        this._destinataire = parametres["destinataire"];
        /**
        * quantité livrée
        */
        this._nourriture = parametres["nourriture"] || 0;
        /**
        * quantité livrée
        */
        this._materiaux = parametres["materiaux"] || 0;
        /**
        * id de la commande pour le convoi
        */
        this._idCommande = parametres["idCommande"] || -1;
        /**
        * date d'arrivée du convoi
        */
        this._dateArrivee = parametres["dateArrivee"];
        /**
        * date de publication du convoi sur le forum
        */
        this._datePost = parametres["datePost"] || null;
        /**
        * ID d'annulation du convoi sur la page commerce
        */
        this._idAnnulation = parametres["idAnnulation"] || null;
        /**
        * Nombre d'ouvrières utilisées pour le convoi
        */
        this._ouvrieres = parametres["ouvrieres"] || 0;
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
    get expediteur()
    {
        return this._expediteur;
    }
    /**
    *
    */
    set expediteur(newExpediteur)
    {
        this._expediteur = newExpediteur;
    }
    /**
    *
    */
    get destinataire()
    {
        return this._destinataire;
    }
    /**
    *
    */
    set destinataire(newDestinataire)
    {
        this._destinataire = newDestinataire;
    }
    /**
    *
    */
    get nourriture()
    {
        return this._nourriture;
    }
    /**
    *
    */
    set nourriture(newNourriture)
    {
        this._nourriture = newNourriture;
    }
    /**
    *
    */
    get materiaux()
    {
        return this._materiaux;
    }
    /**
    *
    */
    set materiaux(newMateriaux)
    {
        this._materiaux = newMateriaux;
    }
    /**
    *
    */
    get idCommande()
    {
        return this._idCommande;
    }
    /**
    *
    */
    set idCommande(newIdCommande)
    {
        this._idCommande = newIdCommande;
    }
    /**
    *
    */
    get dateArrivee()
    {
        return this._dateArrivee;
    }
    /**
    *
    */
    set dateArrivee(newArrivee)
    {
        this._dateArrivee = newArrivee;
    }
    /**
    *
    */
    get datePost()
    {
        return this._datePost;
    }
    /**
    *
    */
    set datePost(newDatePost)
    {
        this._datePost = newDatePost;
    }
    /**
    *
    */
    get idAnnulation()
    {
        return this._idAnnulation;
    }
    /**
    *
    */
    set idAnnulation(newIdAnnulation)
    {
        this._idAnnulation = newIdAnnulation;
    }
    /**
    *
    */
    get ouvrieres()
    {
        return this._ouvrieres;
    }
    /**
    *
    */
    set ouvrieres(newOuvrieres)
    {
        this._ouvrieres = newOuvrieres;
    }
    /**
    *
    */
    estDestinataire()
    {
        return this._destinataire == monProfilJoueur.pseudo;
    }
    /**
    *
    */
    estTermine()
    {
        return moment(this._dateArrivee).diff(moment()) < 0;
    }
    /**
    *
    */
    toUtilitaire()
    {
        // Calculer le temps restant pour les deux cas (convoi normal ou annulation)
        let tempsRestant = moment(this._dateArrivee).diff(moment()) / 1000;

        // Si c'est un convoi d'annulation (quantités négatives), la date de retour est la date d'arrivée initiale.
        if (this._nourriture < 0 || this._materiaux < 0) {
            return `- Vous allez livrer ${numeral(this._nourriture).format()} nourritures et ${numeral(this._materiaux).format()} materiaux à ${this._destinataire} dans ${Utils.intToTime(tempsRestant)} - Retour le ${moment(this._dateArrivee).format("D MMM YYYY à HH[h]mm")}${this._idAnnulation ? ` (ID Annulation: ${this._idAnnulation})` : ''}${this._ouvrieres > 0 ? ` (${numeral(this._ouvrieres).format()} ouvrières)` : ''}`;
        } else {
            // Pour un convoi normal, calculer le temps restant.
            return `- Vous allez livrer ${numeral(this._nourriture).format()} nourritures et ${numeral(this._materiaux).format()} materiaux à ${this._destinataire} dans ${Utils.intToTime(tempsRestant)} - Retour le ${Utils.roundMinute(tempsRestant).format("D MMM YYYY à HH[h]mm")}${this._idAnnulation ? ` (ID Annulation: ${this._idAnnulation})` : ''}${this._ouvrieres > 0 ? ` (${numeral(this._ouvrieres).format()} ouvrières)` : ''}`;
        }
    }
    /**
    *
    */
    toHTML(id)
    {
        // Si le convoi m'est destiné et que le datetime d'arrivée n'est pas dépassé
        let tempsRestant = moment(this._dateArrivee).diff(moment()) / 1000;
        $(id).after(`<strong>- Vous allez recevoir ${numeral(this._nourriture).format()} ${IMG_POMME} et ${numeral(this._materiaux).format()} ${IMG_MAT} de <a href="Membre.php?Pseudo=${this._expediteur}">${this._expediteur}</a> dans <span id='convoi_${this._id}'>${Utils.intToTime(tempsRestant)}</span></strong> - <small>Retour le ${Utils.roundMinute(tempsRestant).format("D MMM YYYY à HH[h]mm")}</small><br/>`);
        Utils.decreaseTime(moment(this._dateArrivee).diff(moment()) / 1000, "convoi_" + this._id);
        return this;
    }

    /**
    * Retourne une représentation de l'objet Convoi sous forme d'objet simple.
    * Utile pour la sérialisation.
    */
    toObject() {
        return {
            id: this._id,
            expediteur: this._expediteur,
            destinataire: this._destinataire,
            nourriture: this._nourriture,
            materiaux: this._materiaux,
            idCommande: this._idCommande,
            dateArrivee: this._dateArrivee ? this._dateArrivee.toISOString() : null, // Convertir Moment en string ISO
            datePost: this._datePost ? this._datePost.toISOString() : null, // Convertir Moment en string ISO
            idAnnulation: this._idAnnulation,
            ouvrieres: this._ouvrieres
        };
    }

    /**
     * Crée un objet Convoi à partir d'une chaîne de caractères formatée comme un message de forum.
     *
     * @static
     * @method fromUtilitaireString
     * @param {string} messageText La chaîne de caractères du message du forum.
     * @param {string} auteurMessage L'auteur du message (expéditeur).
     * @param {string} idCommande L'ID de la commande associée (ID du sujet du forum).
     * @param {Date} datePost La date de publication du message sur le forum.
     * @returns {Convoi|null} Un objet Convoi si le parsing réussit, sinon null.
     */
    static fromUtilitaireString(messageText, auteurMessage, idCommande, datePost) {
        // Regex pour capturer nourriture, matériaux, destinataire, temps restant, date de retour, ID d'annulation (optionnel) et ouvrières (optionnel)
        const convoiMatch = messageText.match(/\s*- Vous allez livrer (-?\d+) nourritures et (-?\d+) materiaux à (.+?) dans (.+?) - Retour le (.+?)(?: \(ID Annulation: (\d+)\))?(?: \((\d+) ouvrières\))?$/);

        if (convoiMatch) {
            const nourriture = parseInt(convoiMatch[1], 10);
            const materiaux = parseInt(convoiMatch[2], 10);
            const destinataire = convoiMatch[3];
            // convoiMatch[4] est le temps restant (ex: "1h 30m"), non utilisé directement pour la date d'arrivée
            const dateRetourText = convoiMatch[5];
            const idAnnulation = convoiMatch[6] ? convoiMatch[6] : null;
            const ouvrieres = convoiMatch[7] ? parseInt(convoiMatch[7], 10) : 0; // Capture group 7 for ouvrières

            const dateArrivee = moment(dateRetourText, "D MMM YYYY à HH[h]mm");

            // Vérifier si la date d'arrivée est dans le futur ou dans la minute actuelle
            // Utiliser une tolérance pour les dates passées très récentes (-1 minute)
            if (dateArrivee.diff(moment()) >= -60000) {
                return new Convoi({
                    expediteur: auteurMessage,
                    destinataire: destinataire,
                    nourriture: nourriture,
                    materiaux: materiaux,
                    dateArrivee: dateArrivee.toDate(),
                    idCommande: idCommande,
                    datePost: datePost,
                    idAnnulation: idAnnulation,
                    ouvrieres: ouvrieres
                });
            }
        }
        return null;
    }
}
