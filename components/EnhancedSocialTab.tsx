import React, { useState, useRef } from 'react';
import { Tab } from '@headlessui/react';
import { 
  UserGroupIcon, 
  TrophyIcon, 
  ChatBubbleLeftRightIcon, 
  BellIcon,
  PlusIcon,
  PhotoIcon,
  PaperClipIcon,
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import FriendList from './FriendList';
import ChallengeCard from './ChallengeCard';
import ChallengeCreationForm from './ChallengeCreationForm';
import ActivityFeed from './ActivityFeed';
import { useToast } from '../contexts/ToastContext';
import socialApi from '../services/socialService';
import { Challenge, Friend, FriendRequest, SocialPost, LiveActivity, Encouragement, MilestoneCelebration } from '../types';

interface EnhancedSocialTabProps {
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
  onUpdateProgress: (challengeId: number, progress: number) => void;
  onCompleteChallenge?: (challengeId: number) => void;
  onLikePost: (postId: number) => void;
  onSharePost: (postId: number) => void;
  onCommentOnSharePost: (postId: number) => void;
  onCommentOnPost: (postId: number) => void;
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
  onCreateChallenge: (challengeData: {
    title: string;
    description: string;
    challenge_type: 'streak' | 'protein' | 'weight_loss' | 'workout' | 'water' | 'custom';
    duration_days: number;
    target_value?: number;
    reward_points: number;
    max_participants: number;
  }) => void;
  onUpdateActivityStatus?: (activityId: number, status: 'live' | 'ended', meetingLink?: string) => void;
  currentUserEmail?: string;
}

const EnhancedSocialTab: React.FC<EnhancedSocialTabProps> = ({
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
  onUpdateProgress,
  onCompleteChallenge,
  onLikePost,
  onCommentOnPost,
  onSharePost,
  onCreatePost,
  onJoinActivity,
  onCreateActivity,
  onCreateMilestone,
  onCreateChallenge,
  onUpdateActivityStatus,
  currentUserEmail
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [postContent, setPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState<number | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFriend, setSelectedFriend] = useState('');
  const [allUsers, setAllUsers] = useState<Array<{email: string, last_name: string}>>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [feedSearchTerm, setFeedSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<Array<{email: string, last_name: string}>>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeFilter, setChallengeFilter] = useState<'all' | 'joined' | 'completed'>('all');
  const [challengeSearchTerm, setChallengeSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Load all users for messaging
  const loadAllUsers = async () => {
    try {
      const users = await socialApi.getAllUsers();
      setAllUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  // Filter users based on search term
  React.useEffect(() => {
    const filtered = allUsers.filter(user => 
      user.last_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [userSearchTerm, allUsers]);

  // Load users when chat opens
  React.useEffect(() => {
    if (chatOpen && allUsers.length === 0) {
      loadAllUsers();
    }
  }, [chatOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !selectedFile) {
      showToast('Please add content or file', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreatePost(postContent.trim(), selectedFile || undefined);
      showToast('Post created successfully!', 'success');
      setPostContent('');
      removeFile();
    } catch (error) {
      showToast('Failed to create post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await onLikePost(postId);
      showToast('Post liked!', 'success');
    } catch (error) {
      showToast('Failed to like post', 'error');
    }
  };

  const handleShare = async (postId: number) => {
    try {
      await onSharePost(postId);
      showToast('Post shared successfully!', 'success');
    } catch (error) {
      showToast('Failed to share post', 'error');
    }
  };

  const handleCreateChallenge = async (challengeData: any) => {
    try {
      await onCreateChallenge(challengeData);
      showToast('Challenge created successfully!', 'success');
      setShowChallengeForm(false);
    } catch (error) {
      showToast('Failed to create challenge', 'error');
    }
  };

  const loadComments = async (postId: number) => {
    try {
      const data = await socialApi.getPostComments(postId);
      setComments(data);
    } catch (error) {
      showToast('Failed to load comments', 'error');
    }
  };

  const handleComment = (postId: number) => {
    setCommentsOpen(postId);
    loadComments(postId);
  };

  const handleSubmitComment = async (postId: number) => {
    if (!newComment.trim()) return;
    
    try {
      await socialApi.commentOnPost(postId, newComment.trim());
      showToast('Comment added!', 'success');
      setNewComment('');
      loadComments(postId);
    } catch (error) {
      showToast('Failed to add comment', 'error');
    }
  };

  const loadMessages = async () => {
    try {
      if (selectedFriend) {
        // Load conversation between current user and selected friend
        const data = await socialApi.getConversation(selectedFriend);
        setMessages(data);
      } else {
        // Fallback to all received messages
        const data = await socialApi.getEncouragements();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend.trim()) return;

    try {
      await socialApi.sendEncouragement(selectedFriend, newMessage.trim());
      showToast('Message sent successfully!', 'success');
      setNewMessage('');
      loadMessages();
    } catch (error) {
      showToast('Failed to send message', 'error');
    }
  };

  React.useEffect(() => {
    if (chatOpen) loadMessages();
  }, [chatOpen]);

  React.useEffect(() => {
    if (chatOpen && selectedFriend) loadMessages();
  }, [selectedFriend, chatOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleDateString();
  };

  // Filter posts based on search term
  const filteredPosts = socialPosts.filter(post => 
    !feedSearchTerm || 
    post.content.toLowerCase().includes(feedSearchTerm.toLowerCase()) ||
    post.post_type.toLowerCase().includes(feedSearchTerm.toLowerCase())
  );

  // Filter and search challenges
  const filteredChallenges = challenges.filter(challenge => {
    // Apply filter
    const isJoined = challenge.current_progress !== null && challenge.current_progress !== undefined;
    const isCompleted = challenge.is_completed === true;
    
    let passesFilter = true;
    if (challengeFilter === 'joined') {
      passesFilter = isJoined && !isCompleted;
    } else if (challengeFilter === 'completed') {
      passesFilter = isCompleted;
    }
    
    // Apply search
    let passesSearch = true;
    if (challengeSearchTerm) {
      const searchLower = challengeSearchTerm.toLowerCase();
      passesSearch = 
        challenge.title.toLowerCase().includes(searchLower) ||
        (challenge.description && challenge.description.toLowerCase().includes(searchLower)) ||
        challenge.challenge_type.toLowerCase().includes(searchLower) ||
        (challenge.challenge_type === 'streak' && searchLower.includes('streak')) ||
        (challenge.challenge_type === 'protein' && searchLower.includes('protein')) ||
        (challenge.challenge_type === 'weight_loss' && (searchLower.includes('weight') || searchLower.includes('loss'))) ||
        (challenge.challenge_type === 'workout' && searchLower.includes('workout')) ||
        (challenge.challenge_type === 'water' && searchLower.includes('water')) ||
        (challenge.challenge_type === 'custom' && searchLower.includes('custom'));
    }
    
    return passesFilter && passesSearch;
  });

  // Count challenges in each category
  const allCount = challenges.length;
  const joinedCount = challenges.filter(c => c.current_progress !== null && c.current_progress !== undefined && !c.is_completed).length;
  const completedCount = challenges.filter(c => c.is_completed === true).length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <Tab.List className="flex space-x-2 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-2 mb-8 shadow-lg">
          {[
            { name: 'Friends', icon: UserGroupIcon },
            { name: 'Challenges', icon: TrophyIcon },
            { name: 'Feed', icon: ChatBubbleLeftRightIcon },
            { name: 'Activity', icon: BellIcon }
          ].map(({ name, icon: Icon }) => (
            <Tab
              key={name}
              className={({ selected }) =>
                `w-full py-4 px-6 text-lg font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2
                ${selected
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span>{name}</span>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-8">
          {/* Friends Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Friends</h2>
                  <FriendList
                    friends={friends}
                    pendingRequests={pendingRequests}
                    onAcceptRequest={onAcceptRequest}
                    onDeclineRequest={onDeclineRequest}
                    onRemoveFriend={onRemoveFriend}
                    onMessage={(email) => {
                      const message = prompt('Enter your message:');
                      if (message?.trim()) {
                        socialApi.sendEncouragement(email, message.trim());
                        showToast('Message sent!', 'success');
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-4">Messages</h3>
                  <button
                    onClick={() => setChatOpen(true)}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl py-4 px-6 font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                    <span>Open Chat</span>
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Add Friend</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const lastName = (e.currentTarget.elements.namedItem('lastName') as HTMLInputElement).value;
                      if (lastName) {
                        onSendFriendRequest(lastName);
                        e.currentTarget.reset();
                        showToast('Friend request sent!', 'success');
                      }
                    }}
                    className="space-y-4"
                  >
                    <input
                      type="text"
                      name="lastName"
                      placeholder="friend's last name"
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
                    >
                      Send Request
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Challenges Panel */}
          <Tab.Panel>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Challenges</h2>
                <button
                  onClick={() => setShowChallengeForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Create Challenge</span>
                </button>
              </div>

              {/* Challenge Filter Menu */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Filter Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setChallengeFilter('all')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        challengeFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>All Challenges</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{allCount}</span>
                    </button>
                    <button
                      onClick={() => setChallengeFilter('joined')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        challengeFilter === 'joined'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>Joined</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{joinedCount}</span>
                    </button>
                    <button
                      onClick={() => setChallengeFilter('completed')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        challengeFilter === 'completed'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>Completed</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{completedCount}</span>
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={challengeSearchTerm}
                        onChange={(e) => setChallengeSearchTerm(e.target.value)}
                        placeholder={`Search ${challengeFilter === 'all' ? 'all' : challengeFilter} challenges: streak, protein, weight, workout, water...`}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      {challengeSearchTerm && (
                        <button
                          onClick={() => setChallengeSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Search Results Count */}
                {challengeSearchTerm && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Found {filteredChallenges.length} challenges matching "{challengeSearchTerm}"
                  </p>
                )}
              </div>

              {showChallengeForm ? (
                <ChallengeCreationForm
                  onCreateChallenge={handleCreateChallenge}
                  onCancel={() => setShowChallengeForm(false)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredChallenges.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <TrophyIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {challengeSearchTerm 
                          ? `No challenges found matching "${challengeSearchTerm}"`
                          : challengeFilter === 'joined' 
                            ? 'No joined challenges yet'
                            : challengeFilter === 'completed'
                              ? 'No completed challenges yet'
                              : 'No challenges available yet'
                        }
                      </p>
                      {!challengeSearchTerm && challengeFilter === 'all' && (
                        <button
                          onClick={() => setShowChallengeForm(true)}
                          className="px-6 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
                        >
                          Create the First Challenge
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {filteredChallenges.map((challenge) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          onJoin={onJoinChallenge}
                          onUpdateProgress={onUpdateProgress}
                          onComplete={onCompleteChallenge}
                          userProgress={challenge.current_progress || 0}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* Feed Panel */}
          <Tab.Panel>
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Feed Search */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center space-x-3">
                  <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    value={feedSearchTerm}
                    onChange={(e) => setFeedSearchTerm(e.target.value)}
                    placeholder="Search posts by topic: food, exercise, nutrition, water..."
                    className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {feedSearchTerm && (
                    <button
                      onClick={() => setFeedSearchTerm('')}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {feedSearchTerm && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    Found {filteredPosts.length} posts matching "{feedSearchTerm}"
                  </p>
                )}
              </div>

              {/* Create Post */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Create Post</h2>
                <form onSubmit={handleSubmitPost} className="space-y-6">
                  <div>
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="What's on your mind? Share your progress, thoughts, or achievements..."
                      className="w-full px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-700 dark:text-white placeholder-gray-500"
                      rows={4}
                    />
                  </div>

                  {selectedFile && (
                    <div className="relative">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-4 bg-gray-50 dark:bg-gray-700">
                        {previewUrl ? (
                          <div className="relative">
                            <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
                            <button
                              type="button"
                              onClick={removeFile}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <PaperClipIcon className="w-8 h-8 text-gray-400" />
                              <span className="text-gray-700 dark:text-gray-300">{selectedFile.name}</span>
                            </div>
                            <button type="button" onClick={removeFile} className="text-red-500 hover:text-red-600">
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-3">
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
                        className="flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                      >
                        <PhotoIcon className="w-6 h-6" />
                        <span className="font-medium">Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                      >
                        <PaperClipIcon className="w-6 h-6" />
                        <span className="font-medium">File</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || (!postContent.trim() && !selectedFile)}
                      className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all transform hover:scale-105"
                    >
                      {isSubmitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Posts */}
              <div className="space-y-6">
                {filteredPosts.length === 0 && feedSearchTerm ? (
                  <div className="text-center py-12">
                    <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 dark:text-gray-400">No posts found matching "{feedSearchTerm}"</p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                  <div key={post.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    {/* Post Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {post.author_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{post.author_name || 'Unknown'}</h4>
                            <p className="text-gray-500 dark:text-gray-400">{formatDate(post.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="px-6 pb-4">
                      <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">{post.content}</p>
                      {post.metadata?.url && (
                        <div className="mt-4">
                          {post.metadata.mimetype?.startsWith('image/') ? (
                            <img src={post.metadata.url} alt="Post image" className="w-full rounded-xl shadow-md" />
                          ) : (
                            <div className="flex items-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              <PaperClipIcon className="w-5 h-5 text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">{post.metadata.filename}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Post Actions */}
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLike(post.id)}
                          className="flex items-center space-x-3 px-6 py-3 rounded-full text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <HeartIcon className="w-6 h-6" />
                          <span className="font-medium">{post.likes_count || 0}</span>
                        </button>

                        <button
                          onClick={() => handleComment(post.id)}
                          className="flex items-center space-x-3 px-6 py-3 rounded-full text-gray-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        >
                          <ChatBubbleLeftIcon className="w-6 h-6" />
                          <span className="font-medium">{post.comments_count || 0}</span>
                        </button>

                        <button
                          onClick={() => handleShare(post.id)}
                          className="flex items-center space-x-3 px-6 py-3 rounded-full text-gray-600 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                        >
                          <ShareIcon className="w-6 h-6" />
                          <span className="font-medium">Share</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {commentsOpen === post.id && (
                      <div className="border-t border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Comments</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                          {comments.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">No comments yet</p>
                          ) : (
                            comments.map((comment) => (
                              <div key={comment.id} className="flex space-x-3">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">
                                  {comment.author_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                                    <p className="font-medium text-gray-900 dark:text-white">{comment.author_name}</p>
                                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Add Comment */}
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          handleSubmitComment(post.id);
                        }} className="flex space-x-3">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            type="submit"
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
                          >
                            Comment
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )))}
              </div>
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
                onUpdateActivityStatus={onUpdateActivityStatus}
                currentUserEmail={currentUserEmail}
                onShowToast={showToast}
              />
            </div>
          </Tab.Panel>

        </Tab.Panels>
      </Tab.Group>

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold">Messages</h3>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Search - At top */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <UserIcon className="w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => {
                      setUserSearchTerm(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    placeholder="Search users by name or email..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  />
                  {selectedFriend && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFriend('');
                        setUserSearchTerm('');
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Selected Friend Display */}
                {selectedFriend && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Chatting with: {allUsers.find(u => u.email === selectedFriend)?.last_name || selectedFriend}
                    </p>
                  </div>
                )}

                {/* User Dropdown */}
                {showUserDropdown && userSearchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <div
                          key={user.email}
                          onClick={() => {
                            setSelectedFriend(user.email);
                            setUserSearchTerm(`${user.last_name} (${user.email})`);
                            setShowUserDropdown(false);
                          }}
                          className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{user.last_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.message_type === 'sent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.message_type === 'sent' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        <p className="text-sm font-medium mb-1">
                          {message.message_type === 'sent' ? 'You' : message.sender_name}
                        </p>
                        <p>{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.message_type === 'sent' 
                            ? 'text-blue-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={sendMessage} className="space-y-4">
                {/* Message Input */}
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={selectedFriend ? "Type your message..." : "Select a friend first..."}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    required
                    disabled={!selectedFriend}
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                    disabled={!selectedFriend}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSocialTab;
