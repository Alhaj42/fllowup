import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
} from '@mui/material';

export interface ConfigurationOption {
  key: string;
  value: string;
  label: string;
}

interface ConfigurationSelectorProps {
  label: string;
  value: string | undefined;
  onChange: (key: string) => void;
  options: ConfigurationOption[];
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

export const ConfigurationSelector: React.FC<ConfigurationSelectorProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  error = false,
  helperText,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  return (
    <Box sx={{ minWidth: 200 }}>
      <FormControl fullWidth required={required} error={error}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          label={label}
        >
          {options.map((option) => (
            <MenuItem key={option.key} value={option.key}>
              {option.label || option.value}
            </MenuItem>
          ))}
        </Select>
        {helperText && <Box sx={{ fontSize: '0.75rem', color: error ? 'error.main' : 'text.secondary', mt: 0.5 }}>{helperText}</Box>}
      </FormControl>
    </Box>
  );
};

export default ConfigurationSelector;
