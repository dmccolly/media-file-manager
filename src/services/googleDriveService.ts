import { gapi } from 'gapi-script';

const CLIENT_ID = 'YOUR_CLIENT_ID'; // Will need to be configured
const API_KEY = 'YOUR_API_KEY'; // Will need to be configured
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export class GoogleDriveService {
  private static instance: GoogleDriveService;
  private isInitialized = false;

  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  async init() {
    if (this.isInitialized) return;

    return new Promise<void>((resolve, reject) => {
      gapi.load('client:auth2', () => {
        gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        }).then(() => {
          this.isInitialized = true;
          resolve();
        }).catch(reject);
      });
    });
  }

  async signIn() {
    await this.init();
    const GoogleAuth = gapi.auth2.getAuthInstance();
    return GoogleAuth.signIn();
  }

  async signOut() {
    const GoogleAuth = gapi.auth2.getAuthInstance();
    return GoogleAuth.signOut();
  }

  isSignedIn() {
    const GoogleAuth = gapi.auth2.getAuthInstance();
    return GoogleAuth.isSignedIn.get();
  }

  async createFolder(name: string, parentId?: string) {
    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    };

    try {
      const response = await gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id, name, webViewLink, mimeType',
      });
      return response.result;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async listFolders(parentId?: string) {
    try {
      let query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      const response = await gapi.client.drive.files.list({
        q: query,
        pageSize: 100,
        fields: 'files(id, name, webViewLink, mimeType, parents)',
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error listing folders:', error);
      throw error;
    }
  }

  async listFiles(folderId?: string) {
    try {
      let query = "trashed=false";
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      } else {
        query += " and mimeType!='application/vnd.google-apps.folder'";
      }

      const response = await gapi.client.drive.files.list({
        q: query,
        pageSize: 100,
        fields: 'files(id, name, webViewLink, mimeType, size, createdTime, modifiedTime, parents)',
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async uploadFile(file: File, folderId?: string) {
    const fileMetadata = {
      name: file.name,
      parents: folderId ? [folderId] : undefined,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
        body: form,
      });

      return response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string) {
    try {
      await gapi.client.drive.files.delete({
        fileId: fileId,
      });
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async moveFile(fileId: string, newParentId: string) {
    try {
      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'parents',
      });

      const previousParents = response.result.parents?.join(',') || '';
      
      await gapi.client.drive.files.update({
        fileId: fileId,
        addParents: newParentId,
        removeParents: previousParents,
        fields: 'id, parents',
      });

      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      throw error;
    }
  }

  async downloadFile(fileId: string) {
    try {
      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
      });

      return response.body;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
}