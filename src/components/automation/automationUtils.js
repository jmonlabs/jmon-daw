// Mathematical conversion functions for automation timeline

/**
 * Convert time to X pixel position
 * @param {number} time - Time value
 * @param {number} beatWidth - Width of one beat in pixels
 * @returns {number} X position in pixels
 */
export const timeToX = (time, beatWidth = 80) => {
  return time * beatWidth * 4;
};

/**
 * Convert X pixel position to time
 * @param {number} x - X position in pixels
 * @param {number} beatWidth - Width of one beat in pixels
 * @returns {number} Time value
 */
export const xToTime = (x, beatWidth = 80) => {
  return x / (beatWidth * 4);
};

/**
 * Convert automation value to Y pixel position
 * @param {number} value - Automation value
 * @param {Array} range - [min, max] range of the automation parameter
 * @param {number} height - Height of the timeline in pixels
 * @returns {number} Y position in pixels
 */
export const valueToY = (value, range, height = 60) => {
  const [min, max] = range;
  const normalized = (value - min) / (max - min);
  const padding = height * 0.1; // 10% padding
  return height - padding - (normalized * (height - 2 * padding));
};

/**
 * Convert Y pixel position to automation value
 * @param {number} y - Y position in pixels
 * @param {Array} range - [min, max] range of the automation parameter
 * @param {number} height - Height of the timeline in pixels
 * @returns {number} Automation value
 */
export const yToValue = (y, range, height = 60) => {
  const [min, max] = range;
  const padding = height * 0.1; // 10% padding
  const normalized = (height - padding - y) / (height - 2 * padding);
  return Math.round(min + (normalized * (max - min)));
};

/**
 * Generate smooth spline path between automation points
 * @param {Array} points - Array of {time, value} points
 * @param {Array} range - [min, max] range of the automation parameter
 * @param {number} beatWidth - Width of one beat in pixels
 * @param {number} height - Height of the timeline in pixels
 * @returns {string} SVG path string
 */
export const generateSplinePath = (points, range, beatWidth = 80, height = 60) => {
  if (points.length < 2) return '';
  
  const sortedPoints = [...points].sort((a, b) => a.time - b.time);
  let path = '';
  
  for (let i = 0; i < sortedPoints.length; i++) {
    const point = sortedPoints[i];
    const x = timeToX(point.time, beatWidth);
    const y = valueToY(point.value, range, height);
    
    if (i === 0) {
      path += `M ${x} ${y}`;
    } else {
      const prevPoint = sortedPoints[i - 1];
      const prevX = timeToX(prevPoint.time, beatWidth);
      const prevY = valueToY(prevPoint.value, range, height);
      
      // Simple cubic bezier for smooth curves
      const cp1x = prevX + (x - prevX) * 0.3;
      const cp1y = prevY;
      const cp2x = x - (x - prevX) * 0.3;
      const cp2y = y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    }
  }
  
  return path;
};

/**
 * Clamp a value to a given range
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Check if a point is near another point (for drag detection)
 * @param {number} x1 - X coordinate of first point
 * @param {number} y1 - Y coordinate of first point
 * @param {number} x2 - X coordinate of second point
 * @param {number} y2 - Y coordinate of second point
 * @param {number} threshold - Distance threshold in pixels
 * @returns {boolean} True if points are within threshold distance
 */
export const isPointNear = (x1, y1, x2, y2, threshold = 10) => {
  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  return distance <= threshold;
};

/**
 * Find the nearest automation point to a given coordinate
 * @param {Array} points - Array of automation points
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Array} range - [min, max] range of the automation parameter
 * @param {number} beatWidth - Width of one beat in pixels
 * @param {number} height - Height of the timeline in pixels
 * @returns {Object|null} {index, distance} or null if no point found
 */
export const findNearestPoint = (points, x, y, range, beatWidth = 80, height = 60) => {
  let nearestIndex = -1;
  let nearestDistance = Infinity;
  
  points.forEach((point, index) => {
    const pointX = timeToX(point.time, beatWidth);
    const pointY = valueToY(point.value, range, height);
    const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
    
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  
  return nearestIndex >= 0 ? { index: nearestIndex, distance: nearestDistance } : null;
};

/**
 * Get interpolated automation value at a specific time using spline interpolation
 * @param {Array} points - Array of {time, value} points (must be sorted by time)
 * @param {number} time - Time to get value for
 * @param {Array} range - [min, max] range of the automation parameter
 * @returns {number} Interpolated value
 */
export const getAutomationValueAtTime = (points, time, range) => {
  if (!points || points.length === 0) return (range[1] - range[0]) / 2 + range[0]; // Default to middle value
  if (points.length === 1) return points[0].value;
  
  // Sort points by time
  const sortedPoints = [...points].sort((a, b) => a.time - b.time);
  
  // If time is before first point, return first point value
  if (time <= sortedPoints[0].time) return sortedPoints[0].value;
  
  // If time is after last point, return last point value
  const lastPoint = sortedPoints[sortedPoints.length - 1];
  if (time >= lastPoint.time) return lastPoint.value;
  
  // Find the two points to interpolate between
  let leftIndex = 0;
  let rightIndex = 1;
  
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    if (time >= sortedPoints[i].time && time <= sortedPoints[i + 1].time) {
      leftIndex = i;
      rightIndex = i + 1;
      break;
    }
  }
  
  const leftPoint = sortedPoints[leftIndex];
  const rightPoint = sortedPoints[rightIndex];
  
  // Calculate interpolation factor (0 to 1)
  const timeDiff = rightPoint.time - leftPoint.time;
  const factor = timeDiff === 0 ? 0 : (time - leftPoint.time) / timeDiff;
  
  // Use cubic interpolation for smooth curves (Hermite interpolation)
  const leftValue = leftPoint.value;
  const rightValue = rightPoint.value;
  
  // Get tangent values (slope) for smooth curves
  const leftTangent = leftIndex === 0 ? 0 : 
    (rightPoint.value - sortedPoints[Math.max(0, leftIndex - 1)].value) / 
    (rightPoint.time - sortedPoints[Math.max(0, leftIndex - 1)].time);
    
  const rightTangent = rightIndex === sortedPoints.length - 1 ? 0 :
    (sortedPoints[Math.min(sortedPoints.length - 1, rightIndex + 1)].value - leftPoint.value) /
    (sortedPoints[Math.min(sortedPoints.length - 1, rightIndex + 1)].time - leftPoint.time);
  
  // Hermite interpolation
  const factor2 = factor * factor;
  const factor3 = factor2 * factor;
  
  const h1 = 2 * factor3 - 3 * factor2 + 1;
  const h2 = -2 * factor3 + 3 * factor2;
  const h3 = factor3 - 2 * factor2 + factor;
  const h4 = factor3 - factor2;
  
  const interpolatedValue = h1 * leftValue + h2 * rightValue + 
                           h3 * leftTangent * timeDiff + h4 * rightTangent * timeDiff;
  
  // Clamp to range
  return clamp(interpolatedValue, range[0], range[1]);
};

/**
 * Generate automation events for Tone.js scheduling
 * @param {Array} points - Array of automation points
 * @param {Array} range - [min, max] range of the automation parameter
 * @param {number} startTime - Start time in transport time
 * @param {number} duration - Duration to generate events for
 * @param {number} resolution - Time resolution for interpolation (smaller = smoother)
 * @returns {Array} Array of {time, value} events for scheduling
 */
export const generateAutomationEvents = (points, range, startTime = 0, duration = 16, resolution = 0.1) => {
  if (!points || points.length === 0) return [];
  
  const events = [];
  const endTime = startTime + duration;
  
  // Generate events at regular intervals for smooth interpolation
  for (let time = startTime; time <= endTime; time += resolution) {
    const value = getAutomationValueAtTime(points, time, range);
    events.push({ time, value });
  }
  
  // Always include the exact automation points for precision
  points.forEach(point => {
    if (point.time >= startTime && point.time <= endTime) {
      // Remove any existing event at this exact time and replace it
      const existingIndex = events.findIndex(event => Math.abs(event.time - point.time) < resolution / 2);
      if (existingIndex >= 0) {
        events[existingIndex] = { time: point.time, value: point.value };
      } else {
        events.push({ time: point.time, value: point.value });
      }
    }
  });
  
  // Sort by time
  return events.sort((a, b) => a.time - b.time);
};