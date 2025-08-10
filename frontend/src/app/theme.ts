// Centralized design tokens for the dark UI revamp
// (Utility reference – Tailwind still generates the utility classes)
export const theme = {
  colors: {
    bg: {
      base: 'bg-gray-900',
      surface: 'bg-surface-800',
      surfaceAlt: 'bg-surface-700',
      elevated: 'bg-surface-600'
    },
    text: {
      high: 'text-gray-100',
      medium: 'text-gray-300',
      low: 'text-gray-400',
      muted: 'text-gray-500'
    },
    border: 'border-gray-700',
    focus: 'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none'
  },
  radius: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  },
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg'
  },
  transitions: {
    base: 'transition duration-200 ease-out'
  }
};

export type AppTheme = typeof theme;
