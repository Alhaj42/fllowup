export interface ValidationError {
    field: string;
    message: string;
    row?: number;
    severity?: 'error' | 'warning';
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export declare class MigrationValidator {
    validateRequiredFields(data: Record<string, unknown>, requiredFields: string[]): ValidationError[];
    validateEmail(email: unknown): boolean;
    validateDate(dateString: unknown): boolean;
    validatePositiveNumber(value: unknown): boolean;
    validateEnum(value: unknown, allowedValues: string[]): boolean;
    validateStringType(value: unknown): boolean;
    validateProjectData(project: Record<string, unknown>, rowNumber: number): ValidationResult;
    validateUserData(user: Record<string, unknown>, rowNumber: number): ValidationResult;
    validatePhaseData(phase: Record<string, unknown>, rowNumber: number): ValidationResult;
    validateTaskData(task: Record<string, unknown>, rowNumber: number): ValidationResult;
    validateCostData(cost: Record<string, unknown>, rowNumber: number): ValidationResult;
    validateKPIData(kpi: Record<string, unknown>, rowNumber: number): ValidationResult;
}
export default MigrationValidator;
//# sourceMappingURL=migrationValidator.d.ts.map