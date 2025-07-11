// Automation Types Configuration - Clean blue theme
export const modulationTypes = [
  { id: 'velocity', name: 'Velocity', range: [0, 127], color: '#007bff', defaultValue: 64 },
  { id: 'pitchBend', name: 'Pitch Bend', range: [-8192, 8191], color: '#0056b3', defaultValue: 0 },
  { id: 'modulation', name: 'Modulation (CC1)', range: [0, 127], color: '#6610f2', defaultValue: 0 },
  { id: 'expression', name: 'Expression (CC11)', range: [0, 127], color: '#0d6efd', defaultValue: 127 },
  { id: 'sustain', name: 'Sustain (CC64)', range: [0, 127], color: '#198754', defaultValue: 0 },
  { id: 'filterCutoff', name: 'Filter Cutoff (CC74)', range: [0, 127], color: '#20c997', defaultValue: 64 },
  { id: 'customCC', name: 'Custom CC', range: [0, 127], color: '#6c757d', defaultValue: 0 }
];

// Automation Constants - Updated for clean design
export const AUTOMATION_CONSTANTS = {
  CHANNEL_HEIGHT: 80,
  HEADER_WIDTH: 120,
  MIN_POINTS: 2,
  MAX_CHANNELS: 8,
  CONTROL_POINT_RADIUS: 4,
  CONTROL_POINT_HOVER_RADIUS: 5,
  CURVE_STROKE_WIDTH: 2,
  GRID_STROKE_WIDTH: 1,
  TIMELINE_PADDING: 10
};

// Default automation channel structure
export const createDefaultChannel = (typeConfig) => ({
  type: typeConfig.id,
  name: typeConfig.name,
  range: typeConfig.range,
  color: typeConfig.color,
  points: [
    { time: 0, value: typeConfig.defaultValue },
    { time: 16, value: typeConfig.defaultValue }
  ]
});