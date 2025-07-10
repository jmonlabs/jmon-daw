# JMON DAW - Theme System Documentation

## Architecture du Système de Thème

Le système de thème est construit sur Bulma avec des extensions personnalisées pour les éléments musicaux.

### Structure des Fichiers

- `bulma-themes.css` - Système de thème principal
- `daw.scss` - Styles SCSS Bulma de base
- `THEME_SYSTEM.md` - Cette documentation

## Variables de Thème

### Variables Bulma Core
```css
--bulma-scheme-main         /* Background principal */
--bulma-scheme-main-bis     /* Background secondaire */
--bulma-scheme-main-ter     /* Background surfaces élevées */
--bulma-scheme-invert       /* Couleur de texte principale */
--bulma-primary             /* Couleur d'accent principale */
--bulma-info                /* Couleur d'information */
--bulma-warning             /* Couleur d'avertissement */
--bulma-danger              /* Couleur de danger */
--bulma-border              /* Couleur des bordures */
```

### Variables de Contraste
```css
--contrast-text             /* Texte haute visibilité (blanc pour dark) */
--contrast-text-inverse     /* Texte inversé (noir pour dark) */
--contrast-border           /* Bordure haute visibilité */
--contrast-border-inverse   /* Bordure inversée */
```

### Variables Piano Roll & Notes
```css
--note-bg                   /* Background des notes */
--note-bg-hover             /* Background des notes au survol */
--note-bg-selected          /* Background des notes sélectionnées */
--note-text                 /* Texte dans les notes */
--note-border               /* Bordure des notes */
--note-border-selected      /* Bordure des notes sélectionnées */

--track-bg                  /* Background des tracks */
--track-bg-selected         /* Background des tracks sélectionnés */
--track-bg-hover            /* Background des tracks au survol */
--track-border              /* Bordures entre les tracks */
--track-border-selected     /* Bordure des tracks sélectionnés */

--piano-key-white           /* Touches blanches du piano */
--piano-key-black           /* Touches noires du piano */
--piano-key-text            /* Texte sur les touches */
```

## Thèmes Disponibles

### 1. Ocean Sunset (par défaut)
- **Palette**: Teal et orange warm
- **Contraste**: Texte blanc sur fonds sombres
- **Usage**: Thème principal JMON

### 2. Deep Blue 
- **Palette**: Bleu professionnel
- **Contraste**: Texte clair sur fonds bleu foncé
- **Usage**: Thème corporatif/professionnel

### 3. Forest
- **Palette**: Verts naturels
- **Contraste**: Texte clair sur fonds vert foncé
- **Usage**: Thème naturel/écologique

### 4. Royal Purple
- **Palette**: Violet luxueux
- **Contraste**: Texte clair sur fonds violet foncé
- **Usage**: Thème créatif/artistique

## Comment Ajouter un Nouveau Thème

### 1. Définir les Variables de Base
```css
[data-theme="mon-theme"] {
  /* Variables Bulma Core */
  --bulma-scheme-main: #votre-couleur-principale;
  --bulma-scheme-main-bis: #votre-couleur-secondaire;
  --bulma-scheme-main-ter: #votre-couleur-surfaces;
  --bulma-scheme-invert: #votre-couleur-texte;
  
  /* Variables Bulma Colors */
  --bulma-primary: #votre-accent-principal;
  --bulma-info: #votre-couleur-info;
  --bulma-warning: #votre-couleur-warning;
  --bulma-danger: #votre-couleur-danger;
  
  /* Variables de Contraste */
  --contrast-text: #ffffff;              /* ou #000000 pour thème clair */
  --contrast-text-inverse: #000000;      /* ou #ffffff pour thème clair */
  --contrast-border: #ffffff;            /* ou #000000 pour thème clair */
  --contrast-border-inverse: #000000;    /* ou #ffffff pour thème clair */
  
  /* Variables Piano Roll & Notes - utilisent automatiquement les variables Bulma */
}
```

### 2. Ajouter le Thème dans ThemeSubmenu.jsx
```javascript
const themes = [
  // ... thèmes existants
  {
    id: 'mon-theme',
    name: 'Mon Thème',
    description: 'Description de mon thème',
    colors: ['#couleur1', '#couleur2', '#couleur3', '#couleur4']
  }
];
```

## Guidelines de Contraste

### Thèmes Sombres (Dark)
- `--contrast-text: #ffffff` (ou couleur très claire)
- `--contrast-text-inverse: couleur-du-theme-foncée`
- `--contrast-border: #ffffff` (ou couleur très claire)

### Thèmes Clairs (Light) - Futur
- `--contrast-text: #000000` (ou couleur très foncée)
- `--contrast-text-inverse: couleur-du-theme-claire`
- `--contrast-border: #000000` (ou couleur très foncée)

## Utilisation des Classes CSS

### Classes Utilitaires de Contraste
```css
.contrast-text              /* Applique --contrast-text */
.contrast-text-inverse      /* Applique --contrast-text-inverse */
.contrast-border            /* Applique --contrast-border */
.contrast-border-inverse    /* Applique --contrast-border-inverse */
```

### Classes Composants Musicaux
```css
.note                       /* Style de base des notes */
.note:hover                 /* Style des notes au survol */
.note.selected              /* Style des notes sélectionnées */
.track-lane                 /* Style des lanes de track */
.track-lane.is-selected     /* Style des tracks sélectionnés */
.piano-key-white            /* Style des touches blanches */
.piano-key-black            /* Style des touches noires */
```

## Notes Techniques

1. **Ordre d'Importation**: `daw.scss` puis `bulma-themes.css`
2. **Priorité CSS**: Les variables de `bulma-themes.css` surchargent SCSS avec `!important`
3. **Persistence**: Les thèmes sont sauvegardés dans `localStorage` avec la clé `jmon-theme`
4. **Fallback**: Le thème `default` (Ocean Sunset) est utilisé si aucun thème n'est sauvegardé

## Débogage

### Variables CSS dans DevTools
Utilisez l'inspecteur pour voir les valeurs des variables CSS :
```css
/* Dans l'inspecteur */
:root {
  --bulma-scheme-main: #274754;  /* Valeur actuelle */
}
```

### Classes Appliquées
Vérifiez que les classes correctes sont appliquées aux éléments :
- `.note` pour les notes musicales
- `.track-lane` pour les lanes de track
- `[data-theme="theme-name"]` sur le body