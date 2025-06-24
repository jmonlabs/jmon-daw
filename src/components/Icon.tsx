import { Component, onMount } from 'solid-js';
import 'iconify-icon';

// Declare the iconify-icon custom element for TypeScript
declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': {
        icon?: string;
        width?: number | string;
        height?: number | string;
        style?: string;
        class?: string;
        ref?: any;
      };
    }
  }
}

interface IconProps {
  name: string;
  size?: number | string;
  color?: string;
  class?: string;
}

export const Icon: Component<IconProps> = (props) => {
  let iconRef: HTMLElement | undefined;

  onMount(() => {
    // Ensure iconify-icon is loaded - static import above should handle this
    // No dynamic loading needed
  });

  return (
    <iconify-icon
      ref={iconRef}
      icon={`lucide:${props.name}`}
      width={props.size || 16}
      height={props.size || 16}
      style={props.color ? `color: ${props.color}` : undefined}
      class={props.class}
    />
  );
};

// CSS for better icon alignment
const style = document.createElement('style');
style.textContent = `
iconify-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
`;
document.head.appendChild(style);