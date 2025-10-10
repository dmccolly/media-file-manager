import { XanoService, XanoFileRecord } from './XanoService';

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  results: any[];
}

export interface BulkMoveOperation {
  fileIds: string[];
  targetFolder: string;
}

export interface BulkUpdateOperation {
  fileIds: string[];
  updates: Partial<XanoFileRecord>;
}

export interface BulkDeleteOperation {
  fileIds: string[];
}

export class BulkOperationsService {
  private xanoService: XanoService;

  constructor() {
    this.xanoService = new XanoService();
  }

  async moveFiles(operation: BulkMoveOperation): Promise<BulkOperationResult> {
    try {
      // Convert string IDs to numbers and folder path to folder ID
      const fileIds = operation.fileIds.map(id => parseInt(id, 10));
      
      // Parse folder ID from target folder path
      // If targetFolder is empty or "root", use null for root folder
      let folderId: number | null = null;
      if (operation.targetFolder && operation.targetFolder !== 'root') {
        // Extract folder ID from path (assuming format like "folder_123" or just "123")
        const folderIdMatch = operation.targetFolder.match(/\d+/);
        if (folderIdMatch) {
          folderId = parseInt(folderIdMatch[0], 10);
        }
      }

      // Call the new batch move endpoint
      const response = await fetch('/.netlify/functions/batch-move-to-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileIds,
          folderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Batch move failed');
      }

      const data = await response.json();

      // Extract errors from failed results
      const errors = data.results
        .filter((r: any) => !r.success)
        .map((r: any) => `File ${r.fileId}: ${r.error}`);

      return {
        success: data.failed === 0,
        processed: data.succeeded,
        failed: data.failed,
        errors,
        results: data.results,
      };
    } catch (error) {
      return {
        success: false,
        processed: 0,
        failed: operation.fileIds.length,
        errors: [error instanceof Error ? error.message : 'Batch move failed'],
        results: [],
      };
    }
  }

  async updateFiles(operation: BulkUpdateOperation): Promise<BulkOperationResult> {
    const updates = operation.fileIds.map(id => ({
      id,
      fields: operation.updates
    }));

    try {
      const results = await this.xanoService.batchUpdateFiles(updates);
      return {
        success: true,
        processed: operation.fileIds.length,
        failed: 0,
        errors: [],
        results
      };
    } catch (error) {
      return {
        success: false,
        processed: 0,
        failed: operation.fileIds.length,
        errors: [error instanceof Error ? error.message : 'Batch update failed'],
        results: []
      };
    }
  }

  async deleteFiles(operation: BulkDeleteOperation): Promise<BulkOperationResult> {
    try {
      const success = await this.xanoService.batchDeleteFiles(operation.fileIds);
      return {
        success,
        processed: operation.fileIds.length,
        failed: success ? 0 : operation.fileIds.length,
        errors: success ? [] : ['Batch delete failed'],
        results: []
      };
    } catch (error) {
      return {
        success: false,
        processed: 0,
        failed: operation.fileIds.length,
        errors: [error instanceof Error ? error.message : 'Batch delete failed'],
        results: []
      };
    }
  }

  async downloadFiles(fileIds: string[]): Promise<BulkOperationResult> {
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;

    // This would integrate with Cloudinary for bulk download
    // For now, we'll simulate the operation
    for (const fileId of fileIds) {
      try {
        // In a real implementation, this would generate a ZIP file
        // or provide download links for all files
        processed++;
      } catch (error) {
        errors.push(`Failed to prepare download for file ${fileId}: ${error}`);
        failed++;
      }
    }

    return {
      success: failed === 0,
      processed,
      failed,
      errors,
      results: []
    };
  }

  async validateBulkOperation(fileIds: string[]): Promise<{
    valid: string[];
    invalid: string[];
    errors: string[];
  }> {
    const valid: string[] = [];
    const invalid: string[] = [];
    const errors: string[] = [];

    try {
      const allFiles = await this.xanoService.fetchAllFiles();
      const fileMap = new Map(allFiles.map(f => [f.id, f]));

      for (const fileId of fileIds) {
        if (fileMap.has(fileId)) {
          valid.push(fileId);
        } else {
          invalid.push(fileId);
          errors.push(`File ${fileId} not found`);
        }
      }
    } catch (error) {
      errors.push(`Validation failed: ${error}`);
    }

    return { valid, invalid, errors };
  }
}

export const bulkOperations = new BulkOperationsService();