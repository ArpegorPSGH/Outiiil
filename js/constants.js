/**
* CONSTANTE
*/
const CONSTRUCTION = ["Champignonnière", "Entrepôt de Nourriture", "Entrepôt de Matériaux", "Couveuse", "Solarium", "Laboratoire", "Salle d'analyse", "Salle de combat", "Caserne", "Dôme", "Loge Impériale", "Etable à pucerons", "Etable à cochenilles"];
const RECHERCHE = ["Technique de ponte", "Bouclier Thoracique", "Armes", "Architecture", "Communication avec les animaux", "Vitesse de chasse", "Vitesse d'attaque", "Génétique", "Acide", "Poison"];
const COUT_CONSTUCTION = [90, 600, 600, 600, 2000, 1400, 1400, 300, 800, 3500, 5000, 1500, 10000];
const COUT_RECHERCHE_POM = [120, 200, 300, 100, 200, 4000, 3000, 3000, 100000, 40000000];
const COUT_RECHERCHE_BOI = [120, 300, 200, 200, 500, 2500, 1000, 10000, 300000, 15000000];
const NOM_UNITE = ["Ouvrière", "Jeune Soldate Naine", "Soldate Naine", "Naine d’Elite", "Jeune Soldate", "Soldate", "Concierge", "Concierge d’élite", "Artilleuse", "Artilleuse d’élite", "Soldate d’élite", "Tank", "Tank d’élite", "Tueuse", "Tueuse d’élite"];
const NOM_UNITES = ["Ouvrières", "Jeunes Soldates Naines", "Soldates Naines", "Naines d’Elites", "Jeunes Soldates", "Soldates", "Concierges", "Concierges d’élites", "Artilleuses", "Artilleuses d’élites", "Soldates d’élites", "Tanks", "Tanks d’élites", "Tueuses", "Tueuses d’élites"];
const NOM_RAC_UNITE = ["O", "JSN", "SN", "NE", "JS", "S", "C", "CE", "A", "AE", "SE", "Tk", "TkE", "Tu", "TuE"];
const TEMPS_UNITE = [60, 300, 450, 570, 740, 1000, 1410, 1410, 1440, 1520, 1450, 1860, 1860, 2740, 2740];
const COUT_UNITE = [5, 16, 20, 26, 30, 36, 70, 100, 30, 34, 44, 100, 150, 80, 90];
const VIE_UNITE = [0, 8, 10, 13, 16, 20, 30, 40, 10, 12, 27, 35, 50, 50, 55];
const ATT_UNITE = [0, 3, 5, 7, 10, 15, 1, 1, 30, 35, 24, 55, 80, 50, 55];
const DEF_UNITE = [0, 2, 4, 6, 9, 14, 25, 35, 15, 18, 23, 1, 1, 50, 55];
const RATIO_CHASSE = [1, 2, 3, 4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10];
const PERTE_MIN_CHASSE = [0.103971824, 0.066805442, 0.036854146, 0.014477073, 0.010067247, 0.008361713, 0.00751662, 0.007060666, 0.006692853, 0.006402339, 0.006090569, 0.0057788, 0.005080623];
const PERTE_MOY_CHASSE = [0.14183641, 0.089382202, 0.065595625, 0.037509208, 0.024982573, 0.018532185, 0.014281932, 0.011725921, 0.010437083, 0.009834768, 0.009339662, 0.008844556, 0.008502895];
const PERTE_MAX_CHASSE = [0.33333334, 0.176739357, 0.113191158, 0.08245817, 0.051342954, 0.036955988, 0.03395735, 0.032083615, 0.026461955, 0.024588162, 0.021774264, 0.018960366, 0.017190797];
const ORDRE_UNITE_CHASSE = [11, 4, 5, 2, 13, 8, 6, 14, 12, 10, 9, 7, 3];
const ORDRE_XP_CHASSE = [11, 4, 5, 2, 13, 8, 6];
const REPLIQUE_CHASSE = [0, 0, 0, 0.016, 0.093, 0.345, 0.577777778, 0.753, 0.837, 0.874, 0.937, 0.96, 0.989];
// Image chat, messagerie de fourmizzz
const LISTESMILEY1 = `<img src='images/carte/rien.gif' width='1' height='39'>
      <img src='images/smiley/ant_pouce.gif' onclick='addRaccourciSmiley("message","ant_pouce")'>
       <img src='images/smiley/ant_smile.gif' onclick='addRaccourciSmiley("message","ant_smile")'>
       <img src='images/smiley/ant_biggrin.gif' onclick='addRaccourciSmiley("message","ant_biggrin")'>
       <img src='images/smiley/ant_laugh.gif' onclick='addRaccourciSmiley("message","ant_laugh")'>
       <img src='images/smiley/ant_tongue.gif' onclick='addRaccourciSmiley("message","ant_tongue")'>
       <img src='images/smiley/ant_bye.gif' onclick='addRaccourciSmiley("message","ant_bye")'>
       <img src='images/smiley/ant_cool.gif' onclick='addRaccourciSmiley("message","ant_cool")'>
       <img src='images/smiley/ant_interest.gif' onclick='addRaccourciSmiley("message","ant_interest")'>
       <img src='images/smiley/ant_angel.gif' onclick='addRaccourciSmiley("message","ant_angel")'>
       <img src='images/smiley/ant_smug.gif' onclick='addRaccourciSmiley("message","ant_smug")'>
       <img src='images/smiley/ant_nudgewink.gif' onclick='addRaccourciSmiley("message","ant_nudgewink")'>
       <img src='images/smiley/ant_blink.gif' onclick='addRaccourciSmiley("message","ant_blink")'>
       <img src='images/smiley/ant_unsure.gif' onclick='addRaccourciSmiley("message","ant_unsure")'>
       <img src='images/smiley/ant_shy.gif' onclick='addRaccourciSmiley("message","ant_shy")'>
       <img src='images/smiley/ant_oh.gif' onclick='addRaccourciSmiley("message","ant_oh")'>
       <img src='images/smiley/ant_sleep.gif' onclick='addRaccourciSmiley("message","ant_sleep")'>
       <img src='images/smiley/ant_sad.gif' onclick='addRaccourciSmiley("message","ant_sad")'>
       <img src='images/smiley/ant_mad.gif' onclick='addRaccourciSmiley("message","ant_mad")'>
       <img src='images/smiley/ant_doctor.gif' onclick='addRaccourciSmiley("message","ant_doctor")'>`;
const LISTESMILEY2 = `<img src='images/carte/rien.gif' width='1' height='39'>
      <img onclick='addRaccourciSmiley("message","doctor")' src='images/smiley/doctor.gif'>
       <img onclick='addRaccourciSmiley("message","borg")' src='images/smiley/borg.gif'>
       <img onclick='addRaccourciSmiley("message","pirate")' src='images/smiley/pirate.gif'>
       <img onclick='addRaccourciSmiley("message","sick2")' src='images/smiley/sick2.gif'>
       <img onclick='addRaccourciSmiley("message","asian")' src='images/smiley/asian.gif'>
       <img onclick='addRaccourciSmiley("message","dunce")' src='images/smiley/dunce.gif'>
       <img onclick='addRaccourciSmiley("message","canadian")' src='images/smiley/canadian.gif'>
       <img onclick='addRaccourciSmiley("message","captain")' src='images/smiley/captain.gif'>
       <img onclick='addRaccourciSmiley("message","police")' src='images/smiley/police.gif'>
       <img onclick='addRaccourciSmiley("message","santa")' src='images/smiley/santa.gif'>
       <img onclick='addRaccourciSmiley("message","cook")' src='images/smiley/cook.gif'>
       <img onclick='addRaccourciSmiley("message","farmer")' src='images/smiley/farmer.gif'>
       <img onclick='addRaccourciSmiley("message","smurf")' src='images/smiley/smurf.gif'>
       <img onclick='addRaccourciSmiley("message","gangster")' src='images/smiley/gangster.gif'>
       <img onclick='addRaccourciSmiley("message","king")' src='images/smiley/king.gif'>
       <img onclick='addRaccourciSmiley("message","king2")' src='images/smiley/king2.gif'>
       <img onclick='addRaccourciSmiley("message","pixie")' src='images/smiley/pixie.gif'>
       <img onclick='addRaccourciSmiley("message","pirate2")' src='images/smiley/pirate2.gif'>
       <img onclick='addRaccourciSmiley("message","pirate3")' src='images/smiley/pirate3.gif'>
       <img onclick='addRaccourciSmiley("message","warrior")' src='images/smiley/warrior.gif'>
       <img onclick='addRaccourciSmiley("message","card")' src='images/smiley/card.gif'>
       <img onclick='addRaccourciSmiley("message","egypt")' src='images/smiley/egypt.gif'>
       <img onclick='addRaccourciSmiley("message","fool")' src='images/smiley/fool.gif'>
       <img onclick='addRaccourciSmiley("message","hat")' src='images/smiley/hat.gif'>`;
const LISTESMILEY3 = `<img src='images/carte/rien.gif' width='1' height='39'>
      <img onclick='addRaccourciSmiley("message","dead")' src='images/smiley/dead.gif'>
       <img onclick='addRaccourciSmiley("message","inv")' src='images/smiley/inv.gif'>
       <img onclick='addRaccourciSmiley("message","stretcher")' src='images/smiley/stretcher.gif'>
       <img onclick='addRaccourciSmiley("message","blue")' src='images/smiley/blue.gif'>
       <img onclick='addRaccourciSmiley("message","sick")' src='images/smiley/sick.gif'>
       <img onclick='addRaccourciSmiley("message","love")' src='images/smiley/love.gif'>
       <img onclick='addRaccourciSmiley("message","cupid")' src='images/smiley/cupid.gif'>
       <img onclick='addRaccourciSmiley("message","diablo")' src='images/smiley/diablo.gif'>
       <img onclick='addRaccourciSmiley("message","crossbones")' src='images/smiley/crossbones.gif'>
       <img onclick='addRaccourciSmiley("message","fish")' src='images/smiley/fish.gif'>
       <img onclick='addRaccourciSmiley("message","cupid2")' src='images/smiley/cupid2.gif'>
       <img onclick='addRaccourciSmiley("message","construction")' src='images/smiley/construction.gif'>
       <img onclick='addRaccourciSmiley("message","flower")' src='images/smiley/flower.gif'>
       <img onclick='addRaccourciSmiley("message","drinks")' src='images/smiley/drinks.gif'>
       <img onclick='addRaccourciSmiley("message","burp")' src='images/smiley/burp.gif'>
       <img onclick='addRaccourciSmiley("message","rain")' src='images/smiley/rain.gif'>
       <img onclick='addRaccourciSmiley("message","surf")' src='images/smiley/surf.gif'>
       <img onclick='addRaccourciSmiley("message","baloon")' src='images/smiley/baloon.gif'>
       <img onclick='addRaccourciSmiley("message","sleep2")' src='images/smiley/sleep2.gif'>
       <img onclick='addRaccourciSmiley("message","rip")' src='images/smiley/rip.gif'>
       <img onclick='addRaccourciSmiley("message","scooter")' src='images/smiley/scooter.gif'>
       <img onclick='addRaccourciSmiley("message","moto")' src='images/smiley/moto.gif'>`;
const LISTESMILEY4 = `<img src='images/carte/rien.gif' width='1' height='39'>
      <img onclick='addRaccourciSmiley("message","whip")' src='images/smiley/whip.gif'>
      <img onclick='addRaccourciSmiley("message","shades")' src='images/smiley/shades.gif'>
      <img onclick='addRaccourciSmiley("message","kiss")' src='images/smiley/kiss.gif'>
      <img onclick='addRaccourciSmiley("message","boxer")' src='images/smiley/boxer.gif'>
      <img onclick='addRaccourciSmiley("message","gun")' src='images/smiley/gun.gif'>
      <img onclick='addRaccourciSmiley("message","bross")' src='images/smiley/bross.gif'>
      <img onclick='addRaccourciSmiley("message","whistling")' src='images/smiley/whistling.gif'>
      <img onclick='addRaccourciSmiley("message","showoff")' src='images/smiley/showoff.gif'>
      <img onclick='addRaccourciSmiley("message","noel_vache")' src='images/smiley/noel_vache.gif'>
      <img onclick='addRaccourciSmiley("message","app")' src='images/smiley/app.gif'>
      <img onclick='addRaccourciSmiley("message","book")' src='images/smiley/book.gif'>
      <img onclick='addRaccourciSmiley("message","cake")' src='images/smiley/cake.gif'>
      <img onclick='addRaccourciSmiley("message","dance")' src='images/smiley/dance.gif'>
      <img onclick='addRaccourciSmiley("message","harhar")' src='images/smiley/harhar.gif'>
      <img onclick='addRaccourciSmiley("message","juggle")' src='images/smiley/juggle.gif'>
      <img onclick='addRaccourciSmiley("message","worthy")' src='images/smiley/worthy.gif'>
      <img onclick='addRaccourciSmiley("message","fishing")' src='images/smiley/fishing.gif'>
      <img onclick='addRaccourciSmiley("message","stereo")' src='images/smiley/stereo.gif'>
      <img onclick='addRaccourciSmiley("message","music")' src='images/smiley/music.gif'>
      <img onclick='addRaccourciSmiley("message","prison")' src='images/smiley/prison.gif'>
      <img onclick='addRaccourciSmiley("message","piece")' src='images/smiley/piece.gif'>`;
const LISTESMILEY5 = `<img src='images/carte/rien.gif' width='1' height='39'>
      <img onclick='addRaccourciSmiley("message","noel_etoile")' src='images/smiley/noel_etoile.gif'>
       <img onclick='addRaccourciSmiley("message","noel_snowman10")' src='images/smiley/noel_snowman10.gif'>
       <img onclick='addRaccourciSmiley("message","noel_snowman11")' src='images/smiley/noel_snowman11.gif'>
       <img onclick='addRaccourciSmiley("message","noel_cadeau3")' src='images/smiley/noel_cadeau3.gif'>
       <img onclick='addRaccourciSmiley("message","noel_vache")' src='images/smiley/noel_vache.gif'>
       <img onclick='addRaccourciSmiley("message","santa")' src='images/smiley/santa.gif'>
       <img onclick='addRaccourciSmiley("message","noel_pere")' src='images/smiley/noel_pere.gif'>
       <img onclick='addRaccourciSmiley("message","noel_santa")' src='images/smiley/noel_santa.gif'>
       <img onclick='addRaccourciSmiley("message","noel_bougie")' src='images/smiley/noel_bougie.gif'>
       <img onclick='addRaccourciSmiley("message","noel_chien2")' src='images/smiley/noel_chien2.gif'>
       <img onclick='addRaccourciSmiley("message","noel_chapeau")' src='images/smiley/noel_chapeau.gif'>
       <img onclick='addRaccourciSmiley("message","noel_cadeau")' src='images/smiley/noel_cadeau.gif'>
       <img onclick='addRaccourciSmiley("message","noel_sapin3")' src='images/smiley/noel_sapin3.gif'>
       <img onclick='addRaccourciSmiley("message","noel_snowman4")' src='images/smiley/noel_snowman4.gif'>
       <img onclick='addRaccourciSmiley("message","noel_snowman3")' src='images/smiley/noel_snowman3.gif'>
       <img onclick='addRaccourciSmiley("message","noel_chaussette")' src='images/smiley/noel_chaussette.gif'>
       <img onclick='addRaccourciSmiley("message","noel_flocon")' src='images/smiley/noel_flocon.gif'>
       <img onclick='addRaccourciSmiley("message","noel_snowman5")' src='images/smiley/noel_snowman5.gif'>
       <img onclick='addRaccourciSmiley("message","noel_sapin2")' src='images/smiley/noel_sapin2.gif'>
       <img onclick='addRaccourciSmiley("message","noel_snowman8")' src='images/smiley/noel_snowman8.gif'>
       <img onclick='addRaccourciSmiley("message","noel_bonnet")' src='images/smiley/noel_bonnet.gif'>
       <img onclick='addRaccourciSmiley("message","noel_renne")' src='images/smiley/noel_renne.gif'>
       <img onclick='addRaccourciSmiley("message","noel_renne3")' src='images/smiley/noel_renne3.gif'>`;
const LISTESMILEY6 = `<img src='images/carte/rien.gif' width='1' height='39'>
      <img src='images/smiley/dollar.gif' onclick='addRaccourciSmiley("message","dollar")'>
       <img src='images/smiley/ninja.gif' onclick='addRaccourciSmiley("message","ninja")'>
       <img src='images/smiley/bat.gif' onclick='addRaccourciSmiley("message","bat")'>
       <img src='images/smiley/whistles.gif' onclick='addRaccourciSmiley("message","whistles")'>
       <img src='images/smiley/showoff2.gif' onclick='addRaccourciSmiley("message","showoff2")'>
       <img src='images/smiley/barbarian.gif' onclick='addRaccourciSmiley("message","barbarian")'>
       <img src='images/smiley/magi.gif' onclick='addRaccourciSmiley("message","magi")'>
       <img src='images/smiley/prof.gif' onclick='addRaccourciSmiley("message","prof")'>
       <img src='images/smiley/witch.gif' onclick='addRaccourciSmiley("message","witch")'>
       <img src='images/smiley/pirate4.gif' onclick='addRaccourciSmiley("message","pirate4")'>
       <img src='images/smiley/bicycle.gif' onclick='addRaccourciSmiley("message","bicycle")'>
       <img src='images/smiley/scooter2.gif' onclick='addRaccourciSmiley("message","scooter2")'>
       <img src='images/smiley/police2.gif' onclick='addRaccourciSmiley("message","police2")'>
       <img src='images/smiley/dragon.gif' onclick='addRaccourciSmiley("message","dragon")'>
       <img src='images/smiley/panic.gif' onclick='addRaccourciSmiley("message","panic")'>
       <img src='images/smiley/dog.gif' onclick='addRaccourciSmiley("message","dog")'>
       <img src='images/smiley/plane.gif' onclick='addRaccourciSmiley("message","plane")'>`;
// Image diverses de fourmizzz
const IMG_FLECHE = "<img src='images/icone/fleche-bas-claire.png' style='vertical-align:1px;' alt='changer' height='8'>";
const IMG_POMME = "<img src='images/icone/icone_pomme.gif' alt='Nourriture' class='o_vAlign' height='18' title='Consommation Journalière' />";
const IMG_MAT = "<img src='images/icone/icone_bois.gif' alt='Materiaux' height='18'/>";
const IMG_VIE = "<img src='images/icone/icone_coeur.gif' class='o_vAlign' height='18' width='18'/>";
const IMG_ATT = "<img src='images/icone/icone_degat_attaque.gif'  alt='Dégâts en attaque :' class='o_vAlign'height='18' title='Dégâts en attaque :' />";
const IMG_DEF = "<img src='images/icone/icone_degat_defense.gif' alt='Dégâts en défense :' class='o_vAlign' height='18' title='Dégâts en défense :' />";
const IMG_GAUCHE = "<img src='images/bouton/fleche-champs-gauche.gif' width='9' height='15' class='o_vAlign'/>";
const IMG_DROITE = "<img src='images/bouton/fleche-champs-droite.gif' width='9' height='15' class='o_vAlign'/>";
const IMG_COPY = "<img src='images/icone/feuille.gif' class='cliquable' title='Copier/Coller une armée' style='position:relative;top:3px' width='14' height='17'>";
const IMG_ACTIF = "<img src='images/icone/1rondvert.gif' alt='Actif' title='Actif cette semaine'/>";
const IMG_INACTIF_3 = "<img src='images/icone/2rondorange.gif' alt='Inactif 3 jours' title='Inactif depuis 3 jours'/>";
const IMG_INACTIF_10 = "<img src='images/icone/3rondrouge.gif' alt='Inactif 10 jours' title='Inactif depuis 10 jours'/>";
const IMG_VACANCES = "<img src='images/icone/4rondbleu.gif' alt='Vacances' title='En vacances'/>";
const IMG_BANNI = "<img src='images/icone/5rondgris.gif' alt='Banni' title='Banni'/>";
const IMG_COLONISE = "<img src='images/icone/attention.gif' alt='Colonisé' title='Colonisé'/>";
// Image pour l'extension
const IMG_CHANGE = chrome.runtime.getURL("images/change.png");
const IMG_ACTUALISER = chrome.runtime.getURL("images/actualize_on_01.png");
const IMG_CRAYON = chrome.runtime.getURL("images/crayon.gif");
const IMG_CROIX = chrome.runtime.getURL("images/croix.png");
const IMG_COPIER = chrome.runtime.getURL("images/copy.png");
const IMG_HISTORIQUE = chrome.runtime.getURL("images/historique.png");
const IMG_LIVRAISON = chrome.runtime.getURL("images/livraison.png");
const IMG_RADAR = chrome.runtime.getURL("images/radar.png");
const IMG_SPRITE_MENU = chrome.runtime.getURL("images/sprite_menu.png");
const IMG_UTILITY = chrome.runtime.getURL("images/utility.png");
const IMG_DOWN = chrome.runtime.getURL("images/down.png");
const IMG_UP = chrome.runtime.getURL("images/up.png");
const IMG_OUTIIIL = chrome.runtime.getURL("images/outiiil.png");

const TOAST_ERROR = { heading: "Erreur", hideAfter: 3500, showHideTransition: "slide", position: { top: 30, right: 100 }, icon: "error" };
const TOAST_SUCCESS = { heading: "Succès", hideAfter: 3500, showHideTransition: "slide", position: { top: 30, right: 100 }, icon: "success" };
const TOAST_WARNING = { heading: "Attention", hideAfter: 3500, showHideTransition: "slide", position: { top: 30, right: 100 }, icon: "warning" };
const TOAST_INFO = { heading: "Information", hideAfter: 3500, showHideTransition: "slide", position: { top: 30, right: 100 }, icon: "info" };
const EVOLUTION = [...CONSTRUCTION, ...RECHERCHE, "Nourriture", "Materiaux"];
const EFFET = ["", "Blind", "Bounce", "Clip", "Drop", "Explode", "Fade", "Fold", "Highlight", "Puff", "Pulsate", "Scale", "Shake", "Size", "Slide"];
const METHODE_FLOOD = ["Standard", "Optimisée", "Uniforme", "Dégressive"];
const LIEU = { TERRAIN: 0, DOME: 1, LOGE: 2 };
const LIBELLE_LIEU = ["Terrain de Chasse", "fourmilière", "Loge Impériale"];
const ETAT_COMMANDE = { "Nouvelle": 0, "En attente": 1, "En cours": 2, "Annulée": 3, "Terminée": 4, "Supprimée": 5 };
const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MOIS_RAC_FR = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
const JOUR_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DATEPICKER_OPTION = {
      closeText: 'Fermer',
      prevText: 'Précédent',
      nextText: 'Suivant',
      currentText: 'Aujourd\'hui',
      monthNames: MOIS_FR,
      monthNamesShort: MOIS_RAC_FR,
      dayNames: JOUR_FR,
      dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
      dayNamesMin: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
      weekHeader: 'Sem.',
      dateFormat: 'dd-mm-yy',
      firstDay: '1',
      changeYear: true,
      changeMonth: true
};

// Formats globaux par défaut de l'extension
const FORMAT_DATE_DEFAUT = "D MMM [à] HH[h]mm";
const FORMAT_DUREE_DEFAUT = "Y[A ]d[J ]h[h ]m[m ]ss[s]";

const TRANSACTION_COLLISION_WAIT_MS = 1000;