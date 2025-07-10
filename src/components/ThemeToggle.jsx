import { createSignal, onMount } from 'solid-js';

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = createSignal(false);

  // Load saved theme on mount
  onMount(() => {
    const savedTheme = localStorage.getItem('jmon-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldUseDark);
    applyTheme(shouldUseDark ? 'dark' : 'light');
  });

  const applyTheme = (themeId) => {
    const body = document.body;
    
    // Remove existing theme attributes
    body.removeAttribute('data-theme');
    
    // Apply new theme
    if (themeId === 'dark') {
      body.setAttribute('data-theme', 'dark');
    }
    
    // Save theme preference
    localStorage.setItem('jmon-theme', themeId);
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode() ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode());
    applyTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      class="btn btn-secondary"
      title={isDarkMode() ? "Switch to Light Theme" : "Switch to Dark Theme"}
    >
      <i 
        class={isDarkMode() ? "fa-solid fa-sun" : "fa-solid fa-moon"}
        style="font-size: 0.75rem;"
      ></i>
    </button>
  );
}
