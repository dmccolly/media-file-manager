import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { bulkOperations } from '../services/BulkOperationsService';
import { XanoFileRecord } from '../services/XanoService';

interface Folder {
  id: number;
  name: string;
  path?: string;
}

interface BulkOperationsPanelProps {
  selectedFiles: XanoFileRecord[];
  folders: Folder[];
  onComplete: () => void;
}

export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  selectedFiles,
  folders,
  onComplete
}) => {
  const [operation, setOperation] = useState<'move' | 'update' | 'delete' | 'download'>('move');
  const [targetFolder, setTargetFolder] = useState('');
  const [commonTags, setCommonTags] = useState('');
  const [commonDescription, setCommonDescription] = useState('');
  const [commonCategory, setCommonCategory] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkOperation = async () => {
    if (selectedFiles.length === 0) {
      toast.error('No files selected for bulk operation');
      return;
    }

    setIsProcessing(true);
    const fileIds = selectedFiles.map(f => f.id);

    try {
      let result;

      switch (operation) {
        case 'move':
          if (!targetFolder.trim()) {
            toast.error('Please select a target folder');
            return;
          }
          result = await bulkOperations.moveFiles({
            fileIds,
            targetFolder: targetFolder.trim()
          });
          break;

        case 'update':
          const updates: Partial<XanoFileRecord> = {};
          if (commonTags.trim()) updates.tags = commonTags.split(',').map(t => t.trim());
          if (commonDescription.trim()) updates.description = commonDescription.trim();
          if (commonCategory.trim()) updates.category = commonCategory.trim();
          
          if (Object.keys(updates).length === 0) {
            toast.error('Please provide at least one field to update');
            return;
          }
          
          result = await bulkOperations.updateFiles({
            fileIds,
            updates
          });
          break;

        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) {
            return;
          }
          result = await bulkOperations.deleteFiles({ fileIds });
          break;

        case 'download':
          result = await bulkOperations.downloadFiles(fileIds);
          break;
      }

      if (result.success) {
        toast.success(`${result.processed} files processed successfully`);
        onComplete();
      } else {
        toast.error(`${result.failed} files failed to process`);
        if (result.errors.length > 0) {
          toast.error(result.errors[0]);
        }
      }
    } catch (error) {
      toast.error('Bulk operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Bulk Operations</h3>
        <Badge variant="secondary">{selectedFiles.length} files selected</Badge>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Operation Type</label>
        <Select value={operation} onValueChange={(value) => setOperation(value as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="move">Move to Folder</SelectItem>
            <SelectItem value="update">Update Metadata</SelectItem>
            <SelectItem value="delete">Delete Files</SelectItem>
            <SelectItem value="download">Download Files</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {operation === 'move' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Folder</label>
          <Select value={targetFolder} onValueChange={setTargetFolder}>
            <SelectTrigger>
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">Root (No Folder)</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id.toString()}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {operation === 'update' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Common Tags (comma-separated)</label>
            <Input
              placeholder="tag1, tag2, tag3"
              value={commonTags}
              onChange={(e) => setCommonTags(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Common Description</label>
            <Textarea
              placeholder="Description to apply to all selected files"
              value={commonDescription}
              onChange={(e) => setCommonDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Common Category</label>
            <Input
              placeholder="Category to apply to all selected files"
              value={commonCategory}
              onChange={(e) => setCommonCategory(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleBulkOperation} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : `Apply to ${selectedFiles.length} files`}
        </Button>
        <Button variant="outline" onClick={onComplete}>
          Cancel
        </Button>
      </div>

      {isProcessing && (
        <div className="text-sm text-gray-500">
          Processing {selectedFiles.length} files...
        </div>
      )}
    </div>
  );
};