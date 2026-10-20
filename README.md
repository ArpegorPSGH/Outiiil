# Outiiil - Extension pour Fourmizzz

<br/>

[![Outiiil logo](./img/header.png)](http://outiiil.fr)

<br/>

## Outiiil ##

Outiiil est un projet destiné à ameliorer la qualité du jeu [Fourmizzz](http://fourmizzz.fr). Fourmizzz
est un jeu par navigateur dont le but est de developper sa fourmilière. Dans la lignée des jeux par navigateur 
comme Ogame, Fourmizzz s'est aproprié un monde à part et perdure depuis plusieurs années.

Le projet est né d'une volonté de proposer une solution **libre** et de proposer des outils directement sur le jeu.
De plus Outiiil a l'ambition d'être complétement **transparent** : tout les joueurs qui utilisent cette extension peuvent
lire le code et savent exactement ce que fait l'extension !

Le projet attache également une grande importance quant à l'utilisation de vos données lié au jeu. 
Outiiil fonctionne localement, il récupére des données de fàçon securisée seulement pour l'historique des joueurs et 
pour gérer un eventuel utilitaire. **Aucunes** Données personnelles n'est stockées ailleurs que chez vous !

## Contribuer ##

Si Outiiil est à présent sur Github c'est pour la communauté : beaucoup participe de prés et de loin à ce projet et je me devais 
de proposer une solution digne de ce nom pour faire evoluer ce projet, celui qui veut faire sa propre version parce qu'il voit les choses 
autrement ou celui qui veut vraiment participer peut desormais le faire plus facilement !

### Comment ? ###

Le projet disponible ci-dessus présente les sources en JavaScript pouvant être intégrées à une extension ou un userscript.

### Générer une release et déployer une mise à jour ###

Outiiil utilise une architecture de mise à jour dynamique :
1. Incrémentez le numéro de version dans `manifest.json`.
2. Exécutez le script release.py
Les utilisateurs recevront automatiquement la mise à jour en arrière-plan dès leur navigation suivante, sans aucune action requise de leur part.

