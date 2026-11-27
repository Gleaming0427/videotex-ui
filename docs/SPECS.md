# Spécifications utilisées par le code

Valeurs reprises dans le noyau (`src/core`). Tant que l’[étape 1](https://github.com/Gleaming0427/videotex-ui/issues/1) n’est pas faite, aucune n’est recoupée avec la STUM (Spécifications techniques d’utilisation du Minitel).

Statut : **source unique** = une seule source citée dans la fiche projet ; **à recouper** = valeur de travail, sans source vérifiée.

| Sujet | Valeur dans le code | Où | Statut |
| --- | --- | --- | --- |
| Grille | 40 colonnes × 25 rangées | `grid.ts` | Source unique (Wikipédia) |
| Ligne 0 | Ligne de service : pas de retour à la ligne, taille normale seulement | `grid.ts`, `builder.ts` | À recouper |
| Cellule | 8 × 10 points (écran de 320 × 250 points) | `grid.ts` | À recouper |
| Mosaïques | 2 × 3 sixels ; colonnes de 4 points ; rangées de 3, 4 et 3 points | `mosaic.ts` | À recouper |
| Codes G1 | 0x20 à 0x3F puis 0x60 à 0x7F ; bit 6 du code = sixel en bas à droite | `mosaic.ts` | À recouper |
| Mosaïque disjointe | Attribut de soulignement en mode mosaïque ; chaque sixel perd 1 point à droite et en bas | `mosaicStyle.ts` | À recouper |
| Couleurs | Noir, rouge, vert, jaune, bleu, magenta, cyan, blanc (codes 0 à 7) | `palette.ts` | À recouper |
| Niveaux de gris | Ordre de luminance : noir, bleu, rouge, magenta, vert, cyan, jaune, blanc ; 8 niveaux également espacés | `palette.ts` | Ordre à recouper, espacement supposé |
| Double hauteur | Le caractère occupe la rangée du curseur et celle du dessus ; refusée en rangées 0 et 1 | `builder.ts` | À recouper |
| Double largeur | Le caractère occupe la colonne du curseur et la suivante | `builder.ts` | À recouper |
| Attributs en mosaïque | Ni taille ni inversion ; le clignotement s’applique | `builder.ts` | À recouper |
| Accents | Pas de majuscules accentuées (la démo écrit « VIDEOTEX ») | `demo/demoPage.ts` | À recouper |
| Vitesse | 1 200 bauds, 10 bits par caractère, soit 120 caractères par seconde | `reveal.ts` | À recouper |
| Touches de fonction | Répétition, Suite, Sommaire, Guide, Annulation, Retour, Correction, Envoi | (étape 5) | Source unique (brochure DGT de 1986) |

## Simplifications connues

- **Attributs parallèles** : chaque cellule porte ses propres couleurs et attributs. Un vrai Minitel utilise des attributs sériels (le fond change sur un délimiteur). Le mode fidèle strict arrive avec le décodeur de flux ([étape 14](https://github.com/Gleaming0427/videotex-ui/issues/14)).
- **Recouvrement des doubles tailles** : écrire par-dessus une partie d’un caractère double ne nettoie pas les autres parties.
- **Police** : VT323 (Google Fonts) étirée horizontalement en attendant la police maison ([étape 12](https://github.com/Gleaming0427/videotex-ui/issues/12)).
