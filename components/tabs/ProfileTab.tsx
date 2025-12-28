/**
 * Profile Tab
 * Shows user profile with stats, personal info (own profile only), and edit options
 * Profile image upload and edit profile functionality for own profile
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import { socialApi } from '../../services/socialService';
import { UserProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { GiftIcon, TrophyIcon } from '../icons';

interface ProfileTabProps {
  viewingEmail?: string | null;
  onBack?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ viewingEmail, onBack }) => {
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', country: '', password: '' });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // New states for milestones and challenges
  const [milestones, setMilestones] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(false);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false);
  const [activeTab, setActiveTab] = useState<'milestones' | 'challenges'>('milestones');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emailToView = viewingEmail || currentUser?.email;
  const isOwnProfile = !viewingEmail || viewingEmail === currentUser?.email;

  const fetchProfile = useCallback(async () => {
    if (!emailToView) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getUserProfile(emailToView);
      setProfile(data);
      if (isOwnProfile && currentUser) {
        setEditForm({
          username: currentUser.lastName || '',
          country: currentUser.country || '',
          password: '',
        });
        // Load saved profile image from localStorage
        const savedImage = localStorage.getItem(`profileImage_${currentUser.email}`);
        if (savedImage) setProfileImage(savedImage);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [emailToView, isOwnProfile, currentUser]);

  const fetchMilestones = useCallback(async () => {
    if (!emailToView) return;
    
    setIsLoadingMilestones(true);
    try {
      const data = await socialApi.getUserMilestones(emailToView);
      setMilestones(data);
    } catch (err: any) {
      console.error('Failed to fetch milestones:', err);
    } finally {
      setIsLoadingMilestones(false);
    }
  }, [emailToView]);

  const fetchChallenges = useCallback(async () => {
    if (!emailToView) return;
    
    setIsLoadingChallenges(true);
    try {
      const data = await socialApi.getUserChallenges(emailToView);
      setChallenges(data);
    } catch (err: any) {
      console.error('Failed to fetch challenges:', err);
    } finally {
      setIsLoadingChallenges(false);
    }
  }, [emailToView]);

  useEffect(() => {
    fetchProfile();
    fetchMilestones();
    fetchChallenges();
  }, [fetchProfile, fetchMilestones, fetchChallenges]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileImage(base64);
        if (currentUser?.email) {
          localStorage.setItem(`profileImage_${currentUser.email}`, base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await api.updateProfile({
        lastName: editForm.username,
        country: editForm.country,
        ...(editForm.password && { password: editForm.password }),
      });
      if (updateUser) {
        updateUser({ lastName: editForm.username, country: editForm.country });
      }
      setIsEditing(false);
      fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-20">
        <span className="text-4xl mb-4 block">😕</span>
        <p className="text-slate-500 dark:text-slate-400">{error || 'Profile not found'}</p>
        {onBack && (
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Go Back
          </button>
        )}
      </div>
    );
  }

  const { user, stats, topFoods, topExercises } = profile;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {!isOwnProfile && onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors">
          <span>←</span> Back to Leaderboard
        </button>
      )}

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar with upload option for own profile */}
          <div className="relative">
            <div 
              className={`w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold shadow-lg overflow-hidden ${isOwnProfile ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={() => isOwnProfile && fileInputRef.current?.click()}
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            {isOwnProfile && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-emerald-600 hover:bg-emerald-50"
                >
                  📷
                </button>
              </>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              {user.username}
              {isOwnProfile && <span className="text-sm bg-white/20 px-2 py-1 rounded-full">You</span>}
            </h2>
            <p className="text-white/80 mt-1 flex items-center gap-2">
              <span>📍</span> {user.country}
            </p>
            <p className="text-white/60 text-sm mt-1">
              Member since {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Level Badge */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
            <p className="text-white/70 text-xs font-medium">Level</p>
            <p className="text-4xl font-bold">{stats.level}</p>
            <p className="text-sm text-white/80">{stats.totalPoints.toLocaleString()} pts</p>
          </div>
        </div>
      </div>

      {/* Personal Info Section - Only for own profile */}
      {isOwnProfile && currentUser && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>🔐</span> Personal Information
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors text-sm font-medium"
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
                <input
                  type="text"
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password (optional)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Username</p>
                <p className="font-semibold text-slate-800 dark:text-white">{currentUser.lastName || 'Not set'}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</p>
                <p className="font-semibold text-slate-800 dark:text-white">{currentUser.email}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Country</p>
                <p className="font-semibold text-slate-800 dark:text-white">{currentUser.country || 'Not set'}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Password</p>
                <p className="font-semibold text-slate-800 dark:text-white">••••••••</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: '🔥', value: stats.currentStreak, label: 'Current Streak' },
          { icon: '⭐', value: stats.longestStreak, label: 'Best Streak' },
          { icon: '📅', value: stats.daysLogged, label: 'Days Active' },
          { icon: '🏆', value: stats.achievementsUnlocked, label: 'Achievements' },
          { icon: '🍎', value: stats.uniqueFoodTypes, label: 'Food Types' },
          { icon: '💪', value: stats.uniqueExerciseTypes, label: 'Exercise Types' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-2xl">{stat.icon}</span>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Calorie & Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span>🔥</span> Calorie Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400">Total Consumed</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.totalCaloriesIn.toLocaleString()} cal</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400">Total Burned</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">{stats.totalCaloriesBurned.toLocaleString()} cal</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400">Total Water</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{(stats.totalWaterIntake / 1000).toFixed(1)} L</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span>📊</span> Activity Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400">Food Entries</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{stats.totalFoods.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400">Exercise Entries</span>
              <span className="font-bold text-pink-600 dark:text-pink-400">{stats.totalExercises.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400">Avg Calories/Day</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {stats.daysLogged > 0 ? Math.round(stats.totalCaloriesIn / stats.daysLogged).toLocaleString() : 0} cal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Foods & Exercises */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span>🍽️</span> Top Foods
          </h3>
          {topFoods.length > 0 ? (
            <div className="space-y-3">
              {topFoods.map((food, index) => (
                <div key={food.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{food.name}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{food.count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">No food logged yet</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span>🏃</span> Top Exercises
          </h3>
          {topExercises.length > 0 ? (
            <div className="space-y-3">
              {topExercises.map((exercise, index) => (
                <div key={exercise.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{exercise.name}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{exercise.count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">No exercises logged yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
