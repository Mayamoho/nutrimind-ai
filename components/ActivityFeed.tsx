import React, { useState } from 'react';
import { LiveActivity, Encouragement, MilestoneCelebration } from '../types';

// Simple Meeting Component
const SimpleMeeting = ({ roomId }: { roomId: string }) => {
  const [isInMeeting, setIsInMeeting] = useState(false);
  
  const joinMeeting = () => {
    setIsInMeeting(true);
    console.log(`[MEETING] Joining room: ${roomId}`);
    // In a real implementation, this would initialize WebRTC
  };
  
  const leaveMeeting = () => {
    setIsInMeeting(false);
    console.log(`[MEETING] Leaving room: ${roomId}`);
  };
  
  if (!isInMeeting) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">In-App Meeting Room: {roomId}</h3>
        <button 
          onClick={joinMeeting}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Join Meeting
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Meeting Room: {roomId}</h3>
        <button 
          onClick={leaveMeeting}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Leave Meeting
        </button>
      </div>
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-gray-400">Video meeting interface would go here</div>
        <div className="text-sm text-gray-500 mt-2">
          WebRTC implementation needed for real video/audio
        </div>
      </div>
    </div>
  );
};
import { 
  CalendarIcon, 
  FireIcon, 
  TrophyIcon, 
  UserIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  GiftIcon,
  PlusIcon,
  CloseIcon
} from './icons';

interface ActivityFeedProps {
  activities: Array<{
    type: 'live_activity' | 'encouragement' | 'milestone';
    data: LiveActivity | Encouragement | MilestoneCelebration;
    timestamp: string;
    is_joined?: boolean;
  }>;
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
  onUpdateActivityStatus?: (activityId: number, status: 'live' | 'ended', meetingLink?: string) => void;
  currentUserEmail?: string;
  onShowToast?: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities, 
  onJoinActivity,
  onCreateActivity,
  onCreateMilestone,
  onUpdateActivityStatus,
  currentUserEmail,
  onShowToast
}) => {
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [showCreateMilestone, setShowCreateMilestone] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    activity_type: 'workout' as 'workout' | 'nutrition_workshop' | 'qna' | 'challenge_prep',
    scheduled_start: '',
    scheduled_end: '',
    max_participants: 10,
    use_in_app_meeting: false
  });
  const [newMilestone, setNewMilestone] = useState({
    milestone_type: 'streak',
    milestone_value: 1,
    description: ''
  });
  const [meetingLinks, setMeetingLinks] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'upcoming' | 'running' | 'ended'>('upcoming');
  const getActivityIcon = (type: string, activityType?: string) => {
    if (type === 'live_activity') {
      switch (activityType) {
        case 'workout': return <VideoCameraIcon className="w-5 h-5 text-red-500" />;
        case 'nutrition_workshop': return <CalendarIcon className="w-5 h-5 text-green-500" />;
        case 'qna': return <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500" />;
        case 'challenge_prep': return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
        default: return <VideoCameraIcon className="w-5 h-5 text-gray-500" />;
      }
    } else if (type === 'encouragement') {
      return <StarIcon className="w-5 h-5 text-yellow-500" />;
    } else if (type === 'milestone') {
      return <GiftIcon className="w-5 h-5 text-purple-500" />;
    }
    return <CalendarIcon className="w-5 h-5 text-gray-500" />;
  };

  const getActivityTitle = (activity: any) => {
    if (activity.type === 'live_activity') {
      const liveActivity = activity.data as LiveActivity;
      return liveActivity.title;
    } else if (activity.type === 'encouragement') {
      const encouragement = activity.data as Encouragement;
      return `Encouragement from ${encouragement.sender_name}`;
    } else if (activity.type === 'milestone') {
      const milestone = activity.data as MilestoneCelebration;
      return milestone.description || `Milestone: ${milestone.milestone_type}`;
    }
    return 'Activity';
  };

  const getActivityDescription = (activity: any) => {
    if (activity.type === 'live_activity') {
      const liveActivity = activity.data as LiveActivity;
      return liveActivity.description || `Join this ${liveActivity.activity_type.replace('_', ' ')} session`;
    } else if (activity.type === 'encouragement') {
      const encouragement = activity.data as Encouragement;
      return encouragement.message;
    } else if (activity.type === 'milestone') {
      const milestone = activity.data as MilestoneCelebration;
      return milestone.description || `Celebrating ${milestone.milestone_type.replace('_', ' ')}`;
    }
    return '';
  };

  const getActivityTime = (activity: any) => {
    if (activity.type === 'live_activity') {
      const liveActivity = activity.data as LiveActivity;
      const startTime = new Date(liveActivity.scheduled_start);
      return `Starts at ${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return new Date(activity.timestamp).toLocaleString();
  };

  const getActivityMetadata = (activity: any) => {
    if (activity.type === 'live_activity') {
      const liveActivity = activity.data as LiveActivity;
      return {
        host: liveActivity.host_name || liveActivity.host_email,
        participants: liveActivity.participant_count || 0,
        maxParticipants: liveActivity.max_participants,
        isActive: liveActivity.is_active
      };
    } else if (activity.type === 'encouragement') {
      const encouragement = activity.data as Encouragement;
      return {
        sender: encouragement.sender_name,
        type: encouragement.encouragement_type,
        isRead: encouragement.is_read
      };
    } else if (activity.type === 'milestone') {
      const milestone = activity.data as MilestoneCelebration;
      return {
        user: milestone.user_name || milestone.user_email,
        type: milestone.milestone_type,
        value: milestone.milestone_value,
        isShared: milestone.is_shared
      };
    }
    return {};
  };

  const isActuallyLive = (activity: any) => {
    if (activity.type !== 'live_activity') return false;
    const liveActivity = activity.data as LiveActivity;
    const now = new Date();
    const startTime = new Date(liveActivity.scheduled_start);
    const endTime = new Date(liveActivity.scheduled_end);
    
    return liveActivity.is_active && now >= startTime && now <= endTime;
  };

  const canJoinActivity = (activity: any) => {
    return activity.type === 'live_activity' && 
           (activity.data as LiveActivity).is_active && 
           !activity.is_joined;
  };

  const handleCreateActivity = () => {
    if (!newActivity.title || !newActivity.description || !newActivity.scheduled_start || !newActivity.scheduled_end) {
      alert('Please fill in all activity fields');
      return;
    }
    onCreateActivity(newActivity);
    setNewActivity({
      title: '',
      description: '',
      activity_type: 'workout',
      scheduled_start: '',
      scheduled_end: '',
      max_participants: 10,
      use_in_app_meeting: false
    });
    setShowCreateActivity(false);
  };

  const handleCreateMilestone = () => {
    if (!newMilestone.description || !newMilestone.milestone_value) {
      alert('Please fill in all milestone fields');
      return;
    }
    
    // Ensure milestone_value is a number
    const milestoneData = {
      ...newMilestone,
      milestone_value: Number(newMilestone.milestone_value)
    };
    
    onCreateMilestone(milestoneData);
    setNewMilestone({
      milestone_type: 'streak',
      milestone_value: 1,
      description: ''
    });
    setShowCreateMilestone(false);
  };

  const handleJoinActivity = (activityId: number) => {
    onJoinActivity(activityId);
    onShowToast?.('Successfully joined activity! Check your email for confirmation.', 'success');
  };

  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Filter activities based on tab
  const filteredActivities = sortedActivities.filter(activity => {
    if (activity.type !== 'live_activity' && activity.type !== 'milestone') return false;
    
    if (activity.type === 'milestone') return true;
    
    const liveActivity = activity.data as LiveActivity;
    const now = new Date();
    const startTime = new Date(liveActivity.scheduled_start);
    const endTime = new Date(liveActivity.scheduled_end);
    
    if (activeTab === 'upcoming') {
      return startTime > now && liveActivity.is_active;
    } else if (activeTab === 'running') {
      return liveActivity.is_active && now >= startTime && now <= endTime;
    } else if (activeTab === 'ended') {
      return !liveActivity.is_active;
    }
    return false;
  });

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2">No recent activity</p>
        <p className="text-sm">Activities will appear here when available</p>
        
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => setShowCreateActivity(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <VideoCameraIcon className="w-4 h-4" />
            <span>Create Activity</span>
          </button>
          <button
            onClick={() => setShowCreateMilestone(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <GiftIcon className="w-4 h-4" />
            <span>Share Milestone</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 pb-4 border-b border-gray-200">
        <button
          onClick={() => setShowCreateActivity(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <VideoCameraIcon className="w-4 h-4" />
          <span>Create Activity</span>
        </button>
        <button
          onClick={() => setShowCreateMilestone(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <GiftIcon className="w-4 h-4" />
          <span>Share Milestone</span>
        </button>
      </div>

      {/* Activity Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'upcoming' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('running')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'running' 
              ? 'bg-white text-green-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Running
        </button>
        <button
          onClick={() => setActiveTab('ended')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'ended' 
              ? 'bg-white text-gray-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Ended
        </button>
      </div>

      {/* Activity Count */}
      <div className="text-sm text-gray-500 text-center">
        {activeTab === 'upcoming' && `${filteredActivities.length} upcoming activities`}
        {activeTab === 'running' && `${filteredActivities.length} running activities`}
        {activeTab === 'ended' && `${filteredActivities.length} ended activities`}
      </div>

      {filteredActivities.map((activity, index) => {
        const metadata = getActivityMetadata(activity);
        const canJoin = canJoinActivity(activity);
        
        return (
          <div 
            key={`${activity.type}-${activity.data.id}-${index}`}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-gray-50 rounded-full flex-shrink-0">
                {getActivityIcon(activity.type, (activity.data as any).activity_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {getActivityTitle(activity)}
                    </h3>
                    
                    {activity.type === 'live_activity' && (
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <UserIcon className="w-4 h-4 mr-1" />
                        <span>Host: {metadata.host}</span>
                      </div>
                    )}
                    
                    {activity.type === 'encouragement' && (
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <UserIcon className="w-4 h-4 mr-1" />
                        <span>From: {metadata.sender}</span>
                      </div>
                    )}
                    
                    {activity.type === 'milestone' && (
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <UserIcon className="w-4 h-4 mr-1" />
                        <span>{metadata.user}</span>
                      </div>
                    )}
                    
                    {activity.type === 'live_activity' && (
                      <div className="flex items-center mt-1">
                        {activeTab === 'upcoming' && (
                          <div className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            Scheduled
                          </div>
                        )}
                        {activeTab === 'running' && isActuallyLive(activity) && (
                          <div className="flex items-center bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Live
                          </div>
                        )}
                        {activeTab === 'ended' && (
                          <div className="flex items-center bg-gray-50 text-gray-700 px-2 py-1 rounded-full text-xs">
                            <div className="w-2 h-2 bg-gray-500 rounded-full mr-1"></div>
                            Ended
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 mt-2 text-sm">
                  {getActivityDescription(activity)}
                </p>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    <span>{getActivityTime(activity)}</span>
                  </div>
                  
                  {activity.type === 'live_activity' && (
                    <div className="flex items-center text-xs text-gray-500">
                      <UserIcon className="w-3 h-3 mr-1" />
                      <span>{metadata.participants}/{metadata.maxParticipants} participants</span>
                    </div>
                  )}
                </div>
                
                {/* In-App Meeting Link Display */}
                {activity.type === 'live_activity' && (activity.data as any).meeting_link && (activity.data as any).meeting_link?.includes('/meeting/') && (
                  <div className="mt-2">
                    <SimpleMeeting roomId={(activity.data as any).meeting_password || 'ROOM'} />
                  </div>
                )}
                
                {/* External Meeting Link Display */}
                {activity.type === 'live_activity' && (activity.data as any).meeting_link && !(activity.data as any).meeting_link?.includes('/meeting/') && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center text-sm text-blue-700">
                      <VideoCameraIcon className="w-4 h-4 mr-2" />
                      <span className="font-medium">External Meeting Link Available</span>
                    </div>
                    <a 
                      href={(activity.data as any).meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 block"
                    >
                      {(activity.data as any).meeting_link}
                    </a>
                    {(activity.data as any).meeting_password && (
                      <div className="text-xs text-gray-600 mt-1">
                        Password: <span className="font-mono">{(activity.data as any).meeting_password}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {canJoin && (
                  <button
                    onClick={() => handleJoinActivity((activity.data as LiveActivity).id)}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
                  >
                    <VideoCameraIcon className="w-4 h-4" />
                    <span>Join Activity</span>
                  </button>
                )}
                
                {activity.type === 'live_activity' && activity.is_joined && (
                  <div className="mt-3 w-full bg-green-50 text-green-700 font-medium py-2 px-4 rounded-md flex items-center justify-center space-x-2">
                    <VideoCameraIcon className="w-4 h-4" />
                    <span>Joined</span>
                  </div>
                )}
                
                {/* Host controls for activity management */}
                {activity.type === 'live_activity' && 
                 (activity.data as LiveActivity).host_email === currentUserEmail && (
                  <div className="mt-3 space-y-2">
                    {activeTab === 'running' && isActuallyLive(activity) ? (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Meeting link (optional)"
                          value={meetingLinks[(activity.data as LiveActivity).id] || ''}
                          onChange={(e) => setMeetingLinks(prev => ({
                            ...prev,
                            [(activity.data as LiveActivity).id]: e.target.value
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <button
                          onClick={() => onUpdateActivityStatus?.((activity.data as LiveActivity).id, 'ended', meetingLinks[(activity.data as LiveActivity).id])}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                        >
                          End Session
                        </button>
                      </div>
                    ) : activeTab === 'upcoming' && (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Meeting link (optional)"
                          value={meetingLinks[(activity.data as LiveActivity).id] || ''}
                          onChange={(e) => setMeetingLinks(prev => ({
                            ...prev,
                            [(activity.data as LiveActivity).id]: e.target.value
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <button
                          onClick={() => onUpdateActivityStatus?.((activity.data as LiveActivity).id, 'live', meetingLinks[(activity.data as LiveActivity).id])}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                        >
                          Start Session
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {activity.type === 'encouragement' && !metadata.isRead && (
                  <div className="mt-2 bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs">
                    New message
                  </div>
                )}
                
                {activity.type === 'milestone' && metadata.isShared && (
                  <div className="mt-2 bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                    Shared with community
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Create Activity Modal */}
      {showCreateActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create Live Activity</h3>
              <button onClick={() => setShowCreateActivity(false)}>
                <CloseIcon />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Morning Yoga Session"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Join us for a refreshing morning yoga flow"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Activity Type</label>
                <select
                  value={newActivity.activity_type}
                  onChange={(e) => setNewActivity({...newActivity, activity_type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="workout">Workout</option>
                  <option value="nutrition_workshop">Nutrition Workshop</option>
                  <option value="qna">Q&A Session</option>
                  <option value="challenge_prep">Challenge Prep</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newActivity.scheduled_start}
                    onChange={(e) => setNewActivity({...newActivity, scheduled_start: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={newActivity.scheduled_end}
                    onChange={(e) => setNewActivity({...newActivity, scheduled_end: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Max Participants</label>
                <input
                  type="number"
                  value={newActivity.max_participants}
                  onChange={(e) => setNewActivity({...newActivity, max_participants: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                  max="100"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use-in-app-meeting"
                  checked={newActivity.use_in_app_meeting}
                  onChange={(e) => setNewActivity({...newActivity, use_in_app_meeting: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="use-in-app-meeting" className="text-sm text-gray-700">
                  Create in-app video meeting (free, real-time)
                </label>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateActivity}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Create Activity
                </button>
                <button
                  onClick={() => setShowCreateActivity(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Milestone Modal */}
      {showCreateMilestone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Share Milestone</h3>
              <button onClick={() => setShowCreateMilestone(false)}>
                <CloseIcon />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Milestone Type</label>
                <select
                  value={newMilestone.milestone_type}
                  onChange={(e) => setNewMilestone({...newMilestone, milestone_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="streak">Workout Streak</option>
                  <option value="weight_goal">Weight Goal</option>
                  <option value="challenge_complete">Challenge Complete</option>
                  <option value="level_up">Level Up</option>
                  <option value="personal_record">Personal Record</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <input
                  type="number"
                  value={newMilestone.milestone_value}
                  onChange={(e) => setNewMilestone({...newMilestone, milestone_value: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                  placeholder="30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Completed 30-day workout streak!"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateMilestone}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700"
                >
                  Share Milestone
                </button>
                <button
                  onClick={() => setShowCreateMilestone(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
