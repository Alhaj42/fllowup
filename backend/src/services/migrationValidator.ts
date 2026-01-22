export interface ValidationError {
  field: string;
  message: string;
  row?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class MigrationValidator {
  validateRequiredFields(
    data: Record<string, unknown>,
    requiredFields: string[]
  ): ValidationError[] {
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
  }

  validateEmail(email: unknown): boolean {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateDate(dateString: unknown): boolean {
    if (typeof dateString !== 'string') return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  validatePositiveNumber(value: unknown): boolean {
    if (typeof value !== 'number') return false;
    return value > 0;
  }

  validateEnum(value: unknown, allowedValues: string[]): boolean {
    if (typeof value !== 'string') return false;
    return allowedValues.includes(value);
  }

  validateStringType(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  validateProjectData(project: Record<string, unknown>, rowNumber: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.validateStringType(project.clientName as string)) {
      errors.push({ field: 'clientName', message: 'Client name is required and must be a string', row: rowNumber });
    }
    if (!this.validateStringType(project.contractCode as string)) {
      errors.push({ field: 'contractCode', message: 'Contract code is required and must be a string', row: rowNumber });
    }
    if (!this.validatePositiveNumber(project.builtUpArea)) {
      errors.push({ field: 'builtUpArea', message: 'Built-up area must be a positive number', row: rowNumber });
    }
    if (!this.validateDate(project.contractSigningDate)) {
      errors.push({ field: 'contractSigningDate', message: 'Contract signing date must be a valid date', row: rowNumber });
    }
    if (!this.validateDate(project.startDate)) {
      errors.push({ field: 'startDate', message: 'Start date must be a valid date', row: rowNumber });
    }
    if (!this.validateDate(project.estimatedEndDate)) {
      errors.push({ field: 'estimatedEndDate', message: 'Estimated end date must be a valid date', row: rowNumber });
    }

    if (this.validateDate(project.contractSigningDate) && this.validateDate(project.startDate)) {
      const signingDate = new Date(project.contractSigningDate as string);
      const startDate = new Date(project.startDate as string);
      if (signingDate > startDate) {
        errors.push({ field: 'contractSigningDate', message: 'Contract signing date must be before or equal to start date', row: rowNumber });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateUserData(user: Record<string, unknown>, rowNumber: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.validateStringType(user.name as string)) {
      errors.push({ field: 'name', message: 'Name is required and must be a string', row: rowNumber });
    }
    if (!this.validateEmail(user.email)) {
      errors.push({ field: 'email', message: 'Valid email is required', row: rowNumber });
    }
    if (user.role && !this.validateEnum(user.role, ['MANAGER', 'TEAM_LEADER', 'TEAM_MEMBER'])) {
      errors.push({ field: 'role', message: 'Role must be MANAGER, TEAM_LEADER, or TEAM_MEMBER', row: rowNumber });
    }
    if (user.monthlyCost && !this.validatePositiveNumber(user.monthlyCost)) {
      errors.push({ field: 'monthlyCost', message: 'Monthly cost must be a positive number', row: rowNumber });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validatePhaseData(phase: Record<string, unknown>, rowNumber: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.validateEnum(phase.name, ['STUDIES', 'DESIGN'])) {
      errors.push({ field: 'name', message: 'Phase name must be STUDIES or DESIGN', row: rowNumber });
    }
    if (!this.validateDate(phase.startDate)) {
      errors.push({ field: 'startDate', message: 'Start date must be a valid date', row: rowNumber });
    }
    if (!this.validatePositiveNumber(phase.duration)) {
      errors.push({ field: 'duration', message: 'Duration must be a positive number', row: rowNumber });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateTaskData(task: Record<string, unknown>, rowNumber: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.validateStringType(task.taskCode as string)) {
      errors.push({ field: 'taskCode', message: 'Task code is required and must be a string', row: rowNumber });
    }
    if (!this.validateStringType(task.description as string)) {
      errors.push({ field: 'description', message: 'Description is required and must be a string', row: rowNumber });
    }
    if (!this.validatePositiveNumber(task.duration)) {
      errors.push({ field: 'duration', message: 'Duration must be a positive number', row: rowNumber });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateCostData(cost: Record<string, unknown>, rowNumber: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.validatePositiveNumber(cost.costAmount)) {
      errors.push({ field: 'costAmount', message: 'Cost amount must be a positive number', row: rowNumber });
    }
    if (cost.costType && !this.validateEnum(cost.costType, ['EMPLOYEE_COST', 'MATERIAL_COST', 'OTHER_COST'])) {
      errors.push({ field: 'costType', message: 'Cost type must be EMPLOYEE_COST, MATERIAL_COST, or OTHER_COST', row: rowNumber });
    }
    if (!this.validateDate(cost.period)) {
      errors.push({ field: 'period', message: 'Period must be a valid date', row: rowNumber });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateKPIData(kpi: Record<string, unknown>, rowNumber: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (kpi.delayedDays && typeof kpi.delayedDays !== 'number') {
      errors.push({ field: 'delayedDays', message: 'Delayed days must be a number', row: rowNumber });
    }
    if (kpi.delayedDays && (kpi.delayedDays as number) < 0) {
      errors.push({ field: 'delayedDays', message: 'Delayed days cannot be negative', row: rowNumber });
    }

    if (kpi.clientModifications && typeof kpi.clientModifications !== 'number') {
      errors.push({ field: 'clientModifications', message: 'Client modifications must be a number', row: rowNumber });
    }
    if (kpi.clientModifications && (kpi.clientModifications as number) < 0) {
      errors.push({ field: 'clientModifications', message: 'Client modifications cannot be negative', row: rowNumber });
    }

    if (kpi.technicalMistakes && typeof kpi.technicalMistakes !== 'number') {
      errors.push({ field: 'technicalMistakes', message: 'Technical mistakes must be a number', row: rowNumber });
    }
    if (kpi.technicalMistakes && (kpi.technicalMistakes as number) < 0) {
      errors.push({ field: 'technicalMistakes', message: 'Technical mistakes cannot be negative', row: rowNumber });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default MigrationValidator;
