import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * NotificationProvider Component
 * Provides toast notification functionality across the application
 * Supports different notification types (success, error, warning, info)
 * Auto-dismisses notifications after a duration
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-dismiss after duration (default: 5 seconds)
    const duration = notification.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * useNotification Hook
 * Custom hook for accessing notification context
 * @returns Notification context value
 */
export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return context;
}

/**
 * ToastNotification Component
 * Displays individual toast notification with auto-dismiss functionality
 */
interface ToastNotificationProps {
  notification: Notification;
  onDismiss: () => void;
}

function ToastNotification({ notification, onDismiss }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 300); // Wait for exit animation

      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  const getBackgroundColor = (type: NotificationType): string => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getIcon = (type: NotificationType): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '●';
    }
  };

  return (
    <div
      className={`
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}
        transition-all duration-300 ease-out max-w-sm
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className={`flex items-start p-4 ${getBackgroundColor(notification.type)}`}>
          {/* Icon */}
          <div className="flex-shrink-0 mr-3">
            <span className="text-white text-lg" aria-hidden="true">
              {getIcon(notification.type)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-semibold text-white">
                {notification.title}
              </h4>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => onDismiss(), 300);
                }}
                className="text-white opacity-70 hover:opacity-100 focus:outline-none"
                aria-label="Dismiss notification"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {notification.message && (
              <p className="mt-1 text-sm text-white opacity-90">
                {notification.message}
              </p>
            )}

            {notification.action && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    notification.action.onClick();
                    setIsVisible(false);
                    setTimeout(() => onDismiss(), 300);
                  }}
                  className="w-full px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                >
                  {notification.action.label}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ToastContainer Component
 * Displays all active toast notifications in a stack
 */
export function ToastContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((notification) => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

/**
 * NotificationButton Component
 * Helper component to trigger notifications from anywhere in the app
 */
interface NotificationButtonProps {
  onClick: () => void;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

export function NotificationButton({
  onClick,
  type,
  title,
  message,
  duration,
}: NotificationButtonProps) {
  const { addNotification } = useNotification();

  return (
    <button
      onClick={() => {
        addNotification({
          type,
          title,
          message,
          duration,
        });
        onClick();
      }}
      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 20 20" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17H5a2 2 0 00-2v-4a2 2 0 012 2h10a2 2 0 012 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8a6 6 0 016 0H4a1 1 0 110-2 2 011-2H4a1 1 0 010-2v2a2 2 0 012 2h10a2 2 0 012 2z" />
      </svg>
      Trigger Notification
    </button>
  );
}

/**
 * withNotification HOC
 * Higher-order component to add notification functionality to other components
 */
export function withNotification<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const { addNotification, removeNotification } = useNotification();

    // Add notification methods to component props
    const enhancedProps = {
      ...props,
      notification: {
        add: addNotification,
        remove: removeNotification,
      },
    };

    return <Component {...(enhancedProps as any)} />;
  };

  WrappedComponent.displayName = `withNotification(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
