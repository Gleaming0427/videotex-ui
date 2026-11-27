# Feuille de route

Chaque étape a son ticket, avec la liste des tâches. Le numéro d’étape est aussi le numéro du ticket.

## MVP — test de 14 jours

Ce qu’il faut pour le test de validation : 8 composants, page de démo, GIF, publication à J8, mesure à J14.

| Étape | Ticket | Fini quand |
| --- | --- | --- |
| 1 | [Recouper les spécifications avec la STUM](https://github.com/Gleaming0427/videotex-ui/issues/1) | Chaque valeur de `docs/SPECS.md` cite la STUM ou deux sources concordantes. |
| 2 | [Socle du dépôt](https://github.com/Gleaming0427/videotex-ui/issues/2) | `npm ci`, `npm run typecheck`, `npm test` et `npm run build` passent en local et en CI. |
| 3 | [Noyau Vidéotex en TypeScript pur](https://github.com/Gleaming0427/videotex-ui/issues/3) | Tests verts et API décrite dans le README. |
| 4 | [Composant Ecran](https://github.com/Gleaming0427/videotex-ui/issues/4) | La démo affiche une page complète, nette, en couleur et en gris. |
| 5 | [ClavierFonctions](https://github.com/Gleaming0427/videotex-ui/issues/5) | La démo navigue entre plusieurs pages avec Suite, Retour et Sommaire. |
| 6 | [Composants de formulaire et de navigation](https://github.com/Gleaming0427/videotex-ui/issues/6) | 8 composants au total (avec `Ecran`, `ClavierFonctions` et `Mosaique`) utilisés dans la démo. |
| 7 | [Mosaique : convertisseur d’images](https://github.com/Gleaming0427/videotex-ui/issues/7) | Une photo déposée dans la démo s’affiche en mosaïque et s’exporte. |
| 8 | [Paquet npm et registre shadcn](https://github.com/Gleaming0427/videotex-ui/issues/8) | La commande d’installation shadcn ajoute `Ecran` dans un projet neuf. |
| 9 | [Vérifications juridiques](https://github.com/Gleaming0427/videotex-ui/issues/9) | Chaque point est vérifié et noté dans `docs/JURIDIQUE.md`. |
| 10 | [Site de démo et GIF](https://github.com/Gleaming0427/videotex-ui/issues/10) | La démo est en ligne et le GIF dure moins de 10 secondes. |
| 11 | [Lancement et mesure à J14](https://github.com/Gleaming0427/videotex-ui/issues/11) | Décision écrite de poursuivre ou d’arrêter. |

## v1

Fidélité complète après le test : police maison, rendu Canvas, flux Vidéotex.

| Étape | Ticket | Fini quand |
| --- | --- | --- |
| 12 | [Police à pixels 8 × 10](https://github.com/Gleaming0427/videotex-ui/issues/12) | La démo n’utilise plus VT323. |
| 13 | [Rendu Canvas au pixel près](https://github.com/Gleaming0427/videotex-ui/issues/13) | Les rendus DOM et Canvas d’une même page sont identiques à l’œil. |
| 14 | [Flux Vidéotex (.vdt)](https://github.com/Gleaming0427/videotex-ui/issues/14) | Une page exportée se relit à l’identique dans miedit. |

## Ordre conseillé

1. Étapes 2 à 4 : socle, noyau et `Ecran`, sur lesquels tout le reste s’appuie.
2. Étape 1 en parallèle : les valeurs vérifiées corrigent les constantes du noyau.
3. Étapes 5 à 7 : les autres composants.
4. Étapes 8 à 10 : paquet, vérifications juridiques, démo.
5. Étape 11 : lancement (un samedi, pour r/webdev).
