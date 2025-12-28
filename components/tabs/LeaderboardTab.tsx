/**
 * Leaderboard Tab
 * Community leaderboard showing user rankings by various metrics
 * Clicking on a username navigates to their profile
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { LeaderboardUser, LeaderboardSortOption, CommunityStats } from '../../types';
import { RankingStrategies } from '../../patterns/LeaderboardStrategy';

const SORT_OPTIONS: { value: LeaderboardSortOption; label: string; icon: string }[] = [
  { value: 'level', label: 'Level', icon: '🎖️' },
  { value: 'totalPoints', label: 'Points', icon: '⭐' },
  { value: 'totalCaloriesIn', label: 'Calories Intake', icon: '🍎' },
  { value: 'totalCaloriesBurned', label: 'Calories Burned', icon: '🔥' },
  { value: 'totalProtein', label: 'Protein Intake', icon: '🥩' },
  { value: 'totalCarbs', label: 'Carbs Intake', icon: '🍞' },
  { value: 'totalFat', label: 'Fat Intake', icon: '🥑' },
  { value: 'totalWaterIntake', label: 'Water Intake', icon: '💧' },
  { value: 'totalFoods', label: 'Meals Logged', icon: '🍽️' },
  { value: 'totalExercises', label: 'Workouts', icon: '💪' },
  { value: 'bestStreak', label: 'Best Streak', icon: '🔥' },
  { value: 'totalNeat', label: 'NEAT Activities', icon: '🚶' },
];

const getMedalStyle = (rank: number) => {
  switch (rank) {
    case 1: return { bg: 'bg-gradient-to-r from-yellow-400 to-amber-500', medal: '🥇' };
    case 2: return { bg: 'bg-gradient-to-r from-slate-300 to-slate-400', medal: '🥈' };
    case 3: return { bg: 'bg-gradient-to-r from-amber-600 to-orange-700', medal: '🥉' };
    default: return null;
  }
};

const getLevelColor = (level: number) => {
  if (level >= 10) return 'from-purple-500 to-pink-500';
  if (level >= 7) return 'from-blue-500 to-cyan-500';
  if (level >= 4) return 'from-emerald-500 to-teal-500';
  return 'from-slate-400 to-slate-500';
};

interface LeaderboardTabProps {
  onViewProfile?: (email: string) => void;
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ onViewProfile }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [sortBy, setSortBy] = useState<LeaderboardSortOption>('level');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leaderboardData, statsData] = await Promise.all([
        api.getLeaderboard(sortBy, searchQuery, 50),
        api.getLeaderboardStats(),
      ]);
      setLeaderboard(leaderboardData.leaderboard || []);
      setCurrentUser(leaderboardData.currentUser || null);
      setCommunityStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, searchQuery]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch !== searchQuery) return;
    fetchLeaderboard();
  }, [debouncedSearch]);

  const getDisplayValue = (user: LeaderboardUser) => {
    const strategy = RankingStrategies[sortBy];
    return strategy ? strategy.getValue(user) : `${user.totalPoints} pts`;
  };

  const currentSortOption = SORT_OPTIONS.find(o => o.value === sortBy);
  const handleUserClick = (email: string) => { if (onViewProfile) onViewProfile(email); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span className="text-3xl">🏅</span> Leaderboard
            </h2>
            <p className="text-white/80 mt-1">See how you rank against others</p>
          </div>
          {currentUser && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <p className="text-white/70 text-xs font-medium mb-1">Your Rank</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">#{currentUser.rank}</span>
                <div className="text-left">
                  <p className="text-sm font-medium">{currentUser.username}</p>
                  <p className="text-xs text-white/70">{getDisplayValue(currentUser)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Community Stats */}
      {communityStats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-2xl">👥</span>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{communityStats.totalUsers}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Users</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-2xl">⭐</span>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{(communityStats.communityPoints / 1000).toFixed(1)}k</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Points</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-2xl">📝</span>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{communityStats.totalLogs}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Logs</p>
          </div>
        </div>
      )}

      {/* Search & Sort */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="sm:w-64">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as LeaderboardSortOption)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <span className="text-4xl mb-4 block">😕</span>
            <p className="text-slate-500 dark:text-slate-400">{error}</p>
            <button onClick={fetchLeaderboard} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Retry</button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl mb-4 block">🏆</span>
            <p className="text-slate-500 dark:text-slate-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">User</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Level</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{currentSortOption?.icon} {currentSortOption?.label}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {leaderboard.map((user) => {
                  const medalStyle = getMedalStyle(user.rank);
                  const isCurrentUser = user.isCurrentUser;
                  return (
                    <tr key={user.email} className={`transition-colors ${isCurrentUser ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                      <td className="px-4 py-4">
                        {medalStyle ? (
                          <div className={`w-10 h-10 rounded-full ${medalStyle.bg} flex items-center justify-center shadow-md`}>
                            <span className="text-xl">{medalStyle.medal}</span>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <span className="font-bold text-slate-600 dark:text-slate-300">#{user.rank}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => handleUserClick(user.email)} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-semibold hover:underline ${isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>
                              {user.username}
                              {isCurrentUser && <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">You</span>}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.country}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${getLevelColor(user.level)} text-white font-bold text-sm shadow-md`}>
                          {user.level}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-lg text-slate-800 dark:text-white">{getDisplayValue(user)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardTab;
