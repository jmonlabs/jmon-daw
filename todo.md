- Le déplacement vertical des notes du pianoroll ne fonctionne pas: en fait, lorsque que déplace verticalement la note, la tuile reste sur la même hauteur, mais sont indicateur de pitch (e.g. C4) change, et lorsque je lâche le bouton de la souris, la note apparait au bon endroit, mais la tuile ne se déplace pas avec la souris. L'étirement des tuiles de note à droite fonctionne, mais pas à gauche. ✓ FIXED
- Nouvelle interface utilisateur avec themes One Light et One Dark (blue accents) ✓ COMPLETED
- Système de défilement vertical amélioré avec nouveaux boutons de scroll ✓ COMPLETED
- Suppression des anciennes flèches de scroll et nettoyage de l'UI ✓ COMPLETED
- Correction des problèmes d'alignement CSS et changement vers accents bleus ✓ COMPLETED
- le bouton snap devient plus gors lorsqu'il est à "on", est-ce qu'il a une bordure? STP l'enlever, ou en tout cas faire en sorte que les boutons s'allignent. Du coup, réduit la taille des boutons play et stop, de manière à uniformiser les dimensions des boutons d'entête ✓ COMPLETED
- retire la grille verticale: elle fonctionne mal et sursature le visuel ✓ COMPLETED
- Améliore la lecture, de sorte que la barre verticale avance en continu. Le clic sur la règle indique l'endroit ou déplacer le curseur soit en cours de lecture, sur pause ou sur stop. La touche HOME sur le clavier indique de déplacer le curseur au début de la lecture, et la touche FIN à la fin. ✓ COMPLETED
- le scroll horizontal est contraint à avoir toujours la barre de lecture verticale en vue. Il faut libérer cette contrainte. Également, implémente un scroll vertical (non contraignant contrairement à la barre de lecture horizontale).✓ COMPLETED
- la barre de lecture s'arrête sur pause, reprend sur play, mais une fois que pause a été activé une fois, le son ne revient pas.✓ COMPLETED
- retire la grille verticale: elle fonctionne mal et sursature le visuel,
- Le snap prévaut aussi sur la barre verticale de lecture✓ COMPLETED
- le clic droit est confiné à la track lane.✓ COMPLETED
- Après une pause, le point de redémarrage est placé à la mauvaise position.
- Assures-toi que les différentes propriétés des éléments sont bien synchronisés avec le texte du JMON dans </> ✓ COMPLETED
- Les notes devraient être étirables de part et d'autre. ✓ COMPLETED
- Assure-toi que les effets fonctionnent bien. Je ne les entends pas.
- Aménage la loop en un rectangle dans la règle, qui défini le début et la fin de la boucle. La boîte de loop peut être déplacée et redimensionnée pour définir la durée de la boucle. Elle ne doit pas superposer entièrement la règle, pour laisser de l'espace pour déplacer la barre verticale de lecture. ✓ COMPLETED
- Snap should work on dragging note handles ✓ COMPLETED
- assures-toi que le pan et le volume des tracks fonctionne bien ✓ COMPLETED
- Assure-toi que les boutons M et S dans les informations des tracks soient fonctionnels ✓ COMPLETED
- Ajoute un A au H-Zoom, qui zoome sur l'ensemble des tracks (donc la plus longue track). ✓ COMPLETED
- Le DAW devrait se souvenir de la position de la loop lorsqu'elle est désactivée, puis réactivée. ✓ COMPLETED
- Implémenter un undo, redo comme boutons avec les raccourcis clavier.
- Le déplacement vertical des notes du pianoroll ne fonctionne pas: en fait, lorsque que déplace verticalement la note, la tuile reste sur la même hauteur, mais sont indicateur de pitch (e.g. C4) change, et lorsque je lâche le bouton de la souris, la note apparait au bon endroit, mais la tuile ne se déplace pas avec la souris. L'étirement des tuiles de note à droite fonctionne, mais pas à gauche. ✓ COMPLETED
- Groupement (jumelage) des boutons M, S, delete avec bordures cohérentes ✓ COMPLETED
- Groupement (jumelage) des boutons de zoom vertical avec bordures cohérentes ✓ COMPLETED
- Groupement (jumelage) des stacks d'effets horizontaux avec déplacement (comme dans mockup.png) ✓ COMPLETED
- Amélioration du contraste des boîtes de dialogue (effets, synth, jmon, master) ✓ COMPLETED
- Pour les notes du pianoroll, vérifie la dinamique de sélection, déselection, les handles qui doivent apparaître en sélection, etc. Les déplacements fonctionnent seulement au-dessus de C3. ✓ FIXED
- Problèmes de scroll vertical dans le piano roll: notes n'apparaissent pas au bon endroit sous un certain scroll, scroll up restreint au lieu de permettre 0-127 ✓ FIXED
- Navigation difficile dans les notes: offset vertical entre note et curseur, étirement décentré lors de l'agrandissement de piste, zoom automatique dysfonctionnel ✓ FIXED
- Amélioration UX des notes: centrer le texte, handles plus apparents, curseur d'étirement prioritaire sur curseur de déplacement ✓ FIXED
- bordure à gauche de la colonne des effets (ou à droite du piano roll) ✓ COMPLETED
- titre des tracks en blanc sur fond bleu ✓ COMPLETED
- le fichier TrackPanel.jsx n'est pas utilisé et peut être supprimé ✓ CONFIRMED
- bouton + Add track dans le rectangle vide au dessus des track info, à gauche de la règle ✓ COMPLETED ✓ COMPLETED
- Boutons Mute et Solo: changer l'arrière-plan en bleu quand activés au lieu de bordure incomplète ✓ COMPLETED
- Nouvelles tracks: corriger l'initialisation du synthé pour qu'elles produisent du son ✓ COMPLETED
- Volumes: améliorer le débogage et la gestion des volumes ✓ COMPLETED

## AUDIO ENGINE FIXES
- Fixed "Unknown audio node type" error for invalid synth types ✓ COMPLETED
- Added support for MetalSynth and MembraneSynth (initially incorrectly marked as invalid) ✓ COMPLETED
- Added fallback to default Synth for truly unknown synth types to prevent null synthNode ✓ COMPLETED
- Added validation function to fix existing tracks with invalid synth types ✓ COMPLETED
- Updated synth type dropdown to include all valid Tone.js synth types ✓ COMPLETED
- Improved error handling and debug logging for synth creation ✓ COMPLETED
- Fixed "store is not defined" error in dawStore.js validation calls ✓ COMPLETED
- Changed default synth type to PolySynth for new tracks (polyphonic support) ✓ COMPLETED
- Added overlapping notes detection and warnings for monophonic synths ✓ COMPLETED
- Fixed "toFixed is not a function" error in overlap detection (proper time conversion) ✓ COMPLETED
- Nouvelles tracks: toutes les notes ne sont pas jouées (problème résolu avec PolySynth par défaut) ✓ FIXED
- Sequences "fantômes" causant des notes dupliquées/manquantes ✓ FIXED
- Implemented user-facing notification system for polyphony warnings and other notifications ✓ COMPLETED

## NOTIFICATION SYSTEM COMPLETED
- Created NotificationSystem component with modern UI and animations ✓ COMPLETED
- Integrated notification system into Layout with proper positioning ✓ COMPLETED
- Added notification types: INFO, WARNING, ERROR, SUCCESS, POLYPHONY ✓ COMPLETED
- Implemented auto-remove functionality and manual close buttons ✓ COMPLETED
- Added polyphony warning notifications with "Switch to PolySynth" action ✓ COMPLETED
- Updated audioEngine to use UI notifications instead of console only ✓ COMPLETED
- Added test notifications for new tracks and app loading ✓ COMPLETED

## REMAINING ISSUES
- retire l'item "theme" dans le menu hamburger, ajoute plutôt un bouton dark theme (<i class="fa-solid fa-moon"></i>) / light theme (<i class="fa-solid fa-sun"></i>) dans l'entête ✓ COMPLETED
- retravaille la fenêtre Master de sorte qu'elle fonctionne en stack de la même manière que les stacks d'effet des tracks. ✓ COMPLETED
- Peux-tu rendre le DAW plus "responsive" à la dimension de la page? Lorsque les éléments de l'entête commencent à se chevaucher, les placer dans le menu hamburger ✓ COMPLETED
- la barre verticale de lecture se rouve à un z-index plus élevé que la fenêtre d'édition JMON et les dialogues des effets, qui devraient être placée au-dessus. ✓ COMPLETED
- Les boutons Master et pour rétracter la colonne des effets sont trop gros: il dépassent sous leur cadre. ✓ COMPLETED

- Répare les track avec les samplers
- Réfléchis à une manière d'implémenter les Signals de Tone.js


- Lorsque j'appuie sur la touche HOME en cours de lecture, le son est réinitialisé, mais pas la barre verticale de lecture, qui continue son chemin.
- Lorsque la loop est activée, le bouton pause redémarre la musique au début de la boucle au lieu de l'endroit où elle était arrêtée.
- Améliore la rapidité du chargement.
- Effectue un grand ménage du code, pour enlever les doublons ou le code fantôme, optimiser les fonctions trop compliquées pour rien, améliorer la lisibilité et documenter les fonctions, en utilisant le meilleur de SolidJS, Bulma, Tone.js et Zustand. Fait attention pour améliorer sans briser.

