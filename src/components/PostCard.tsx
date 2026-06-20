import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, Image, Calendar, Share2, Copy, Check, X, ShieldAlert, Sparkles, Bookmark } from "lucide-react";
import { Post, User } from "../types";

interface PostCardProps {
  key?: string;
  post: Post;
  currentUser: User | null;
  usersMap: Record<string, User>;
  onLike: (postId: string) => void | Promise<void>;
  onComment: (postId: string, content: string) => Promise<void>;
  onUserClick: (userId: string) => void;
  onReact?: (postId: string, reaction: string) => void | Promise<void>;
  isBookmarked: boolean;
  onBookmarkToggle: (postId: string) => void;
  onHashtagClick?: (hashtag: string) => void;
}

export default function PostCard({
  post,
  currentUser,
  usersMap,
  onLike,
  onComment,
  onUserClick,
  onReact,
  isBookmarked,
  onBookmarkToggle,
  onHashtagClick,
}: PostCardProps) {
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Snapdragon self-destruct state
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (post.postType !== "snapchat" || !post.createdAt) return;
    const expireHoursVal = post.expireHours || 24;
    const expireDuration = expireHoursVal * 60 * 60 * 1000;
    const expirationTime = new Date(post.createdAt).getTime() + expireDuration;

    const updateTimer = () => {
      const now = Date.now();
      const diff = expirationTime - now;
      if (diff <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [post.createdAt, post.expireHours, post.postType]);

  const renderContentWithHashtags = (text: string) => {
    if (!text) return "";
    const tokens = text.split(/(\s+)/);
    return tokens.map((token, idx) => {
      if (token.startsWith("#") && token.length > 1) {
        // Remove trailing punctuation from hashtag detection
        const cleanTag = token.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        return (
          <span
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              if (onHashtagClick) {
                onHashtagClick(cleanTag);
              }
            }}
            className="text-[#0095F6] hover:underline cursor-pointer font-semibold"
          >
            {token}
          </span>
        );
      }
      return token;
    });
  };

  const getTelegramViews = () => {
    let hash = 0;
    for (let i = 0; i < post.id.length; i++) {
      hash = post.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const views = Math.abs(hash % 910) + 75;
    return views;
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/?postId=${post.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const author: User = usersMap[post.authorId] || {
    id: post.authorId,
    displayName: post.authorId,
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${post.authorId}`,
    bio: "User profile",
    followers: [],
    following: [],
    createdAt: new Date().toISOString(),
    isGoogleUser: false,
  };

  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onComment(post.id, commentContent.trim());
      setCommentContent("");
      setShowComments(true); // Open block immediately to see the added comment
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Resolve snap lens filter classes
  const getFilterClass = () => {
    if (post.postType !== "snapchat" || !post.filterStyle) return "";
    switch (post.filterStyle) {
      case "sepia":
        return "sepia saturate-150 contrast-105";
      case "grayscale":
        return "grayscale contrast-125";
      case "neon":
        return "saturate-200 contrast-110 hue-rotate-60";
      case "blue":
        return "hue-rotate-180 brightness-105 saturate-125";
      default:
        return "";
    }
  };

  const isTelegram = post.postType === "telegram";
  const isSnapchat = post.postType === "snapchat";

  return (
    <div 
      className={`bg-white border rounded-xl overflow-hidden shadow-xs transition duration-200 ${
        isTelegram 
          ? "border-[#0088CC]/30 hover:border-[#0088CC]/60 bg-gradient-to-b from-[#F5FBFF]/40 to-white" 
          : isSnapchat 
          ? "border-[#FFFC00]/50 hover:border-[#FFFC00] bg-yellow-50/5" 
          : "border-[#DBDBDB] hover:border-gray-300"
      }`} 
      id={`post-card-${post.id}`}
    >
      {/* Banner indicator badges for Hybrid platforms */}
      {isTelegram && (
        <div className="bg-[#0088CC] text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="animate-pulse text-sky-200">●</span> Telegram Channel Broadcast
          </span>
          <div className="flex items-center gap-3">
            <span className="bg-[#0077b5]/60 text-sky-100 font-bold px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1 font-sans">
              <span>👁</span> {getTelegramViews()} views
            </span>
            <span className="font-mono text-[9px] opacity-90">t.me/{author.id}</span>
          </div>
        </div>
      )}

      {isSnapchat && (
        <div className="bg-[#FFFC00] text-black px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            👻 SNAPCHAT SELF-DESTRUCT LENS
          </span>
          <span className="font-mono text-[9px] font-extrabold text-[#9A8F00] bg-white/40 px-1.5 py-0.5 rounded">
            {isExpired ? "🔴 EXPIRED" : `⏳ ${timeLeft}`}
          </span>
        </div>
      )}

      {/* Post Header */}
      <div className="p-4 flex items-start gap-3">
        <button
          onClick={() => onUserClick(author.id)}
          className="flex-shrink-0 cursor-pointer group text-left"
          id={`post-avatar-btn-${post.id}`}
        >
          <img
            src={author.avatarUrl}
            alt={author.displayName}
            referrerPolicy="no-referrer"
            className={`w-10 h-10 rounded-full object-cover border group-hover:opacity-90 transition-all ${
              isTelegram ? "border-[#0088CC]" : isSnapchat ? "border-[#FFFC00]" : "border-[#DBDBDB]"
            }`}
          />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-left flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onUserClick(author.id)}
              className="font-bold text-[#262626] hover:text-[#0095F6] hover:underline cursor-pointer text-sm text-left truncate max-w-[150px] sm:max-w-[200px]"
            >
              {author.displayName}
            </button>
            <span className="text-gray-400 text-xs text-left truncate">@{author.id}</span>
            {author.isGoogleUser && (
              <span className="bg-blue-50 text-[#0095F6] border border-blue-200 text-[8px] font-sans font-bold px-1 py-0.5 rounded uppercase tracking-wider scale-95 shrink-0 block">
                Google Verified
              </span>
            )}
            <span className="text-zinc-300 text-xs">•</span>
            <span className="text-gray-400 text-xs">{formatDate(post.createdAt)}</span>
          </div>
          <p className="mt-2 text-[#262626] text-sm text-left leading-relaxed whitespace-pre-wrap">
            {renderContentWithHashtags(post.content)}
          </p>
        </div>
      </div>

      {/* Post Attachment Image (if available) with camera lens overlays / Expiration state */}
      {post.imageUrl && (
        <div className="px-4 pb-3.5">
          <div className="rounded-lg overflow-hidden border border-[#DBDBDB] bg-[#FAFAFA] max-h-[350px] relative group select-none">
            {isSnapchat && isExpired ? (
              <div className="w-full h-[220px] bg-zinc-950 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt="Expired preview"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-15 pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold text-lg mb-2 shadow-[0_0_15px_rgba(255,252,0,0.35)] animate-bounce">
                    👻
                  </div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider">Snap Disappeared</h4>
                  <p className="text-zinc-400 text-[10px] mt-1 max-w-[260px] leading-relaxed font-semibold">
                    This snapshot has self-destructed because its {post.expireHours || 24}-hour countdown elapsed!
                  </p>
                </div>
              </div>
            ) : (
              <>
                <img
                  src={post.imageUrl}
                  alt="Post attachment"
                  className={`w-full h-full object-cover max-h-[350px] transition duration-200 ${getFilterClass()}`}
                  referrerPolicy="no-referrer"
                />
                {isSnapchat && post.filterStyle && post.filterStyle !== "none" && (
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] py-1 px-2.5 rounded font-semibold font-sans tracking-wide">
                    🎨 Snapchat Lens: {post.filterStyle.toUpperCase()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Telegram Channel inline Tap reactions row */}
      {isTelegram && (
        <div className="flex gap-2 flex-wrap px-4 py-2.5 bg-[#F5FBFF] border-t border-[#E1F3FE] items-center">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-sans">Channel reactions:</span>
          {["👍", "🔥", "❤️", "🎉", "🚀"].map((react) => {
            const count = post.telegramReactions?.[react] || 0;
            return (
              <button
                key={react}
                onClick={() => onReact && onReact(post.id, react)}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#DBDBDB] hover:border-[#0088CC] rounded-full hover:scale-105 active:scale-95 transition text-xs font-semibold cursor-pointer shadow-2xs"
              >
                <span>{react}</span>
                <span className="font-mono text-gray-500 text-[11px] font-bold">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Post Action Buttons */}
      <div className="border-t border-b border-[#DBDBDB] px-4 py-2 bg-[#FAFAFA] flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 sm:gap-2 py-1 px-2.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              isLiked
                ? "text-red-500 bg-red-50/50"
                : "text-gray-500 hover:text-red-500 hover:bg-red-50/50"
            }`}
            id={`like-btn-${post.id}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            <span>{post.likes.length} Likes</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 sm:gap-2 py-1 px-2.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              showComments
                ? "text-[#262626] bg-[#FAFAFA] border border-[#DBDBDB]"
                : "text-gray-500 hover:text-gray-800 hover:bg-[#FAFAFA]"
            }`}
            id={`comments-toggle-btn-${post.id}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments.length} Comments</span>
          </button>

          <button
            onClick={() => onBookmarkToggle(post.id)}
            className={`flex items-center gap-1.5 sm:gap-2 py-1 px-2.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              isBookmarked
                ? "text-[#FF9500] bg-orange-50/50"
                : "text-gray-500 hover:text-[#FF9500] hover:bg-orange-50/50"
            }`}
            id={`bookmark-btn-${post.id}`}
            title={isBookmarked ? "Remove bookmark" : "Save this post"}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-[#FF9500] text-[#FF9500]" : ""}`} />
            <span className="hidden xs:inline">{isBookmarked ? "Saved" : "Save"}</span>
          </button>
        </div>

        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
          id={`share-btn-${post.id}`}
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Show/Hide Comments Block */}
      {showComments && (
        <div className="bg-[#FAFAFA] divide-y divide-[#DBDBDB] border-b border-[#DBDBDB] transition-all">
          {post.comments.length > 0 ? (
            <div className="max-h-[220px] overflow-y-auto p-4 space-y-3.5">
              {post.comments.map((comment) => {
                const commentAuthor = usersMap[comment.authorId] || {
                  id: comment.authorId,
                  displayName: comment.authorId,
                  avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.authorId}`,
                };
                return (
                  <div key={comment.id} className="flex gap-2.5 items-start text-xs">
                    <button
                      onClick={() => onUserClick(commentAuthor.id)}
                      className="cursor-pointer flex-shrink-0"
                    >
                      <img
                        src={commentAuthor.avatarUrl}
                        alt={commentAuthor.displayName}
                        className="w-7.5 h-7.5 rounded-full object-cover border border-[#DBDBDB]"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                    <div className="flex-1 bg-white border border-[#DBDBDB] rounded-lg p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] text-left">
                      <div className="flex items-center justify-between mb-1 flex-wrap">
                        <button
                          onClick={() => onUserClick(commentAuthor.id)}
                          className="font-bold text-[#262626] hover:underline hover:text-[#0095F6]"
                        >
                          {commentAuthor.displayName}
                        </button>
                        <span className="text-gray-400 text-[10px] font-medium">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-zinc-700 leading-relaxed break-words">
                        {renderContentWithHashtags(comment.content)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-450 text-xs font-semibold">
              No comments yet. Start the conversation!
            </div>
          )}
        </div>
      )}

      {/* Write a comment form */}
      <form onSubmit={handleSubmitComment} className="p-3 bg-white flex items-center gap-2">
        {currentUser && (
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.displayName}
            className="w-7 h-7 rounded-full object-cover border border-[#DBDBDB] flex-shrink-0 hidden sm:block"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            className="w-full text-xs pl-3 pr-10 py-2 bg-[#FAFAFA] border border-[#DBDBDB] rounded-full focus:outline-none focus:border-[#0095F6] transition"
            id={`comment-input-${post.id}`}
          />
          <button
            type="submit"
            disabled={!commentContent.trim() || isSubmitting}
            className="absolute right-1.5 p-1.5 rounded-full text-[#0095F6] hover:bg-blue-50/50 hover:text-[#007cd1] disabled:opacity-30 disabled:hover:bg-transparent disabled:text-zinc-300 transition duration-200 cursor-pointer"
            id={`comment-submit-btn-${post.id}`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Share Modal Dialog Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" id={`share-modal-${post.id}`}>
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl border border-[#DBDBDB] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-[#DBDBDB] flex items-center justify-between bg-white">
              <h3 className="text-xs font-bold text-[#262626] uppercase tracking-wider font-sans">Share Post</h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-650 p-1.5 rounded-full hover:bg-[#FAFAFA] border border-transparent hover:border-[#DBDBDB] transition-all cursor-pointer"
                id={`close-share-modal-${post.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Body */}
            <div className="p-5 space-y-4 text-left bg-white">
              <p className="text-xs text-gray-500 font-semibold">Copy this link to share this profile post:</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?postId=${post.id}`}
                  className="w-full text-xs px-3 py-2.5 bg-[#FAFAFA] border border-[#DBDBDB] rounded-lg focus:outline-none font-mono text-gray-600 select-all"
                  id={`share-link-input-${post.id}`}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-805 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
                  id={`copy-share-link-btn-${post.id}`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {/* Footer */}
            <div className="px-5 py-3.5 bg-[#FAFAFA] border-t border-[#DBDBDB] text-right">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-xs font-bold text-[#262626] hover:text-[#0095F6] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
