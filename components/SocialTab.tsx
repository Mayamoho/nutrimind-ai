import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { 
  UserGroupIcon, 
  TrophyIcon, 
  ChatBubbleLeftRightIcon, 
  BellIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import FriendList from './FriendList';
import ChallengeCard from './ChallengeCard';
import SocialPostCard from './SocialPostCard';
import ActivityFeed from './ActivityFeed.tsx';
import { Challenge, Friend, FriendRequest, SocialPost, LiveActivity, Encouragement, MilestoneCelebration } from '../types';

interface SocialTabProps {
  friends: Friend[];
  challenges: Challenge[];
  socialPosts: SocialPost[];
  pendingRequests: FriendRequest[];
  activities: Array<{
    type: 'live_activity' | 'encouragement' | 'milestone';
    data: LiveActivity | Encouragement | MilestoneCelebration;
    timestamp: string;
    is_joined?: boolean;
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
  onCreateActivity: (activity: {
    title: string;
    description: string;
    activity_type: 'workout' | 'nutrition_workshop' | 'qna' | 'challenge_prep';
    scheduled_start: string;
    scheduled_end: string;
    max_participants: number;
  }) => void;
  onCreateMilestone: (milestone: {
    milestone_type: string;
    milestone_value: number;
    description: string;
  }) => void;
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
  onJoinActivity,
  onCreateActivity,
  onCreateMilestone
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [postContent, setPostContent] = useState('');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (postContent.trim()) {
      onCreatePost(postContent);
    }
  };

  return (
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
                />
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 h-fit">
                <h3 className="font-medium text-gray-800 mb-3">Add Friend</h3>
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
                  userProgress={('current_progress' in challenge) ? (challenge as any).current_progress : 0}
                />
              ))}
            </div>
          </Tab.Panel>

          {/* Feed Panel */}
          <Tab.Panel>
            <div className="max-w-2xl mx-auto">
              {/* Create Post */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-100">
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div>
                    <label htmlFor="post" className="sr-only">What's on your mind?</label>
                    <textarea
                      id="post"
                      name="post"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="What's on your mind?"
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!postContent.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Post
                    </button>
                  </div>
                </form>
              </div>

              {/* Posts */}
              {socialPosts.map((post) => (
                <SocialPostCard
                  key={post.id}
                  post={post}
                  onLike={onLikePost}
                  onComment={onCommentOnPost}
                  onShare={onSharePost}
                  isLiked={false} // You'll need to pass the actual liked state
                />
              ))}
            </div>
          </Tab.Panel>

          {/* Activity Panel */}
          <Tab.Panel>
            <div className="max-w-2xl mx-auto">
              <ActivityFeed 
                activities={activities} 
                onJoinActivity={onJoinActivity}
                onCreateActivity={onCreateActivity}
                onCreateMilestone={onCreateMilestone}
              />
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default SocialTab;
