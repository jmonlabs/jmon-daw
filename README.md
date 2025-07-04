# JMON DAW

Un DAW (Digital Audio Workstation) professionnel construit avec SolidJS, Tailwind CSS, Zustand et Tone.js.

## Fonctionnalités

### Interface
- 🎨 **Thème sombre** inspiré de Logic Pro X
- 📱 **Interface responsive** avec sidebars masquables
- 🎹 **Timeline** avec ruler temporelle et zoom
- 🎼 **Piano roll intégré** pour édition des notes

### Audio
- 🔊 **Synthétiseurs multiples** (Synth, PolySynth, MonoSynth, FM, AM, etc.)
- 🎛️ **Effets audio** (Reverb, Delay, Chorus, Filter, Distortion, etc.)
- ⏯️ **Transport** (Play/Pause/Stop, BPM, Loop)
- 📊 **Mixer** avec contrôles volume, mute/solo

### Format JMON
- 📝 **Éditeur JMON** en overlay avec synchronisation bidirectionnelle
- 💾 **Import/Export** de compositions JMON
- 🔄 **Synchronisation temps réel** DAW ↔ JMON

## Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Espace` | Play/Pause |
| `Shift+Enter` | Stop |
| `Cmd+L` | Toggle Loop |
| `Cmd+T` | Add Track |
| `Cmd+J` | JMON Editor |
| `Shift+Click` | Set Loop Points |
| `Right-click` | Delete Note |
| `Ctrl+Scroll` | Zoom Timeline |

## Utilisation

### Ajouter des notes
- Cliquez sur la timeline pour ajouter une note
- Faites glisser les notes pour les repositionner
- Clic droit pour supprimer une note
- Redimensionnez les tracks verticalement pour une meilleure édition

### Contrôler la lecture
- Utilisez les contrôles de transport en haut
- Définissez des points de loop avec Shift+Click
- Ajustez le BPM et activez le snap

### Gérer les effets
- Utilisez le mixer à droite pour ajouter des effets
- Chaque effet a des contrôles dédiés
- Réorganisez les effets par drag & drop

### Format JMON
- Ouvrez l'éditeur JMON pour voir/éditer le JSON
- Importez/exportez vos compositions
- Synchronisation automatique avec l'interface DAW

## Structure du projet

```
src/
├── components/     # Composants UI
│   ├── Layout.jsx
│   ├── Transport.jsx
│   ├── Timeline.jsx
│   ├── TrackEditor.jsx
│   ├── TrackPanel.jsx
│   ├── Mixer.jsx
│   ├── JmonEditor.jsx
│   └── EffectControls.jsx
├── stores/         # État Zustand
│   └── dawStore.js
├── utils/          # Utilitaires
│   ├── audioEngine.js
│   ├── keyboardHandler.js
│   └── noteConversion.js
├── data/           # Données
│   └── demoComposition.js
└── styles/         # Styles
    └── globals.css
```

## Démarrage

```bash
npm install
npm run dev
```

Le DAW sera disponible sur http://localhost:3000

## Tests automatiques

En mode développement, des tests automatiques s'exécutent dans la console :
- **Tests Store** : Vérification de la réactivité SolidJS
- **Tests Audio** : Validation de Tone.js et des synthétiseurs
- **Tests d'intégration** : Workflow complet DAW ↔ JMON

Ouvrez la console du navigateur pour voir les résultats des tests.

## Fonctionnalités avancées

- **Composition démo** chargée automatiquement
- **Gestion d'erreurs** pour l'audio
- **Snap to grid** configurable
- **Raccourcis clavier** complets
- **Interface Logic Pro X** authentique
- **Support JMON complet** selon le schéma fourni