export class PreviewService {
  static renderPreview(file: any) {
    console.log('PreviewService.renderPreview called with:', file);
    console.log('file.file_type:', file.file_type);
    console.log('file.media_url:', file.media_url);
    
    // Handle image files
    if (file.file_type.startsWith('image/')) {
      console.log('✅ Matched image file type, rendering <img>');
      return <img src={file.media_url} alt={file.title} className="max-w-full max-h-96 object-contain" />;
    }
    
    // Handle video files
    if (file.file_type.startsWith('video/')) {
      console.log('✅ Matched video file type, rendering <video>');
      return <video src={file.media_url} controls className="max-w-full max-h-96" />;
    }
    
    // Handle audio files
    if (file.file_type.startsWith('audio/')) {
      console.log('✅ Matched audio file type, rendering <audio>');
      return <audio src={file.media_url} controls className="w-full" />;
    }
    
    // Handle PDF files
    console.log('Checking PDF: file.file_type.includes("pdf"):', file.file_type.includes('pdf'));
    if (file.file_type.includes('pdf')) {
      console.log('✅ Matched PDF file type, rendering native PDF embed');
      return (
        <object 
          data={file.media_url}
          type="application/pdf"
          className="w-full h-96"
          title={file.title}
        >
          <p className="p-4 text-center">
            Unable to display PDF. 
            <a 
              href={file.media_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              Download PDF
            </a>
          </p>
        </object>
      );
    }
    
    // Handle Office documents (Word, Excel, PowerPoint)
    const isOffice = this.isOfficeDocument(file.file_type, file.media_url);
    console.log('Checking Office document: isOfficeDocument():', isOffice);
    if (isOffice) {
      console.log('✅ Matched Office document type, rendering Microsoft Office Online viewer');
      return (
        <iframe 
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.media_url)}`}
          className="w-full h-96" 
          title={file.title}
        />
      );
    }
    
    // Handle text files
    const isText = file.file_type.startsWith('text/') || this.isTextDocument(file.media_url);
    console.log('Checking text file:', isText);
    if (isText) {
      console.log('✅ Matched text file type');
      return (
        <div className="p-4 bg-gray-100 rounded max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-700">Text preview not implemented in this demo</p>
        </div>
      );
    }
    
    // Fallback for unsupported file types
    console.log('❌ No file type matched, showing fallback');
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
