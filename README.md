# videotex-ui

Kit d’interface React inspiré du Vidéotex français : grille de 40 × 25, mosaïques semi-graphiques, 8 couleurs, touches de fonction.

> Projet en cours de construction, dépôt privé. Rien n’est encore publié sur npm.

## Démarrer

```bash
npm install
npm run dev        # démo sur http://localhost:5173
npm test           # tests
npm run build      # bibliothèque dans dist/
```

## Utilisation

```tsx
import { Ecran, PageBuilder } from 'videotex-ui';
import 'videotex-ui/styles.css';

const page = new PageBuilder()
  .moveTo(3, 2).print('BONJOUR', { fg: 'yellow', size: 'double-size' })
  .moveTo(5, 2).print('Tapez votre choix puis ')
  .print(' Envoi ', { inverse: true })
  .build();

export function Accueil() {
  return <Ecran page={page} crt baud={1200} aria-label="Accueil" />;
}
```

La police VT323 n’est pas fournie : chargez-la depuis Google Fonts, ou changez `--vtx-font` (et réglez alors `--vtx-font-scale` et `--vtx-font-stretch`).

### `PageBuilder`

Écrit une page comme un serveur Vidéotex : on place le curseur, on choisit les attributs, on écrit.

| Méthode | Rôle |
| --- | --- |
| `moveTo(rangée, colonne)` | Place le curseur (rangées 0 à 24, colonnes 0 à 39) et fixe la marge utilisée par `\n` |
| `attr({ fg, bg, … })` | Change les attributs des écritures suivantes ; `reset()` revient à ceux du constructeur |
| `print(texte, attributs?)` | Écrit du texte ; retour à la ligne en colonne 40 |
| `mosaic(masques, attributs?)` | Écrit des caractères mosaïques (masque de 6 bits, voir `maskFromRows`) |
| `mosaicBlock(lignes, attributs?)` | Écrit plusieurs rangées de mosaïques, par exemple issues de `bitmapToMasks` |
| `fill(haut, gauche, hauteur, largeur, attributs?)` | Peint un rectangle |
| `build()` | Renvoie la page (figée) |

Attributs : `fg` et `bg` (0 à 7 ou `'black'`, `'red'`, `'green'`, `'yellow'`, `'blue'`, `'magenta'`, `'cyan'`, `'white'`), `blink`, `inverse`, `underline` (mosaïque disjointe en mode mosaïque), `size` (`'normal'`, `'double-height'`, `'double-width'`, `'double-size'`).

### `Ecran`

| Prop | Défaut | Rôle |
| --- | --- | --- |
| `page` | | Page à afficher |
| `palette` | `'color'` | `'color'` ou `'monochrome'` (8 niveaux de gris) |
| `crt` | `false` | Lignes de balayage, vignettage, halo, bord sombre |
| `baud` | `false` | Affichage progressif à cette vitesse (1200 sur un Minitel) |
| `scale` | `'auto'` | Taille d’un point en pixels CSS ; `'auto'` prend le plus grand entier qui tient, pour des pixels nets |
| `blink` | `true` | Active le clignotement |
| `onRevealEnd` | | Appelée à la fin de l’affichage progressif |

Le texte de la page est lu par les lecteurs d’écran ; la grille elle-même leur est masquée. `prefers-reduced-motion` coupe le clignotement, le scintillement et l’affichage progressif.

## Feuille de route

Les étapes sont décrites dans [ROADMAP.md](ROADMAP.md) et suivies dans les tickets du dépôt. Les valeurs techniques utilisées, et ce qui reste à vérifier, sont dans [docs/SPECS.md](docs/SPECS.md).

## Licence

[MIT](LICENSE)
