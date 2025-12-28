import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { 
  UserGroupIcon, 
  TrophyIcon, 
  ChatBubbleLeftRightIcon, 
  BellIcon,
  PlusIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import FriendList from '../FriendList';
import ChallengeCard from '../ChallengeCard';
import SocialPostCard from '../SocialPostCard';
import ActivityFeed from '../ActivityFeed';
import CommentDialog from '../CommentDialog';
import PostComments from '../PostComments';
import MessagesPanel from '../MessagesPanel';
import ChatPanel from '../ChatPanel';
import EnhancedPostCard from '../EnhancedPostCard';
import CreatePost from '../CreatePost';
import { VideoCall } from '../VideoCall';
import { WebRTCProvider } from '../../contexts/WebRTCContext';
import { Challenge, Friend, FriendRequest, SocialPost, LiveActivity, Encouragement, MilestoneCelebration } from '../../types';
import socialApi from '../../services/socialService';
import { useToast } from '../../contexts/ToastContext';

interface SocialTabProps {
  friends: Friend[];
  challenges: Challenge[];
  socialPosts: SocialPost[];
  pendingRequests: FriendRequest[];
  activities: Array<{
    type: 'live_activity' | 'encouragement' | 'milestone';
    data: LiveActivity | Encouragement | MilestoneCelebration;
    timestamp: string;
  }>;
  onSendFriendRequest: (email: string) => void;
  onAcceptRequest: (email: string) => void;
  onDeclineRequest: (email: string) => void;
  onRemoveFriend: (email: string) => void;
  onJoinChallenge: (challengeId: number) => void;
  onLikePost: (postId: number) => void;
  onCommentOnPost: (postId: number) => void;
  onSharePost: (postId: number) => void;
  onCreatePost: (content: string, file?: File) => void;
  onJoinActivity: (activityId: number) => void;
}

const SocialTab: React.FC<SocialTabProps> = ({
  friends,
  challenges,
  socialPosts,
  pendingRequests,
  activities,
  onSendFriendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  onJoinChallenge,
  onLikePost,
  onCommentOnPost,
  onSharePost,
  onCreatePost,
  onJoinActivity
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [postContent, setPostContent] = useState('');
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [postCommentsOpen, setPostCommentsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { showToast } = useToast();

  const handleCreatePost = async (content: string, file?: File) => {
    try {
      await onCreatePost(content, file);
      showToast('Post created successfully!', 'success');
    } catch (error) {
      showToast('Failed to create post', 'error');
    }
  };

  const handleComment = (postId: number) => {
    setCurrentPostId(postId);
    setPostCommentsOpen(true);
  };

  const handleSubmitComment = async (comment: string) => {
    if (currentPostId !== null) {
      try {
        await socialApi.commentOnPost(currentPostId, comment);
        showToast('Comment added successfully!', 'success');
        loadSocialData(); // Refresh posts
      } catch (error) {
        showToast('Failed to add comment', 'error');
      }
    }
  };

  const handleUpdateProgress = async (challengeId: number, progress: number) => {
    try {
      await socialApi.updateProgress(challengeId, progress);
      showToast('Progress updated successfully!', 'success');
      loadSocialData(); // Refresh challenges
    } catch (error) {
      showToast('Failed to update progress', 'error');
    }
  };

  const loadSocialData = async () => {
    // This would refresh all social data
    // In a real app, you'd call the parent's loadSocialData function
  };

  return (
    <WebRTCProvider>
      <div className="max-w-4xl mx-auto p-4">
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-100 p-1 mb-6">
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm leading-5 font-medium rounded-lg
                ${selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
                }`
              }
            >
              <div className="flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 mr-2" />
                <span>Friends</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm leading-5 font-medium rounded-lg
                ${selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
                }`
              }
            >
              <div className="flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 mr-2" />
                <span>Challenges</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm leading-5 font-medium rounded-lg
                ${selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
                }`
              }
            >
              <div className="flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                <span>Feed</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm leading-5 font-medium rounded-lg
                ${selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
                }`
              }
            >
              <div className="flex items-center justify-center">
                <BellIcon className="w-5 h-5 mr-2" />
                <span>Activity</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm leading-5 font-medium rounded-lg
                ${selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
                }`
              }
            >
              <div className="flex items-center justify-center">
                <VideoCameraIcon className="w-5 h-5 mr-2" />
                <span>Video Call</span>
              </div>
            </Tab>
          </Tab.List>

        <Tab.Panels className="mt-2">
          {/* Friends Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <FriendList
                  friends={friends}
                  pendingRequests={pendingRequests}
                  onAcceptRequest={onAcceptRequest}
                  onDeclineRequest={onDeclineRequest}
                  onRemoveFriend={onRemoveFriend}
                  onMessage={(email) => {
                    // For now, just send an encouragement as a message
                    const message = prompt('Enter your message:');
                    if (message && message.trim()) {
                      socialApi.sendEncouragement(email, message.trim());
                      showToast('Message sent successfully!', 'success');
                    }
                  }}
                />
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 h-fit">
                <h3 className="font-medium text-gray-800 mb-3">Messages</h3>
                <button
                  onClick={() => setChatOpen(true)}
                  className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                  Open Chat
                </button>
                <h3 className="font-medium text-gray-800 mb-3 mt-4">Add Friend</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                    if (email) {
                      onSendFriendRequest(email);
                      e.currentTarget.reset();
                    }
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="friend@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Send Friend Request
                  </button>
                </form>
              </div>
            </div>
          </Tab.Panel>

          {/* Challenges Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={onJoinChallenge}
                  onUpdateProgress={handleUpdateProgress}
                  userProgress={('current_progress' in challenge) ? (challenge as any).current_progress : 0}
                />
              ))}
            </div>
          </Tab.Panel>

          {/* Feed Panel */}
          <Tab.Panel>
            <div className="max-w-2xl mx-auto">
              {/* Create Post */}
              <CreatePost onCreatePost={handleCreatePost} />

              {/* Posts */}
              <div className="space-y-4">
                {socialPosts.map((post) => (
                  <EnhancedPostCard
                    key={post.id}
                    post={post}
                    onLike={onLikePost}
                    onComment={handleComment}
                    onShare={onSharePost}
                    isLiked={false}
                  />
                ))}
              </div>
            </div>
          </Tab.Panel>

          {/* Activity Panel */}
          <Tab.Panel>
            <div className="max-w-2xl mx-auto">
              <ActivityFeed 
                activities={activities} 
                onJoinActivity={onJoinActivity}
                onCreateActivity={() => {}}
                onCreateMilestone={() => {}}
              />
            </div>
          </Tab.Panel>

          {/* Video Call Panel */}
          <Tab.Panel>
            <VideoCall />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
      
      <CommentDialog
        isOpen={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        onSubmit={handleSubmitComment}
      />
      
      <PostComments
        postId={currentPostId || 0}
        isOpen={postCommentsOpen}
        onClose={() => setPostCommentsOpen(false)}
      />
      
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
      </div>
    </WebRTCProvider>
  );
};

export default SocialTab;
