// Utility functions for temporal grid generation
export const generateTemporalGrid = (beatWidth, timelineWidth, timelineScroll = 0) => {
  const gridLines = [];
  
  // Calculate visible range
  const startBeat = Math.floor(-beatWidth / beatWidth) - 2;
  const endBeat = Math.ceil((timelineWidth + beatWidth) / beatWidth) + 2;
  
  // Generate quarter note grid lines (main beats)
  for (let beat = startBeat; beat <= endBeat; beat++) {
    const x = beat * beatWidth;
    
    // Skip if outside reasonable area
    if (x < -beatWidth || x > timelineWidth + beatWidth) {
      continue;
    }
    
    // Determine beat subdivision
    const beatInMeasure = beat % 4;
    
    let strokeWidth = 1;
    let opacity = 0.3;
    
    // Measure boundary (every 4 beats)
    if (beatInMeasure === 0) {
      strokeWidth = 2;
      opacity = 0.6;
    }
    // Regular quarter note
    else {
      strokeWidth = 1;
      opacity = 0.3;
    }
    
    gridLines.push({
      x,
      type: 'quarter',
      strokeWidth,
      opacity,
      beat
    });
  }
  
  // Add eighth note subdivisions
  for (let beat = startBeat; beat <= endBeat; beat++) {
    const eighthX = beat * beatWidth + (beatWidth / 2);
    
    // Skip if outside reasonable area
    if (eighthX < -beatWidth || eighthX > timelineWidth + beatWidth) {
      continue;
    }
    
    gridLines.push({
      x: eighthX,
      type: 'eighth',
      strokeWidth: 0.5,
      opacity: 0.15,
      beat: beat + 0.5
    });
  }
  
  return gridLines.sort((a, b) => a.x - b.x);
};

