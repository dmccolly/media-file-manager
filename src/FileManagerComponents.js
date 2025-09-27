// =============================================
// UTILITY FUNCTIONS & UI COMPONENTS
// =============================================
const getFileIcon = (type, size = 'text-2xl') => {
  const icons = { image: '🖼️', video: '🎥', audio: '🎵', document: '📄', spreadsheet: '📊', presentation: '📽️', archive: '📦', file: '📁', unknown: '❓' };
  return <span className={size}>{icons[type] || icons.unknown}</span>;
};

const formatFileSize = bytes => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = dateString => {
  if (!dateString) return 'Unknown';
  try { return new Date(dateString).toLocaleDateString(); } catch { return 'Invalid Date'; }
};

const SelectionControls = ({ files, selectedFiles, onSelectAll, onClearSelection }) => (
  <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 rounded-lg">
    <button onClick={onSelectAll} className="text-sm text-blue-600 hover:text-blue-800">Select All ({files.length})</button>
    <span className="text-gray-400">|</span>
    <button onClick={onClearSelection} className="text-sm text-gray-600 hover:text-gray-800">Clear Selection</button>
    {selectedFiles.length > 0 && (<><span className="text-gray-400">|</span><span className="text-sm font-medium text-blue-800">{selectedFiles.length} selected</span></>)}
  </div>
);

const FolderTree = ({ folderTree, currentFolder, setCurrentFolder, expandedFolders, setExpandedFolders, setContextMenu, onCreateFolder }) => (
  <div className="w-64 sidebar-dark bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-white">Folders</h3>
      <button onClick={onCreateFolder} className="text-blue-400 hover:text-blue-300 text-sm font-medium" title="Create New Folder">+ New</button>
    </div>
    <div className="space-y-1">
      {Object.entries(folderTree).map(([folder, count]) => (
        <div key={folder} className="group">
          <div
            className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-700 transition-colors ${currentFolder === folder ? 'bg-blue-900 text-blue-300 font-medium' : 'text-gray-300'}`}
            onClick={() => setCurrentFolder(folder)}
            onContextMenu={e => setContextMenu({ show: true, x: e.clientX, y: e.clientY, type: 'folder', target: folder })}
          >
            <span className="w-4 h-4 mr-2">📁</span>
            <span className="flex-1 truncate">{folder}</span>
            <span className="text-xs text-gray-400 ml-2 bg-gray-700 px-1 rounded">{count}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UploadButton = ({ onFileSelect, isUploading }) => {
  const handleFileSelect = e => {
    const files = Array.from(e.target.files);
    if (files.length > 0) onFileSelect(files);
    e.target.value = '';
  };
  return (
    <div className="relative">
      <input type="file" multiple onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading} />
      <button className={`px-4 py-2 rounded-lg font-medium transition-colors ${isUploading ? 'bg-gray-600 cursor-not-allowed text-gray-400' : 'button-primary shadow-sm'}`} disabled={isUploading}>
        {isUploading ? '⏳ Uploading...' : '📤 Upload Files'}
      </button>
    </div>
  );
};

const FileGrid = ({ files, viewMode, onFileRightClick, onFileClick, selectedFiles, onFileSelect, onSelectAll, onClearSelection }) => {
  const [imageErrors, setImageErrors] = useState(new Set());
  const handleImageError = fileId => setImageErrors(prev => new Set([...prev, fileId]));
  const isSelected = file => selectedFiles.some(f => f.id === file.id);

  if (files.length === 0) {
    return (<div className="flex-1 flex items-center justify-center text-gray-400"><div className="text-center"><div className="text-6xl mb-4">📁</div><p className="text-lg font-medium mb-2">No files in this folder</p><p className="text-sm">Drag files here or use the upload button</p></div></div>);
  }
  
  const SelectionControls = () => (
    <div className="flex items-center gap-2 mb-4 p-2 bg-gray-800 rounded-lg">
      <button onClick={onSelectAll} className="text-sm text-blue-400 hover:text-blue-300">Select All ({files.length})</button>
      <span className="text-gray-500">|</span>
      <button onClick={onClearSelection} className="text-sm text-gray-300 hover:text-white">Clear Selection</button>
      {selectedFiles.length > 0 && (<><span className="text-gray-500">|</span><span className="text-sm font-medium text-blue-300">{selectedFiles.length} selected</span></>)}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <SelectionControls />
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"><input type="checkbox" checked={selectedFiles.length === files.length} onChange={selectedFiles.length === files.length ? onClearSelection : onSelectAll} className="rounded" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {files.map(file => (
                <tr key={file.id} className={`hover:bg-gray-700 cursor-pointer transition-colors ${isSelected(file) ? 'bg-gray-600' : ''}`} onContextMenu={e => onFileRightClick(e, file)} onClick={() => onFileClick(file)}>
                  <td className="px-4 py-3"><input type="checkbox" checked={isSelected(file)} onChange={e => onFileSelect(file, e)} className="rounded" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="mr-3">{getFileIcon(file.type, 'text-lg')}</div>
                      <div>
                        <div className="font-medium text-white truncate" title={file.title}>{file.title}</div>
                        {file.description && (<div className="text-xs text-gray-400 truncate">{file.description}</div>)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300 capitalize">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-200">{file.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{formatFileSize(file.fileSize)}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{formatDate(file.uploadDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-auto">
      <SelectionControls />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {files.map(file => (
          <div key={file.id} className={`relative file-item-dark bg-gray-800 border-2 rounded-lg p-3 hover:shadow-lg cursor-pointer transition-all duration-200 group ${isSelected(file) ? 'border-blue-500 bg-gray-700 shadow-md' : 'border-gray-600 hover:border-gray-500'}`} onContextMenu={e => onFileRightClick(e, file)} onClick={() => onFileClick(file)}>
            <div className="absolute top-2 left-2 z-10"><input type="checkbox" checked={isSelected(file)} onChange={e => onFileSelect(file, e)} className="rounded shadow-sm" /></div>
            <div className="aspect-square mb-2 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
              {file.thumbnail ? (
                <img src={file.thumbnail} alt={file.title} className="w-full h-full object-cover rounded-lg" onError={() => handleImageError(file.id)} loading="lazy" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">{getFileIcon(file.type, 'text-3xl')}<span className="text-xs text-gray-500 mt-1 uppercase font-medium">{file.type || 'unknown'}</span></div>
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium truncate text-white" title={file.title}>{file.title}</p>
              <p className="text-xs text-gray-400 truncate">{formatFileSize(file.fileSize)}</p>
              {file.tags && (<p className="text-xs text-blue-400 truncate mt-1">{file.tags}</p>)}
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <button onClick={e => {e.stopPropagation(); onFileRightClick(e, file);}} className="bg-gray-800 bg-opacity-90 hover:bg-opacity-100 text-white p-2 rounded-full shadow-sm" title="More options">⋯</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FileDetailsModal = ({ file, isOpen, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  useEffect(() => {
    if (file) setEditData({ title: file.title || '', description: file.description || '', notes: file.notes || '', tags: file.tags || '', station: file.station || '', category: file.category || '' });
  }, [file]);
  const handleSave = () => { onUpdate(file.id, { 'Title': editData.title, 'Description': editData.description, 'Notes': editData.notes, 'Tags': editData.tags, 'Station': editData.station, 'Category': editData.category }); setIsEditing(false); };
  const handleCancel = () => { if (file) setEditData({ title: file.title || '', description: file.description || '', notes: file.notes || '', tags: file.tags || '', station: file.station || '', category: file.category || '' }); setIsEditing(false); };
  if (!isOpen || !file) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div className="flex items-center gap-3">{getFileIcon(file.type, 'text-2xl')}<div><h2 className="text-xl font-semibold text-gray-900">{file.title}</h2><p className="text-sm text-gray-500">{file.category} • {formatFileSize(file.fileSize)}</p></div></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{isEditing ? 'Cancel' : '✏️ Edit'}</button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">✕</button>
          </div>
        </div>
        <div className="flex h-[calc(90vh-120px)]">
          <div className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
            {file.type === 'image' && file.url && (<img src={file.url} alt={file.title} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />)}
            {file.type === 'video' && file.url && (<video src={file.url} controls className="max-w-full max-h-full object-contain rounded-lg shadow-sm">Your browser does not support video playback.</video>)}
            {file.type === 'audio' && file.url && (<div className="text-center"><div className="text-6xl mb-4">🎵</div><audio src={file.url} controls className="w-full max-w-md">Your browser does not support audio playback.</audio></div>)}
            {!['image', 'video', 'audio'].includes(file.type) && (<div className="text-center"><div className="text-6xl mb-4">{getFileIcon(file.type, 'text-6xl')}</div><p className="text-gray-600 mb-4">Preview not available for this file type</p>{file.url && (<a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">📄 Open File</a>)}</div>)}
          </div>
          <div className="w-96 p-6 overflow-y-auto border-l bg-white">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">File Details</h3>
            {isEditing ? (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="Images">Images</option><option value="Video">Video</option><option value="Audio">Audio</option><option value="Documents">Documents</option><option value="Files">Files</option><option value="product">Product</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Station</label><input type="text" value={editData.station} onChange={e => setEditData({...editData, station: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} rows={2} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tags</label><input type="text" value={editData.tags} onChange={e => setEditData({...editData, tags: e.target.value})} placeholder="tag1, tag2, tag3" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
                <div className="flex gap-2 pt-4"><button onClick={handleSave} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">💾 Save Changes</button><button onClick={handleCancel} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-700 block mb-1">File Type</span><span className="text-sm text-gray-900 capitalize">{file.type}</span></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-700 block mb-1">Size</span><span className="text-sm text-gray-900">{formatFileSize(file.fileSize)}</span></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-700 block mb-1">Upload Date</span><span className="text-sm text-gray-900">{formatDate(file.uploadDate)}</span></div>
                  {file.station && (<div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-700 block mb-1">Station</span><span className="text-sm text-gray-900">{file.station}</span></div>)}
                  {file.description && (<div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-700 block mb-1">Description</span><span className="text-sm text-gray-900">{file.description}</span></div>)}
                  {file.notes && (<div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-700 block mb-1">Notes</span><span className="text-sm text-gray-900">{file.notes}</span></div>)}
                  {file.tags && (<div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-700 block mb-1">Tags</span><div className="flex flex-wrap gap-1">{file.tags.split(',').map((tag, index) => (<span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{tag.trim()}</span>))}</div></div>)}
                  {file.url && (<div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-700 block mb-1">File URL</span><a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 break-all">{file.url}</a></div>)}
                </div>
                <div className="pt-4 border-t"><button onClick={() => onDelete(file)} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">🗑️ Delete File</button></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BatchOperationsPanel = ({ selectedFiles, onClose, onBatchUpdate, onBatchDelete, onBatchMove }) => {
  const [batchAction, setBatchAction] = useState('');
  const [batchData, setBatchData] = useState({ category: '', tags: '', station: '', description: '', notes: '' });
  const handleBatchUpdate = () => {
    const updates = selectedFiles.map(file => ({ id: file.id, fields: { ...(batchData.category && { 'Category': batchData.category }), ...(batchData.tags && { 'Tags': batchData.tags }), ...(batchData.station && { 'Station': batchData.station }), ...(batchData.description && { 'Description': batchData.description }), ...(batchData.notes && { 'Notes': batchData.notes }) } }));
    onBatchUpdate(updates);
  };
  if (selectedFiles.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 z-40">
      <div className="flex items-center justify-between mb-3"><h4 className="font-medium text-gray-800">Batch Operations ({selectedFiles.length} files)</h4><button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button></div>
      <div className="space-y-3">
        <div className="flex gap-2">
          <select value={batchAction} onChange={e => setBatchAction(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded text-sm"><option value="">Choose Action</option><option value="update">Update Fields</option><option value="move">Move to Category</option><option value="delete">Delete Files</option></select>
        </div>
        {batchAction === 'update' && (<div className="space-y-2"><select value={batchData.category} onChange={e => setBatchData({...batchData, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded text-sm"><option value="Images">Images</option><option value="Video">Video</option><option value="Audio">Audio</option><option value="Documents">Documents</option><option value="Files">Files</option></select><input type="text" placeholder="Tags (append/replace)" value={batchData.tags} onChange={e => setBatchData({...batchData, tags: e.target.value})} className="w-full p-2 border border-gray-300 rounded text-sm" /><input type="text" placeholder="Station" value={batchData.station} onChange={e => setBatchData({...batchData, station: e.target.value})} className="w-full p-2 border border-gray-300 rounded text-sm" /><button onClick={handleBatchUpdate} className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Update {selectedFiles.length} Files</button></div>)}
        {batchAction === 'move' && (<div className="space-y-2"><select value={batchData.category} onChange={e => setBatchData({...batchData, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded text-sm"><option value="">Select Destination</option><option value="Images">Images</option><option value="Video">Video</option><option value="Audio">Audio</option><option value="Documents">Documents</option><option value="Files">Files</option></select><button onClick={() => onBatchMove(selectedFiles, batchData.category)} disabled={!batchData.category} className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400">Move {selectedFiles.length} Files</button></div>)}
        {batchAction === 'delete' && (<div className="space-y-2"><p className="text-sm text-red-600">This will permanently delete {selectedFiles.length} files.</p><button onClick={() => onBatchDelete(selectedFiles)} className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">🗑️ Delete {selectedFiles.length} Files</button></div>)}
      </div>
    </div>
  );
};

const ContextMenu = ({ contextMenu, onClose, onAction }) => {
  if (!contextMenu.show) return null;
  const handleAction = (action) => { onAction(action, contextMenu.target); onClose(); };
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="fixed bg-white border border-gray-300 rounded-lg shadow-xl py-2 z-50 min-w-48" style={{ left: contextMenu.x, top: contextMenu.y }}>
        {contextMenu.type === 'file' ? (<><button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2" onClick={() => handleAction('view')}>👁️ View Details</button><button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2" onClick={() => handleAction('download')}>💾 Download</button><button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2" onClick={() => handleAction('rename')}>✏️ Rename</button><button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2" onClick={() => handleAction('move')}>📁 Move to Category</button><hr className="my-1" /><button className="w-full px-4 py-2 text-left hover:bg-red-50 text-sm text-red-600 flex items-center gap-2" onClick={() => handleAction('delete')}>🗑️ Delete</button></>) : (<><button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2" onClick={() => handleAction('rename')}>✏️ Rename Folder</button><button className="w-full px-4 py-2 text-left hover:bg-red-50 text-sm text-red-600 flex items-center gap-2" onClick={() => handleAction('delete')}>🗑️ Delete Folder</button></>)}
      </div>
    </div>
  );
};

const UploadMetadataForm = ({ isOpen, onClose, onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({ category: initialData.category || 'Images', station: initialData.station || '', description: initialData.description || '', notes: initialData.notes || '', tags: initialData.tags || '', ...initialData });
  const handleSubmit = e => { e.preventDefault(); onSubmit(formData); };
  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Upload Settings</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={formData.category} onChange={e => handleChange('category', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="Images">Images</option><option value="Video">Video</option><option value="Audio">Audio</option><option value="Documents">Documents</option><option value="Files">Files</option><option value="product">Product</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Station</label><input type="text" value={formData.station} onChange={e => setFormData({...formData, station: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tags</label><input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
          <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Upload Files</button></div>
        </form>
      </div>
    </div>
  );
};

const DragDropOverlay = ({ isDragOver }) => {
  if (!isDragOver) return null;
  return (
    <div className="fixed inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-12 shadow-2xl text-center border-4 border-dashed border-blue-400">
        <div className="text-6xl mb-4">📤</div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Drop files to upload</h3>
        <p className="text-gray-600">Release to start uploading to the current folder</p>
      </div>
    </div>
  );
};

const ProgressBar = ({ uploads, onClose }) => {
  if (!uploads || uploads.length === 0) return null;
  const overallProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0) / uploads.length;
  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-64 overflow-y-auto z-50">
      <div className="flex items-center justify-between mb-2"><h4 className="font-medium text-gray-800">Uploading Files</h4><button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button></div>
      <div className="mb-3"><div className="flex justify-between text-sm text-gray-600 mb-1"><span>Overall Progress</span><span>{Math.round(overallProgress)}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${overallProgress}%` }} /></div></div>
      <div className="space-y-2">
        {uploads.map((upload, index) => (
          <div key={index} className="text-sm"><div className="flex justify-between text-gray-600 mb-1"><span className="truncate">{upload.name}</span><span>{upload.progress}%</span></div><div className="w-full bg-gray-200 rounded-full h-1"><div className={`h-1 rounded-full transition-all duration-300 ${upload.progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${overallProgress}%` }} /></div></div>
        ))}
      </div>
    </div>
  );
};

export {
  getFileIcon,
  formatFileSize,
  formatDate,
  SelectionControls,
  FolderTree,
  UploadButton,
  FileGrid,
  FileDetailsModal,
  BatchOperationsPanel,
  ContextMenu,
  UploadMetadataForm,
  DragDropOverlay,
  ProgressBar
};

function UnusedDuplicateApp() {
  const xanoService = useMemo(() => new XanoService(), []);
  const cloudinaryService = useMemo(() => new CloudinaryService(), []);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('Images');
  const [viewMode, setViewMode] = useState('grid');
  const [expandedFolders, setExpandedFolders] = useState(['Images', 'Video', 'Audio']);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: '', target: null });
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showBatchPanel, setShowBatchPanel] = useState(false);

  const folderTree = useMemo(() => {
    const tree = {};
    files.forEach(file => {
      const category = file.category || 'uncategorized';
      tree[category] = (tree[category] || 0) + 1;
    });
    return tree;
  }, [files]);

  const currentFiles = useMemo(() => files.filter(file => file.category === currentFolder), [files, currentFolder]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedFiles = await xanoService.fetchAllFiles();
      setFiles(loadedFiles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [xanoService]);

  useEffect(() => { loadFiles(); }, [loadFiles]);
  useEffect(() => { setSelectedFiles([]); setShowBatchPanel(false); }, [currentFolder]);
  const startUpload = useCallback(async (selectedFiles, metadata) => {
    setIsUploading(true);
    setUploads(selectedFiles.map(file => ({ name: file.name, progress: 0 })));
    setShowUploadForm(false);
    try {
      const result = await cloudinaryService.uploadMultipleFiles(selectedFiles, metadata, (fileIndex, progress, fileName) => setUploads(prev => prev.map((upload, index) => index === fileIndex ? { ...upload, progress } : upload)));
      const savePromises = result.successful.map(fileData => xanoService.saveFile(fileData));
      await Promise.all(savePromises);
      if (result.failed.length > 0) alert(`Upload complete! ${result.successful.length} files uploaded successfully, ${result.failed.length} failed.`);
      else alert(`All ${result.successful.length} files uploaded successfully!`);
      await loadFiles();
      setUploads([]);
      setPendingFiles([]);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  }, [cloudinaryService, xanoService, loadFiles]);
  const handleFileSelect = useCallback(files => { setPendingFiles(files); setShowUploadForm(true); }, []);
  const handleUploadSubmit = useCallback(metadata => { if (pendingFiles.length > 0) startUpload(pendingFiles, metadata); }, [pendingFiles, startUpload]);
  const handleFileSelectToggle = useCallback(file => setSelectedFiles(prev => prev.some(f => f.id === file.id) ? prev.filter(f => f.id !== file.id) : [...prev, file]), []);
  const handleSelectAll = useCallback(() => { setSelectedFiles(currentFiles); setShowBatchPanel(true); }, [currentFiles]);
  const handleClearSelection = useCallback(() => { setSelectedFiles([]); setShowBatchPanel(false); }, []);
  useEffect(() => { setShowBatchPanel(selectedFiles.length > 0); }, [selectedFiles]);
  const handleDragOver = useCallback(e => { e.preventDefault(); if (!isDragOver) setIsDragOver(true); }, [isDragOver]);
  const handleDragLeave = useCallback(e => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); }, []);
  const handleDrop = useCallback(e => { e.preventDefault(); setIsDragOver(false); const files = Array.from(e.dataTransfer.files); if (files.length > 0) handleFileSelect(files); }, [handleFileSelect]);
  const handleFileClick = useCallback(file => { setSelectedFile(file); setShowFileDetails(true); }, []);
  const handleFileRightClick = useCallback((e, file) => { e.preventDefault(); setContextMenu({ show: true, x: e.clientX, y: e.clientY, type: 'file', target: file }); }, []);
  const handleContextAction = useCallback(async (action, target) => {
    try {
      switch (action) {
        case 'view': setSelectedFile(target); setShowFileDetails(true); break;
        case 'download': if (target.url) window.open(target.url, '_blank'); break;
        case 'rename': { const newTitle = prompt('Enter new name:', target.title); if (newTitle && newTitle !== target.title) { await xanoService.updateFile(target.id, { 'Title': newTitle }); await loadFiles(); } break; }
        case 'move': { const categories = ['Images', 'Video', 'Audio', 'Documents', 'Files', 'Product']; const newCategory = prompt('Move to category:\n' + categories.join(', '), target.category); if (newCategory && categories.includes(newCategory) && newCategory !== target.category) { await xanoService.updateFile(target.id, { 'Category': newCategory }); await loadFiles(); } break; }
        case 'delete': if (confirm(`Are you sure you want to delete "${target.title}"?`)) { await xanoService.deleteFile(target.id); await loadFiles(); } break;
      }
    } catch (error) { alert('Action failed: ' + error.message); }
  }, [xanoService, loadFiles]);
  const closeContextMenu = useCallback(() => setContextMenu({ show: false, x: 0, y: 0, type: '', target: null }), []);
  const handleFileUpdate = useCallback(async (fileId, updates) => { try { await xanoService.updateFile(fileId, updates); await loadFiles(); alert('File updated successfully!'); } catch (error) { alert('Error updating file: ' + error.message); } }, [xanoService, loadFiles]);
  const handleFileDelete = useCallback(async file => { if (confirm(`Are you sure you want to delete "${file.title}"?`)) { try { await xanoService.deleteFile(file.id); await loadFiles(); setShowFileDetails(false); alert('File deleted successfully!'); } catch (error) { alert('Error deleting file: ' + error.message); } } }, [xanoService, loadFiles]);
  const handleBatchUpdate = useCallback(async updates => { try { await xanoService.updateMultipleFiles(updates); await loadFiles(); setSelectedFiles([]); alert(`Successfully updated ${updates.length} files!`); } catch (error) { alert('Error updating files: ' + error.message); } }, [xanoService, loadFiles]);
  const handleBatchDelete = useCallback(async filesToDelete => { if (confirm(`Are you sure you want to delete ${filesToDelete.length} files? This cannot be undone.`)) { try { const recordIds = filesToDelete.map(f => f.id); await xanoService.deleteMultipleFiles(recordIds); await loadFiles(); setSelectedFiles([]); alert(`Successfully deleted ${filesToDelete.length} files!`); } catch (error) { alert('Error deleting files: ' + error.message); } } }, [xanoService, loadFiles]);
  const handleBatchMove = useCallback(async (filesToMove, newCategory) => { try { const updates = filesToMove.map(file => ({ id: file.id, fields: { 'Category': newCategory } })); await xanoService.updateMultipleFiles(updates); await loadFiles(); setSelectedFiles([]); alert(`Successfully moved ${filesToMove.length} files to ${newCategory}!`); } catch (error) { alert('Error moving files: ' + error.message); } }, [xanoService, loadFiles]);
  const handleCreateFolder = useCallback(() => { const folderName = prompt('Enter folder name:'); if (folderName && folderName.trim() && !folderTree[folderName.trim()]) { setCurrentFolder(folderName.trim()); } }, [folderTree]);

  if (loading) { return (<div className="h-screen flex items-center justify-center bg-gray-900"><div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div><p className="text-white text-lg">Loading files...</p></div></div>); }
  if (error) { return (<div className="h-screen flex items-center justify-center bg-gray-900"><div className="text-center"><div className="text-red-500 text-6xl mb-4">❌</div><p className="text-red-600 mb-4 text-lg">Error loading files: {error}</p><button onClick={loadFiles} className="button-primary px-6 py-3 rounded-lg transition-colors">Try Again</button></div></div>); }
  return null;
};
