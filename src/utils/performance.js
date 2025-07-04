// Performance optimization utilities

// Debounce function for expensive operations
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for frequent events
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// RAF-based animation helper
export function rafThrottle(func) {
  let rafId = null;
  return function(...args) {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, args);
        rafId = null;
      });
    }
  };
}

// Memory-efficient array operations
export function updateArrayItem(array, index, updates) {
  return array.map((item, i) => 
    i === index ? { ...item, ...updates } : item
  );
}

export function removeArrayItem(array, index) {
  return array.filter((_, i) => i !== index);
}

// Performance monitor (dev only)
export class PerformanceMonitor {
  constructor(name) {
    this.name = name;
    this.startTime = 0;
    this.measurements = [];
  }

  start() {
    this.startTime = performance.now();
  }

  end() {
    const duration = performance.now() - this.startTime;
    this.measurements.push(duration);
    
    if (import.meta.env.DEV && duration > 16) { // Warn if >16ms (60fps threshold)
      console.warn(`⚠️ Performance warning: ${this.name} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  getStats() {
    if (this.measurements.length === 0) return null;
    
    const avg = this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length;
    const max = Math.max(...this.measurements);
    const min = Math.min(...this.measurements);
    
    return { avg, max, min, count: this.measurements.length };
  }
}

// Global performance monitoring
export const perfMonitors = {
  timeline: new PerformanceMonitor('Timeline Render'),
  audio: new PerformanceMonitor('Audio Processing'),
  store: new PerformanceMonitor('Store Update')
};

// Auto-log performance stats in dev
if (import.meta.env.DEV) {
  setInterval(() => {
    Object.entries(perfMonitors).forEach(([name, monitor]) => {
      const stats = monitor.getStats();
      if (stats && stats.count > 10) {
        console.log(`📊 ${name} performance:`, {
          avg: `${stats.avg.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
          samples: stats.count
        });
        monitor.measurements = []; // Reset
      }
    });
  }, 10000); // Log every 10 seconds
}