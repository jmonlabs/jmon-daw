import { For, Show, createSignal, onMount, createEffect } from "solid-js";

export default function NotificationSystem(props) {
  const [isVisible, setIsVisible] = createSignal(true);

  // Debug log to check if notifications are being passed
  console.log("NotificationSystem received notifications:", props.notifications);
  
  // Add reactive effect to track notifications changes
  createEffect(() => {
    const notifications = props.notifications();
    console.log("🔄 NotificationSystem: notifications changed:", notifications);
    console.log("🔄 NotificationSystem: notifications length:", notifications.length);
  });

  // Icons for different notification types
  const getIcon = (type) => {
    switch (type) {
      case 'info':
        return 'fa-solid fa-info-circle';
      case 'warning':
        return 'fa-solid fa-exclamation-triangle';
      case 'error':
        return 'fa-solid fa-times-circle';
      case 'success':
        return 'fa-solid fa-check-circle';
      case 'polyphony':
        return 'fa-solid fa-music';
      default:
        return 'fa-solid fa-bell';
    }
  };

  // Colors for different notification types
  const getColor = (type) => {
    switch (type) {
      case 'info':
        return '#2196f3';
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      case 'success':
        return '#4caf50';
      case 'polyphony':
        return '#2196f3';
      default:
        return '#2196f3';
    }
  };

  // Get background color for notifications
  const getBackgroundColor = (type) => {
    switch (type) {
      case 'info':
        return '#e3f2fd';
      case 'warning':
        return '#fff3e0';
      case 'error':
        return '#ffebee';
      case 'success':
        return '#e8f5e8';
      case 'polyphony':
        return '#f5f5f5';
      default:
        return '#f5f5f5';
    }
  };

  // Get text color for notifications
  const getTextColor = (type) => {
    switch (type) {
      case 'info':
        return '#1976d2';
      case 'warning':
        return '#f57c00';
      case 'error':
        return '#d32f2f';
      case 'success':
        return '#388e3c';
      case 'polyphony':
        return '#333333';
      default:
        return '#333333';
    }
  };

  return (
    <div
      style={`
        position: fixed;
        top: 4rem;
        right: 1rem;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 400px;
        pointer-events: none;
      `}
    >
      <For each={props.notifications()}>
        {(notification) => {
          console.log("Rendering notification:", notification);
          return (
            <div
              style={`
                background-color: ${getBackgroundColor(notification.type)};
                color: ${getTextColor(notification.type)};
                border: 1px solid ${getColor(notification.type)};
                border-radius: 6px;
                padding: 1rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                pointer-events: auto;
                animation: slideIn 0.3s ease-out;
                max-width: 400px;
                word-wrap: break-word;
              `}
            >
              {/* Icon */}
              <div
                style={`
                  flex-shrink: 0;
                  width: 20px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: ${getColor(notification.type)};
                  margin-top: 0.1rem;
                `}
              >
                <i class={getIcon(notification.type)} style="font-size: 1rem;"></i>
              </div>

              {/* Content */}
              <div style="flex: 1; min-width: 0;">
                <div 
                  style={`
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-bottom: 0.25rem;
                    color: ${getTextColor(notification.type)};
                  `}
                >
                  {notification.title}
                </div>
                <div 
                  style={`
                    font-size: 0.8rem;
                    line-height: 1.3;
                    color: ${getTextColor(notification.type)};
                    opacity: 0.9;
                  `}
                >
                  {notification.message}
                </div>

                {/* Actions */}
                <Show when={notification.actions}>
                  <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                    <For each={notification.actions}>
                      {(action) => (
                        <button
                          onClick={action.action}
                          style={`
                            padding: 0.25rem 0.75rem;
                            border: 1px solid ${getColor(notification.type)};
                            border-radius: 4px;
                            background-color: ${getColor(notification.type)};
                            color: white;
                            font-size: 0.75rem;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s ease;
                          `}
                          onMouseOver={(e) => {
                            e.target.style.opacity = '0.8';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.opacity = '1';
                          }}
                        >
                          {action.label}
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              {/* Close button */}
              <button
                onClick={() => props.removeNotification(notification.id)}
                style={`
                  flex-shrink: 0;
                  width: 20px;
                  height: 20px;
                  border: none;
                  background: none;
                  color: ${getColor(notification.type)};
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  opacity: 0.7;
                  transition: opacity 0.2s ease;
                `}
                onMouseOver={(e) => {
                  e.target.style.opacity = '1';
                }}
                onMouseOut={(e) => {
                  e.target.style.opacity = '0.7';
                }}
                title="Close notification"
              >
                <i class="fa-solid fa-times" style="font-size: 0.8rem;"></i>
              </button>
            </div>
          );
        }}
      </For>

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}
