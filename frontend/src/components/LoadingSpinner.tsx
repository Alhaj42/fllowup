import { CircularProgress, Box, Typography, Fade } from '@mui/material';

export interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'determinate';
  value?: number;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  ariaLabel?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  message = 'Loading...',
  fullScreen = false,
  variant = 'default',
  value,
  color = 'primary',
  ariaLabel = 'Loading',
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: fullScreen ? 3 : 2,
        minHeight: fullScreen ? '100vh' : 'auto',
        gap: 2,
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <CircularProgress
        size={size}
        variant={variant}
        value={value}
        color={color}
        aria-label={ariaLabel}
        aria-valuemin={variant === 'determinate' ? 0 : undefined}
        aria-valuemax={variant === 'determinate' ? 100 : undefined}
        aria-valuenow={variant === 'determinate' ? value : undefined}
      />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          component="div"
          sx={{
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        >
          {message}
          {variant === 'determinate' && value !== undefined && (
            <span aria-hidden="true"> ({Math.round(value)}%)</span>
          )}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Fade in={true} timeout={300}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 9999,
          }}
        >
          {content}
        </Box>
      </Fade>
    );
  }

  return <Fade in={true}>{content}</Fade>;
};

export default LoadingSpinner;
