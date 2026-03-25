// Design System — Professional, neutral, elegant

export const colors = {
  // Indigo accent (replacing pastel blue)
  primary: {
    50:  '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // main accent
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Neutral grays (zinc-based — slightly cooler than warm gray)
  gray: {
    50:  '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },

  // Semantic
  success: {
    50:  '#F0FDF4',
    200: '#BBF7D0',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  warning: {
    50:  '#FFFBEB',
    200: '#FDE68A',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
  },
  error: {
    50:  '#FFF1F2',
    200: '#FECDD3',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
  },

  // Sticky note accent tones — warmer, slightly richer than pastels
  accent: {
    yellow: '#FEF3C7',
    green:  '#DCFCE7',
    pink:   '#FCE7F3',
    blue:   '#DBEAFE',
    purple: '#EDE9FE',
    orange: '#FFEDD5',
  },

  white:   '#FFFFFF',
  black:   '#000000',
  overlay: 'rgba(0, 0, 0, 0.55)',
};

export const typography = {
  fonts: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
  },
  sizes: {
    xs:   '0.6875rem', // 11px
    sm:   '0.8125rem', // 13px
    base: '0.9375rem', // 15px
    lg:   '1.0625rem', // 17px
    xl:   '1.25rem',
    '2xl':'1.5rem',
    '3xl':'1.875rem',
    '4xl':'2.25rem',
  },
  weights: {
    normal:  400,
    medium:  500,
    semibold:600,
    bold:    700,
  },
  lineHeights: {
    tight:  1.25,
    normal: 1.5,
    relaxed:1.625,
  },
};

export const spacing = {
  px:  '1px',
  0:   '0',
  0.5: '0.125rem',
  1:   '0.25rem',
  1.5: '0.375rem',
  2:   '0.5rem',
  2.5: '0.625rem',
  3:   '0.75rem',
  3.5: '0.875rem',
  4:   '1rem',
  5:   '1.25rem',
  6:   '1.5rem',
  7:   '1.75rem',
  8:   '2rem',
  10:  '2.5rem',
  12:  '3rem',
  16:  '4rem',
  20:  '5rem',
};

export const borderRadius = {
  none: '0',
  sm:   '3px',
  base: '4px',
  md:   '6px',
  lg:   '8px',
  xl:   '12px',
  '2xl':'16px',
  full: '9999px',
};

export const shadows = {
  sm:    '0 1px 2px rgba(0,0,0,0.06)',
  base:  '0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)',
  md:    '0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)',
  lg:    '0 8px 24px rgba(0,0,0,0.10)',
  xl:    '0 20px 40px rgba(0,0,0,0.12)',
  inner: 'inset 0 1px 3px rgba(0,0,0,0.08)',
  none:  'none',
};

export const transitions = {
  fast:   '120ms ease',
  normal: '200ms ease',
  slow:   '300ms ease',
};

// Component-specific styles
export const components = {
  button: {
    base: {
      fontFamily:    typography.fonts.sans,
      fontSize:      typography.sizes.sm,
      fontWeight:    typography.weights.medium,
      lineHeight:    1,
      borderRadius:  borderRadius.md,
      transition:    transitions.fast,
      cursor:        'pointer',
      display:       'inline-flex',
      alignItems:    'center',
      justifyContent:'center',
      gap:           '6px',
      border:        'none',
      outline:       'none',
      textDecoration:'none',
      userSelect:    'none' as const,
      whiteSpace:    'nowrap' as const,
    },
    sizes: {
      xs: { padding: `${spacing[1]}   ${spacing[2]}`,   fontSize: typography.sizes.xs  },
      sm: { padding: `${spacing[1.5]} ${spacing[3]}`,   fontSize: typography.sizes.sm  },
      md: { padding: `${spacing[2]}   ${spacing[4]}`,   fontSize: typography.sizes.base },
      lg: { padding: `${spacing[2.5]} ${spacing[5]}`,   fontSize: typography.sizes.lg  },
      icon: { padding: spacing[1.5], aspectRatio: '1' },
    },
    variants: {
      primary: {
        backgroundColor: colors.gray[900],
        color:           colors.white,
      },
      secondary: {
        backgroundColor: colors.white,
        color:           colors.gray[700],
        borderWidth:    '1px',
        borderStyle:    'solid' as const,
        borderColor:    colors.gray[200],
      },
      ghost: {
        backgroundColor: 'transparent',
        color:           colors.gray[600],
      },
      danger: {
        backgroundColor: colors.error[600],
        color:           colors.white,
      },
      active: {
        backgroundColor: colors.gray[900],
        color:           colors.white,
      },
    },
  },

  input: {
    base: {
      fontFamily:   typography.fonts.sans,
      fontSize:     typography.sizes.sm,
      lineHeight:   typography.lineHeights.normal,
      padding:      `${spacing[2]} ${spacing[3]}`,
      borderRadius: borderRadius.md,
      borderWidth:  '1px',
      borderStyle:  'solid' as const,
      borderColor:  colors.gray[200],
      backgroundColor: colors.white,
      color:        colors.gray[900],
      transition:   transitions.fast,
      outline:      'none',
      width:        '100%',
    },
  },

  card: {
    base: {
      backgroundColor: colors.white,
      borderRadius:    borderRadius.lg,
      boxShadow:       shadows.sm,
      borderWidth:     '1px',
      borderStyle:     'solid' as const,
      borderColor:     colors.gray[200],
    },
    hover: {
      boxShadow:  shadows.md,
      borderColor:colors.gray[300],
    },
  },

  modal: {
    overlay: {
      position:       'fixed' as const,
      inset:          0,
      backgroundColor:colors.overlay,
      zIndex:         50,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        spacing[4],
    },
    content: {
      backgroundColor: colors.white,
      borderRadius:    borderRadius.xl,
      boxShadow:       shadows.xl,
      width:           '100%',
      maxWidth:        '28rem',
      overflow:        'hidden',
    },
    header: {
      padding:           `${spacing[4]} ${spacing[5]}`,
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid' as const,
      borderBottomColor: colors.gray[100],
    },
    body: {
      padding: spacing[5],
    },
    footer: {
      padding:         `${spacing[3]} ${spacing[5]}`,
      borderTopWidth:  '1px',
      borderTopStyle:  'solid' as const,
      borderTopColor:  colors.gray[100],
      display:         'flex',
      justifyContent:  'flex-end',
      gap:             spacing[2],
    },
  },
};

// Layout
export const layout = {
  sidebar: {
    width:           '220px',
    backgroundColor: colors.gray[900],  // dark sidebar
    borderColor:     colors.gray[800],
    textColor:       colors.gray[50],
    textSecondary:   colors.gray[400],
    hoverColor:      colors.gray[800],
    activeColor:     colors.gray[700],
  },
  toolbar: {
    height:          '52px',
    backgroundColor: colors.white,
    borderColor:     colors.gray[200],
  },
  canvas: {
    backgroundColor: colors.gray[100],
  },
};

// Convenience re-export for backward compat
export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
};
