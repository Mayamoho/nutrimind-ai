import { Friend, FriendRequest, SocialPost, Challenge, Encouragement, LiveActivity, MilestoneCelebration } from '../types';

const API_BASE_URL = '/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ msg: response.statusText }));
        throw new Error(errorData.msg || 'An unknown API error occurred');
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') !== -1) {
        return response.json();
    }
    return { success: true };
};

// Helper for making authenticated requests
const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('nutrimind_token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    return handleResponse(response);
};

export const socialApi = {
    // Friends
    getFriends: async (): Promise<Friend[]> => {
        return await authFetch('/social/friends');
    },

    sendFriendRequest: async (lastName: string): Promise<void> => {
        await authFetch('/social/friends/request', {
            method: 'POST',
            body: JSON.stringify({ lastName }),
        });
    },

    acceptFriendRequest: async (email: string): Promise<void> => {
        await authFetch('/social/friends/accept', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    declineFriendRequest: async (email: string): Promise<void> => {
        await authFetch('/social/friends/decline', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    removeFriend: async (email: string): Promise<void> => {
        await authFetch('/social/friends/remove', {
            method: 'DELETE',
            body: JSON.stringify({ email }),
        });
    },

    getPendingRequests: async (): Promise<FriendRequest[]> => {
        return await authFetch('/social/friends/pending');
    },

    // Social Posts
    getPosts: async (): Promise<SocialPost[]> => {
        return await authFetch('/social/posts');
    },

    createPost: async (content: string, file?: File): Promise<SocialPost> => {
        const token = localStorage.getItem('nutrimind_token');
        const formData = new FormData();
        formData.append('content', content);
        if (file) {
            formData.append('file', file);
        }

        const response = await fetch(`${API_BASE_URL}/social/posts`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });

        return await handleResponse(response);
    },

    likePost: async (postId: number): Promise<void> => {
        await authFetch(`/social/posts/${postId}/like`, {
            method: 'POST',
        });
    },

    commentOnPost: async (postId: number, comment: string): Promise<void> => {
        await authFetch(`/social/posts/${postId}/comment`, {
            method: 'POST',
            body: JSON.stringify({ comment }),
        });
    },

    sharePost: async (postId: number): Promise<void> => {
        await authFetch(`/social/posts/${postId}/share`, {
            method: 'POST',
        });
    },

    // Challenges
    getChallenges: async (): Promise<Challenge[]> => {
        return await authFetch('/social/challenges');
    },

    joinChallenge: async (challengeId: number): Promise<void> => {
        await authFetch(`/social/challenges/${challengeId}/join`, {
            method: 'POST',
        });
    },

    completeChallenge: async (challengeId: number): Promise<{ points_awarded: number }> => {
        return await authFetch(`/social/challenges/${challengeId}/complete`, {
            method: 'POST',
        });
    },

    updateProgress: async (challengeId: number, progress: number): Promise<void> => {
        return await authFetch(`/social/challenges/${challengeId}/progress`, {
            method: 'PUT',
            body: JSON.stringify({ progress }),
        });
    },

    createChallenge: async (challengeData: {
        title: string;
        description: string;
        challenge_type: 'streak' | 'protein' | 'weight_loss' | 'workout' | 'water' | 'custom';
        duration_days: number;
        target_value?: number;
        reward_points: number;
        max_participants: number;
    }): Promise<any> => {
        return await authFetch('/social/challenges', {
            method: 'POST',
            body: JSON.stringify(challengeData),
        });
    },

    // Activities
    getActivities: async (): Promise<Array<{
        type: 'live_activity' | 'encouragement' | 'milestone';
        data: LiveActivity | Encouragement | MilestoneCelebration;
        timestamp: string;
    }>> => {
        return await authFetch('/social/activities');
    },

    joinActivity: async (activityId: number): Promise<void> => {
        await authFetch(`/social/activities/${activityId}/join`, {
            method: 'POST',
        });
    },

    // Encouragement
    sendEncouragement: async (recipientEmail: string, message: string): Promise<void> => {
        await authFetch('/social/encouragement', {
            method: 'POST',
            body: JSON.stringify({ recipientEmail, message }),
        });
    },

    getEncouragements: async (): Promise<any[]> => {
        return await authFetch('/social/encouragements');
    },

    getUserProfile: async (userEmail: string): Promise<any> => {
        return await authFetch(`/social/profile/${userEmail}`);
    },

    getConversation: async (friendEmail: string): Promise<any[]> => {
        return await authFetch(`/social/conversation/${friendEmail}`);
    },

    getAllUsers: async (): Promise<Array<{email: string, last_name: string}>> => {
        return await authFetch('/social/users');
    },

    getPostComments: async (postId: number): Promise<any[]> => {
        return await authFetch(`/social/posts/${postId}/comments`);
    },

    createActivity: async (activity: {
        title: string;
        description: string;
        activity_type: 'workout' | 'nutrition_workshop' | 'qna' | 'challenge_prep';
        scheduled_start: string;
        scheduled_end: string;
        max_participants: number;
    }): Promise<void> => {
        return authFetch('/social/activities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activity),
        });
    },

    createMilestone: async (milestone: {
        milestone_type: string;
        milestone_value: number;
        description: string;
    }): Promise<void> => {
        return authFetch('/social/milestones', {
            method: 'POST',
            body: JSON.stringify(milestone),
        });
    },

    // User milestones and challenges
    getUserMilestones: async (userEmail?: string): Promise<any[]> => {
        return await authFetch(`/social/milestones${userEmail ? `/${userEmail}` : ''}`);
    },

    getUserChallenges: async (userEmail?: string): Promise<any[]> => {
        return await authFetch(`/social/challenges${userEmail ? `/${userEmail}` : ''}`);
    },
};

export default socialApi;
