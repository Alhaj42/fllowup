/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

/**
 * Calculate luminance of a color
 * @param hex - Hex color code (e.g., '#ffffff')
 * @returns Luminance value between 0 and 1
 */
export const getLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

/**
 * Convert hex color to RGB
 * @param hex - Hex color code
 * @returns RGB object or null if invalid
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calculate contrast ratio between two colors
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @returns Contrast ratio
 */
export const getContrastRatio = (foreground: string, background: string): number => {
  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if color contrast meets WCAG 2.1 AA standards
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @param largeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns Object with compliance status for different levels
 */
export const checkColorContrast = (
  foreground: string,
  background: string,
  largeText = false
): {
  ratio: number;
  aa: boolean;
  aaa: boolean;
  largeAa: boolean;
  largeAaa: boolean;
} => {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    largeAa: ratio >= 3,
    largeAaa: ratio >= 4.5,
  };
};

/**
 * Get accessible color (black or white) for a given background
 * @param backgroundColor - Background color (hex)
 * @returns 'black' or 'white' hex code
 */
export const getAccessibleTextColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Check if a string is a valid focusable element selector
 * @param selector - CSS selector
 * @returns Boolean indicating if selector is focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
  if (!element) return false;

  const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  const hasTabIndex = element.getAttribute('tabindex') !== null;
  const isContentEditable = element.getAttribute('contenteditable') === 'true';

  return (
    hasTabIndex ||
    isContentEditable ||
    focusableTags.includes(element.tagName)
  );
};

/**
 * Trap focus within a container (for modals, dialogs)
 * @param container - Container element
 */
export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTab);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTab);
  };
};

/**
 * Announce message to screen readers
 * @param message - Message to announce
 * @param politeness - Politeness level ('polite' or 'assertive')
 */
export const announceToScreenReader = (message: string, politeness: 'polite' | 'assertive' = 'polite'): void => {
  let announcer = document.getElementById(`a11y-announcer-${politeness}`);

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = `a11y-announcer-${politeness}`;
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', politeness);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    document.body.appendChild(announcer);
  }

  announcer.textContent = '';
  // Small delay to ensure screen readers pick up the change
  setTimeout(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  }, 100);
};

/**
 * Create a visually hidden but screen reader accessible element
 * @param text - Text content
 * @returns HTML element
 */
export const createVisuallyHiddenElement = (text: string): HTMLSpanElement => {
  const element = document.createElement('span');
  element.textContent = text;
  element.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  return element;
};

/**
 * Check if keyboard navigation is supported
 * @returns Boolean
 */
export const isKeyboardNavigationSupported = (): boolean => {
  return !('ontouchstart' in window) || !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
};

/**
 * Generate a unique ID for accessibility purposes
 * @param prefix - ID prefix
 * @returns Unique ID
 */
export const generateA11yId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if an element has visible focus (custom focus styles)
 * @param element - Element to check
 * @returns Boolean
 */
export const hasVisibleFocus = (element: HTMLElement): boolean => {
  if (!element) return false;
  return document.activeElement === element;
};

/**
 * Restore focus to previously focused element
 * @param element - Element to focus
 */
export const restoreFocus = (element: HTMLElement): void => {
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
};

/**
 * Save the currently focused element
 * @returns Element or null
 */
export const saveFocus = (): HTMLElement | null => {
  return document.activeElement as HTMLElement;
};

/**
 * Common ARIA attributes for different UI patterns
 */
export const ariaAttributes = {
  // Modal
  modal: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'modal-title',
    'aria-describedby': 'modal-description',
  },
  // Tab panel
  tabPanel: {
    role: 'tabpanel',
    'aria-labelledby': '',
  },
  // Tab
  tab: {
    role: 'tab',
    'aria-selected': 'false',
    'aria-controls': '',
    tabIndex: 0,
  },
  // Progress bar
  progressBar: {
    role: 'progressbar',
    'aria-valuenow': 0,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-label': 'Progress',
  },
  // Alert
  alert: {
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': 'true',
  },
  // Live region
  liveRegion: {
    'aria-live': 'polite',
    'aria-atomic': 'true',
  },
};

/**
 * Generate ARIA label for icon-only buttons
 * @param iconName - Name of the icon
 * @param action - Action the button performs
 * @returns ARIA label string
 */
export const generateIconLabel = (iconName: string, action: string): string => {
  return `${action} (${iconName})`;
};
