import { createSignal, onMount } from 'solid-js';

const themes = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean light theme inspired by One Light',
    colors: ['#fafafa', '#4078f2', '#e45649', '#50a14f', '#c18401']
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Modern dark theme inspired by One Dark',
    colors: ['#282c34', '#61afef', '#e06c75', '#98c379', '#e5c07b']
  }
];

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = createSignal('light');
  const [isOpen, setIsOpen] = createSignal(false);

  // Load saved theme on mount
  onMount(() => {
    // Clear any old saved themes and start fresh
    localStorage.removeItem('jmon-theme');
    const defaultTheme = 'light';
    applyTheme(defaultTheme);
    setCurrentTheme(defaultTheme);
  });

  const applyTheme = (themeId) => {
    const body = document.body;
    
    // Remove existing theme attributes
    body.removeAttribute('data-theme');
    
    // Apply new theme
    if (themeId === 'dark') {
      body.setAttribute('data-theme', 'dark');
    }
    // Light theme uses the default root CSS variables
    
    // Don't save themes - let them reset on page reload
  };

  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    setIsOpen(false);
  };

  const getCurrentThemeInfo = () => {
    return themes.find(theme => theme.id === currentTheme()) || themes[0];
  };

  return (
    <div class="theme-selector" style="position: relative;">
      <button
        onClick={() => setIsOpen(!isOpen())}
        class="button is-small app-menu-button"
        title="Change Theme"
      >
        <span class="icon is-small">
          <i class="fas fa-palette"></i>
        </span>
        <span class="is-hidden-mobile">{getCurrentThemeInfo().name}</span>
      </button>

      {isOpen() && (
        <>
          {/* Backdrop */}
          <div
            style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 100;"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Theme selector dropdown */}
          <div
            class="theme-dropdown"
            style={`
              position: absolute;
              top: 100%;
              right: 0;
              margin-top: 0.5rem;
              background-color: var(--elevated-bg);
              border: 1px solid var(--border-color);
              border-radius: var(--radius-md);
              box-shadow: var(--shadow-lg);
              padding: 1rem;
              min-width: 280px;
              z-index: 101;
            `}
          >
            <h4 
              style="color: var(--text-primary); font-weight: 600; font-size: 0.875rem; margin-bottom: 1rem;"
            >
              <i class="fas fa-palette" style="margin-right: 0.5rem; color: var(--primary-accent);"></i>
              Choose Theme
            </h4>
            
            <div class="theme-grid" style="display: grid; gap: 0.5rem;">
              {themes.map(theme => (
                <div
                  class={`theme-option ${currentTheme() === theme.id ? 'selected' : ''}`}
                  style={`
                    padding: 0.75rem;
                    border: 2px solid ${currentTheme() === theme.id ? 'var(--primary-accent)' : 'var(--border-color)'};
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    background-color: ${currentTheme() === theme.id ? 'var(--hover-overlay)' : 'transparent'};
                  `}
                  onClick={() => handleThemeChange(theme.id)}
                  onMouseEnter={(e) => {
                    if (currentTheme() !== theme.id) {
                      e.target.style.borderColor = 'var(--secondary-accent)';
                      e.target.style.backgroundColor = 'var(--hover-overlay)';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentTheme() !== theme.id) {
                      e.target.style.borderColor = 'var(--border-color)';
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div class="theme-colors" style="display: flex; gap: 0.25rem;">
                      {theme.colors.slice(0, 5).map(color => (
                        <div
                          style={`
                            width: 14px;
                            height: 14px;
                            border-radius: 50%;
                            background-color: ${color};
                            border: 2px solid var(--border-color);
                            box-shadow: var(--shadow-sm);
                          `}
                        />
                      ))}
                    </div>
                    
                    <div style="flex: 1;">
                      <div 
                        style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem;"
                      >
                        {theme.name}
                        {currentTheme() === theme.id && (
                          <span style="color: var(--primary-accent); margin-left: 0.5rem;">
                            <i class="fas fa-check"></i>
                          </span>
                        )}
                      </div>
                      <div 
                        style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.125rem;"
                      >
                        {theme.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div 
              style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.7rem; text-align: center;"
            >
              <i class="fas fa-info-circle" style="margin-right: 0.25rem;"></i>
              Theme resets on page reload
            </div>
          </div>
        </>
      )}
    </div>
  );
}