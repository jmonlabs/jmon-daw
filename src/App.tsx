import { Component, onMount } from 'solid-js';
import { DAWProvider, useTransport } from './stores/context';
import { MainLayout } from './components/MainLayout';
import './App.css';

const App: Component = () => {
  onMount(() => {
    // Prevent accidental navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your work may be lost.';
      return e.returnValue;
    };

    // Prevent back button navigation
    const handlePopState = (e: PopStateEvent) => {
      if (confirm('Are you sure you want to leave? Your work may be lost.')) {
        return true;
      } else {
        window.history.pushState(null, '', window.location.href);
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Push initial state to enable back button prevention
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  });

  return (
    <DAWProvider>
      <div class="app">
        <MainLayout />
      </div>
    </DAWProvider>
  );
};

export default App;