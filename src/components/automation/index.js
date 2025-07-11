// Automation Components Barrel Export
export { default as AutomationHeader } from './AutomationHeader';
export { default as AutomationChannel } from './AutomationChannel';
export { default as AutomationTimeline } from './AutomationTimeline';

// Configuration and utilities
export { modulationTypes, AUTOMATION_CONSTANTS, createDefaultChannel } from './automationConfig';
export { 
  timeToX, 
  xToTime, 
  valueToY, 
  yToValue, 
  generateSplinePath, 
  clamp, 
  isPointNear, 
  findNearestPoint,
  getAutomationValueAtTime,
  generateAutomationEvents
} from './automationUtils';

// Automation-to-Tone.js integration
export {
  AUTOMATION_PARAMETER_MAP,
  applyAutomationToToneNode,
  applyAutomationToMultipleNodes,
  getAutomationTargets,
  createAutomationSchedule
} from './automationMapping';