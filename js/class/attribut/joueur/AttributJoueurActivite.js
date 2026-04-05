class AttributJoueurActivite extends AttributObjet {
    static NOM_AFFICHAGE = ['Activité'];
    valeur = '';

    /**
     * Modifie la valeur de l'activité du joueur.
     * Accepte une chaîne d'activité directe ('actif', 'vacances', etc.)
     * ou une URL/tag HTML d'image et la convertit.
     * @param {string|object} nouvelleValeur - La nouvelle valeur d'activité.
     * @returns {Promise<Boolean>} Vrai si la modification a réussi.
     */
    async ecrire(nouvelleValeur) {
        console.log('invocation surcharge avec :', nouvelleValeur);
        let valeurNormalisee = nouvelleValeur;
        if (typeof nouvelleValeur === 'object' && nouvelleValeur !== null && typeof nouvelleValeur.attr === 'function') {
            // Objet jQuery : extraire le src
            valeurNormalisee = this._convertirImageEtatEnString(nouvelleValeur.attr('src'));
        } else if (typeof nouvelleValeur === 'string' && nouvelleValeur.includes('images/icone')) {
            // URL d'image ou balise HTML img
            const srcMatch = nouvelleValeur.match(/src=['"]([^'"]*)['"]/);
            const src = srcMatch ? srcMatch[1] : nouvelleValeur;
            valeurNormalisee = this._convertirImageEtatEnString(src);
        }

        return await super.ecrire(valeurNormalisee);
    }

    /**
     * Convertit une URL d'image de pastille d'activité en sa chaîne d'activité correspondante.
     * @param {string} imageUrl - L'URL de l'image.
     * @returns {string} La chaîne d'activité ou chaîne vide si non reconnue.
     * @private
     */
    _convertirImageEtatEnString(imageUrl) {
        let normalizedUrl = imageUrl;
        const absoluteMatch = imageUrl.match(/https?:\/\/[^/]+(\/images\/icone\/[^'"]*\.gif)/);
        if (absoluteMatch) {
            normalizedUrl = absoluteMatch[1];
        }

        const _getSrc = (tag) => {
            const m = tag.match(/src=['"]([^'"]*)['"]/);
            return m ? m[1] : '';
        };

        if (normalizedUrl.includes(_getSrc(IMG_ACTIF))) return 'actif';
        if (normalizedUrl.includes(_getSrc(IMG_INACTIF_3))) return 'inactif_3_jours';
        if (normalizedUrl.includes(_getSrc(IMG_INACTIF_10))) return 'inactif_10_jours';
        if (normalizedUrl.includes(_getSrc(IMG_VACANCES))) return 'vacances';
        if (normalizedUrl.includes(_getSrc(IMG_BANNI))) return 'banni';
        console.warn(`[AttributJoueurActivite] Image d'activité non reconnue: ${imageUrl}.`);
        return '';
    }
}
