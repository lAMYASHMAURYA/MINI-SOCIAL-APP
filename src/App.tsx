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
  Activity,
  Bell,
  Bookmark,
  TrendingUp,
  X
} from "lucide-react";

import { User, Post, Story } from "./types";
import PostCard from "./components/PostCard";
import UserProfileModal from "./components/UserProfileModal";
import CreateProfileModal from "./components/CreateProfileModal";
import CreatePostCard from "./components/CreatePostCard";
import MessengerDrawer from "./components/MessengerDrawer";

import StoryBubbleTray from "./components/StoryBubbleTray";
import StoryViewerModal from "./components/StoryViewerModal";
import AddStoryModal from "./components/AddStoryModal";

interface AlertNotification {
  id: string;
  type: "like" | "comment" | "follow" | "telegram";
  userDisplayName: string;
  userAvatarUrl: string;
  time: string;
  text: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Persistent Client-side bookmarks database
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("mini_social_bookmarks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("mini_social_bookmarks", JSON.stringify(bookmarkedPostIds));
  }, [bookmarkedPostIds]);

  // Collapsible Notification bells tray & counts
  const [notifications, setNotifications] = useState<AlertNotification[]>([
    {
      id: "n1",
      type: "follow",
      userDisplayName: "Alice Chen",
      userAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250",
      time: "2 mins ago",
      text: "followed your hybrid channel"
    },
    {
      id: "n2",
      type: "like",
      userDisplayName: "Marcus Vance",
      userAvatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=250",
      time: "15 mins ago",
      text: "liked your latest Sepia Snapchat lens post"
    },
    {
      id: "n3",
      type: "comment",
      userDisplayName: "Alice Chen",
      userAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250",
      time: "1 hour ago",
      text: "commented: 'Unbelievably beautiful layout, love this custom sandboxed system #design'"
    }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  // Modals & Navigation state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [activeStoryUserId, setActiveStoryUserId] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<"all" | "following" | "bookmarks">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile active sections: "feed", "network"
  const [mobileTab, setMobileTab] = useState<"feed" | "network">("feed");

  // Fetch initial state
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Softly navigate and highlight the shared post if postId is in query params
  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const sharedPostId = params.get("postId");
      if (sharedPostId) {
        // Clear query parameters from URL state after reading to preserve fresh refreshes if they navigate
        setTimeout(() => {
          const element = document.getElementById(`post-card-${sharedPostId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("ring-2", "ring-[#0095F6]", "ring-offset-2");
            setTimeout(() => {
              element.classList.remove("ring-2", "ring-[#0095F6]", "ring-offset-2");
            }, 3000);
          }
        }, 600);
      }
    }
  }, [isLoading, posts]);

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

      // 4. All platform stories
      const storiesRes = await fetch("/api/stories");
      if (storiesRes.ok) {
        setStories(await storiesRes.json());
      }
    } catch (err: any) {
      console.error("Networking error:", err);
      setError("Server connection failed. Verify Express server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (
    content: string, 
    imageUrl?: string,
    postType?: "instagram" | "snapchat" | "telegram",
    filterStyle?: string,
    expireHours?: number
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl, postType, filterStyle, expireHours })
      });
      if (res.ok) {
        // Refresh feed
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

  const handleTelegramReact = async (postId: string, reaction: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
      }
    } catch (err) {
      console.error("Failed to post reaction:", err);
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

  const handlePublishStory = async (storyForm: {
    mediaUrl?: string;
    text?: string;
    bgGradient?: string;
  }) => {
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyForm)
      });
      if (res.ok) {
        const storiesRes = await fetch("/api/stories");
        if (storiesRes.ok) {
          setStories(await storiesRes.json());
        }
        setShowAddStoryModal(false);
      }
    } catch (err) {
      console.error("Failed to add story item", err);
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
    googleEmail?: string;
    isGoogleUser?: boolean;
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

  const handleBookmarkToggle = (postId: string) => {
    setBookmarkedPostIds(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleHashtagClick = (tag: string) => {
    setSearchQuery(tag);
    setFeedFilter("all");
    setMobileTab("feed");
    setTimeout(() => {
      const container = document.getElementById("posts-timeline-feed");
      if (container) {
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200);
  };

  const handleSimulateViralAlert = () => {
    const alerts = [
      { name: "Alice Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250", type: "like", text: "voted 👍 on your hybrid update" },
      { name: "Marcus Vance", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=250", type: "comment", text: "replied: 'This is brilliant, let's explore more #tech'" },
      { name: "Yash Maurya", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250", type: "telegram", text: "broadcasted a fresh reaction 🔥 to followers" },
      { name: "Sarah Connor", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Sarah", type: "follow", text: "joined variables directory and followed you back!" },
    ];
    const picked = alerts[Math.floor(Math.random() * alerts.length)];
    const newNotif: AlertNotification = {
      id: `live_${Date.now()}`,
      type: picked.type as any,
      userDisplayName: picked.name,
      userAvatarUrl: picked.avatar,
      time: "Just now",
      text: picked.text
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  // Compute trending hashtags dynamically from all posts
  const getTrendingHashtags = (): [string, number][] => {
    const counts: Record<string, number> = {};
    posts.forEach(post => {
      const tags = post.content.match(/#\w+/g);
      if (tags) {
        tags.forEach(tag => {
          const clean = tag.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
          if (clean && clean.length > 1) {
            counts[clean] = (counts[clean] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 5 trending tags
  };

  // Convert array to fast-lookup Record
  const usersMap: Record<string, User> = {};
  users.forEach(u => {
    usersMap[u.id] = u;
  });

  // Filter posts list dynamically
  const filteredPostsByAudience = posts.filter(post => {
    if (feedFilter === "all") return true;
    if (feedFilter === "bookmarks") return bookmarkedPostIds.includes(post.id);
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
    <div className="min-h-screen bg-[#FAFAFA] text-[#262626] font-sans flex flex-col animate-fadeIn" id="app-root">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#DBDBDB] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#262626] flex items-center justify-center text-white">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[#262626] leading-none uppercase font-sans">Telegram X Instagram X Snap</h1>
            <span className="text-[9px] text-[#0095F6] font-extrabold uppercase tracking-widest">Minimalist Hybrid Social</span>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDatabase}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg border border-[#DBDBDB] cursor-pointer font-bold transition-all shadow-2xs"
            title="Reset DB schemas back to primary seeds"
            id="reset-db-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Baseline</span>
          </button>

          {/* Notifications Drawer Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setUnreadCount(0); // clear count upon open
              }}
              className="relative p-2 rounded-lg border border-[#DBDBDB] hover:bg-gray-50 cursor-pointer transition text-gray-500 hover:text-gray-800"
              id="notifications-bell-btn"
              title="Recent activity logs"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-sans text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2.5 w-76 sm:w-80 bg-white border border-[#DBDBDB] rounded-xl shadow-lg z-50 overflow-hidden"
                id="notifications-dropdown-menu"
              >
                <div className="p-3 bg-[#FAFAFA] border-b border-[#DBDBDB] flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-700 tracking-wide uppercase font-sans">Activity Broadcasts</span>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-[260px] overflow-y-auto divide-y divide-gray-100">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-3 flex gap-2.5 items-start text-xs hover:bg-zinc-50 transition">
                      <img src={notif.userAvatarUrl} className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0" referrerPolicy="no-referrer" />
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[#262626] font-semibold break-words leading-tight">
                          <span className="font-bold">{notif.userDisplayName}</span> {notif.text}
                        </p>
                        <span className="text-[9px] text-gray-400 font-medium block mt-1">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-gray-50 border-t border-[#DBDBDB] text-center">
                  <button 
                    onClick={handleSimulateViralAlert}
                    className="text-[10px] font-extrabold text-[#0095F6] hover:underline cursor-pointer"
                  >
                    ⚡ Simulate Live Event
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCreateProfileModal(true)}
            className="flex items-center gap-1.5 text-xs text-white bg-zinc-900 shadow-md hover:bg-zinc-800 px-4 py-2 rounded-lg font-bold cursor-pointer transition-all border border-zinc-900"
            id="create-profile-header-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Join with Google / New Profile</span>
          </button>
        </div>
      </header>

      {/* Main layout frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: Active user badge + simulation panel */}
        <section className="w-full lg:w-72 flex-shrink-0 space-y-5" id="sidebar-left">
          {currentUser ? (
            <div className="bg-white border border-[#DBDBDB] rounded-xl p-4.5 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <span className="bg-[#FAFAFA] border border-[#DBDBDB] text-gray-500 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide rounded">
                  Current Session
                </span>
                {currentUser.isGoogleUser && (
                  <span className="text-[10px] text-[#0095F6] font-bold flex items-center gap-1">
                    <span className="text-xs">🔒</span> Google Account
                  </span>
                )}
              </div>

              {/* Current user card click triggers their profile view */}
              <button
                onClick={() => handleOpenUserProfile(currentUser.id)}
                className="w-full text-left flex items-center gap-3 p-2 hover:bg-[#FAFAFA] rounded-lg transition cursor-pointer group"
                id="current-user-card-btn"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover border border-[#DBDBDB]"
                  />
                  {currentUser.isGoogleUser && (
                    <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border border-white text-[8px]" title="Authenticated via Google OAuth">
                      ✓
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#262626] text-sm group-hover:underline truncate">{currentUser.displayName}</h3>
                  <p className="text-gray-400 text-xs truncate">@{currentUser.id}</p>
                </div>
              </button>

              {currentUser.googleEmail && (
                <div className="mt-2.5 px-2.5 py-1.5 bg-gray-50 border border-[#E9E9E9] rounded-lg text-[10px] text-gray-500 font-mono overflow-ellipsis truncate">
                  email: {currentUser.googleEmail}
                </div>
              )}

              <div className="mt-4 pt-3.5 border-t border-[#DBDBDB] grid grid-cols-2 text-center text-xs">
                <div>
                  <div className="font-bold text-[#262626]">{currentUser.followers.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Followers</div>
                </div>
                <div className="border-l border-[#DBDBDB]">
                  <div className="font-bold text-[#262626]">{currentUser.following.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Following</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-[#DBDBDB] rounded-xl p-4 text-center text-xs text-zinc-500 font-semibold">
              No simulated user is active. Please register a profile or refresh first!
            </div>
          )}

          {/* SIMULATE ANOTHER USER LIST (Enables easy testing of cross liking/follow) */}
          <div className="bg-white border border-[#DBDBDB] rounded-xl p-4.5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-gray-500" />
              <span>Simulated Sessions</span>
            </h3>
            <p className="text-[10px] text-gray-400 mb-3.5 leading-relaxed font-semibold">
              Switch profiles below instantly to simulate post likes, followers, write comments, or test Stories!
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {users.map((u) => {
                const isActive = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSwitchSimulatedUser(u.id)}
                    className={`w-full text-left flex items-center justify-between p-2 rounded-lg transition text-xs font-medium border cursor-pointer ${
                      isActive
                        ? "bg-[#FAFAFA] border-[#DBDBDB] text-[#262626] font-bold shadow-2xs"
                        : "bg-white border-transparent hover:bg-[#FAFAFA] text-gray-500 hover:text-gray-800"
                    }`}
                    id={`simulate-user-select-${u.id}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative">
                        <img src={u.avatarUrl} alt={u.displayName} className="w-6.5 h-6.5 rounded-full object-cover border border-[#DBDBDB]" />
                        {u.isGoogleUser && (
                          <span className="absolute -bottom-0.5 -right-0.5 bg-[#0095F6] text-white rounded-full w-2 h-2 flex items-center justify-center text-[7px]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{u.displayName}</p>
                        <p className="text-[9px] text-gray-400 truncate">@{u.id}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#0095F6] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSimulateViralAlert}
              className="mt-4.5 w-full bg-zinc-950 text-white rounded-lg py-2.5 px-3 text-xs font-bold hover:bg-zinc-800 transition flex items-center justify-center gap-2 shadow-sm relative overflow-hidden group cursor-pointer"
              id="simulate-traffic-btn"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-300/10 to-red-400/10 opacity-0 group-hover:opacity-100 transition duration-200" />
              <Activity className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>Simulate Real-time Alerts ⚡️</span>
            </button>
          </div>
        </section>

        {/* CENTER COLUMN: Feeds, Post creation, query input */}
        <section className="flex-1 space-y-5" id="main-content">
          
          {/* Mobile Tab Toggle */}
          <div className="flex lg:hidden bg-white p-1 rounded-xl border border-[#DBDBDB]">
            <button
              onClick={() => setMobileTab("feed")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                mobileTab === "feed" ? "bg-zinc-900 text-white shadow-sm" : "text-gray-500"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Feeds & Timeline</span>
            </button>
            <button
              onClick={() => setMobileTab("network")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                mobileTab === "network" ? "bg-zinc-900 text-white shadow-sm" : "text-gray-500"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Who to Follow ({whoToFollowCandidates.length})</span>
            </button>
          </div>

          {/* View Container bounded by Mobile Navigation Tabs */}
          <div className={`${mobileTab === "feed" ? "block" : "hidden lg:block"} space-y-5`}>
            
            {/* Instagram Active Story tray */}
            <StoryBubbleTray
              currentUser={currentUser}
              stories={stories}
              usersMap={usersMap}
              onAddStoryClick={() => setShowAddStoryModal(true)}
              onUserStorySelect={(authorId) => setActiveStoryUserId(authorId)}
            />

            {/* Create Post Card */}
            {currentUser && (
              <CreatePostCard currentUser={currentUser} onPostCreated={handleCreatePost} />
            )}

            {/* Filter Timelines & Search */}
            <div className="bg-white border border-[#DBDBDB] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
              {/* Timeline feed filter links */}
              <div className="flex bg-[#FAFAFA] border border-[#DBDBDB] p-1 rounded-xl w-full md:w-auto flex-wrap">
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
                  <span>Explore Feed</span>
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
                <button
                  onClick={() => setFeedFilter("bookmarks")}
                  className={`flex-1 md:flex-initial flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    feedFilter === "bookmarks"
                      ? "bg-white text-[#262626] border border-[#DBDBDB] shadow-sm font-bold"
                      : "text-gray-400 hover:text-gray-800"
                  }`}
                  id="feed-filter-bookmarks-btn"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${feedFilter === "bookmarks" ? "fill-[#FF9500] text-[#FF9500]" : "text-gray-450"}`} />
                  <span>Saved ({bookmarkedPostIds.length})</span>
                </button>
              </div>

              {/* Search input query filtering */}
              <div className="relative w-full md:w-60 flex items-center">
                <Search className="absolute left-3 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search tags, posts or users..."
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
                <div className="w-8 h-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
                <p className="text-sm text-gray-450 font-semibold">Loading platform feed...</p>
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
                    onReact={handleTelegramReact}
                    isBookmarked={bookmarkedPostIds.includes(post.id)}
                    onBookmarkToggle={handleBookmarkToggle}
                    onHashtagClick={handleHashtagClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-[#DBDBDB] rounded-xl p-6">
                <p className="text-sm text-gray-500 font-semibold">No posts match your selection.</p>
                <p className="text-xs text-gray-400 mt-1.5 max-w-sm mx-auto font-medium leading-relaxed">
                  {feedFilter === "following" 
                    ? "Follow some participants in the directory or share updates to build your personal timeline feed."
                    : feedFilter === "bookmarks"
                    ? "Bookmark updates in the feeds to save them safely into your personal bookmarks tab!"
                    : "Be the first one to create a new thread!"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-xs font-bold text-[#0095F6] hover:underline cursor-pointer"
                  >
                    Clear Search Filter
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Directory, Who to Follow list, Stats summary */}
        <section className={`w-full lg:w-72 flex-shrink-0 space-y-5 ${mobileTab === "network" ? "block" : "hidden lg:block"}`} id="sidebar-right">
          
          {/* WHO TO FOLLOW LIST */}
          <div className="bg-white border border-[#DBDBDB] rounded-xl p-4.5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gray-550" />
                <span>Suggestions For You</span>
              </span>
              <span className="bg-[#FAFAFA] border border-[#DBDBDB] text-gray-550 text-[10px] px-2 py-0.5 rounded font-extrabold">
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
              <p className="text-gray-400 italic text-[11px] text-center py-4 font-semibold">
                Following everyone! 🚀📈
              </p>
            )}
          </div>

          {/* ALL REGISTERED MEMBERS LIST */}
          <div className="bg-white border border-[#DBDBDB] rounded-xl p-4.5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              <span>Verified Directory ({users.length})</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleOpenUserProfile(u.id)}
                  className="flex items-center gap-1.5 bg-white hover:bg-zinc-50 border border-[#DBDBDB] rounded-full py-1 px-2.5 cursor-pointer transition text-[11px] font-bold text-gray-700 hover:border-[#0095F6]"
                  id={`registry-badge-${u.id}`}
                >
                  <img src={u.avatarUrl} alt={u.displayName} className="w-4 h-4 rounded-full object-cover border border-[#DBDBDB]" />
                  <span>{u.displayName.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC TRENDS WIDGET */}
          <div className="bg-white border border-[#DBDBDB] rounded-xl p-4.5 shadow-xs animate-fade-in">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#0095F6]" />
                <span>Trending Hashtags</span>
              </span>
            </h3>
            <div className="space-y-1">
              {getTrendingHashtags().length > 0 ? (
                getTrendingHashtags().map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => handleHashtagClick(`#${tag}`)}
                    className="w-full flex items-center justify-between text-left hover:bg-zinc-50 p-2 rounded-lg transition-all group cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#262626] group-hover:text-[#0095F6]">
                      #{tag}
                    </span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-extrabold font-mono">
                      {count} {count === 1 ? "post" : "posts"}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-gray-400 italic text-[11px] text-center py-2 font-medium">
                  Use #hashtags in updates to trigger updates!
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* STORY VIEWER PORTAL */}
      {activeStoryUserId && (
        <StoryViewerModal
          userId={activeStoryUserId}
          stories={stories}
          usersMap={usersMap}
          onClose={() => setActiveStoryUserId(null)}
        />
      )}

      {/* STORY ADD MODAL */}
      {showAddStoryModal && (
        <AddStoryModal
          onClose={() => setShowAddStoryModal(false)}
          onSubmit={handlePublishStory}
        />
      )}

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

      {/* LIVE MESSENGER WIDGET DRAWER */}
      {currentUser && (
        <MessengerDrawer
          currentUser={currentUser}
          users={users}
          usersMap={usersMap}
        />
      )}

      {/* MODAL: Profile signup form */}
      {showCreateProfileModal && (
        <CreateProfileModal
          onClose={() => setShowCreateProfileModal(false)}
          onSubmit={handleCreateProfileSubmit}
          users={users}
          onSwitchUser={handleSwitchSimulatedUser}
        />
      )}
    </div>
  );
}
