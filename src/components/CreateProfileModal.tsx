import React, { useState } from "react";
import { X, UserPlus, Sparkles, AlertCircle, LogIn, CheckCircle } from "lucide-react";
import { User } from "../types";

interface CreateProfileModalProps {
  onClose: () => void;
  onSubmit: (userForm: { 
    username: string; 
    displayName: string; 
    bio: string; 
    avatarUrl: string;
    googleEmail?: string;
    isGoogleUser?: boolean;
  }) => Promise<User | null>;
  users?: User[];
  onSwitchUser?: (userId: string) => Promise<void>;
}

// Preset modern avatar vectors for fun selection
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150", 
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150", 
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150", 
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150", 
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150", 
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"  
];

const GOOGLE_ACCOUNTS = [
  {
    displayName: "Yash Maurya",
    email: "yashmaurya02007@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
  },
  {
    displayName: "Alice Chen Creative",
    email: "alice.chen@creative.io",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
  },
  {
    displayName: "Vance Architect",
    email: "vance.architect@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150"
  }
];

export default function CreateProfileModal({ onClose, onSubmit, users = [], onSwitchUser }: CreateProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"register" | "signin">("register");
  const [loginUsername, setLoginUsername] = useState("");

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [customAvatar, setCustomAvatar] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Google OAuth simulation states
  const [googleEmail, setGoogleEmail] = useState<string | undefined>(undefined);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");

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

  const selectGoogleAccount = async (acc: typeof GOOGLE_ACCOUNTS[0]) => {
    setIsLoading(true);
    setError("");
    const defaultUsername = acc.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
    
    // Check if user already exists
    const existing = users.find(u => u.id === defaultUsername);
    if (existing) {
      // Switch automatically if already exists!
      try {
        if (onSwitchUser) {
          await onSwitchUser(defaultUsername);
          onClose();
          return;
        }
      } catch (err: any) {
        setError(err?.message || "Failed to log into existing Google profile.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const resUser = await onSubmit({
        username: defaultUsername,
        displayName: acc.displayName,
        bio: `Connected with Google Secure Account (${acc.email}). Excited to build on MiniSocial! 🤝✨`,
        avatarUrl: acc.avatarUrl,
        googleEmail: acc.email,
        isGoogleUser: true
      });
      if (resUser) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Google registration failed.");
    } finally {
      setIsLoading(false);
      setShowGooglePopup(false);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.includes("@") || !customGoogleName.trim()) {
      setError("Please supply a valid name and Google email.");
      return;
    }
    setIsLoading(true);
    setError("");
    const defaultUsername = customGoogleEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
    
    // Check if user already exists
    const existing = users.find(u => u.id === defaultUsername);
    if (existing) {
      try {
        if (onSwitchUser) {
          await onSwitchUser(defaultUsername);
          onClose();
          return;
        }
      } catch (err: any) {
        setError(err?.message || "Failed to switch user.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const resUser = await onSubmit({
        username: defaultUsername,
        displayName: customGoogleName.trim(),
        bio: `Securely connected with Google Account (${customGoogleEmail.trim()}). 💻📱`,
        avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${defaultUsername}`,
        googleEmail: customGoogleEmail.trim().toLowerCase(),
        isGoogleUser: true
      });
      if (resUser) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Google registration failed.");
    } finally {
      setIsLoading(false);
      setShowGooglePopup(false);
    }
  };

  const unlinkGoogleAccount = () => {
    setGoogleEmail(undefined);
    setIsGoogleUser(false);
    setUsername("");
    setDisplayName("");
    setBio("");
    setAvatarUrl(AVATAR_PRESETS[0]);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanHandle = loginUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!cleanHandle) {
      setError("Please enter a valid handle name.");
      return;
    }

    const matched = users.find(u => u.id === cleanHandle);
    if (!matched) {
      setError(`Profile handle @${cleanHandle} does not exist. Check spelling or Register below.`);
      return;
    }

    setIsLoading(true);
    try {
      if (onSwitchUser) {
        await onSwitchUser(cleanHandle);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to sign in with this account.");
    } finally {
      setIsLoading(false);
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
        avatarUrl: avatarUrl,
        googleEmail: googleEmail,
        isGoogleUser: isGoogleUser
      });
      if (resUser) {
        onClose();
      }
    } catch (err: any) {
      // Suggest login if already registered
      const msg = err?.message || "An error occurred while creating your profile.";
      if (msg.toLowerCase().includes("taken") || msg.toLowerCase().includes("already")) {
        setError(`${msg} -> Do you want to sign in instead?`);
        setLoginUsername(username.trim().toLowerCase());
        setActiveTab("signin");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" id="create-profile-modal">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#DBDBDB] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#DBDBDB] bg-white flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#DBDBDB] text-zinc-900">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#262626] leading-tight font-sans">User Access Center</h3>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Register Account or Sign In</p>
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

          {/* Elegant active tab triggers */}
          <div className="flex bg-[#FAFAFA] p-1 rounded-lg border border-[#EBEBEB]">
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === "register" ? "bg-white text-zinc-900 shadow-xs border border-gray-100" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === "signin" ? "bg-white text-zinc-900 shadow-xs border border-gray-100" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        </div>

        {activeTab === "signin" ? (
          /* Sign In Form */
          <form onSubmit={handleLoginSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-white" id="signin-tab-content">
            {error && (
              <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Your account username</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-450 text-sm font-semibold font-mono">@</span>
                <input
                  type="text"
                  required
                  placeholder="yash_m"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="w-full text-sm pl-7 pr-3 py-2 bg-transparent border border-[#DBDBDB] rounded-lg focus:outline-none focus:border-[#0095F6] transition font-mono font-medium"
                  id="signin-username-input"
                />
              </div>
              <p className="text-[9px] text-gray-400 font-medium">Type your existing lowercase username with underscores.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-850 disabled:opacity-50 text-white font-bold text-sm cursor-pointer transition"
              id="signin-submit-btn"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? "Signing In..." : "Authenticate Session"}</span>
            </button>

            {/* Quick select registry */}
            {users.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-2 text-left">Select an active profile:</span>
                <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setLoginUsername(u.id);
                        setError("");
                      }}
                      className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:border-zinc-350 hover:bg-zinc-50 transition text-left cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={u.avatarUrl} alt={u.displayName} className="w-6.5 h-6.5 rounded-full object-cover border border-[#DBDBDB]" />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-zinc-800">{u.displayName}</p>
                          <p className="text-[9px] text-gray-400 font-mono">@{u.id}</p>
                        </div>
                      </div>
                      {loginUsername === u.id && (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        ) : (
          /* Registration Form */
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-white" id="register-tab-content">
            
            {/* Google Sign-In Integration */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Fast Registration</h4>
              {isGoogleUser ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-green-800">Connected with Google</p>
                      <p className="text-[10px] text-green-600 font-mono text-xs">{googleEmail}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={unlinkGoogleAccount}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowGooglePopup(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-[#DBDBDB] hover:bg-gray-50 text-[13px] font-bold text-zinc-800 rounded-lg shadow-xs cursor-pointer transition"
                    id="google-signin-btn"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5.04c1.74 0 3.12.6 3.81 1.25l2.84-2.84C16.92 1.9 14.65 1 12 1 7.24 1 3.2 4.04 1.62 8.38l3.41 2.65C5.87 7.78 8.69 5.04 12 5.04z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.47c-.28 1.47-1.11 2.71-2.35 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.5z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.03 14.77a7.2 7.2 0 0 1-.38-2.3c0-.82.14-1.62.38-2.3L1.62 7.52C.58 9.61 0 11.91 0 14.33c0 2.42.58 4.72 1.62 6.81l3.41-2.37z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.3 1.09-3.73 1.09-3.31 0-6.13-2.22-7.13-5.22L1.62 15.5C3.2 19.84 7.24 23 12 23s.01 0 .01 0z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-[1px] bg-gray-200" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">or sign up manually</span>
                    <div className="flex-1 h-[1px] bg-gray-200" />
                  </div>
                </div>
              )}
            </div>

          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 font-medium" id="create-profile-error">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Avatar picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">1. Profile Avatar</label>
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
              <div className="flex-1 text-left">
                <div className="flex gap-2 flex-wrap mb-2">
                  {AVATAR_PRESETS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePresetSelect(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 cursor-pointer transition ${
                        avatarUrl === url ? "border-[#0095F6] scale-105" : "border-transparent opacity-85"
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or custom image URL..."
                  value={customAvatar}
                  onChange={handleCustomAvatarChange}
                  className="w-full text-xs px-3 py-2 bg-transparent border border-[#DBDBDB] rounded-lg focus:outline-none focus:border-[#0095F6] transition font-medium"
                  id="custom-avatar-url-input"
                />
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">2. Personal Handle</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-450 text-sm font-semibold font-mono">@</span>
              <input
                type="text"
                required
                maxLength={20}
                placeholder="yash_m"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="w-full text-sm pl-7 pr-3 py-2 bg-transparent border border-[#DBDBDB] rounded-lg focus:outline-none focus:border-[#0095F6] transition font-mono font-medium"
                id="profile-username-input"
              />
            </div>
            <p className="text-[9px] text-gray-400 font-medium">Lowercase characters and underscores only. Max 20.</p>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">3. Display Name</label>
            <input
              type="text"
              required
              maxLength={40}
              placeholder="Yash Maurya"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-sm px-3.5 py-2 bg-transparent border border-[#DBDBDB] rounded-lg focus:outline-none focus:border-[#0095F6] transition font-medium"
              id="profile-displayname-input"
            />
          </div>

          {/* Biography */}
          <div className="space-y-1.5 text-left">
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
            <div className="text-[9px] text-right text-gray-400 font-semibold">{bio.length}/160 characters</div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-850 disabled:opacity-50 text-white font-bold text-sm cursor-pointer transition"
            id="create-profile-submit-btn"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isLoading ? "Creating Profile..." : "Create and Sign In"}</span>
          </button>
        </form>
        )}
      </div>

      {/* Simulated Google Consent popup */}
      {showGooglePopup && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-xl border border-gray-200 flex flex-col p-6 animate-in fade-in duration-100">
            <div className="flex flex-col items-center text-center space-y-2 mb-4">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.74 0 3.12.6 3.81 1.25l2.84-2.84C16.92 1.9 14.65 1 12 1 7.24 1 3.2 4.04 1.62 8.38l3.41 2.65C5.87 7.78 8.69 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.47c-.28 1.47-1.11 2.71-2.35 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.03 14.77a7.2 7.2 0 0 1-.38-2.3c0-.82.14-1.62.38-2.3L1.62 7.52C.58 9.61 0 11.91 0 14.33c0 2.42.58 4.72 1.62 6.81l3.41-2.37z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.3 1.09-3.73 1.09-3.31 0-6.13-2.22-7.13-5.22L1.62 15.5C3.2 19.84 7.24 23 12 23s.01 0 .01 0z"
                />
              </svg>
              <h3 className="text-base font-bold text-gray-900">Sign in with Google</h3>
              <p className="text-xs text-gray-500">to continue to MiniSocial</p>
            </div>

            <div className="space-y-2">
              {GOOGLE_ACCOUNTS.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectGoogleAccount(acc)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left cursor-pointer"
                >
                  <img
                    src={acc.avatarUrl}
                    alt={acc.displayName}
                    className="w-9 h-9 rounded-full object-cover border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{acc.displayName}</p>
                    <p className="text-[10px] text-gray-500 font-mono truncate">{acc.email}</p>
                  </div>
                  <ChevronRight />
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomGoogleSubmit} className="mt-4 border-t border-gray-100 pt-4 space-y-2 text-left">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Use a different address</span>
              <input
                type="text"
                required
                placeholder="Google Account Full Name"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#FAFAFA] border border-[#DBDBDB] rounded-md focus:outline-none focus:border-[#0095F6] transition font-medium"
              />
              <input
                type="email"
                required
                placeholder="Google Email (e.g. creative@gmail.com)"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#FAFAFA] border border-[#DBDBDB] rounded-md focus:outline-none focus:border-[#0095F6] transition font-medium"
              />
              <button
                type="submit"
                className="w-full py-2 bg-zinc-900 text-white text-[11px] font-bold rounded-md hover:bg-zinc-800 transition cursor-pointer"
              >
                Authenticate new Google account
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowGooglePopup(false)}
              className="mt-4 text-xs font-semibold text-gray-400 hover:text-gray-600 transition text-center hover:underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const ChevronRight = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
  </svg>
);
