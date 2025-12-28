import React, { useState } from 'react';

interface CommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}

const CommentDialog: React.FC<CommentDialogProps> = ({ isOpen, onClose, onSubmit }) => {
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment.trim());
      setComment('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Add a comment</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Write your comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!comment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Comment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentDialog;
