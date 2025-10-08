export class PreviewService {
  static renderPreview(file: any) {
    console.log('PreviewService.renderPreview called with:', file);
    console.log('file.file_type:', file.file_type);
    console.log('file.media_url:', file.media_url);
    
    // Handle image files
    if (file.file_type.startsWith('image/')) {
      return <img src={file.media_url} alt={file.title} className="max-w-full max-h-96 object-contain" />;
    }
    
    // Handle video files
    if (file.file_type.startsWith('video/')) {
      return <video src={file.media_url} controls className="max-w-full max-h-96" />;
    }
    
    // Handle audio files
    if (file.file_type.startsWith('audio/')) {
      return <audio src={file.media_url} controls className="w-full" />;
    }
    
    // Handle PDF files
    if (file.file_type.includes('pdf')) {
      // Use Google Docs Viewer for PDF previews
      return (
        <iframe 
          src={`https://docs.google.com/gview?url=${encodeURIComponent(file.media_url)}&embedded=true`} 
          className="w-full h-96" 
          title={file.title}
          onError={(e) => {
            // Fallback to direct PDF embed if Google Docs Viewer fails
            const iframe = e.target as HTMLIFrameElement;
            iframe.src = file.media_url;
          }}
        />
      );
    }
    
    // Handle Office documents (Word, Excel, PowerPoint)
    if (this.isOfficeDocument(file.file_type, file.media_url)) {
      // Use Google Docs Viewer for Office document previews
      return (
        <iframe 
          src={`https://docs.google.com/gview?url=${encodeURIComponent(file.media_url)}&embedded=true`} 
          className="w-full h-96" 
          title={file.title}
        />
      );
    }
    
    // Handle text files
    if (file.file_type.startsWith('text/') || this.isTextDocument(file.media_url)) {
      return (
        <div className="p-4 bg-gray-100 rounded max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-700">Text preview not implemented in this demo</p>
        </div>
      );
    }
    
    // Fallback for unsupported file types
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-100 rounded">
        <p>Preview not available for this file type</p>
        <p className="text-sm mt-2">File type: {file.file_type}</p>
        <a 
          href={file.media_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Download File
        </a>
      </div>
    );
  }

  static isOfficeDocument(fileType: string, url: string): boolean {
    const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const officeTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    const lowerUrl = url.toLowerCase();
    return officeTypes.some(type => fileType.includes(type)) || 
           officeExtensions.some(ext => lowerUrl.includes(ext));
  }

  static isTextDocument(url: string): boolean {
    const textExtensions = ['.txt', '.rtf', '.md', '.json', '.xml', '.csv'];
    const lowerUrl = url.toLowerCase();
    return textExtensions.some(ext => lowerUrl.includes(ext));
  }
}
