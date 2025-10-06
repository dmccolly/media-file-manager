import { XanoService, XanoFileRecord } from './XanoService';

export interface SmartFolderRule {
  type: 'file_type' | 'category' | 'tags' | 'size' | 'date' | 'author' | 'name_contains';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between';
  value: string | string[] | number | Date | [number, number] | [Date, Date];
}

export interface SmartFolder {
  id: string;
  name: string;
  description: string;
  rules: SmartFolderRule[];
  color: string;
  icon: string;
  fileCount?: number;
  totalSize?: number;
  lastUpdated?: Date;
}

export class SmartFoldersService {
  private xanoService: XanoService;

  constructor() {
    this.xanoService = new XanoService();
  }

  async createSmartFolder(folder: Omit<SmartFolder, 'id' | 'fileCount' | 'totalSize' | 'lastUpdated'>): Promise<SmartFolder> {
    const id = Date.now().toString();
    return {
      ...folder,
      id,
      fileCount: 0,
      totalSize: 0,
      lastUpdated: new Date()
    };
  }

  async getFilesForSmartFolder(folder: SmartFolder): Promise<XanoFileRecord[]> {
    const allFiles = await this.xanoService.fetchAllFiles();
    return allFiles.filter(file => this.matchesRules(file, folder.rules));
  }

  private matchesRules(file: XanoFileRecord, rules: SmartFolderRule[]): boolean {
    return rules.every(rule => this.matchesRule(file, rule));
  }

  private matchesRule(file: XanoFileRecord, rule: SmartFolderRule): boolean {
    const value = this.getValueForRule(file, rule.type);
    
    switch (rule.operator) {
      case 'equals':
        return value === rule.value;
      
      case 'contains':
        if (typeof value === 'string' && typeof rule.value === 'string') {
          return value.toLowerCase().includes(rule.value.toLowerCase());
        }
        if (Array.isArray(value) && typeof rule.value === 'string') {
          return value.some(v => v.toLowerCase().includes(rule.value.toLowerCase()));
        }
        return false;
      
      case 'starts_with':
        return typeof value === 'string' && typeof rule.value === 'string' && 
               value.toLowerCase().startsWith(rule.value.toLowerCase());
      
      case 'ends_with':
        return typeof value === 'string' && typeof rule.value === 'string' && 
               value.toLowerCase().endsWith(rule.value.toLowerCase());
      
      case 'greater_than':
        if (typeof value === 'number' && typeof rule.value === 'number') {
          return value > rule.value;
        }
        if (value instanceof Date && rule.value instanceof Date) {
          return value > rule.value;
        }
        return false;
      
      case 'less_than':
        if (typeof value === 'number' && typeof rule.value === 'number') {
          return value < rule.value;
        }
        if (value instanceof Date && rule.value instanceof Date) {
          return value < rule.value;
        }
        return false;
      
      case 'between':
        if (Array.isArray(rule.value) && rule.value.length === 2) {
          if (typeof value === 'number' && typeof rule.value[0] === 'number' && typeof rule.value[1] === 'number') {
            return value >= rule.value[0] && value <= rule.value[1];
          }
          if (value instanceof Date && rule.value[0] instanceof Date && rule.value[1] instanceof Date) {
            return value >= rule.value[0] && value <= rule.value[1];
          }
        }
        return false;
      
      default:
        return false;
    }
  }

  private getValueForRule(file: XanoFileRecord, type: SmartFolderRule['type']): any {
    switch (type) {
      case 'file_type':
        return file.file_type;
      case 'category':
        return file.category;
      case 'tags':
        return file.tags;
      case 'size':
        return file.file_size;
      case 'date':
        return new Date(file.created_at);
      case 'author':
        return file.author || '';
      case 'name_contains':
        return file.title;
      default:
        return '';
    }
  }

  getDefaultSmartFolders(): SmartFolder[] {
    return [
      {
        id: 'recent',
        name: 'Recent Files',
        description: 'Files uploaded in the last 7 days',
        rules: [
          {
            type: 'date',
            operator: 'greater_than',
            value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        ],
        color: 'bg-blue-500',
        icon: '📅'
      },
      {
        id: 'large-files',
        name: 'Large Files',
        description: 'Files larger than 10MB',
        rules: [
          {
            type: 'size',
            operator: 'greater_than',
            value: 10 * 1024 * 1024 // 10MB
          }
        ],
        color: 'bg-orange-500',
        icon: '📊'
      },
      {
        id: 'images',
        name: 'All Images',
        description: 'All image files',
        rules: [
          {
            type: 'file_type',
            operator: 'contains',
            value: 'image/'
          }
        ],
        color: 'bg-purple-500',
        icon: '🖼️'
      },
      {
        id: 'videos',
        name: 'All Videos',
        description: 'All video files',
        rules: [
          {
            type: 'file_type',
            operator: 'contains',
            value: 'video/'
          }
        ],
        color: 'bg-red-500',
        icon: '🎥'
      },
      {
        id: 'documents',
        name: 'Documents',
        description: 'All document files',
        rules: [
          {
            type: 'file_type',
            operator: 'contains',
            value: 'application/pdf'
          }
        ],
        color: 'bg-green-500',
        icon: '📄'
      }
    ];
  }

  async calculateFolderStats(folder: SmartFolder): Promise<{
    fileCount: number;
    totalSize: number;
    lastUpdated: Date;
  }> {
    const files = await this.getFilesForSmartFolder(folder);
    return {
      fileCount: files.length,
      totalSize: files.reduce((sum, file) => sum + file.file_size, 0),
      lastUpdated: new Date()
    };
  }
}

export const smartFoldersService = new SmartFoldersService();