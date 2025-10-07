<old_str>     const handleUpload = async () => {
       if (!uploadFiles || uploadFiles.length === 0) return
       
       setIsUploading(true)
       try {
         // This would integrate with your actual upload service
         // For now, we'll simulate the upload
         console.log('Uploading files to folder:', selectedFolder)
         console.log('Files:', Array.from(uploadFiles))

         // Close modal and refresh
         setIsUploadModalOpen(false)
         setUploadFiles(null)
         await loadFiles() // Refresh file list
       } catch (error) {
         console.error('Upload failed:', error)
         setError('Upload failed. Please try again.')
       } finally {
         setIsUploading(false)
       }
     }</old_str><new_str>     const handleUpload = async () => {
       if (!uploadFiles || uploadFiles.length === 0) return
       
       setIsUploading(true)
       try {
         // Import the integrated upload service
         const { IntegratedUploadService } = await import('./services/IntegratedUploadService');
         const uploadService = new IntegratedUploadService();

         // Prepare files for integrated upload
         const uploadPromises = Array.from(uploadFiles).map(file => ({
           file,
           title: file.name.split('.')[0],
           description: `Uploaded file: ${file.name}`,
           category: 'Files',
           tags: '',
           folder_path: selectedFolder
         }));

         // Upload to Cloudinary, Xano, and Webflow
         console.log('🚀 Starting integrated upload to Cloudinary, Xano, and Webflow...');
         const results = await uploadService.uploadMultipleFiles(
           uploadPromises,
           (fileIndex, progress, fileName) => {
             console.log(`📤 Upload progress for ${fileName}: ${progress}%`);
           }
         );

         console.log('✅ Upload complete:', results);
         
         // Close modal and refresh
         setIsUploadModalOpen(false);
         setUploadFiles(null);
         await loadFiles(); // Refresh file list
         
         // Show success message
         setError(null);
         console.log('🎉 Files successfully uploaded to Cloudinary, Xano, and Webflow!');
         
       } catch (error) {
         console.error('Upload failed:', error);
         setError(`Upload failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
       } finally {
         setIsUploading(false);
       }
     }</new_str>