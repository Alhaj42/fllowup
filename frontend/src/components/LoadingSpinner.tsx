import { CircularProgress, Box, Typography } from '@mui/material';

const LoadingSpinner = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
      Loading...
    </Typography>
  </Box>
);

export default LoadingSpinner;
