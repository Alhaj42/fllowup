import { describe, it, expect } from '@jest/globals';

describe('Migration Validator Service', () => {
  interface ValidationError {
    field: string;
    message: string;
  }

  const validateRequiredFields = (
    data: Record<string, unknown>,
    requiredFields: string[]
  ): ValidationError[] => {
    const errors: ValidationError[] = [];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push({
          field,
          message: `${field} is required`,
        });
      }
    }
    return errors;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const validatePositiveNumber = (value: unknown): boolean => {
    if (typeof value !== 'number') return false;
    return value > 0;
  };

  it('should detect missing required fields', () => {
    const data = {
      clientName: 'Test Client',
      contractCode: '',
      builtUpArea: 1000,
    };

    const errors = validateRequiredFields(data, ['clientName', 'contractCode', 'builtUpArea']);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      field: 'contractCode',
      message: 'contractCode is required',
    });
  });

  it('should validate email format', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('should validate date format', () => {
    expect(validateDate('2024-01-01')).toBe(true);
    expect(validateDate('01/01/2024')).toBe(true);
    expect(validateDate('invalid-date')).toBe(false);
    expect(validateDate('')).toBe(false);
  });

  it('should validate positive numbers', () => {
    expect(validatePositiveNumber(100)).toBe(true);
    expect(validatePositiveNumber(0)).toBe(false);
    expect(validatePositiveNumber(-100)).toBe(false);
    expect(validatePositiveNumber('100')).toBe(false);
  });

  it('should validate project data', () => {
    const projectData = {
      clientName: 'Test Client',
      contractCode: 'CONTRACT-001',
      builtUpArea: 1000,
      contractSigningDate: '2024-01-01',
      startDate: '2024-01-15',
      estimatedEndDate: '2024-03-15',
    };

    const errors: ValidationError[] = [];

    if (!projectData.clientName) {
      errors.push({ field: 'clientName', message: 'clientName is required' });
    }
    if (!projectData.contractCode) {
      errors.push({ field: 'contractCode', message: 'contractCode is required' });
    }
    if (!validatePositiveNumber(projectData.builtUpArea)) {
      errors.push({ field: 'builtUpArea', message: 'builtUpArea must be positive' });
    }
    if (!validateDate(projectData.contractSigningDate)) {
      errors.push({ field: 'contractSigningDate', message: 'contractSigningDate must be a valid date' });
    }
    if (!validateDate(projectData.startDate)) {
      errors.push({ field: 'startDate', message: 'startDate must be a valid date' });
    }
    if (!validateDate(projectData.estimatedEndDate)) {
      errors.push({ field: 'estimatedEndDate', message: 'estimatedEndDate must be a valid date' });
    }

    expect(errors).toHaveLength(0);
  });

  it('should validate user data', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'MANAGER',
      monthlyCost: 5000,
    };

    const errors: ValidationError[] = [];

    if (!userData.name) {
      errors.push({ field: 'name', message: 'name is required' });
    }
    if (!userData.email || !validateEmail(userData.email)) {
      errors.push({ field: 'email', message: 'email must be valid' });
    }
    if (!userData.role || !['MANAGER', 'TEAM_LEADER', 'TEAM_MEMBER'].includes(userData.role as string)) {
      errors.push({ field: 'role', message: 'role must be MANAGER, TEAM_LEADER, or TEAM_MEMBER' });
    }
    if (!validatePositiveNumber(userData.monthlyCost)) {
      errors.push({ field: 'monthlyCost', message: 'monthlyCost must be positive' });
    }

    expect(errors).toHaveLength(0);
  });

  it('should validate phase data', () => {
    const phaseData = {
      projectId: 'project-1',
      name: 'STUDIES',
      startDate: '2024-01-15',
      duration: 30,
    };

    const errors: ValidationError[] = [];

    if (!phaseData.projectId) {
      errors.push({ field: 'projectId', message: 'projectId is required' });
    }
    if (!phaseData.name || !['STUDIES', 'DESIGN'].includes(phaseData.name as string)) {
      errors.push({ field: 'name', message: 'name must be STUDIES or DESIGN' });
    }
    if (!validateDate(phaseData.startDate)) {
      errors.push({ field: 'startDate', message: 'startDate must be a valid date' });
    }
    if (!validatePositiveNumber(phaseData.duration)) {
      errors.push({ field: 'duration', message: 'duration must be positive' });
    }

    expect(errors).toHaveLength(0);
  });

  it('should detect data type mismatches', () => {
    const invalidData = {
      clientName: 123,
      builtUpArea: '1000',
      startDate: 'not-a-date',
    };

    const errors: ValidationError[] = [];

    if (typeof invalidData.clientName !== 'string') {
      errors.push({ field: 'clientName', message: 'clientName must be a string' });
    }
    if (typeof invalidData.builtUpArea !== 'number') {
      errors.push({ field: 'builtUpArea', message: 'builtUpArea must be a number' });
    }
    if (!validateDate(invalidData.startDate as string)) {
      errors.push({ field: 'startDate', message: 'startDate must be a valid date' });
    }

    expect(errors).toHaveLength(3);
  });

  it('should validate date sequence (startDate <= estimatedEndDate)', () => {
    const startDate = new Date('2024-03-01');
    const estimatedEndDate = new Date('2024-02-01');

    const isValid = startDate <= estimatedEndDate;
    expect(isValid).toBe(false);
  });

  it('should validate contractSigningDate <= startDate', () => {
    const contractSigningDate = new Date('2024-02-01');
    const startDate = new Date('2024-01-01');

    const isValid = contractSigningDate <= startDate;
    expect(isValid).toBe(false);
  });
});
