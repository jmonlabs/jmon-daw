import { render } from "solid-js/web";
import Layout from "./components/Layout";
import "bulma/css/bulma.min.css";
import "./styles/daw.scss";
import "./styles/themes.css";

// Load saved theme on app startup
const loadSavedTheme = () => {
  // Clear any old saved themes and start fresh with light theme
  localStorage.removeItem("jmon-theme");
  const body = document.body;

  // Remove existing theme attributes
  body.removeAttribute("data-theme");

  // Start with light theme (default) - no data-theme attribute needed
  // Dark theme would use data-theme="dark"
};

// Load theme immediately
loadSavedTheme();

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

render(() => <Layout />, root);
