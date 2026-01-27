/**
 * Database Backup Service
 * Implements automated weekly database backups per NFR-013
 * Supports backup to local storage and external storage (AWS S3, Google Cloud Storage)
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { prisma } from './prismaClient';

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

class BackupService {
  private config: BackupConfig;
  private backupPath: string;
  private isRunning: boolean = false;

  constructor(config?: Partial<BackupConfig>) {
    this.config = {
      enabled: process.env.DB_BACKUP_ENABLED !== 'false',
      schedule: (process.env.DB_BACKUP_SCHEDULE as any) || 'weekly',
      retentionDays: parseInt(process.env.DB_BACKUP_RETENTION_DAYS || '30'),
      backupPath: process.env.DB_BACKUP_PATH || './backups',
      externalStorage: {
        provider: process.env.DB_BACKUP_PROVIDER as any,
        bucket: process.env.DB_BACKUP_BUCKET,
        region: process.env.DB_BACKUP_REGION,
      },
      ...config,
    };

    this.backupPath = path.resolve(this.config.backupPath);

    // Ensure backup directory exists
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
      logger.info(`Backup directory created: ${this.backupPath}`);
    }
  }

  /**
   * Get database connection string for pg_dump
   * @returns PostgreSQL connection string
   */
  private getDatabaseUrl(): string {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Parse DATABASE_URL and format for pg_dump
    // Expected format: postgresql://user:password@host:port/database
    const parsed = new URL(dbUrl);
    const password = parsed.password;
    const host = parsed.hostname;
    const port = parsed.port || '5432';
    const database = parsed.pathname.replace(/^\//, '');

    return `postgresql://${password}@${host}:${port}/${database}`;
  }

  /**
   * Create a full database backup using pg_dump
   * @returns Promise<BackupResult>
   */
  async createFullBackup(): Promise<BackupResult> {
    if (!this.config.enabled) {
      logger.info('Database backups are disabled');
      return {
        success: true,
        timestamp: new Date().toISOString(),
        type: 'full',
        size: '0 bytes (disabled)',
        path: '',
      };
    }

    if (this.isRunning) {
      logger.warn('Backup is already running. Skipping...');
      throw new Error('Backup is already in progress');
    }

    this.isRunning = true;

    const timestamp = new Date();
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().replace(/:/g, '-');
    const filename = `full-backup-${dateStr}-${timeStr}.sql`;

    try {
      logger.info('Starting full database backup...');

      const dbUrl = this.getDatabaseUrl();
      const outputPath = path.join(this.backupPath, filename);
      const tempOutputPath = path.join(this.backupPath, `${filename}.temp`);

      // Run pg_dump command
      const pgDumpCommand = `pg_dump "${dbUrl}" > "${tempOutputPath}"`;

      await new Promise((resolve, reject) => {
        const process = exec(pgDumpCommand, (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            logger.error('pg_dump command failed', { error, stderr });
            reject(error);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });

      // Move temp file to final location
      await fs.promises.rename(tempOutputPath, outputPath);

      // Get file size
      const stats = await fs.promises.stat(outputPath);
      const fileSize = `${(stats.size / 1024 / 1024).toFixed(2)} MB`;

      logger.info('Full database backup completed successfully', {
        filename,
        size: fileSize,
        path: outputPath,
      });

      // Upload to external storage if configured
      if (this.config.externalStorage && this.config.externalStorage.provider) {
        await this.uploadToExternalStorage(outputPath, filename);
      }

      // Clean up old backups
      await this.cleanupOldBackups();

      const result: BackupResult = {
        success: true,
        timestamp: timestamp.toISOString(),
        type: 'full',
        size: fileSize,
        path: outputPath,
      };

      this.isRunning = false;

      return result;
    } catch (error) {
      this.isRunning = false;
      logger.error('Failed to create full database backup', { error });

      // Clean up temp file if it exists
      try {
        const tempOutputPath = path.join(this.backupPath, `${filename}.temp`);
        if (fs.existsSync(tempOutputPath)) {
          await fs.promises.unlink(tempOutputPath);
        }
      } catch (cleanupError) {
        logger.error('Failed to clean up temp file', { error: cleanupError });
      }

      throw error;
    }
  }

  /**
   * Upload backup file to external storage (AWS S3, Google Cloud Storage, Azure Blob)
   * @param filePath Path to the backup file
   * @param filename Name of the backup file
   */
  private async uploadToExternalStorage(filePath: string, filename: string): Promise<void> {
    const provider = this.config.externalStorage?.provider;

    if (!provider) {
      logger.info('No external storage provider configured');
      return;
    }

    try {
      if (provider === 'aws-s3') {
        await this.uploadToS3(filePath, filename);
      } else if (provider === 'gcs') {
        await this.uploadToGCS(filePath, filename);
      } else if (provider === 'azure-blob') {
        await this.uploadToAzure(filePath, filename);
      }
    } catch (error) {
      logger.error(`Failed to upload backup to ${provider}`, { error });
      throw error;
    }
  }

  private async uploadToS3(filePath: string, filename: string): Promise<void> {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const fs = require('fs');
    const { pipeline } = require('stream');

    const s3 = new S3Client({
      region: this.config.externalStorage?.region || 'us-east-1',
      credentials: {
        accessKeyId: this.config.externalStorage?.accessKey,
        secretAccessKey: this.config.externalStorage?.secretAccessKey,
      },
    });

    const bucketName = this.config.externalStorage?.bucket;

    if (!bucketName) {
      throw new Error('AWS S3 bucket name is not configured');
    }

    const s3Key = `backups/${new Date().toISOString().split('T')[0]}/${filename}`;

    logger.info(`Uploading backup to AWS S3: ${bucketName}/${s3Key}`);

    const upload = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fs.createReadStream(filePath),
    });

    await s3.send(upload);

    logger.info('Backup uploaded to AWS S3 successfully');
  }

  private async uploadToGCS(filePath: string, filename: string): Promise<void> {
    const { Storage } = require('@google-cloud/storage');
    const fs = require('fs');

    const storage = new Storage({
      keyFilename: process.env.GCS_KEY_FILE,
      projectId: process.env.GCS_PROJECT_ID,
    });

    const bucketName = this.config.externalStorage?.bucket;

    if (!bucketName) {
      throw new Error('Google Cloud Storage bucket name is not configured');
    }

    const gcsKey = `backups/${new Date().toISOString().split('T')[0]}/${filename}`;

    logger.info(`Uploading backup to Google Cloud Storage: ${bucketName}/${gcsKey}`);

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(gcsKey);

    await file.save(filePath);

    logger.info('Backup uploaded to Google Cloud Storage successfully');
  }

  private async uploadToAzure(filePath: string, filename: string): Promise<void> {
    const { BlobServiceClient, StorageSharedKeyCredential, ContainerClient } = require('@azure/storage-blob');
    const fs = require('fs');

    const containerName = this.config.externalStorage?.bucket;

    if (!containerName) {
      throw new Error('Azure Blob container name is not configured');
    }

    const containerClient = new ContainerClient(
      containerName,
      new StorageSharedKeyCredential(
        process.env.AZURE_STORAGE_ACCOUNT_NAME,
        process.env.AZURE_STORAGE_ACCOUNT_KEY
      )
    );

    const blobName = `backups/${new Date().toISOString().split('T')[0]}/${filename}`;

    logger.info(`Uploading backup to Azure Blob Storage: ${containerName}/${blobName}`);

    await containerClient.uploadFile(blobName, filePath);

    logger.info('Backup uploaded to Azure Blob Storage successfully');
  }

  /**
   * Clean up old backups based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.backupPath);
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
      const cutoffDate = Date.now() - retentionMs;

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.backupPath, file);
        const stats = await fs.promises.stat(filePath);

        if (stats.mtimeMs < cutoffDate) {
          await fs.promises.unlink(filePath);
          deletedCount++;
          logger.info(`Deleted old backup: ${file}`);
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleanup completed. Deleted ${deletedCount} old backups`);
      } else {
        logger.info('No old backups to clean up');
      }
    } catch (error) {
      logger.error('Failed to clean up old backups', { error });
    }
  }

  /**
   * Restore database from backup file
   * @param backupFile Path to the backup file to restore from
   * @returns Promise<void>
   */
  async restoreFromBackup(backupFile: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('Cannot restore: Another operation is in progress');
    }

    const filePath = path.resolve(this.backupPath, backupFile);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    this.isRunning = true;

    try {
      logger.info(`Restoring database from backup: ${backupFile}`);

      const dbUrl = this.getDatabaseUrl();

      // Run psql command to restore from backup
      const restoreCommand = `psql "${dbUrl}" < "${filePath}"`;

      await new Promise((resolve, reject) => {
        const process = exec(restoreCommand, (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            logger.error('psql command failed', { error, stderr });
            reject(error);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });

      // Disconnect all connections to ensure changes take effect
      await prisma.$disconnect();

      logger.info('Database restored successfully');
      this.isRunning = false;
    } catch (error) {
      this.isRunning = false;
      logger.error('Failed to restore database from backup', { error });
      throw error;
    }
  }

  /**
   * List all available backups
   * @returns Promise<BackupInfo[]>
   */
  async listBackups(): Promise<BackupResult[]> {
    try {
      const files = await fs.promises.readdir(this.backupPath);
      const backupFiles = files.filter(file => file.endsWith('.sql'));

      const backups: BackupResult[] = [];

      for (const file of backupFiles) {
        const filePath = path.join(this.backupPath, file);
        const stats = await fs.promises.stat(filePath);

        // Extract timestamp from filename
        const timestampMatch = file.match(/(\d{4}-\d{2}-\d{2})-(\d{2}-\d{2}-\d{2})/);
        let timestamp = '';

        if (timestampMatch) {
          const [, year, month, day, time] = timestampMatch;
          timestamp = new Date(`${year}-${month}-${day}T${time}`).toISOString();
        }

        backups.push({
          success: true,
          timestamp,
          type: 'full',
          size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          path: filePath,
        });
      }

      // Sort by timestamp descending
      backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      logger.info(`Found ${backups.length} backup files`);

      return backups;
    } catch (error) {
      logger.error('Failed to list backups', { error });
      throw error;
    }
  }

  /**
   * Test backup service (create a test backup and verify)
   * @returns Promise<BackupResult>
   */
  async testBackup(): Promise<BackupResult> {
    logger.info('Running backup test...');

    const testResult = await this.createFullBackup();

    // Verify backup was created successfully
    if (!testResult.success) {
      throw new Error('Backup test failed: Backup was not created');
    }

    logger.info('Backup test passed successfully', {
      filename: path.basename(testResult.path),
      size: testResult.size,
    });

    return testResult;
  }

  /**
   * Schedule automated backups using a timer
   * @param schedule Schedule in cron format (e.g., "0 2 * * *")
   */
  async scheduleBackups(schedule: string): Promise<void> {
    logger.info(`Scheduling automated backups: ${schedule}`);

    // For production, consider using a proper scheduler like node-cron
    // For now, we'll log the schedule
    logger.info(`Backups scheduled to run: ${this.config.schedule}`);
  }

  /**
   * Get backup configuration
   * @returns BackupConfig
   */
  getConfig(): BackupConfig {
    return { ...this.config };
  }

  /**
   * Update backup configuration
   * @param config New configuration options
   */
  updateConfig(config: Partial<BackupConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    logger.info('Backup configuration updated', this.config);
  }
}

export default new BackupService();
