    if (folderName && folderName.trim()) {
      console.log('🔄 App: Creating folder:', folderName);
      // Add folder to current categories if it doesn't exist
      if (!folderTree[folderName.trim()]) {
        setCurrentFolder(folderName.trim());
      }
    }
  }, [folderTree]);
  // Render Loading State
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading files...</p>
        </div>
      </div>
    );
  }
  // Render Error State
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <p className="text-red-600 mb-4 text-lg">Error loading files: {error}</p>
          <button
            onClick={loadFiles}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  // Main Render
  return (
    <div
      className="h-screen flex flex-col bg-gray-50"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📁 Enhanced File Manager</h1>
            <p className="text-sm text-gray-600 mt-1">
              {files.length} total files • {currentFiles.length} in {currentFolder}
              {selectedFiles.length > 0 && ` • ${selectedFiles.length} selected`}
            </p>
          </div>
         
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🔲 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📋 List
              </button>
            </div>
            {/* Upload Button */}
            <UploadButton
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
            />
            {/* Refresh Button */}
            <button
              onClick={loadFiles}
              disabled={loading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <FolderTree
          folderTree={folderTree}
          currentFolder={currentFolder}
          setCurrentFolder={setCurrentFolder}
          expandedFolders={expandedFolders}
          setExpandedFolders={setExpandedFolders}
          setContextMenu={setContextMenu}
          onCreateFolder={handleCreateFolder}
        />
        {/* File Display Area */}
        <FileGrid
          files={currentFiles}
          viewMode={viewMode}
          onFileRightClick={handleFileRightClick}
          onFileClick={handleFileClick}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelectToggle}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
        />
      </div>
      {/* Upload Progress */}
      <ProgressBar
        uploads={uploads}
        onClose={() => setUploads([])}
      />
      {/* Batch Operations Panel */}
      <BatchOperationsPanel
        selectedFiles={selectedFiles}
        onClose={() => setShowBatchPanel(false)}
        onBatchUpdate={handleBatchUpdate}
        onBatchDelete={handleBatchDelete}
        onBatchMove={handleBatchMove}
      />
      {/* Upload Metadata Form */}
      <UploadMetadataForm
        isOpen={showUploadForm}
        onClose={() => {
          setShowUploadForm(false);
          setPendingFiles([]);
        }}
        onSubmit={handleUploadSubmit}
        initialData={{ category: currentFolder }}
      />
      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={closeContextMenu}
        onAction={handleContextAction}
      />
      {/* File Details Modal */}
      <FileDetailsModal
        file={selectedFile}
        isOpen={showFileDetails}
        onClose={() => {
          setShowFileDetails(false);
          setSelectedFile(null);
        }}
        onUpdate={handleFileUpdate}
        onDelete={handleFileDelete}
      />
      {/* Drag and Drop Overlay */}
      <DragDropOverlay isDragOver={isDragOver} />
    </div>
  );
}
