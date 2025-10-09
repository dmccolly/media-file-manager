export interface Folder {
  id: number
  name: string
  path: string
  parent_path: string
  created_at: number
}

export class FolderService {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api'
  }

  /**
   * Fetch all folders from the backend
   */
  async fetchAllFolders(): Promise<Folder[]> {
    try {
      const response = await fetch(`${this.baseUrl}/folder-list`)
      
      if (!response.ok) {
        console.error('Failed to fetch folders:', response.status)
        return []
      }

      const folders = await response.json()
      return Array.isArray(folders) ? folders : []
    } catch (error) {
      console.error('Error fetching folders:', error)
      return []
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(name: string, parentPath: string = '/'): Promise<Folder | null> {
    try {
      const response = await fetch(`${this.baseUrl}/folder-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          parent_path: parentPath,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to create folder:', error)
        throw new Error(error.error || 'Failed to create folder')
      }

      const result = await response.json()
      return result.folder
    } catch (error) {
      console.error('Error creating folder:', error)
      throw error
    }
  }

  /**
   * Delete a folder
   */
  async deleteFolder(folderId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/folder-delete/${folderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to delete folder:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting folder:', error)
      return false
    }
  }

  /**
   * Build a folder tree structure from flat list
   */
  buildFolderTree(folders: Folder[]): FolderNode[] {
    const folderMap = new Map<string, FolderNode>()
    const rootFolders: FolderNode[] = []

    // Create folder nodes
    folders.forEach(folder => {
      folderMap.set(folder.path, {
        ...folder,
        children: [],
      })
    })

    // Build tree structure
    folders.forEach(folder => {
      const node = folderMap.get(folder.path)
      if (!node) return

      if (folder.parent_path === '/' || !folder.parent_path) {
        rootFolders.push(node)
      } else {
        const parent = folderMap.get(folder.parent_path)
        if (parent) {
          parent.children.push(node)
        } else {
          // Parent doesn't exist, add to root
          rootFolders.push(node)
        }
      }
    })

    return rootFolders
  }
}

export interface FolderNode extends Folder {
  children: FolderNode[]
}