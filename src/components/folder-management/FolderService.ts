import { MediaFile } from '../../types/MediaFile';

interface FolderRecord {
  id: string;
  name: string;
  path: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  is_system?: boolean;
}

interface FolderNode {
  id: string;
  name: string;
  path: string;
  children: FolderNode[];
  fileCount: number;
  isExpanded: boolean;
  isSystem: boolean;
}

export class FolderService {
  private baseUrl = '/api';

  async createFolder(name: string, parentPath?: string): Promise<FolderRecord> {
    const response = await fetch(`${this.baseUrl}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        path: parentPath ? `${parentPath}/${name}` : `/${name}`,
        parent_id: parentPath || null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create folder');
    }

    return response.json();
  }

  async deleteFolder(folderId: string, migrateToFolder?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/folders/${folderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        migrate_to_folder: migrateToFolder || '/uncategorized',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete folder');
    }
  }

  async moveFiles(fileIds: string[], targetFolderPath: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/files/batch/move`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_ids: fileIds,
        target_folder_path: targetFolderPath,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to move files');
    }
  }

  async getFolderTree(): Promise<FolderNode[]> {
    const response = await fetch(`${this.baseUrl}/folders/tree`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch folder tree');
    }

    const data = await response.json();
    return this.buildFolderTree(data.folders || []);
  }

  async getFolderContents(folderPath: string): Promise<MediaFile[]> {
    const response = await fetch(`${this.baseUrl}/folders/${encodeURIComponent(folderPath)}/contents`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch folder contents');
    }

    return response.json();
  }

  private buildFolderTree(folders: any[]): FolderNode[] {
    const tree: FolderNode[] = [];
    const folderMap = new Map<string, FolderNode>();

    // Build nodes
    folders.forEach(folder => {
      const node: FolderNode = {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        children: [],
        fileCount: folder.file_count || 0,
        isExpanded: false,
        isSystem: folder.is_system || false,
      };
      folderMap.set(folder.id, node);
    });

    // Build tree structure
    folders.forEach(folder => {
      const node = folderMap.get(folder.id);
      if (node) {
        if (folder.parent_id && folderMap.has(folder.parent_id)) {
          folderMap.get(folder.parent_id)!.children.push(node);
        } else {
          tree.push(node);
        }
      }
    });

    return tree;
  }

  async updateFileFolder(fileId: string, folderPath: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/files/${fileId}/folder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folder_path: folderPath }),
    });

    if (!response.ok) {
      throw new Error('Failed to update file folder');
    }
  }
}