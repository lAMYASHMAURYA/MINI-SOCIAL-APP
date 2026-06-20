import React, { useState } from "react";
import { X, UserPlus, Sparkles } from "lucide-react";
import { User } from "../types";

interface CreateProfileModalProps {
  onClose: () => void;
  onSubmit: (userForm: { username: string; displayName: string; bio: string; avatarUrl: string }) => Promise<User | null>;
}

// Preset modern avatar vectors for fun selection
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150", // Female tech
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150", // Creative developer
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150", // Creative designer
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150", // Tech guy
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150", // Minimal avatar
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"  // Casual corporate
];

export default function CreateProfileModal({ onClose, onSubmit }: CreateProfileModalProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [customAvatar, setCustomAvatar] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePresetSelect = (url: string) => {
    setAvatarUrl(url);
    setCustomAvatar("");
  };

  const handleCustomAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAvatar(val);
    if (val.trim()) {
      setAvatarUrl(val.trim());
    } else {
      setAvatarUrl(AVATAR_PRESETS[0]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username handle is required.");
      return;
    }
    if (!displayName.trim()) {
      setError("Display Name is required.");
      return;
    }

    // Alphanumeric handle validation
    const handleRegex = /^[a-zA-Z0-9_]+$/;
    if (!handleRegex.test(username.trim())) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    setIsLoading(true);
    try {
      const resUser = await onSubmit({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl
      });
      if (resUser) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while creating your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" id="create-profile-modal">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#DBDBDB] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-[#DBDBDB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#DBDBDB] text-zinc-900">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#262626] leading-tight">Create User Profile</h3>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Register Account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-650 p-1.5 rounded-full hover:bg-[#FAFAFA] transition-colors cursor-pointer border border-transparent hover:border-[#DBDBDB]"
            id="close-create-profile-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg font-medium" id="create-profile-error">
              {error}
            </div>
          )}

          {/* Avatar picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">1. Select Avatar</label>
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl}
                alt="Selected avatar"
                className="w-16 h-16 rounded-full object-cover border border-[#DBDBDB] bg-[#FAFAFA] flex-shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${username || "temp"}`;
                }}
              />
              <div className="flex-1">
                <div className="flex gap-2 flex-wrap mb-2">
                  {AVATAR_PRESETS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePresetSelect(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 cursor-pointer transition ${
                        avatarUrl === url ? "border-[#0095F6] scale-105" : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or paste custom image URL..."
                  value={customAvatar}
                  onChange={handleCustomAvatarChange}
                  className="w-full text-xs px-3 py-2 bg-transparent border border-[#DBDBDB] rounded-lg focus:outline-none focus:border-[#0095F6] transition font-medium"
                  id="custom-avatar-url-input"
                />
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">2. Personal Handle</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400 text-sm font-semibold">@</span>
              <input
                type="text"
                required
                maxLength={20}
                placeholder="yash_m"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="w-full text-sm pl-7 pr-3 py-2.5 bg-transparent border border-[#DBDBDB] rounded-lg focus:outline-none focus:border-[#0095F6] transition font-mono"
                id="profile-username-input"
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium font-sans">Lowercase alphanumeric characters and underscores only. Max 20.</p>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">3. Display Name</label>
            <input
              type="text"
              required
              maxLength={40}
              placeholder="Yash Maurya"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-transparent border border-[#DBDBDB] rounded-lg focus:outline-none focus:border-[#0095F6] transition font-medium"
              id="profile-displayname-input"
            />
          </div>

          {/* Biography */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">4. Biography / Intro</label>
            <textarea
              maxLength={160}
              placeholder="Tell other builders about yourself! Ideas, technologies, hobbies..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full text-sm px-3.5 py-2.5 bg-transparent border border-[#DBDBDB] rounded-lg focus:outline-none focus:border-[#0095F6] transition resize-none font-medium"
              id="profile-bio-input"
            />
            <p className="text-[10px] text-right text-gray-400 font-semibold">{bio.length}/160 characters</p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#0095F6] hover:bg-[#007cd1] disabled:opacity-50 text-white font-bold text-sm cursor-pointer transition-colors duration-250"
            id="create-profile-submit-btn"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? "Creating Profile..." : "Create and Sign In"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
