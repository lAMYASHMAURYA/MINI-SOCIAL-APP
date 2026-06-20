import React, { useState } from "react";
import { Heart, MessageCircle, Send, Image, Calendar } from "lucide-react";
import { Post, User } from "../types";

interface PostCardProps {
  key?: string;
  post: Post;
  currentUser: User | null;
  usersMap: Record<string, User>;
  onLike: (postId: string) => void | Promise<void>;
  onComment: (postId: string, content: string) => Promise<void>;
  onUserClick: (userId: string) => void;
}

export default function PostCard({
  post,
  currentUser,
  usersMap,
  onLike,
  onComment,
  onUserClick,
}: PostCardProps) {
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const author = usersMap[post.authorId] || {
    id: post.authorId,
    displayName: post.authorId,
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${post.authorId}`,
    bio: "User profile",
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

  return (
    <div className="bg-white border border-[#DBDBDB] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]" id={`post-card-${post.id}`}>
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
            className="w-10 h-10 rounded-full object-cover border border-[#DBDBDB] group-hover:opacity-90 transition-all"
          />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onUserClick(author.id)}
              className="font-bold text-[#262626] hover:text-[#0095F6] hover:underline cursor-pointer text-sm text-left truncate max-w-[150px] sm:max-w-[200px]"
            >
              {author.displayName}
            </button>
            <span className="text-gray-400 text-xs text-left truncate">@{author.id}</span>
            <span className="text-zinc-300 text-xs">•</span>
            <span className="text-gray-400 text-xs">{formatDate(post.createdAt)}</span>
          </div>
          <p className="mt-2 text-[#262626] text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      </div>

      {/* Post Attachment Image (if available) */}
      {post.imageUrl && (
        <div className="px-4 pb-3.5">
          <div className="rounded-lg overflow-hidden border border-[#DBDBDB] bg-[#FAFAFA] max-h-[350px]">
            <img
              src={post.imageUrl}
              alt="Post attachment"
              className="w-full h-full object-cover max-h-[350px]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Post Action Buttons */}
      <div className="border-t border-b border-[#DBDBDB] px-4 py-2.5 bg-[#FAFAFA] flex items-center gap-6">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-2 py-1 px-2.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            isLiked
              ? "text-red-500 bg-red-50/50"
              : "text-gray-500 hover:text-red-500 hover:bg-red-50/50"
          }`}
          id={`like-btn-${post.id}`}
        >
          <Heart className={`w-4.5 h-4.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          <span>{post.likes.length} Likes</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 py-1 px-2.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            showComments
              ? "text-[#262626] bg-[#FAFAFA] border border-[#DBDBDB]"
              : "text-gray-500 hover:text-gray-800 hover:bg-[#FAFAFA]"
          }`}
          id={`comments-toggle-btn-${post.id}`}
        >
          <MessageCircle className="w-4.5 h-4.5" />
          <span>{post.comments.length} Comments</span>
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
                    <div className="flex-1 bg-white border border-[#DBDBDB] rounded-lg p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                      <div className="flex items-center justify-between mb-1 flex-wrap">
                        <button
                          onClick={() => onUserClick(commentAuthor.id)}
                          className="font-bold text-[#262626] hover:underline hover:text-[#0095F6]"
                        >
                          {commentAuthor.displayName}
                        </button>
                        <span className="text-gray-400 text-[10px] font-medium">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-zinc-700 leading-relaxed break-words">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400 text-xs font-medium">
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
            className="w-full text-xs pl-3 pr-10 py-2.5 bg-[#FAFAFA] border border-[#DBDBDB] rounded-full focus:outline-none focus:border-[#0095F6] transition"
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
    </div>
  );
}
