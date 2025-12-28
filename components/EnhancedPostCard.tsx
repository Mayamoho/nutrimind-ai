import React, { useState } from 'react';
import { HeartIcon, ChatBubbleLeftIcon, ShareIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useToast } from '../contexts/ToastContext';

interface EnhancedPostCardProps {
  post: any;
  onLike: (id: number) => void;
  onComment: (id: number) => void;
  onShare: (id: number) => void;
  isLiked: boolean;
}

const EnhancedPostCard: React.FC<EnhancedPostCardProps> = ({ post, onLike, onComment, onShare, isLiked }) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { showToast } = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLike = () => {
    onLike(post.id);
    showToast(isLiked ? 'Post unliked' : 'Post liked!', 'success');
  };

  const handleShare = () => {
    onShare(post.id);
    showToast('Post shared successfully!', 'success');
  };

  const content = post.content || '';
  const hasImage = post.metadata?.image_url && !imageError;
  const shouldTruncate = content.length > 200 && !showFullContent;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Post Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {post.author_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">{post.author_name || 'Unknown'}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                <span>{formatDate(post.created_at)}</span>
                {post.post_type && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                      {post.post_type}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
          {shouldTruncate ? `${content.substring(0, 200)}...` : content}
          {shouldTruncate && (
            <button
              onClick={() => setShowFullContent(true)}
              className="text-blue-500 hover:text-blue-600 font-medium ml-1"
            >
              See more
            </button>
          )}
        </p>
      </div>

      {/* Post Image */}
      {hasImage && (
        <div className="px-4 pb-3">
          <img
            src={post.metadata.image_url}
            alt="Post image"
            className="w-full rounded-lg shadow-md"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                isLiked
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              {isLiked ? (
                <HeartSolidIcon className="w-5 h-5" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{post.likes_count || 0}</span>
            </button>

            <button
              onClick={() => onComment(post.id)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <ChatBubbleLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{post.comments_count || 0}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
            >
              <ShareIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>

          {post.metadata?.file_url && (
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <PaperClipIcon className="w-4 h-4 mr-1" />
              <span className="text-xs">Attachment</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPostCard;
