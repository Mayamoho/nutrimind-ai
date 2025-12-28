import React, { useState, useRef } from 'react';
import { PhotoIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '../contexts/ToastContext';

interface CreatePostProps {
  onCreatePost: (content: string, file?: File) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onCreatePost }) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('application/')) {
        showToast('Please select an image or document file', 'error');
        return;
      }

      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl('');
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) {
      showToast('Please add some content or attach a file', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreatePost(content.trim(), selectedFile || undefined);
      setContent('');
      removeFile();
      showToast('Post created successfully!', 'success');
    } catch (error) {
      showToast('Failed to create post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Input */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share your progress, thoughts, or achievements..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            rows={3}
          />
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="relative">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <PaperClipIcon className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <PhotoIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Photo</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <PaperClipIcon className="w-5 h-5" />
              <span className="text-sm font-medium">File</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !selectedFile)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Posting...</span>
              </div>
            ) : (
              'Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
