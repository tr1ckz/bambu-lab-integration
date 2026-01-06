import React, { useState, useEffect } from 'react';
import './Library.css';
import ModelViewer from './ModelViewer';
import Toast from './Toast';
import LoadingScreen from './LoadingScreen';

interface LibraryFile {
  id: number;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  description: string;
  tags: string;
  createdAt: string;
}

interface LibraryProps {
  userRole?: string;
}

const Library: React.FC<LibraryProps> = ({ userRole }) => {
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [folderPath, setFolderPath] = useState('');
  const [scanning, setScanning] = useState(false);
  const [viewingModel, setViewingModel] = useState<LibraryFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);
  const [isDragging, setIsDragging] = useState(false);
  const [editingFile, setEditingFile] = useState<LibraryFile | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoTagging, setAutoTagging] = useState(false);
  const [autoTaggingAll, setAutoTaggingAll] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  
  const isAdmin = userRole === 'admin';

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/library');
      if (!response.ok) throw new Error('Failed to fetch library');
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Filter files based on search query
  const filteredFiles = files.filter(file => {
    const query = searchQuery.toLowerCase();
    return (
      file.originalName.toLowerCase().includes(query) ||
      file.description.toLowerCase().includes(query) ||
      file.tags.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      setUploading(true);
      const response = await fetch('/api/library/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      setToast({ message: 'File uploaded successfully!', type: 'success' });
      form.reset();
      fetchFiles();
    } catch (err) {
      setToast({ message: 'Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'), type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const uploadFiles = async (fileList: FileList) => {
    try {
      setUploading(true);
      
      // Upload each file
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < fileList.length; i++) {
        const formData = new FormData();
        formData.append('file', fileList[i]);

        try {
          const response = await fetch('/api/library/upload', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        setToast({ message: `Successfully uploaded ${successCount} file(s)${failCount > 0 ? `, ${failCount} failed` : ''}`, type: 'success' });
        fetchFiles();
      } else {
        setToast({ message: 'All uploads failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'), type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Filter for supported file types
      const validFiles = Array.from(files).filter(file => {
        const ext = file.name.toLowerCase();
        return ext.endsWith('.3mf') || ext.endsWith('.stl') || ext.endsWith('.gcode');
      });

      if (validFiles.length === 0) {
        setToast({ message: 'No valid files found. Only .3mf, .stl, and .gcode files are supported.', type: 'error' });
        return;
      }

      uploadFiles(files);
    }
  };


  const handleDownload = async (id: number, originalName: string) => {
    try {
      const response = await fetch(`/api/library/download/${id}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setToast({ message: 'Download failed: ' + (err instanceof Error ? err.message : 'Unknown error'), type: 'error' });
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm === null) return;

    try {
      const response = await fetch(`/api/library/${deleteConfirm}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      
      setToast({ message: 'File deleted successfully', type: 'success' });
      fetchFiles();
    } catch (err) {
      setToast({ message: 'Delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'), type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleScanFolder = async () => {
    try {
      setScanning(true);
      const response = await fetch('/api/library/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Scan failed');
      
      const result = await response.json();
      setToast({ message: `Scan complete! Found ${result.added} new file(s).`, type: 'success' });
      fetchFiles();
    } catch (err) {
      setToast({ message: 'Scan failed: ' + (err instanceof Error ? err.message : 'Unknown error'), type: 'error' });
    } finally {
      setScanning(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case '3mf': return '📦';
      case 'stl': return '🔷';
      case 'gcode': return '📄';
      default: return '📁';
    }
  };

  const handleView3D = (file: LibraryFile) => {
    if (file.fileType === 'stl' || file.fileType === '3mf') {
      setViewingModel(file);
    } else {
      setToast({ message: '3D viewing only available for STL and 3MF files', type: 'error' });
    }
  };

  const handleEditFile = (file: LibraryFile) => {
    setEditingFile(file);
    setEditDescription(file.description || '');
    setEditTags(file.tags || '');
  };

  const handleAutoTag = async () => {
    if (!editingFile) return;
    
    try {
      setAutoTagging(true);
      const response = await fetch(`/api/library/${editingFile.id}/auto-tag`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Auto-tag failed');
      
      const data = await response.json();
      
      // Update the form fields with auto-generated content
      setEditDescription(data.description);
      setEditTags(data.tags.join(', '));
      
      setToast({ message: 'Auto-generated description and tags!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Auto-tag failed: ' + (err instanceof Error ? err.message : 'Unknown error'), type: 'error' });
    } finally {
      setAutoTagging(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;
    
    try {
      setSaving(true);
      
      // Save description
      const descResponse = await fetch(`/api/library/${editingFile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editDescription })
      });
      
      if (!descResponse.ok) throw new Error('Failed to update description');
      
      // Save tags
      const tagsArray = editTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const tagsResponse = await fetch(`/api/library/${editingFile.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: tagsArray })
      });
      
      if (!tagsResponse.ok) throw new Error('Failed to update tags');
      
      setToast({ message: 'File updated successfully!', type: 'success' });
      setEditingFile(null);
      fetchFiles();
    } catch (err) {
      setToast({ message: 'Failed to update file: ' + (err instanceof Error ? err.message : 'Unknown error'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoTagAll = async () => {
    if (!confirm('This will auto-generate descriptions and tags for ALL files in your library. This may take a while. Continue?')) {
      return;
    }
    
    try {
      setAutoTaggingAll(true);
      setToast({ message: 'Auto-tagging all files... This may take a few minutes.', type: 'success' });
      
      const response = await fetch('/api/library/auto-tag-all', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: data.message, type: 'success' });
        fetchFiles();
      } else {
        throw new Error(data.error || 'Failed to auto-tag');
      }
    } catch (err) {
      setToast({ message: 'Auto-tag all failed: ' + (err instanceof Error ? err.message : 'Unknown error'), type: 'error' });
    } finally {
      setAutoTaggingAll(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading library..." />;
  }

  return (
    <div className="library-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {viewingModel && (
        <ModelViewer
          fileId={viewingModel.id}
          fileName={viewingModel.originalName}
          fileType={viewingModel.fileType}
          onClose={() => setViewingModel(null)}
        />
      )}

      {editingFile && (
        <div className="modal-overlay" onClick={() => setEditingFile(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit File</h2>
              <button className="modal-close" onClick={() => setEditingFile(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Filename</label>
                <input 
                  type="text" 
                  value={editingFile.originalName} 
                  disabled 
                  style={{ background: '#1a1a1a', color: '#888' }}
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  disabled={saving || autoTagging}
                />
              </div>
              
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="e.g. functional, miniature, prototype"
                  disabled={saving || autoTagging}
                />
                <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  Separate tags with commas. Tags help organize and search your models.
                </small>
              </div>
              
              <button 
                onClick={handleAutoTag} 
                className="btn-auto-tag"
                disabled={saving || autoTagging}
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                {autoTagging ? '🔄 Analyzing...' : '✨ Auto-Generate Description & Tags'}
              </button>
              
              <div className="modal-actions">
                <button 
                  onClick={() => setEditingFile(null)} 
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit} 
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? '💾 Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Model Library</h1>
          <p>{filteredFiles.length} of {files.length} files</p>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search by filename, description, or tags..."
          className="search-input"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')} 
            className="btn-clear-search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="library-actions">
        <div 
          className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="dropzone-content">
            <div className="dropzone-icon">📦</div>
            <h3>Drag & Drop Files Here</h3>
            <p>or click to browse</p>
            <p className="dropzone-hint">Supports .3mf, .stl, and .gcode files</p>
            <input 
              type="file" 
              id="file-input"
              accept=".3mf,.stl,.gcode" 
              multiple
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="btn-browse">
              {uploading ? '⏳ Uploading...' : '📁 Browse Files'}
            </label>
          </div>
        </div>

        <div className="scan-section">
          <h3>Auto-Import from Library Folder</h3>
          <div className="scan-info">
            <p>📂 Files in <code>/app/library</code> are automatically scanned</p>
            <div className="scan-buttons">
              <button onClick={handleScanFolder} disabled={scanning} className="btn-scan">
                {scanning ? '⏳ Scanning...' : '🔄 Refresh Library'}
              </button>
              <button 
                onClick={handleAutoTagAll} 
                disabled={autoTaggingAll || files.length === 0} 
                className="btn-auto-tag"
              >
                {autoTaggingAll ? '⏳ Processing...' : '✨ Auto-Tag All Files'}
              </button>
            </div>
          </div>
          <p className="help-text">Mount your local folder to <code>/app/library</code> in Docker</p>
        </div>
      </div>

      <div className="files-grid">
        {files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No files in library</h3>
            <p>Upload files or scan a folder to get started</p>
          </div>
        ) : (
          paginatedFiles.map(file => (
            <div key={file.id} className="file-card">
              <div 
                className="file-preview" 
                onClick={() => handleView3D(file)}
                style={{ cursor: (file.fileType === 'stl' || file.fileType === '3mf') ? 'pointer' : 'default' }}
              >
                <img 
                  src={`/api/library/thumbnail/${file.id}`} 
                  alt={file.originalName}
                  className="file-thumbnail"
                  loading="lazy"
                  onLoad={() => console.log('Thumbnail loaded for:', file.id)}
                  onError={(e) => {
                    console.error('Thumbnail failed for:', file.id, e);
                    console.log('Attempted URL:', `/api/library/thumbnail/${file.id}`);
                  }}
                />
                {(file.fileType === 'stl' || file.fileType === '3mf') && (
                  <div className="view-3d-overlay">
                    <span>🔍 View in 3D</span>
                  </div>
                )}
              </div>
              <div className="file-info">
                <h4>{file.originalName}</h4>
                <p className="file-type">{file.fileType.toUpperCase()}</p>
                <p className="file-size">{formatFileSize(file.fileSize)}</p>
                {file.description && <p className="file-desc">{file.description}</p>}
                {file.tags && (
                  <div className="file-tags">
                    {file.tags.split(',').map((tag, i) => (
                      <span key={i} className="tag">{tag.trim()}</span>
                    ))}
                  </div>
                )}
                <p className="file-date">{new Date(file.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="file-actions">
                {(file.fileType === 'stl' || file.fileType === '3mf') && (
                  <button 
                    onClick={() => handleView3D(file)}
                    className="btn-view-3d"
                  >
                    👁️ View 3D
                  </button>
                )}
                <button 
                  onClick={() => handleEditFile(file)}
                  className="btn-edit"
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={() => handleDownload(file.id, file.originalName)}
                  className="btn-download"
                >
                  ⬇ Download
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => handleDeleteClick(file.id)}
                    className="btn-delete"
                  >
                    🗑 Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-page"
          >
            ← Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Show first page, last page, current page, and 2 pages around current
                return page === 1 || 
                       page === totalPages || 
                       Math.abs(page - currentPage) <= 2;
              })
              .map((page, index, array) => {
                // Add ellipsis if there's a gap
                const showEllipsis = index > 0 && page - array[index - 1] > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="page-ellipsis">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`btn-page ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>
          
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-page"
          >
            Next →
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this file? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setDeleteConfirm(null)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn-delete">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Library;
