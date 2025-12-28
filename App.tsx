import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { AchievementProvider } from './contexts/AchievementContext';
import { ApiKeyProvider } from './contexts/ApiKeyContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { WebRTCProvider } from './contexts/WebRTCContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Header from './components/Header';
import Auth from './components/Auth';
import AchievementNotificationContainer from './components/AchievementNotificationContainer';
import TabNavigation, { AppTab } from './components/TabNavigation';
import { DashboardTab, LogTab, ProgressTab, AchievementsTab, LeaderboardTab, ProfileTab, DataAnalysisTab, SocialTab } from './components/tabs';
import VideoCallTab from './components/tabs/VideoCallTab';
import EnhancedSocialTab from './components/EnhancedSocialTab';
import Chatbot from './components/Chatbot';
import socialApi from './services/socialService';
import { Friend, FriendRequest, SocialPost, Challenge } from './types';

const AppContent: React.FC = () => {
  console.log('[AppContent] AppContent component rendering...');
  
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  
  console.log('[AppContent] Auth state:', { user: user ? 'logged in' : 'null', isLoading });

  if (!user) {
    console.log('[AppContent] No user found, showing Auth component');
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Auth />
      </div>
    );
  }

  console.log('[AppContent] User found, rendering main app');
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [viewingProfileEmail, setViewingProfileEmail] = useState<string | null>(null);
  
  // Social data state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activities, setActivities] = useState<Array<{
    type: 'live_activity' | 'encouragement' | 'milestone';
    data: any;
    timestamp: string;
    is_joined?: boolean;
  }>>([]);
  
  // Load social data on mount and tab change
  useEffect(() => {
    if (user && activeTab === 'social') {
      loadSocialData();
    }
  }, [user, activeTab]);
  
  const loadSocialData = async () => {
    try {
      const [friendsData, requestsData, postsData, challengesData, activitiesData] = await Promise.all([
        socialApi.getFriends(),
        socialApi.getPendingRequests(),
        socialApi.getPosts(),
        socialApi.getChallenges(),
        socialApi.getActivities()
      ]);
      
      setFriends(friendsData);
      setPendingRequests(requestsData);
      setSocialPosts(postsData);
      setChallenges(challengesData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load social data:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Auth />
      </div>
    );
  }

  const handleViewProfile = (email: string) => {
    setViewingProfileEmail(email);
    setActiveTab('profile');
  };

  const handleBackFromProfile = () => {
    setViewingProfileEmail(null);
    setActiveTab('leaderboard');
  };

  const handleTabChange = (tab: AppTab) => {
    if (tab === 'profile') {
      setViewingProfileEmail(null); // View own profile
    }
    setActiveTab(tab);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'log':
        return <LogTab />;
      case 'progress':
        return <ProgressTab />;
      case 'achievements':
        return <AchievementsTab />;
      case 'leaderboard':
        return <LeaderboardTab onViewProfile={handleViewProfile} />;
      case 'analytics':
        return <DataAnalysisTab />;
      case 'social':
        return <EnhancedSocialTab 
          friends={friends}
          challenges={challenges}
          socialPosts={socialPosts}
          pendingRequests={pendingRequests}
          activities={activities}
          onSendFriendRequest={async (lastName) => {
            await socialApi.sendFriendRequest(lastName);
            loadSocialData(); // Refresh data
          }}
          onAcceptRequest={async (email) => {
            await socialApi.acceptFriendRequest(email);
            loadSocialData(); // Refresh data
          }}
          onDeclineRequest={async (email) => {
            await socialApi.declineFriendRequest(email);
            loadSocialData(); // Refresh data
          }}
          onRemoveFriend={async (email) => {
            await socialApi.removeFriend(email);
            loadSocialData(); // Refresh data
          }}
          onJoinChallenge={async (challengeId) => {
            try {
              await socialApi.joinChallenge(challengeId);
              showToast('Challenge accepted! Good luck!', 'success');
              loadSocialData(); // Refresh data
            } catch (error) {
              showToast('Failed to join challenge', 'error');
            }
          }}
          onCompleteChallenge={async (challengeId) => {
            try {
              const result = await socialApi.completeChallenge(challengeId);
              showToast(`Challenge completed! You earned ${result.points_awarded} points!`, 'success');
              loadSocialData(); // Refresh data
            } catch (error) {
              showToast('Failed to complete challenge', 'error');
            }
          }}
          onUpdateProgress={async (challengeId, progress) => {
            try {
              await socialApi.updateProgress(challengeId, progress);
              showToast('Progress updated successfully!', 'success');
              loadSocialData(); // Refresh data
            } catch (error) {
              showToast('Failed to update progress', 'error');
            }
          }}
          onLikePost={async (postId) => {
            await socialApi.likePost(postId);
            loadSocialData(); // Refresh posts
          }}
          onCommentOnPost={async (postId) => {
            // For now, just a placeholder - would need comment UI
            console.log('Comment on post:', postId);
          }}
          onCommentOnSharePost={async (postId) => {
            // For now, just a placeholder - would need comment UI
            console.log('Comment on shared post:', postId);
          }}
          onSharePost={async (postId) => {
            await socialApi.sharePost(postId);
            console.log('Post shared:', postId);
          }}
          onCreatePost={async (content, file) => {
            await socialApi.createPost(content, file);
            loadSocialData(); // Refresh posts
          }}
          onCreateChallenge={async (challengeData) => {
            await socialApi.createChallenge(challengeData);
            loadSocialData(); // Refresh challenges
          }}
          onJoinActivity={async (activityId) => {
            try {
              await socialApi.joinActivity(activityId);
              showToast('Successfully joined activity!', 'success');
              loadSocialData(); // Refresh activities
            } catch (error) {
              showToast('Failed to join activity', 'error');
            }
          }}
          onCreateActivity={async (activity) => {
            try {
              await socialApi.createActivity(activity);
              showToast('Activity created successfully!', 'success');
              loadSocialData(); // Refresh activities
            } catch (error) {
              showToast('Failed to create activity', 'error');
            }
          }}
          onCreateMilestone={async (milestone) => {
            try {
              await socialApi.createMilestone(milestone);
              showToast('Milestone shared successfully!', 'success');
              loadSocialData(); // Refresh activities
            } catch (error) {
              showToast('Failed to share milestone', 'error');
            }
          }}
          onUpdateActivityStatus={async (activityId, status, meetingLink) => {
            try {
              // Add this API call to socialService
              const response = await fetch(`/api/social/activities/${activityId}/status`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('nutrimind_token')}`
                },
                body: JSON.stringify({ status, meeting_link: meetingLink })
              });
              
              if (!response.ok) throw new Error('Failed to update activity status');
              
              const action = status === 'live' ? 'started' : 'ended';
              showToast(`Activity ${action} successfully!`, 'success');
              loadSocialData(); // Refresh activities
            } catch (error) {
              showToast('Failed to update activity status', 'error');
            }
          }}
          currentUserEmail={user?.email}
        />;
      case 'profile':
        return <ProfileTab viewingEmail={viewingProfileEmail} onBack={viewingProfileEmail ? handleBackFromProfile : undefined} />;
      case 'video-call':
        return <VideoCallTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <DataProvider isAuthenticated={!!user && !isLoading}>
      <AchievementProvider>
        <WebRTCProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans pb-20 md:pb-0">
            <Header />
            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
              {renderActiveTab()}
            </main>
            <AchievementNotificationContainer />
            <Chatbot />
          </div>
        </WebRTCProvider>
      </AchievementProvider>
    </DataProvider>
  );
};

const App: React.FC = () => {
  console.log('[App.tsx] App component rendering...');
  
  return (
    <ApiKeyProvider>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </ApiKeyProvider>
  );
};

export default App;

// Force recompile to clear browser cache - NotificationBar has been moved to Header
