import { UserRole, TaskStatus, Task } from '@prisma/client';
export interface CreateTaskInput {
    phaseId: string;
    code: string;
    description: string;
    duration: number;
    assignedTeamMemberId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: TaskStatus;
}
export interface UpdateTaskInput {
    code?: string;
    description?: string;
    duration?: number;
    status?: TaskStatus;
    assignedTeamMemberId?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    version: number;
}
declare class TaskService {
    private prisma;
    constructor();
    createTask(input: CreateTaskInput, userId: string, role: UserRole): Promise<Task>;
    updateTask(id: string, input: UpdateTaskInput, userId: string, role: UserRole): Promise<Task>;
    deleteTask(id: string, userId: string, role: UserRole): Promise<void>;
    getTaskById(id: string): Promise<Task | null>;
    getTasksByPhase(phaseId: string): Promise<Task[]>;
}
export default TaskService;
//# sourceMappingURL=taskService.d.ts.map