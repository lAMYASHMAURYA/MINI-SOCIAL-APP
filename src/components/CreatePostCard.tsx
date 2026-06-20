import React, { useState } from "react";
import { Send, Image as ImageIcon, Sparkles, AlertCircle, Laptop, Clock, Filter } from "lucide-react";
import { User, Post } from "../types";

interface CreatePostCardProps {
  currentUser: User | null;
  onPostCreated: (
    content: string, 
    imageUrl?: string,
    postType?: "instagram" | "snapchat" | "telegram",
    filterStyle?: string,
    expireHours?: number
  ) => Promise<boolean>;
}

const ATTACHMENT_SUGGESTIONS = [
  { label: "Idea", url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=650" },
  { label: "Code", url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=650" },
  { label: "Coffee", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=650" },
  { label: "Design", url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=650" }
];

const SNAP_LENSES = [
  { id: "none", label: "No Filter 🚫", style: "" },
  { id: "sepia", label: "Sepia Glow 🍂", style: "sepia saturate-150 contrast-105" },
  { id: "grayscale", label: "Noir Grayscale 🎬", style: "grayscale contrast-125" },
  { id: "neon", label: "Cyber Neon 👾", style: "saturate-200 contrast-110 hue-rotate-60" },
  { id: "blue", label: "Prismatic Cold ❄️", style: "hue-rotate-180 brightness-105 saturate-125" }
];

export default function CreatePostCard({ currentUser, onPostCreated }: CreatePostCardProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Trio Mode state values
  const [postType, setPostType] = useState<"instagram" | "snapchat" | "telegram">("instagram");
  const [filterStyle, setFilterStyle] = useState("none");
  const [expireHours, setExpireHours] = useState(24);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Post content cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const activeFilter = postType === "snapchat" ? filterStyle : "none";
      const actualExpire = postType === "snapchat" ? expireHours : undefined;

      const success = await onPostCreated(
        content.trim(), 
        imageUrl.trim() || undefined,
        postType,
        activeFilter,
        actualExpire
      );
      if (success) {
        setContent("");
        setImageUrl("");
        setShowImageInput(false);
        setPostType("instagram");
        setFilterStyle("none");
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
    <div className="bg-white border border-[#DBDBDB] rounded-xl p-5 shadow-xs" id="create-post-card">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Trio Mode Platform Nav buttons */}
        <div className="flex bg-[#F5F5F5] rounded-xl p-1 gap-1 border border-[#E9E9E9]">
          <button
            type="button"
            onClick={() => { setPostType("instagram"); setShowImageInput(true); }}
            className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              postType === "instagram" 
                ? "bg-white text-[#262626] shadow-xs border border-[#E9E9E9]" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="text-sm">📸</span>
            <span>Instagram Feed</span>
          </button>
          <button
            type="button"
            onClick={() => { setPostType("telegram"); }}
            className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              postType === "telegram" 
                ? "bg-white text-[#0088CC] shadow-xs border border-[#E9E9E9]" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="text-sm">📢</span>
            <span>Telegram Channel</span>
          </button>
          <button
            type="button"
            onClick={() => { setPostType("snapchat"); setShowImageInput(true); }}
            className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              postType === "snapchat" 
                ? "bg-white text-[#FFFC00] text-black shadow-xs border border-[#E9E9E9]" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="text-sm">⚡️</span>
            <span>Snapchat Lens</span>
          </button>
        </div>

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
              placeholder={
                postType === "telegram"
                  ? `Write a channel post with inline emoji reactions...`
                  : postType === "snapchat"
                  ? `Write a cool self-destructing layout caption...`
                  : `What's on your mind, ${currentUser.displayName.split(" ")[0]}?`
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-sm py-2 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-gray-400 resize-none text-[#262626] leading-relaxed"
              id="post-content-textarea"
            />
          </div>
        </div>

        {/* Interactive Lens or self-destruct properties for Snapchat */}
        {postType === "snapchat" && (
          <div className="bg-yellow-50/50 border border-yellow-200 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-[10px] text-yellow-700 font-bold uppercase tracking-wider">
              <span className="text-base">⌛️</span>
              <span>Self-Destruct Snapchat Lens Settings</span>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Select Photo Filter/Lens:
              </label>
              <div className="flex gap-2 flex-wrap">
                {SNAP_LENSES.map((lens) => (
                  <button
                    key={lens.id}
                    type="button"
                    onClick={() => setFilterStyle(lens.id)}
                    className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                      filterStyle === lens.id
                        ? "bg-yellow-100 border-yellow-400 text-yellow-800 font-bold"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {lens.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Expires In:
              </label>
              <div className="flex gap-2">
                {[4, 12, 24].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setExpireHours(h)}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-mono font-bold transition border cursor-pointer ${
                      expireHours === h
                        ? "bg-zinc-900 border-zinc-900 text-white"
                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {h} hrs
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Telegram specific tips */}
        {postType === "telegram" && (
          <div className="bg-[#F0F8FF] border border-[#B3D9FF] rounded-xl p-3 text-[11px] text-[#0066B2] font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <span className="text-base">📢</span>
            <span>Channel broadcast. Adds full interactive tap-reactions under your card automatically!</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-1.5 p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Optional Image Url Input */}
        {showImageInput && (
          <div className="space-y-2 animate-in slide-in-from-top-1 duration-150">
            <div className="relative">
              <input
                type="text"
                placeholder={postType === "snapchat" ? "Attach image for your Snap filter lens! *" : "Paste any photo web link (https://...)"}
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
              <div className="rounded-lg overflow-hidden border border-[#DBDBDB] bg-zinc-50 max-h-[160px] max-w-[280px] mt-2 relative group align-middle">
                {/* Apply Snapdragon filter in real-time preview of the card! */}
                <img 
                  src={imageUrl} 
                  alt="attached preview" 
                  className={`w-full h-full object-cover max-h-[160px] transition duration-200 ${
                    postType === "snapchat" && filterStyle === "sepia" ? "sepia saturate-150 contrast-105" :
                    postType === "snapchat" && filterStyle === "grayscale" ? "grayscale contrast-125" :
                    postType === "snapchat" && filterStyle === "neon" ? "saturate-200 contrast-110 hue-rotate-60" :
                    postType === "snapchat" && filterStyle === "blue" ? "hue-rotate-180 brightness-105 saturate-125" : ""
                  }`} 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                    }}
                    className="bg-white text-xs text-zinc-805 py-1 px-2.5 rounded font-bold cursor-pointer"
                  >
                    Clear Filter Attached
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#DBDBDB]">
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
            <span>{showImageInput ? "Attachment Active" : "Add Photo Link"}</span>
          </button>

          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer text-white ${
              postType === "telegram" 
                ? "bg-[#0088CC] hover:bg-[#0077b5]" 
                : postType === "snapchat" 
                ? "bg-[#FFFC00] hover:bg-[#ebd500] text-black" 
                : "bg-zinc-900 hover:bg-zinc-800"
            }`}
            id="post-submit-btn"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSubmitting 
                ? "Sharing..." 
                : postType === "telegram" 
                ? "Broadcast to Telegram" 
                : postType === "snapchat" 
                ? "Snap self-destruct" 
                : "Instagram Feed Post"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
