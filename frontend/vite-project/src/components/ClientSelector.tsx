import { useState, useEffect } from 'react';
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
  const [inputValue, setInputValue] = useState(value || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/v1/clients');
        const data = await response.json();
        setClients(data.clients || []);
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const handleChange = (_event: React.SyntheticEvent<unknown>, value: unknown>) => {
    if (typeof value === 'string') {
      setInputValue(value);
      onChange?.(value);
    }
  };

  const filteredOptions = clients.filter(client =>
    client.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete
        value={value}
        onChange={handleChange}
        options={clients.map(client => ({ label: client.name, id: client.id }))}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            error={error}
            required={required}
            disabled={disabled || loading}
            InputProps={{
              startAdornment: <Typography variant="body2" color="text.secondary">
                {loading ? 'Loading...' : params.InputProps?.startAdornment}
              </Typography>,
              endAdornment: inputValue && (
                <Typography
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    onChange('');
                  setOpen(false);
                  setTimeout(() => setOpen(true), 100);
                  setInputValue(value || '');
                  params.InputProps?.ref?.current?.focus();
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
                    <Typography>X</Typography>
                  </Box>
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
        getOptionLabel={(option) => option.label}
        renderOption={(props, option) => (
          <Box component="li" sx={{ fontSize: '0.875rem' }}>
            {option.label}
          </Box>
        )}
      />
    </Box>
  );
};

export default ClientSelector;
