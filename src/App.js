const PreviewModal = ({ file }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex">
        
        {/* Left Side - Content Preview */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-r">
            <div className="flex items-center space-x-3">
              {getTypeIcon(file.type)}
              <h3 className="text-lg font-semibold">{file.title || file.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(file.status)}`}>
                {file.status}
              </span>
            </div>
            <button 
              onClick={() => setPreviewModal(null)} 
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-6 flex items-center justify-center bg-gray-50 border-r overflow-auto">
            {file.type === 'graphic' && (
              <img 
                src={file.url} 
                alt={file.name} 
                className="max-w-full max-h-full object-contain rounded shadow-lg" 
              />
            )}
            
            {file.type === 'video' && (
              <video 
                controls 
                className="max-w-full max-h-full rounded shadow-lg"
                style={{ maxHeight: '70vh' }}
              >
                <source src={file.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            
            {file.type === 'audio' && (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                  <Music className="w-16 h-16 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-4">{file.title || file.name}</h4>
                <audio controls className="mx-auto">
                  <source src={file.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            
            {file.type === 'document' && (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                  <FileText className="w-16 h-16 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-4">{file.title || file.name}</h4>
                <p className="mb-6 text-gray-600">Document preview not available</p>
                <button
                  onClick={() => window.open(file.url, '_blank')}
                  className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in new tab
                </button>
              </div>
            )}
            
            {file.type === 'other' && (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                  <File className="w-16 h-16 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-4">{file.title || file.name}</h4>
                <p className="mb-6 text-gray-600">Preview not available for this file type</p>
                <button
                  onClick={() => window.open(file.url, '_blank')}
                  className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open file
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Database Card */}
        <div className="w-96 bg-white flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">Database Record</h3>
            <p className="text-sm text-gray-600">Complete file metadata and properties</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Basic Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <File className="w-4 h-4 mr-2" />
                Basic Information
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">File Name:</span>
                  <div className="text-gray-900 mt-1">{file.name}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Title:</span>
                  <div className="text-gray-900 mt-1">{file.title || 'No title set'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <div className="text-gray-900 mt-1 capitalize">{file.type}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Size:</span>
                  <div className="text-gray-900 mt-1">{file.size}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(file.status)}`}>
                    {file.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Details */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Content Details
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <div className="text-gray-900 mt-1 max-h-24 overflow-y-auto">
                    {file.description || 'No description provided'}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Notes:</span>
                  <div className="text-gray-900 mt-1 max-h-24 overflow-y-auto">
                    {file.notes || 'No notes available'}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tags:</span>
                  <div className="mt-1">
                    {file.tags && file.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {file.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No tags assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Project & Team */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Project & Team
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Project:</span>
                  <div className="text-gray-900 mt-1">{file.project || 'Not assigned to project'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created By:</span>
                  <div className="text-gray-900 mt-1">{file.createdBy}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Submitted By:</span>
                  <div className="text-gray-900 mt-1">{file.submittedBy || 'Not specified'}</div>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Technical Details
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Version:</span>
                  <div className="text-gray-900 mt-1">{file.version}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <div className="text-gray-900 mt-1">{file.modified}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Modified:</span>
                  <div className="text-gray-900 mt-1">{file.modified}</div>
                </div>
                {file.uploadedAt && (
                  <div>
                    <span className="font-medium text-gray-700">Uploaded:</span>
                    <div className="text-gray-900 mt-1">{new Date(file.uploadedAt).toLocaleString()}</div>
                  </div>
                )}
                {file.mimeType && (
                  <div>
                    <span className="font-medium text-gray-700">MIME Type:</span>
                    <div className="text-gray-900 mt-1 font-mono text-xs">{file.mimeType}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Relationships */}
            {file.relatedTo && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Link className="w-4 h-4 mr-2" />
                  Relationships
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Related To:</span>
                    <div className="text-gray-900 mt-1">{file.relatedTo}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => downloadFile(file)}
                  className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </button>
                
                <button
                  onClick={() => window.open(file.url, '_blank')}
                  className="w-full flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </button>
                
                <button
                  className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Metadata
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
