// Design System - Centralized styling for the whiteboard app
// Clean, modern design with excellent UX and accessibility

export const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Neutral grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    200: '#bbf7d0',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50: '#fffbeb',
    200: '#fed7aa',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
  },
  error: {
    50: '#fef2f2',
    200: '#fecaca',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  
  // Special colors for whiteboard elements
  accent: {
    yellow: '#FDE68A',
    green: '#A7F3D0',
    purple: '#DDD6FE',
    pink: '#FBB6CE',
    orange: '#FED7AA',
    blue: '#BFDBFE',
  },
  
  // Pure colors
  white: '#ffffff',
  black: '#000000',
  
  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  'overlay-light': 'rgba(255, 255, 255, 0.9)',
};

export const typography = {
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  
  sizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  10: '2.5rem',      // 40px
  12: '3rem',        // 48px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  base: '0.25rem',   // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

// Component-specific styles
export const components = {
  button: {
    base: {
      fontFamily: typography.fonts.sans,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      lineHeight: typography.lineHeights.tight,
      borderRadius: borderRadius.md,
      transition: transitions.fast,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      outline: 'none',
      textDecoration: 'none',
      userSelect: 'none' as const,
    },
    sizes: {
      xs: { padding: `${spacing[1]} ${spacing[2]}`, fontSize: typography.sizes.xs },
      sm: { padding: `${spacing[1.5]} ${spacing[3]}`, fontSize: typography.sizes.sm },
      md: { padding: `${spacing[2.5]} ${spacing[4]}`, fontSize: typography.sizes.base },
      lg: { padding: `${spacing[3]} ${spacing[6]}`, fontSize: typography.sizes.lg },
    },
    variants: {
      primary: {
        backgroundColor: colors.primary[500],
        color: colors.white,
        boxShadow: shadows.sm,
        '&:hover': { backgroundColor: colors.primary[600] },
        '&:active': { backgroundColor: colors.primary[700] },
        '&:disabled': { backgroundColor: colors.gray[300], cursor: 'not-allowed' },
      },
      secondary: {
        backgroundColor: colors.white,
        color: colors.gray[700],
        borderWidth: '1px',
        borderStyle: 'solid' as const,
        borderColor: colors.gray[300],
        '&:hover': { backgroundColor: colors.gray[50], borderColor: colors.gray[400] },
        '&:active': { backgroundColor: colors.gray[100] },
        '&:disabled': { backgroundColor: colors.gray[100], color: colors.gray[400], cursor: 'not-allowed' },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: colors.gray[700],
        '&:hover': { backgroundColor: colors.gray[100] },
        '&:active': { backgroundColor: colors.gray[200] },
        '&:disabled': { color: colors.gray[400], cursor: 'not-allowed' },
      },
      danger: {
        backgroundColor: colors.error[500],
        color: colors.white,
        '&:hover': { backgroundColor: colors.error[600] },
        '&:active': { backgroundColor: colors.error[700] },
        '&:disabled': { backgroundColor: colors.gray[300], cursor: 'not-allowed' },
      },
    },
  },
  
  input: {
    base: {
      fontFamily: typography.fonts.sans,
      fontSize: typography.sizes.sm,
      lineHeight: typography.lineHeights.normal,
      padding: `${spacing[2.5]} ${spacing[3]}`,
      borderRadius: borderRadius.md,
      borderWidth: '1px',
      borderStyle: 'solid' as const,
      borderColor: colors.gray[300],
      backgroundColor: colors.white,
      color: colors.gray[900],
      transition: transitions.fast,
      outline: 'none',
      '&:focus': {
        borderColor: colors.primary[500],
        boxShadow: `0 0 0 3px ${colors.primary[100]}`,
      },
      '&:disabled': {
        backgroundColor: colors.gray[50],
        color: colors.gray[500],
        cursor: 'not-allowed',
      },
    },
  },
  
  card: {
    base: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      boxShadow: shadows.sm,
      borderWidth: '1px',
      borderStyle: 'solid' as const,
      borderColor: colors.gray[200],
    },
    hover: {
      boxShadow: shadows.md,
      borderColor: colors.gray[300],
    },
  },
  
  modal: {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      backgroundColor: colors.overlay,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing[4],
    },
    content: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      boxShadow: shadows.xl,
      width: '100%',
      maxWidth: '32rem',
      overflow: 'hidden',
    },
    header: {
      padding: `${spacing[4]} ${spacing[6]}`,
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid' as const,
      borderBottomColor: colors.gray[200],
    },
    body: {
      padding: spacing[6],
    },
    footer: {
      padding: `${spacing[4]} ${spacing[6]}`,
      borderTopWidth: '1px',
      borderTopStyle: 'solid' as const,
      borderTopColor: colors.gray[200],
      display: 'flex',
      justifyContent: 'flex-end',
      gap: spacing[3],
    },
  },
};

// Layout constants
export const layout = {
  sidebar: {
    width: '280px',
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[200],
  },
  toolbar: {
    height: '60px',
    backgroundColor: colors.white,
    borderColor: colors.gray[200],
  },
  canvas: {
    backgroundColor: colors.gray[50],
  },
};

// Animation presets
export const animations = {
  fadeIn: {
    animation: 'fadeIn 0.2s ease-in-out',
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
  },
  slideUp: {
    animation: 'slideUp 0.3s ease-out',
    '@keyframes slideUp': {
      from: { transform: 'translateY(10px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
  },
};

// Utility functions for consistent styling
export const utils = {
  // Hover state style
  hover: (styles: any) => ({
    ':hover': styles,
  }),

  // Focus state style
  focus: (styles: any) => ({
    ':focus': styles,
  }),

  // Disabled state style
  disabled: (styles: any) => ({
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      ...styles,
    },
  }),

  // Truncate text with ellipsis
  truncateText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  // Screen reader only text
  srOnlyText: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: 0,
  },
};

// Main design system object
const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  components,
  layout,
  animations,
  utils,
};

export default designSystem;
export { designSystem };
