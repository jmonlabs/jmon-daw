# Tests à effectuer pour le JMON DAW

## Tests de base (Interface)

### ✅ Test 1: Chargement initial
- [x] Le DAW se charge sans erreur
- [x] La composition démo est chargée automatiquement
- [x] Les 3 tracks (Piano, Bass, Pads) sont visibles
- [x] L'interface Logic Pro X est appliquée (thème sombre)

### ✅ Test 2: Navigation interface
- [x] Les sidebars se masquent/affichent avec les boutons
- [x] La timeline est zoomable (Ctrl+Scroll)
- [x] Le scroll horizontal fonctionne
- [x] Les raccourcis clavier sont affichés

## Tests Audio

### 🎵 Test 3: Lecture audio
- [ ] Le bouton Play démarre la lecture
- [ ] On entend les 3 instruments (piano, basse, pads)
- [ ] Le playhead se déplace en temps réel
- [ ] Le bouton Stop arrête et remet à zéro
- [ ] Pause met en pause et reprend

### 🎛️ Test 4: Contrôles transport
- [ ] Changement de BPM fonctionne en temps réel
- [ ] Le loop s'active/désactive correctement
- [ ] Les points de loop sont configurables (Shift+Click)
- [ ] Le snap to grid fonctionne

## Tests d'édition

### 🎹 Test 5: Édition des notes
- [ ] Clic sur timeline ajoute une note
- [ ] Drag & drop des notes fonctionne
- [ ] Clic droit supprime les notes
- [ ] Le snap respecte la grille configurée
- [ ] Le piano roll affiche les bonnes notes

### 🎚️ Test 6: Gestion des tracks
- [ ] Ajout de nouvelles tracks
- [ ] Mute/Solo fonctionne
- [ ] Suppression de tracks
- [ ] Changement de synthétiseur
- [ ] Redimensionnement vertical des tracks

## Tests JMON

### 📝 Test 7: Éditeur JMON
- [ ] L'éditeur s'ouvre avec Cmd+J
- [ ] Le JSON correspond aux tracks visibles
- [ ] Les modifications JSON se synchronisent
- [ ] Import/Export JMON fonctionne

### 🔄 Test 8: Synchronisation
- [ ] Modifications DAW → JMON
- [ ] Modifications JMON → DAW
- [ ] Les effets sont synchronisés
- [ ] Les paramètres de synthé se maintiennent

## Tests d'effets

### 🎛️ Test 9: Système d'effets
- [ ] Ajout d'effets via dropdown
- [ ] Contrôles d'effets fonctionnent
- [ ] Suppression d'effets
- [ ] Différents types d'effets (Reverb, Delay, Filter)

## Tests de performance

### ⚡ Test 10: Performance
- [ ] Pas de lag lors du drag & drop
- [ ] Timeline fluide même avec zoom
- [ ] Audio sans craquements ni latence
- [ ] Interface responsive

## Tests d'erreurs

### 🛡️ Test 11: Gestion d'erreurs
- [ ] Erreurs audio gérées gracieusement
- [ ] JSON malformé dans éditeur JMON
- [ ] Fichiers JMON corrompus
- [ ] Navigateur sans support audio

## Tests de workflow

### 🎼 Test 12: Workflow complet
- [ ] Créer un nouveau projet
- [ ] Ajouter plusieurs tracks
- [ ] Composer une mélodie simple
- [ ] Ajouter des effets
- [ ] Configurer une loop
- [ ] Exporter en JMON
- [ ] Réimporter et vérifier