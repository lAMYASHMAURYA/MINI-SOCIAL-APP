import React, { useState } from "react";
import { X, Sparkles, Send, ImageIcon, Type } from "lucide-react";

interface AddStoryModalProps {
  onClose: () => void;
  onSubmit: (storyForm: {
    mediaUrl?: string;
    text?: string;
    bgGradient?: string;
  }) => Promise<void>;
}

const GRADIENT_PRESETS = [
  { label: "Sunset Glow 🌅", value: "linear-gradient(135deg, #f12711, #f5af19)" },
  { label: "Cosmic Ocean 🌌", value: "linear-gradient(135deg, #1e3c72, #2a5298)" },
  { label: "Watermelon Neon 🍉", value: "linear-gradient(135deg, #f857a6, #ff5858)" },
  { label: "Mint Aurora 🎋", value: "linear-gradient(135deg, #11998e, #38ef7d)" },
  { label: "Cyber Grape 🔮", value: "linear-gradient(135deg, #6441A5, #2a0845)" }
];

const QUICK_STORY_PHOTO_SUGGESTIONS = [
  { label: "Travel", url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=400" },
  { label: "Workspace", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400" },
  { label: "Nature", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=400" }
];

export default function AddStoryModal({ onClose, onSubmit }: AddStoryModalProps) {
  const [storyType, setStoryType] = useState<"media" | "gradient">("gradient");
  const [mediaUrl, setMediaUrl] = useState("");
  const [text, setText] = useState("");
  const [bgGradient, setBgGradient] = useState(GRADIENT_PRESETS[0].value);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (storyType === "media" && !mediaUrl.trim() && !text.trim()) return;
    if (storyType === "gradient" && !text.trim()) return;

    setIsPublishing(true);
    try {
      await onSubmit({
        mediaUrl: storyType === "media" ? mediaUrl.trim() || undefined : undefined,
        bgGradient: storyType === "gradient" ? bgGradient : undefined,
        text: text.trim() || undefined
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" id="add-story-modal">
      <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl border border-gray-150 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-4.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9C27B0]" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Add Daily Story</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Instagram Mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-650 p-1.5 rounded-full hover:bg-gray-55 cursor-pointer transition border border-transparent hover:border-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle story style */}
        <div className="p-3 bg-gray-50 border-b border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={() => setStoryType("gradient")}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
              storyType === "gradient"
                ? "bg-white text-zinc-900 shadow-sm border border-gray-200"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Gradient Text</span>
          </button>
          <button
            type="button"
            onClick={() => setStoryType("media")}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
              storyType === "media"
                ? "bg-white text-zinc-900 shadow-sm border border-gray-200"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Picture Story</span>
          </button>
        </div>

        <form onSubmit={handlePublish} className="p-5 space-y-4">
          
          {storyType === "gradient" ? (
            <div className="space-y-3 text-left">
              <label className="text-[10px] font-bold text-gray-400 uppercase block">1. Select Vibrant Backdrop:</label>
              <div className="flex gap-2 flex-wrap">
                {GRADIENT_PRESETS.map((grad, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBgGradient(grad.value)}
                    className={`text-[9px] font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                      bgGradient === grad.value
                        ? "bg-purple-50 border-purple-400 text-purple-700 font-bold"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span 
                      className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 shrink-0 align-middle" 
                      style={{ background: grad.value }}
                    />
                    <span className="align-middle">{grad.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-left">
              <label className="text-[10px] font-bold text-gray-400 uppercase block">1. Paste Photo Address Link:</label>
              <input
                type="text"
                required
                placeholder="https://images.unsplash.com/..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full text-xs px-3.5 py-2 bg-transparent border border-gray-200 rounded-lg focus:outline-none focus:border-[#9C27B0] transition"
              />

              <div className="flex items-center gap-1.5">
                <span className="text-[9px] uppercase font-bold text-gray-500">Fast suggestions:</span>
                {QUICK_STORY_PHOTO_SUGGESTIONS.map((pho) => (
                  <button
                    key={pho.label}
                    type="button"
                    onClick={() => setMediaUrl(pho.url)}
                    className={`text-[10px] font-semibold py-1 px-2.5 rounded-full border transition cursor-pointer ${
                      mediaUrl === pho.url
                        ? "bg-purple-50 border-[#9C27B0] text-[#9C27B0] font-bold"
                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {pho.label}
                  </button>
                ))}
              </div>

              {mediaUrl.trim() && (
                <div className="rounded-lg overflow-hidden border border-gray-200 max-h-[140px] mt-1 relative bg-gray-50/50">
                  <img src={mediaUrl} alt="Attached preview" className="w-full h-full object-cover max-h-[140px]" />
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-400 uppercase block">2. Personal Story Caption Message:</label>
            <textarea
              maxLength={120}
              placeholder="What are you up to today?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="w-full text-xs px-3.5 py-2.5 bg-transparent border border-gray-200 rounded-lg focus:outline-none focus:border-[#9C27B0] transition resize-none font-medium"
            />
            <div className="text-[9px] text-right text-gray-400 font-semibold">{text.length}/120 characters</div>
          </div>

          <button
            type="submit"
            disabled={isPublishing}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs rounded-lg transition"
          >
            <Send className="w-3.5 h-3.5 text-white" />
            <span>{isPublishing ? "Publishing Stories..." : "Publish Daily Story"}</span>
          </button>

        </form>

      </div>
    </div>
  );
}
