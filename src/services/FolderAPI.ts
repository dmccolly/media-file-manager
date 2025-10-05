import { XanoService, XanoFileRecord } from './XanoService';

export interface FolderStructure {
  name: string;
  path: string;
  files: XanoFileRecord[];
  subfolders: FolderStructure[];
}

export class FolderAPIService {
  private xanoService: XanoService;

  constructor() {
    this.xanoService = new XanoService();
  }

  async getFolderStructure(): Promise<FolderStructure[]> {
    const files = await this.xanoService.fetchAllFiles();
    return this.buildFolderHierarchy(files);
  }

  async getFilesInFolder(folderPath: string): Promise<XanoFileRecord[]> {
    const files = await this.xanoService.fetchAllFiles();
    return files.filter(file => file.folder_path === folderPath);
  }

  async createFolder(folderPath: string): Promise<boolean> {
    // Create folder by ensuring it exists in the path structure
    return true;
  }

  async renameFolder(oldPath: string, newPath: string): Promise<boolean> {
    const files = await this.xanoService.fetchAllFiles();
    const filesToUpdate = files.filter(file => file.folder_path?.startsWith(oldPath));
    
    const updates = filesToUpdate.map(file => ({
      id: file.id,
      fields: {
        folder_path: file.folder_path!.replace(oldPath, newPath)
      }
    }));

    await this.xanoService.batchUpdateFiles(updates);
    return true;
  }

  async deleteFolder(folderPath: string): Promise<boolean> {
    const files = await this.xanoService.fetchAllFiles();
    const filesInFolder = files.filter(file => file.folder_path === folderPath);
    const fileIds = filesInFolder.map(file => file.id);
    
    if (fileIds.length > 0) {
      await this.xanoService.batchDeleteFiles(fileIds);
    }
    return true;
  }

  private buildFolderHierarchy(files: XanoFileRecord[]): FolderStructure[] {
    const folderMap = new Map<string, FolderStructure>();
    
    // Create root structure
    const root: FolderStructure = {
      name: 'root',
      path: '',
      files: [],
      subfolders: []
    };
    
    // Process all files
    files.forEach(file => {
      const path = file.folder_path || '';
      const parts = path.split('/').filter(p => p);
      
      let current = root;
      
      // Navigate/create folder structure
      parts.forEach(part => {
        const fullPath = parts.slice(0, parts.indexOf(part) + 1).join('/');
        let folder = folderMap.get(fullPath);
        
        if (!folder) {
          folder = {
            name: part,
            path: fullPath,
            files: [],
            subfolders: []
          };
          folderMap.set(fullPath, folder);
          current.subfolders.push(folder);
        }
        
        current = folder;
      });
      
      // Add file to final folder
      current.files.push(file);
    });
    
    return root.subfolders;
  }

  async getFolderList(): Promise<string[]> {
    const files = await this.xanoService.fetchAllFiles();
    const paths = new Set<string>();
    
    files.forEach(file => {
      if (file.folder_path) {
        paths.add(file.folder_path);
        // Add parent paths
        const parts = file.folder_path.split('/');
        let current = '';
        parts.forEach(part => {
          if (current) current += '/';
          current += part;
          paths.add(current);
        });
      }
    });
    
    return Array.from(paths).sort();
  }
}

export const folderAPI = new FolderAPIService();