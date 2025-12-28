import React from 'react';
import { SocialPost } from '../types';
import { UserIcon, ChatBubbleLeftIcon, HeartIcon, ShareIcon } from './icons';

interface SocialPostCardProps {
  post: SocialPost;
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onShare?: (postId: number) => void;
  isLiked?: boolean;
}

const SocialPostCard: React.FC<SocialPostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  isLiked = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-100">
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
          <UserIcon className="w-6 h-6 text-gray-500" />
        </div>
        <div>
          <h4 className="font-medium text-gray-800">{post.author_name}</h4>
          <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-gray-800">{post.content}</p>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
        <button 
          onClick={() => onLike?.(post.id)}
          className={`flex items-center ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
        >
          <HeartIcon className="w-5 h-5 mr-1" />
          {post.likes_count > 0 && <span>{post.likes_count}</span>}
        </button>
        
        <button 
          onClick={() => onComment?.(post.id)}
          className="flex items-center text-gray-500 hover:text-blue-500"
        >
          <ChatBubbleLeftIcon className="w-5 h-5 mr-1" />
          {post.comments_count > 0 && <span>{post.comments_count}</span>}
        </button>
        
        <button 
          onClick={() => onShare?.(post.id)}
          className="flex items-center text-gray-500 hover:text-green-500"
        >
          <ShareIcon className="w-5 h-5 mr-1" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default SocialPostCard;
