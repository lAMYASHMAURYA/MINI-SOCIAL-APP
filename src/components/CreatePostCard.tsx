import React, { useState } from "react";
import { Send, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";
import { User, Post } from "../types";

interface CreatePostCardProps {
  currentUser: User | null;
  onPostCreated: (content: string, imageUrl?: string) => Promise<boolean>;
}

const ATTACHMENT_SUGGESTIONS = [
  { label: "Idea", url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=650" },
  { label: "Code", url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=650" },
  { label: "Coffee", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=650" },
  { label: "Design", url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=650" }
];

export default function CreatePostCard({ currentUser, onPostCreated }: CreatePostCardProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Post content cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onPostCreated(content.trim(), imageUrl.trim() || undefined);
      if (success) {
        setContent("");
        setImageUrl("");
        setShowImageInput(false);
      } else {
        setError("Could not submit post.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectSuggestion = (url: string) => {
    setImageUrl(url);
    setShowImageInput(true);
  };

  if (!currentUser) return null;

  return (
    <div className="bg-white border border-[#DBDBDB] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]" id="create-post-card">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Author + Textarea */}
        <div className="flex gap-3">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.displayName}
            className="w-10 h-10 rounded-full object-cover border border-[#DBDBDB] flex-shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1">
            <textarea
              required
              rows={3}
              placeholder={`What's on your mind, ${currentUser.displayName.split(" ")[0]}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-sm py-2 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-gray-400 resize-none text-[#262626] leading-relaxed"
              id="post-content-textarea"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Optional Image Url Input */}
        {showImageInput && (
          <div className="pl-13 space-y-2 animate-in slide-in-from-top-1 duration-150">
            <div className="relative">
              <input
                type="text"
                placeholder="Paste any photo web link (https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-transparent border border-[#DBDBDB] rounded-lg focus:outline-none focus:border-[#0095F6] transition"
                id="post-image-url-input"
              />
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute right-2 top-1.5 text-zinc-400 hover:text-zinc-600 text-xs font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Suggestions layout */}
            <div className="flex items-center gap-1.5 scroll-smooth">
              <span className="text-[10px] uppercase font-bold text-gray-400">Suggestions:</span>
              {ATTACHMENT_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.label}
                  type="button"
                  onClick={() => selectSuggestion(sug.url)}
                  className={`text-[10px] font-semibold py-1 px-2.5 rounded-full border transition cursor-pointer ${
                    imageUrl === sug.url
                      ? "bg-[#FAFAFA] border-[#0095F6] text-[#0095F6] font-bold"
                      : "bg-white border-[#DBDBDB] text-gray-500 hover:bg-[#FAFAFA]"
                  }`}
                >
                  {sug.label}
                </button>
              ))}
            </div>

            {imageUrl && (
              <div className="rounded-lg overflow-hidden border border-[#DBDBDB] bg-zinc-50 max-h-[140px] max-w-[240px] mt-2 relative group align-middle">
                <img src={imageUrl} alt="attached preview" className="w-full h-full object-cover max-h-[140px]" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                      setShowImageInput(false);
                    }}
                    className="bg-white text-xs text-zinc-800 py-1 px-2.5 rounded font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#DBDBDB] pl-13">
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition cursor-pointer ${
              showImageInput
                ? "bg-[#FAFAFA] border border-[#DBDBDB] text-[#0095F6]"
                : "text-gray-500 hover:text-gray-800 border border-transparent hover:bg-zinc-50"
            }`}
            id="post-attach-btn"
          >
            <ImageIcon className="w-4 h-4" />
            <span>{showImageInput ? "Attachment active" : "Add Image"}</span>
          </button>

          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#0095F6] hover:bg-[#007cd1] disabled:opacity-40 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            id="post-submit-btn"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Sharing..." : "Share Post"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
