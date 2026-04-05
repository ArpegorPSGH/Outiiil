class ParametreConvoiDestinataire extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static TYPE_LIEN = 'joueur';
    static FORMAT_HISTORY = [{ nom: 'Destinataire', format: '(nom): (valeur) |' }];
    valeur = '';
}
