/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Heart, 
  MessageCircle, 
  Plus, 
  Users, 
  Compass, 
  Sparkles, 
  Search, 
  RefreshCw, 
  UserPlus, 
  User as UserIcon, 
  Eye, 
  Rss,
  Activity
} from "lucide-react";

import { User, Post } from "./types";
import PostCard from "./components/PostCard";
import UserProfileModal from "./components/UserProfileModal";
import CreateProfileModal from "./components/CreateProfileModal";
import CreatePostCard from "./components/CreatePostCard";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & Navigation state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [feedFilter, setFeedFilter] = useState<"all" | "following">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile active sections: "feed", "network"
  const [mobileTab, setMobileTab] = useState<"feed" | "network">("feed");

  // Fetch initial state
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError("");
    try {
      // 1. Current active simulated user
      const authRes = await fetch("/api/auth/current");
      if (authRes.ok) {
        const authData = await authRes.json();
        setCurrentUser(authData);
      } else {
        setError("Failed to resolve current active user.");
      }

      // 2. All platform users
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }

      // 3. All feed posts
      const postsRes = await fetch("/api/posts");
      if (postsRes.ok) {
        setPosts(await postsRes.json());
      }
    } catch (err: any) {
      console.error("Networking error:", err);
      setError("Server connection failed. Verify Express server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (content: string, imageUrl?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl })
      });
      if (res.ok) {
        // Refresh feed & update profile posts if modal is open
        const freshPostsRes = await fetch("/api/posts");
        if (freshPostsRes.ok) {
          const freshPosts = await freshPostsRes.json();
          setPosts(freshPosts);
          return true;
        }
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleLikeToggle = async (postId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST"
      });
      if (res.ok) {
        const likeResult = await res.json();
        // Optimistically update posts state
        setPosts(prev =>
          prev.map(p => (p.id === postId ? { ...p, likes: likeResult.likes } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (postId: string, content: string): Promise<void> => {
    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        const freshPostsRes = await fetch("/api/posts");
        if (freshPostsRes.ok) {
          setPosts(await freshPostsRes.json());
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add comment.");
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleFollowToggle = async (targetId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${targetId}/follow`, {
        method: "POST"
      });
      if (res.ok) {
        const followResult = await res.json();
        
        // Update users state
        setUsers(prev =>
          prev.map(u => {
            if (u.id === currentUser.id) return followResult.user;
            if (u.id === targetId) return followResult.target;
            return u;
          })
        );

        // Update active simulated user status
        setCurrentUser(followResult.user);

        // Keep active selection modal synced too
        if (selectedUser?.id === targetId) {
          setSelectedUser(followResult.target);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProfileSubmit = async (form: {
    username: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
  }): Promise<User | null> => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      const newUser = await res.json();
      // Instantly refresh users list
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
      // Force switch session to new user
      await handleSwitchSimulatedUser(newUser.id);
      return newUser;
    } else {
      const errData = await res.json();
      throw new Error(errData.error || "Registration handle is already registered.");
    }
  };

  const handleSwitchSimulatedUser = async (userId: string) => {
    try {
      const res = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const freshUser = await res.json();
        setCurrentUser(freshUser);
        // Clean filters
        setFeedFilter("all");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("Delete custom posts/profiles and reset database to standard seeds?")) return;
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (res.ok) {
        await fetchInitialData();
        setSelectedUser(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Profile modal click helper
  const handleOpenUserProfile = (userId: string) => {
    const usr = users.find(u => u.id === userId);
    if (usr) {
      setSelectedUser(usr);
    }
  };

  // Convert array to fast-lookup Record
  const usersMap: Record<string, User> = {};
  users.forEach(u => {
    usersMap[u.id] = u;
  });

  // Filter posts list dynamically
  const filteredPostsByAudience = posts.filter(post => {
    if (feedFilter === "all") return true;
    if (!currentUser) return false;
    // Show self posts AND following users posts
    return post.authorId === currentUser.id || currentUser.following.includes(post.authorId);
  });

  const finalFilteredPosts = filteredPostsByAudience.filter(post => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const author = usersMap[post.authorId];
    return (
      post.content.toLowerCase().includes(query) ||
      post.authorId.toLowerCase().includes(query) ||
      (author && author.displayName.toLowerCase().includes(query))
    );
  });

  // Candidates for Who to Follow recommendation
  const whoToFollowCandidates = users.filter(u => {
    if (!currentUser) return true;
    return u.id !== currentUser.id && !currentUser.following.includes(u.id);
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#262626] font-sans flex flex-col" id="app-root">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#DBDBDB] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#262626] flex items-center justify-center text-white">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#262626] leading-none">MiniSocial</h1>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">For You Feed</span>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDatabase}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-50 px-3.5 py-2.5 rounded-lg border border-[#DBDBDB] cursor-pointer font-semibold transition"
            title="Reset DB schemas back to primary seeds"
            id="reset-db-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Seed</span>
          </button>

          <button
            onClick={() => setShowCreateProfileModal(true)}
            className="flex items-center gap-1.5 text-xs text-white bg-[#0095F6] hover:bg-[#007cd1] px-4 py-2.5 rounded-lg font-bold shadow-sm cursor-pointer transition"
            id="create-profile-header-btn"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Register Profile</span>
          </button>
        </div>
      </header>

      {/* Main layout frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: Active user badge + simulation panel */}
        <section className="w-full lg:w-72 flex-shrink-0 space-y-5" id="sidebar-left">
          {currentUser ? (
            <div className="bg-white border border-[#DBDBDB] rounded-xl p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="bg-[#FAFAFA] border border-[#DBDBDB] text-gray-500 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide rounded">
                  Active Session
                </div>
                <div className="text-[11px] text-gray-400 font-semibold">Simulated User</div>
              </div>

              {/* Current user card click triggers their profile view */}
              <button
                onClick={() => handleOpenUserProfile(currentUser.id)}
                className="w-full text-left flex items-center gap-3 p-2 hover:bg-[#FAFAFA] rounded-lg transition cursor-pointer group"
                id="current-user-card-btn"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-[#DBDBDB]"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#262626] text-sm group-hover:underline truncate">{currentUser.displayName}</h3>
                  <p className="text-gray-400 text-xs truncate">@{currentUser.id}</p>
                </div>
              </button>

              <div className="mt-4 pt-3.5 border-t border-[#DBDBDB] grid grid-cols-2 text-center text-xs">
                <div>
                  <div className="font-bold text-[#262626]">{currentUser.followers.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Followers</div>
                </div>
                <div className="border-l border-[#DBDBDB]">
                  <div className="font-bold text-[#262626]">{currentUser.following.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Following</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-[#DBDBDB] rounded-xl p-4 text-center text-xs text-zinc-500">
              No simulated user is active. Please register a profile or refresh first!
            </div>
          )}

          {/* SIMULATE ANOTHER USER LIST (Enables easy testing of cross liking/follow) */}
          <div className="bg-white border border-[#DBDBDB] rounded-xl p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-gray-500" />
              <span>Switch Simulated User</span>
            </h3>
            <p className="text-[10px] text-gray-400 mb-3 leading-normal font-medium">
              Click below to change the logged-in session, write comments, or follow others to test the reactivity!
            </p>

            <div className="space-y-2">
              {users.map((u) => {
                const isActive = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSwitchSimulatedUser(u.id)}
                    className={`w-full text-left flex items-center justify-between p-2 rounded-lg transition text-xs font-medium border cursor-pointer ${
                      isActive
                        ? "bg-[#FAFAFA] border-[#DBDBDB] text-[#262626] font-bold shadow-sm"
                        : "bg-white border-transparent hover:bg-[#FAFAFA] text-gray-500 hover:text-gray-800"
                    }`}
                    id={`simulate-user-select-${u.id}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={u.avatarUrl} alt={u.displayName} className="w-6.5 h-6.5 rounded-full object-cover border border-[#DBDBDB]" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{u.displayName}</p>
                        <p className="text-[10px] text-gray-400 truncate">@{u.id}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0095F6] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: Feeds, Post creation, query input */}
         <section className="flex-1 space-y-5" id="main-content">
          
          {/* Mobile Tab Toggle */}
          <div className="flex lg:hidden bg-white p-1 rounded-xl border border-[#DBDBDB]">
            <button
              onClick={() => setMobileTab("feed")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                mobileTab === "feed" ? "bg-[#0095F6] text-white shadow-sm" : "text-gray-500"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Feeds & Timeline</span>
            </button>
            <button
              onClick={() => setMobileTab("network")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                mobileTab === "network" ? "bg-[#0095F6] text-white shadow-sm" : "text-gray-500"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Who to Follow ({whoToFollowCandidates.length})</span>
            </button>
          </div>

          {/* View Container bounded by Mobile Navigation Tabs */}
          <div className={`${mobileTab === "feed" ? "block" : "hidden lg:block"} space-y-5`}>
            
            {/* Create Post Card */}
            {currentUser && (
              <CreatePostCard currentUser={currentUser} onPostCreated={handleCreatePost} />
            )}

            {/* Filter Timelines & Search */}
            <div className="bg-white border border-[#DBDBDB] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              {/* Timeline feed filter links */}
              <div className="flex bg-[#FAFAFA] border border-[#DBDBDB] p-1 rounded-xl w-full md:w-auto">
                <button
                  onClick={() => setFeedFilter("all")}
                  className={`flex-1 md:flex-initial flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    feedFilter === "all"
                      ? "bg-white text-[#262626] border border-[#DBDBDB] shadow-sm"
                      : "text-gray-400 hover:text-gray-800"
                  }`}
                  id="feed-filter-all-btn"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore All</span>
                </button>
                <button
                  onClick={() => setFeedFilter("following")}
                  disabled={!currentUser}
                  className={`flex-1 md:flex-initial flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-semibold cursor-pointer transition disabled:opacity-45 ${
                    feedFilter === "following"
                      ? "bg-white text-[#262626] border border-[#DBDBDB] shadow-sm"
                      : "text-gray-400 hover:text-gray-800"
                  }`}
                  id="feed-filter-following-btn"
                >
                  <Rss className="w-3.5 h-3.5" />
                  <span>Following Feed</span>
                </button>
              </div>

              {/* Search input query filtering */}
              <div className="relative w-full md:w-60 flex items-center">
                <Search className="absolute left-3 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search posts or users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8.5 pr-3 py-2.5 bg-white border border-[#DBDBDB] rounded-xl focus:outline-none focus:border-[#0095F6] transition"
                  id="feed-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 px-1 text-[10px] font-bold text-gray-400 hover:text-gray-650"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Posts Feed Timeline Lists */}
            {isLoading ? (
              <div className="text-center py-16 bg-white border border-[#DBDBDB] rounded-xl flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#0095F6] border-t-transparent animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Loading platform feeds...</p>
              </div>
            ) : finalFilteredPosts.length > 0 ? (
              <div className="space-y-4" id="posts-timeline-feed">
                {finalFilteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    usersMap={usersMap}
                    onLike={handleLikeToggle}
                    onComment={handleCommentSubmit}
                    onUserClick={handleOpenUserProfile}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-[#DBDBDB] rounded-xl p-6">
                <p className="text-sm text-gray-500 font-semibold">No posts matches your selection.</p>
                <p className="text-xs text-gray-400 mt-1.5 max-w-sm mx-auto font-medium">
                  {feedFilter === "following" 
                    ? "Follow participants on the right sidebar or publish posts to build your personal timeline feed."
                    : "Be the first one to create a new thread!"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-xs font-bold text-[#0095F6] hover:underline cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Directory, Who to Follow list, Stats summary */}
        <section className={`w-full lg:w-72 flex-shrink-0 space-y-5 ${mobileTab === "network" ? "block" : "hidden lg:block"}`} id="sidebar-right">
          
          {/* WHO TO FOLLOW LIST */}
          <div className="bg-white border border-[#DBDBDB] rounded-xl p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Suggestions For You</span>
              </span>
              <span className="bg-[#FAFAFA] border border-[#DBDBDB] text-gray-500 text-[10px] px-2 py-0.5 rounded font-bold">
                {whoToFollowCandidates.length}
              </span>
            </h3>

            {whoToFollowCandidates.length > 0 ? (
              <div className="divide-y divide-[#DBDBDB]">
                {whoToFollowCandidates.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between gap-2.5 first:pt-0 last:pb-0">
                    <button
                      onClick={() => handleOpenUserProfile(u.id)}
                      className="flex items-center gap-2 min-w-0 text-left cursor-pointer hover:opacity-85"
                    >
                      <img src={u.avatarUrl} alt={u.displayName} className="w-8 h-8 rounded-full object-cover border border-[#DBDBDB]" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#262626] truncate hover:underline">{u.displayName}</p>
                        <p className="text-[10px] text-gray-400 truncate">@{u.id}</p>
                      </div>
                    </button>
                    {currentUser && (
                      <button
                        onClick={() => handleFollowToggle(u.id)}
                        className="text-xs font-bold text-[#0095F6] hover:text-[#007cd1] transition cursor-pointer"
                        id={`who-to-follow-btn-${u.id}`}
                      >
                        Follow
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic text-[11px] text-center py-4 font-medium">
                Following everyone on the system! 🚀
              </p>
            )}
          </div>

          {/* ALL REGISTERED MEMBERS LIST */}
          <div className="bg-white border border-[#DBDBDB] rounded-xl p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Registry ({users.length})</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleOpenUserProfile(u.id)}
                  className="flex items-center gap-1.5 bg-white hover:bg-zinc-50 border border-[#DBDBDB] rounded-full py-1 px-2.5 cursor-pointer transition text-[11px] font-semibold text-gray-650"
                  id={`registry-badge-${u.id}`}
                >
                  <img src={u.avatarUrl} alt={u.displayName} className="w-4 h-4 rounded-full object-cover border border-[#DBDBDB]" />
                  <span>{u.displayName.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

        {/* MODAL: Detailed custom profile cards with follower visualization */}
        {selectedUser && (
          <UserProfileModal
            user={selectedUser}
            currentUser={currentUser}
            usersMap={usersMap}
            userPosts={posts.filter((p) => p.authorId === selectedUser.id)}
            onClose={() => setSelectedUser(null)}
            onFollowToggle={handleFollowToggle}
            onSwitchUser={handleSwitchSimulatedUser}
            onUserClick={handleOpenUserProfile}
          />
        )}

        {/* MODAL: Profile signup form */}
        {showCreateProfileModal && (
          <CreateProfileModal
            onClose={() => setShowCreateProfileModal(false)}
            onSubmit={handleCreateProfileSubmit}
          />
        )}
    </div>
  );
}
