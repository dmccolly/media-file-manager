import { XanoFileRecord } from './XanoService';

export class MockDataService {
  private mockFiles: XanoFileRecord[] = [
    {
      id: '1',
      title: 'Project Presentation.pptx',
      description: 'Q4 project presentation slides',
      media_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      file_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      file_size: 2048000,
      created_at: '2024-01-15T10:30:00Z',
      tags: ['presentation', 'q4', 'business'],
      category: 'document',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&h=150&fit=crop',
      author: 'John Smith',
      submitted_by: 'John Smith',
      folder_path: '/projects'
    },
    {
      id: '2',
      title: 'Team Photo 2024.jpg',
      description: 'Annual team building event photo',
      media_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
      file_type: 'image/jpeg',
      file_size: 1024000,
      created_at: '2024-02-20T14:15:00Z',
      tags: ['team', 'photo', '2024', 'event'],
      category: 'image',
      thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop',
      author: 'Sarah Johnson',
      submitted_by: 'Sarah Johnson',
      folder_path: '/personal'
    },
    {
      id: '3',
      title: 'Client Meeting Recording.mp4',
      description: 'Important client discussion about project requirements',
      media_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      file_type: 'video/mp4',
      file_size: 5120000,
      created_at: '2024-03-10T09:45:00Z',
      tags: ['meeting', 'client', 'requirements'],
      category: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=150&h=150&fit=crop',
      author: 'Mike Davis',
      submitted_by: 'Mike Davis',
      folder_path: '/clients'
    },
    {
      id: '4',
      title: 'Budget Analysis.xlsx',
      description: 'Quarterly budget breakdown and analysis',
      media_url: 'https://file-examples.com/storage/fe68c8a7c7c38d85b7c4e15/2017/10/file_example_XLS_10.xls',
      file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      file_size: 512000,
      created_at: '2024-01-25T16:20:00Z',
      tags: ['budget', 'analysis', 'finance', 'quarterly'],
      category: 'document',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=150&h=150&fit=crop',
      author: 'Emily Chen',
      submitted_by: 'Emily Chen',
      folder_path: '/projects'
    },
    {
      id: '5',
      title: 'Product Demo Audio.mp3',
      description: 'Audio recording of product demonstration',
      media_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      file_type: 'audio/mp3',
      file_size: 3072000,
      created_at: '2024-02-05T11:30:00Z',
      tags: ['demo', 'product', 'audio', 'presentation'],
      category: 'audio',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop',
      author: 'Alex Rodriguez',
      submitted_by: 'Alex Rodriguez',
      folder_path: '/projects'
    },
    {
      id: '6',
      title: 'Company Logo.png',
      description: 'Official company logo in high resolution',
      media_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800',
      file_type: 'image/png',
      file_size: 256000,
      created_at: '2024-01-01T08:00:00Z',
      tags: ['logo', 'branding', 'official'],
      category: 'image',
      thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=150&h=150&fit=crop',
      author: 'Design Team',
      submitted_by: 'Design Team',
      folder_path: '/'
    },
    {
      id: '7',
      title: 'Contract Template.pdf',
      description: 'Standard client contract template',
      media_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_type: 'application/pdf',
      file_size: 128000,
      created_at: '2024-01-10T12:00:00Z',
      tags: ['contract', 'template', 'legal'],
      category: 'document',
      thumbnail: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=150&h=150&fit=crop',
      author: 'Legal Team',
      submitted_by: 'Legal Team',
      folder_path: '/clients'
    },
    {
      id: '8',
      title: 'Marketing Video.mp4',
      description: 'Promotional video for new product launch',
      media_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4',
      file_type: 'video/mp4',
      file_size: 8192000,
      created_at: '2024-03-01T15:45:00Z',
      tags: ['marketing', 'video', 'promotion', 'launch'],
      category: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150&h=150&fit=crop',
      author: 'Marketing Team',
      submitted_by: 'Marketing Team',
      folder_path: '/projects'
    }
  ];

  async fetchAllFiles(): Promise<XanoFileRecord[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('🎭 MockDataService: Returning', this.mockFiles.length, 'mock files');
    return [...this.mockFiles];
  }

  async updateFile(recordId: string, updates: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const fileIndex = this.mockFiles.findIndex(f => f.id === recordId);
    if (fileIndex !== -1) {
      this.mockFiles[fileIndex] = { ...this.mockFiles[fileIndex], ...updates };
      console.log('🎭 MockDataService: Updated file', recordId);
      return this.mockFiles[fileIndex];
    }
    throw new Error('File not found');
  }

  async deleteFile(recordId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const initialLength = this.mockFiles.length;
    this.mockFiles = this.mockFiles.filter(f => f.id !== recordId);
    const deleted = this.mockFiles.length < initialLength;
    console.log('🎭 MockDataService: Deleted file', recordId, deleted);
    return deleted;
  }

  async saveFile(fileData: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newFile: XanoFileRecord = {
      id: Date.now().toString(),
      title: fileData.title || 'New File',
      description: fileData.description || '',
      media_url: fileData.media_url || '',
      file_type: fileData.file_type || 'application/octet-stream',
      file_size: fileData.file_size || 0,
      created_at: new Date().toISOString(),
      tags: fileData.tags || [],
      category: fileData.category || 'other',
      thumbnail: fileData.thumbnail,
      author: fileData.author || 'Unknown',
      submitted_by: fileData.submitted_by || 'Unknown',
      folder_path: fileData.folder_path || '/'
    };
    this.mockFiles.push(newFile);
    console.log('🎭 MockDataService: Added new file', newFile.id);
    return newFile;
  }
}