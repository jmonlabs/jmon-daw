/**
 * Utilitaires pour la gestion du layout et du positionnement des tracks
 * 
 * Ce fichier centralise TOUTE la logique de positionnement des tracks
 * pour assurer une cohérence parfaite entre toutes les colonnes.
 */

// Constantes de layout - POINT UNIQUE DE VÉRITÉ
export const TRACK_LAYOUT_CONSTANTS = {
  // Hauteur minimale d'une track en pixels
  MIN_HEIGHT: 80,
  
  // Hauteur du ruler en pixels (espace réservé en haut)
  RULER_HEIGHT: 40,
  
  // Hauteur par défaut d'une nouvelle track
  DEFAULT_HEIGHT: 80,
  
  // Hauteur maximale d'une track
  MAX_HEIGHT: 300
};

/**
 * Calcule la position et les dimensions d'une track spécifique
 * 
 * @param {Array} tracks - Tableau des tracks du store
 * @param {number} trackIndex - Index de la track dont on veut la position
 * @returns {Object} { top: number, height: number }
 */
export function getTrackPosition(tracks, trackIndex) {
  // Validation des paramètres
  if (!Array.isArray(tracks)) {
    console.warn('getTrackPosition: tracks should be an array', tracks);
    return { top: TRACK_LAYOUT_CONSTANTS.RULER_HEIGHT, height: TRACK_LAYOUT_CONSTANTS.DEFAULT_HEIGHT };
  }
  
  if (trackIndex < 0 || trackIndex >= tracks.length) {
    console.warn('getTrackPosition: trackIndex out of bounds', { trackIndex, tracksLength: tracks.length });
    return { top: TRACK_LAYOUT_CONSTANTS.RULER_HEIGHT, height: TRACK_LAYOUT_CONSTANTS.DEFAULT_HEIGHT };
  }
  
  // Calcul de la position
  let topPosition = TRACK_LAYOUT_CONSTANTS.RULER_HEIGHT;
  
  // Accumulation des hauteurs des tracks précédentes
  for (let i = 0; i < trackIndex; i++) {
    const prevTrack = tracks[i];
    const prevTrackHeight = Math.max(
      TRACK_LAYOUT_CONSTANTS.MIN_HEIGHT, 
      prevTrack?.height || TRACK_LAYOUT_CONSTANTS.DEFAULT_HEIGHT
    );
    topPosition += prevTrackHeight;
  }
  
  // Calcul de la hauteur de la track courante
  const currentTrack = tracks[trackIndex];
  const trackHeight = Math.max(
    TRACK_LAYOUT_CONSTANTS.MIN_HEIGHT,
    Math.min(
      TRACK_LAYOUT_CONSTANTS.MAX_HEIGHT,
      currentTrack?.height || TRACK_LAYOUT_CONSTANTS.DEFAULT_HEIGHT
    )
  );
  
  return {
    top: topPosition,
    height: trackHeight
  };
}

/**
 * Calcule la hauteur totale nécessaire pour afficher toutes les tracks
 * 
 * @param {Array} tracks - Tableau des tracks du store
 * @returns {number} Hauteur totale en pixels
 */
export function getTotalTracksHeight(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return TRACK_LAYOUT_CONSTANTS.RULER_HEIGHT;
  }
  
  let totalHeight = TRACK_LAYOUT_CONSTANTS.RULER_HEIGHT;
  
  tracks.forEach(track => {
    const trackHeight = Math.max(
      TRACK_LAYOUT_CONSTANTS.MIN_HEIGHT,
      track?.height || TRACK_LAYOUT_CONSTANTS.DEFAULT_HEIGHT
    );
    totalHeight += trackHeight;
  });
  
  return totalHeight;
}

/**
 * Valide et normalise la hauteur d'une track
 * 
 * @param {number} height - Hauteur proposée
 * @returns {number} Hauteur validée et normalisée
 */
export function validateTrackHeight(height) {
  const numHeight = Number(height);
  
  if (isNaN(numHeight)) {
    return TRACK_LAYOUT_CONSTANTS.DEFAULT_HEIGHT;
  }
  
  return Math.max(
    TRACK_LAYOUT_CONSTANTS.MIN_HEIGHT,
    Math.min(TRACK_LAYOUT_CONSTANTS.MAX_HEIGHT, numHeight)
  );
}

/**
 * Debug: affiche les informations de positionnement
 * Utile pour le développement et le debug
 * 
 * @param {Array} tracks - Tableau des tracks
 * @param {string} context - Contexte d'appel (ex: "Timeline", "Layout")
 */
export function debugTrackPositions(tracks, context = 'Unknown') {
  console.group(`🔍 Track Positions Debug - ${context}`);
  console.log('Tracks count:', tracks?.length || 0);
  console.log('Constants:', TRACK_LAYOUT_CONSTANTS);
  
  if (Array.isArray(tracks)) {
    tracks.forEach((track, index) => {
      const position = getTrackPosition(tracks, index);
      console.log(`Track ${index}:`, {
        name: track?.name || 'Unnamed',
        requestedHeight: track?.height,
        calculatedHeight: position.height,
        top: position.top,
        track
      });
    });
  }
  
  console.log('Total height:', getTotalTracksHeight(tracks));
  console.groupEnd();
}