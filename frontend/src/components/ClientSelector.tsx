import { useState, useEffect, useCallback } from 'react';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';

export interface Client {
  id: string;
  name: string;
}

interface ClientSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  value = '',
  onChange,
  label = 'Client',
  error,
  disabled = false,
  required = true,
}) => {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/v1/clients');
        const data = await response.json();
        setClients(data.clients || []);
      } catch (err) {
        console.error('Failed to load clients:', err);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const handleChange = useCallback((_event: React.SyntheticEvent, newValue: string | null) => {
    if (newValue) {
      onChange(newValue);
    }
  }, [onChange]);

  const clientOptions = clients.map(client => client.name);

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete
        value={value}
        onChange={handleChange}
        options={clientOptions}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={!!error}
            helperText={error}
            required={required}
            disabled={disabled}
            InputProps={{
              ...params.InputProps,
              startAdornment: loading && (
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Loading...
                </Typography>
              ),
            }}
          />
        )}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        disabled={disabled}
        loading={loading}
        noOptionsText="No clients found"
        clearOnBlur
      />
    </Box>
  );
};

export default ClientSelector;
