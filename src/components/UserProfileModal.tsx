import React from "react";
import { X, Users, Calendar, Award, LogIn } from "lucide-react";
import { User, Post } from "../types";

interface UserProfileModalProps {
  user: User;
  currentUser: User | null;
  usersMap: Record<string, User>;
  userPosts: Post[];
  onClose: () => void;
  onFollowToggle: (userId: string) => void;
  onSwitchUser: (userId: string) => void;
  onUserClick: (userId: string) => void;
}

export default function UserProfileModal({
  user,
  currentUser,
  usersMap,
  userPosts,
  onClose,
  onFollowToggle,
  onSwitchUser,
  onUserClick,
}: UserProfileModalProps) {
  const isOwnProfile = currentUser?.id === user.id;
  const isFollowing = currentUser?.following.includes(user.id) || false;

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" id="user-profile-modal">
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-[#DBDBDB] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header decoration */}
        <div className="h-20 bg-[#FAFAFA] border-b border-[#DBDBDB] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/80 text-gray-500 hover:bg-white p-2 rounded-full border border-[#DBDBDB] transition-colors cursor-pointer"
            id="close-profile-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Stats and Info */}
        <div className="px-6 pb-4 relative flex flex-col sm:flex-row items-start justify-between gap-4 -mt-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-20 h-20 rounded-full object-cover border-4 border-white bg-white shadow-md"
              referrerPolicy="no-referrer"
            />
            <div className="mb-0 sm:mb-2">
              <h2 className="text-xl font-bold text-[#262626] leading-tight">{user.displayName}</h2>
              <p className="text-gray-400 text-sm font-semibold">@{user.id}</p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-12 justify-end">
            {!isOwnProfile && currentUser && (
              <button
                onClick={() => onFollowToggle(user.id)}
                className={`flex-1 sm:flex-initial text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer ${
                  isFollowing
                    ? "bg-white text-zinc-800 hover:bg-zinc-50 border border-[#DBDBDB]"
                    : "bg-[#0095F6] text-white hover:bg-[#007cd1] shadow-sm"
                }`}
                id={`follow-toggle-modal-${user.id}`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}

            {!isOwnProfile && (
              <button
                onClick={() => {
                  onSwitchUser(user.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-lg bg-[#262626] hover:bg-black text-white transition cursor-pointer"
                title={`Login as ${user.displayName}`}
                id={`switch-user-modal-${user.id}`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Simulate</span>
              </button>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="px-6 py-2 border-b border-[#DBDBDB]">
          {user.bio ? (
            <p className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">{user.bio}</p>
          ) : (
            <p className="text-gray-400 text-sm italic font-medium">No bio written yet.</p>
          )}

          <div className="flex items-center gap-1.5 mt-3 text-gray-400 text-xs mb-2 font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Joined {formatDate(user.createdAt)}</span>
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-3 divide-x divide-[#DBDBDB] text-center py-3 bg-[#FAFAFA] border-b border-[#DBDBDB]">
          <div>
            <div className="text-sm font-bold text-[#262626]">{userPosts.length}</div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Posts</div>
          </div>
          <div>
            <div className="text-sm font-bold text-[#262626]">{user.followers.length}</div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Followers</div>
          </div>
          <div>
            <div className="text-sm font-bold text-[#262626]">{user.following.length}</div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Following</div>
          </div>
        </div>

        {/* List of followers / following visualizer */}
        <div className="px-6 py-3 border-b border-[#DBDBDB] bg-[#FAFAFA]/40 max-h-[100px] overflow-y-auto flex flex-col gap-1.5 leading-none">
          <div className="flex items-center gap-1 text-gray-500 text-xs font-bold uppercase">
            <Users className="w-3.5 h-3.5" />
            <span>Followers ({user.followers.length}) :</span>
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {user.followers.length > 0 ? (
              user.followers.map(fId => {
                const fUser = usersMap[fId];
                if (!fUser) return null;
                return (
                  <button
                    key={fId}
                    onClick={() => onUserClick(fId)}
                    className="flex items-center gap-1.5 bg-white border border-[#DBDBDB] hover:bg-[#FAFAFA] rounded-full py-1 px-2.5 cursor-pointer transition text-[10px] text-gray-600 font-semibold"
                  >
                    <img src={fUser.avatarUrl} alt={fUser.displayName} className="w-4 h-4 rounded-full object-cover border border-[#DBDBDB]" />
                    <span>{fUser.displayName}</span>
                  </button>
                );
              })
            ) : (
              <span className="text-gray-400 text-xs italic font-semibold">Nobody is following them yet.</span>
            )}
          </div>
        </div>

        {/* Tabbed Area - User's Posts list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAFAFA]/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Recent Posts ({userPosts.length})</span>
          </h3>

          {userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <div key={post.id} className="bg-white border border-[#DBDBDB] rounded-lg p-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                    <span className="text-xs bg-[#FAFAFA] border border-[#DBDBDB] text-[#262626] font-semibold py-0.5 px-2 rounded">
                      ♥ {post.likes.length} Likes
                    </span>
                  </div>
                  <p className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Attachment"
                      className="mt-3.5 rounded-lg border border-[#DBDBDB] max-h-[180px] w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="mt-3.5 pt-3.5 border-t border-[#DBDBDB] flex justify-between items-center text-xs text-gray-400 font-semibold uppercase">
                    <span>{post.comments.length} comments posted</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm bg-white border border-[#DBDBDB] rounded-lg font-medium">
              This user hasn't posted anything yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
