**Créer un DAW professionnel avec SolidJS + Bulma + Zustand + Tone.js**

**Stack technique :**
- SolidJS + Bulma CSS + Zustand pour le state management
- Tone.js pour l'audio (pas d'upload de samples, utiliser les liens vers tonejs-instruments)
- Iconify/Lucide pour les icônes (aucun emojis)
- Architecture modulaire pour extensibilité future

**Layout & Interface (inspiré Logic Pro X) :**
- **Thème sombre** professionnel comme Logic Pro X
- **Layout principal** : une vue unique avec panneaux masquables
- **Sidebar gauche** : Infos tracks (contractable en menu vertical + bouton pour ouvrir l'éditeur JMON en overlay)
- **Centre** : Timeline + tracks étirables verticalement pour édition des notes
- **Sidebar droite** : Mixer/effets (contractable)
- **Header** : Transport, BPM, chrono, options
- Le GUI doit être compact et modulaire

**Transport & Navigation :**
- Play/pause/stop avec Tone.js
- Barre de lecture temps réel synchronisée au BPM
- Timeline ruler : mesures:temps:ticks (avec option minutes:secondes)
- Graduations fines (1/16, 1/32) par défaut
- Zoom horizontal/vertical + scrolls synchronisés
- Loop : bouton activateur + zone draggable/étirable sur timeline

**Tracks & Édition :**
- Tracks étirables verticalement pour édition inline (pas de piano roll séparé)
- Notes : rectangles draggables/étirables avec fréquence affichée (ex: C4)
- Boutons Mute/Solo/Delete par track
- Bouton "+ Add Track"
- Menu clic droit : copier/couper/coller/dupliquer/supprimer (notes, tracks, effets)

**Audio Graph & Effets :**
- Stack d'effets par track : tuiles empilables avec bouton "+"
- Tuiles déplaçables dans le stack (drag & drop)
- Menu clic droit sur tuiles : copier/coller/supprimer/dupliquer
- Support complet du schéma JMON audioGraph + connections

**JMON Integration :**
- Le format JMON est expliqué dans le fichier jmon-schema.json
- Éditeur JSON en sidebar gauche (popup overlay masquable)
- Synchronisation temps réel bidirectionnelle DAW ↔ JMON
- Respect complet du schéma jmon-schema.json fourni

**Contrôles & Options :**
- **BPM** : input sans flèches, ajuste la vitesse de lecture
- **Chronomètre** : temps + mesure courante
- **Snap** : on/off + menu dropdown (1/32 à 1 ou par bonds de 1/3, etc., dépendamment de la signature temporelle du JMON)
- **Menu hamburger** (droite) : Import JMON/MIDI, Export JMON/MIDI/WAV

**Raccourcis clavier :**
- Espace : play/pause (sauf si éditeur JMON actif)
- Flèches : déplacer notes/loop (sauf si éditeur JMON actif)
- Gestion intelligente du focus pour éviter conflits

**Samples & Synthés :**
- Intégration des samples via liens (tonejs-instruments GitHub)
- Support complet des synthés Tone.js du schéma
- Pas d'upload de fichiers

**Architecture :**
- **Modulaire** : composants séparés pour tracks, effets, transport, etc.
- **Extensible** : structure permettant d'ajouter facilités nouvelles fonctionnalités
- **État centralisé** : Zustand pour gérer state DAW + JMON
- **Target** : intégration future dans ObservableHQ/Jupyter/Marimo

**Priorités :**
1. Interface desktop responsive
2. Synchronisation JMON parfaite
3. Performance audio temps réel
4. UX intuitive type DAW professionnel

Commence par la structure de base et les composants principaux, puis implémente progressivement les fonctionnalités avancées.

**Process & Qualité :**
* Effectue des tests par toi-même pour t'assurer que le DAW s'affiche et fonctionne tel que demandé
* Itère par toi-même pour corriger les erreurs et optimiser l'interface
* Le travail peut durer quelques heures - prends le temps nécessaire
* Teste spécifiquement :
  - Synchronisation JMON ↔ DAW en temps réel
  - Lecture audio avec Tone.js (play/pause/stop)
  - Drag & drop des notes et resize
  - Fonctionnement des raccourcis clavier
  - Responsive design et panneaux masquables
  - Import/export JMON valide selon le schéma
* Documente les problèmes rencontrés et leurs solutions
* Propose des améliorations UX si tu en identifies
