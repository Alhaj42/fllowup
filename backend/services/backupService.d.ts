interface BackupConfig {
    enabled: boolean;
    schedule: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    backupPath: string;
    externalStorage?: {
        provider: 'aws-s3' | 'gcs' | 'azure-blob';
        bucket?: string;
        region?: string;
        accessKey?: string;
        secretAccessKey?: string;
    };
}
interface BackupResult {
    success: boolean;
    timestamp: string;
    type: 'full' | 'incremental';
    size: string;
    path: string;
    error?: string;
}
declare class BackupService {
    private config;
    private backupPath;
    private isRunning;
    constructor(config?: Partial<BackupConfig>);
    private ensureBackupDirectory;
    /**
     * Get database connection string for pg_dump
     * @returns PostgreSQL connection string
     */
    private getDatabaseUrl;
    /**
     * Create a full database backup using pg_dump
     * @returns Promise<BackupResult>
     */
    createFullBackup(): Promise<BackupResult>;
    /**
     * Upload backup file to external storage (AWS S3, Google Cloud Storage, Azure Blob)
     * @param filePath Path to the backup file
     * @param filename Name of the backup file
     */
    private uploadToExternalStorage;
    private uploadToS3;
    private uploadToGCS;
    private uploadToAzure;
    /**
     * Clean up old backups based on retention policy
     */
    private cleanupOldBackups;
    /**
     * Restore database from backup file
     * @param backupFile Path to the backup file to restore from
     * @returns Promise<void>
     */
    restoreFromBackup(backupFile: string): Promise<void>;
    /**
     * List all available backups
     * @returns Promise<BackupInfo[]>
     */
    listBackups(): Promise<BackupResult[]>;
    /**
     * Test backup service (create a test backup and verify)
     * @returns Promise<BackupResult>
     */
    testBackup(): Promise<BackupResult>;
    /**
     * Schedule automated backups using a timer
     * @param schedule Schedule in cron format (e.g., "0 2 * * *")
     */
    scheduleBackups(schedule: string): Promise<void>;
    /**
     * Get backup configuration
     * @returns BackupConfig
     */
    getConfig(): BackupConfig;
    /**
     * Update backup configuration
     * @param config New configuration options
     */
    updateConfig(config: Partial<BackupConfig>): void;
}
declare const _default: BackupService;
export default _default;
//# sourceMappingURL=backupService.d.ts.map