// React import not required due to automatic JSX runtime
import { colors, components, spacing, typography, borderRadius, transitions } from '../../styles/design-system';

// Styled Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
  key?: string;
}

export const StyledButton: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  style,
  ...props
}) => {
  const baseStyles = components.button.base;
  const sizeStyles = components.button.sizes[size];
  const variantStyles = components.button.variants[variant];

  const buttonStyle = {
    ...baseStyles,
    ...sizeStyles,
    ...variantStyles,
    ...(disabled || isLoading ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
    ...style,
  };

  return (
    <button
      style={buttonStyle}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          Loading...
        </span>
      ) : children}
    </button>
  );
};

// Styled Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const StyledInput: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  style,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const inputStyle = {
    ...components.input.base,
    ...(error ? { borderColor: colors.error[500] } : {}),
    ...style,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.medium,
            color: colors.gray[700],
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={inputStyle}
        {...props}
      />
      {error && (
        <span style={{
          fontSize: typography.sizes.xs,
          color: colors.error[500],
        }}>
          {error}
        </span>
      )}
      {helperText && !error && (
        <span style={{
          fontSize: typography.sizes.xs,
          color: colors.gray[500],
        }}>
          {helperText}
        </span>
      )}
    </div>
  );
};

// Styled Card Component
interface CardProps {
  children?: React.ReactNode;
  hover?: boolean;
  interactive?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  key?: string;
}

export const StyledCard: React.FC<CardProps> = ({
  children,
  hover = false,
  interactive = false,
  style,
  onClick,
}) => {
  const cardStyle = {
    ...components.card.base,
    ...(interactive ? { cursor: 'pointer' } : {}),
    transition: transitions.fast,
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (hover || interactive) {
      Object.assign(e.currentTarget as HTMLElement, {
        style: { ...cardStyle, ...components.card.hover },
      });
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (hover || interactive) {
      Object.assign(e.currentTarget as HTMLElement, {
        style: cardStyle,
      });
    }
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Styled Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export const StyledModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div style={components.modal.overlay} onClick={onClose}>
      <div
        style={components.modal.content}
        onClick={(e: any) => e.stopPropagation()}
      >
        {title && (
          <div style={components.modal.header}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{
                margin: 0,
                fontSize: typography.sizes.lg,
                fontWeight: typography.weights.semibold,
                color: colors.gray[900],
              }}>
                {title}
              </h2>
              <StyledButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                style={{ padding: spacing[1] }}
                aria-label="Close modal"
              >
                ✕
              </StyledButton>
            </div>
          </div>
        )}
        <div style={components.modal.body}>
          {children}
        </div>
        {footer && (
          <div style={components.modal.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Badge Component
interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

export const StyledBadge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
}) => {
  const variants = {
    default: {
      backgroundColor: colors.gray[100],
      color: colors.gray[700],
      borderColor: colors.gray[200],
    },
    success: {
      backgroundColor: colors.success[50],
      color: colors.success[700],
      borderColor: colors.success[200],
    },
    warning: {
      backgroundColor: colors.warning[50],
      color: colors.warning[700],
      borderColor: colors.warning[200],
    },
    error: {
      backgroundColor: colors.error[50],
      color: colors.error[700],
      borderColor: colors.error[200],
    },
  };

  const sizes = {
    sm: {
      fontSize: typography.sizes.xs,
      padding: `${spacing[0.5]} ${spacing[2]}`,
    },
    md: {
      fontSize: typography.sizes.sm,
      padding: `${spacing[1]} ${spacing[2.5]}`,
    },
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    fontWeight: typography.weights.medium,
    borderWidth: '1px',
    borderStyle: 'solid',
    ...variants[variant],
    ...sizes[size],
  };

  return <span style={badgeStyle}>{children}</span>;
};

// Typography Components
interface TextProps {
  children?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  size?: keyof typeof typography.sizes;
  weight?: keyof typeof typography.weights;
  color?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLElement>;
  title?: string;
}

export const StyledText: React.FC<TextProps> = ({
  children,
  as = 'p',
  size = 'base',
  weight = 'normal',
  color = colors.gray[700],
  style,
  onClick,
  title,
}) => {
  const Component = as;
  const textStyle = {
    margin: 0,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes[size],
    fontWeight: typography.weights[weight],
    lineHeight: typography.lineHeights.normal,
    color,
    ...style,
  };

  return <Component style={textStyle} onClick={onClick} title={title}>{children}</Component>;
};

// Divider Component
export const StyledDivider: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <hr style={{
    border: 'none',
    height: '1px',
    backgroundColor: colors.gray[200],
    margin: `${spacing[4]} 0`,
    ...style,
  }} />
);

// Loading Spinner Component
export const LoadingSpinner: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = colors.primary[500],
}) => (
  <div
    style={{
      width: `${size}px`,
      height: `${size}px`,
      border: `2px solid ${color}20`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }}
  />
);

// Add CSS animations to global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
