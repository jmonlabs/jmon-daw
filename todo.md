Fait
- le bouton snap devient plus gors lorsqu'il est à "on", est-ce qu'il a une bordure? STP l'enlever, ou en tout cas faire en sorte que les boutons s'allignent. Du coup, réduit la taille des boutons play et stop, de manière à uniformiser les dimensions des boutons d'entête
- Améliore la lecture, de sorte que la barre verticale avance en continu. Le clic sur la règle indique l'endroit ou déplacer le curseur soit en cours de lecture, sur pause ou sur stop. La touche HOME sur le clavier indique de déplacer le curseur au début de la lecture, et la touche FIN à la fin.
- le scroll horizontal est contraint à avoir toujours la barre de lecture verticale en vue. Il faut libérer cette contrainte. Également, implémente un scroll vertical (non contraignant contrairement à la barre de lecture horizontale).
- la barre de lecture s'arrête sur pause, reprend sur play, mais une fois que pause a été activé une fois, le son ne revient pas.
- retire la grille verticale: elle fonctionne mal et sursature le visuel,
- Le snap prévaut aussi sur la barre verticale de lecture
- le clic droit est confiné à la track lane.
- Après une pause, le point de redémarrage est placé à la mauvaise position.
- Assures-toi que les différentes propriétés des éléments sont bien synchronisés avec le texte du JMON dans </>


En cours
- Les notes devraient être étirables de part et d'autre.


À faire
- Assure-toi que les boutons M, S et X dans les informations des tracks soient fonctionnels
- Aménage la loop en un rectangle dans la règle, qui défini le début et la fin de la boucle. La boîte de loop peut être déplacée et redimensionnée pour définir la durée de la boucle. Elle ne doit pas superposer entièrement la règle, pour laisser de l'espace pour déplacer la barre verticale de lecture.
- Implémenter un undo, redo comme boutons avec les raccourcis clavier
- assures-toi que le pan et le volume des tracks fonctionne bien
- retravaille la fenêtre Master de sorte qu'elle fonctionne en stack de la même manière que les stacks d'effet des tracks
