import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, ChevronDown, ChevronUp, Globe, ArrowLeft, Search, Check, Users } from "lucide-react";
import { User, Message } from "../types";

interface MessengerDrawerProps {
  currentUser: User | null;
  users: User[];
  usersMap: Record<string, User>;
}

export default function MessengerDrawer({ currentUser, users, usersMap }: MessengerDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null); // "global" or username id
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastSeenTimestamps, setLastSeenTimestamps] = useState<Record<string, string>>({});

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sessionStartTimeRef = useRef<string>(new Date().toISOString());

  // 1. Establish and Maintain WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        socket = new WebSocket(`${protocol}//${host}`);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          console.log("[WebSocket Client] Connected to live chat gateway.");
          setIsConnected(true);
          // Send join signal
          socket?.send(JSON.stringify({
            type: "join",
            data: { userId: currentUser.id }
          }));
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === "message") {
              const msg: Message = payload.data;
              
              setMessages((prev) => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
              });

              const threadId = msg.recipientId === "global" ? "global" : msg.senderId;
              if (threadId !== activeChatId && msg.senderId !== currentUser.id) {
                setUnreadCounts(prev => ({
                  ...prev,
                  [threadId]: (prev[threadId] || 0) + 1
                }));
              }
            } else if (payload.type === "joined") {
              console.log("[WebSocket Client] Sync verified for user:", payload.data.userId);
            }
          } catch (err) {
            // failed to parse
          }
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Retry silently in 10s to keep developer console clear of aggressive reconnect spam
          reconnectTimeout = setTimeout(connect, 10000);
        };

        socket.onerror = () => {
          // Fail silently to suppress background console noise in restricted sandbox environments
          setIsConnected(false);
          if (socket) {
            try { socket.close(); } catch (e) {}
          }
        };
      } catch (err) {
        setIsConnected(false);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (socket) {
        try { socket.close(); } catch (e) {}
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [currentUser, activeChatId]);

  // 1.5. Seamless HTTP Polling fallback when WebSockets are unavailable
  useEffect(() => {
    if (!currentUser || !isOpen) return;

    const interval = setInterval(async () => {
      // 1. Poll active chat history to sync newest messages in active tab
      if (activeChatId) {
        try {
          const res = await fetch(`/api/messages?chatWith=${activeChatId}`);
          if (res.ok) {
            const data = await res.json();
            setMessages(data);
          }
        } catch (err) {
          // ignore silent
        }
      }

      // 2. Poll all messages to update unread counts safely for inactive tabs
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const allMsgs: Message[] = await res.json();
          const nextUnreads: Record<string, number> = {};

          allMsgs.forEach(msg => {
            const isGlobal = msg.recipientId === "global";
            const isForMe = msg.recipientId === currentUser.id;
            const isByMe = msg.senderId === currentUser.id;

            if ((isGlobal || isForMe) && !isByMe) {
              const threadId = isGlobal ? "global" : msg.senderId;
              if (threadId !== activeChatId) {
                const lastSeen = lastSeenTimestamps[threadId] || sessionStartTimeRef.current;
                if (msg.createdAt > lastSeen) {
                  nextUnreads[threadId] = (nextUnreads[threadId] || 0) + 1;
                }
              }
            }
          });

          setUnreadCounts(nextUnreads);
        }
      } catch (err) {
        // ignore silent
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [currentUser, isOpen, activeChatId, lastSeenTimestamps, isConnected]);

  // 2. Load historical messages instantly on switching active thread
  useEffect(() => {
    if (!currentUser || !activeChatId) return;

    // Set last seen timestamp to prevent showing old messages as unread
    setLastSeenTimestamps(prev => ({
      ...prev,
      [activeChatId]: new Date().toISOString()
    }));

    setUnreadCounts(prev => ({
      ...prev,
      [activeChatId]: 0
    }));

    async function loadChatHistory() {
      try {
        const res = await fetch(`/api/messages?chatWith=${activeChatId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed loading thread logs:", err);
      }
    }

    loadChatHistory();
  }, [activeChatId, currentUser]);

  // 3. Scroll to bottom on updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, activeChatId]);

  if (!currentUser) return null;

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const body = {
      recipientId: activeChatId || "global",
      content: inputText.trim()
    };

    setInputText("");

    try {
      // Send message via API (highly reliable, persists to DB and triggers broadcast)
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const sentMsg = await res.json();
        setMessages(prev => {
          if (prev.find(m => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
      }
    } catch (err) {
      console.error("Failed to post chat message", err);
    }
  };

  // Filter contacts based on query
  const filteredUsers = users.filter((u) => {
    if (u.id === currentUser.id) return false;
    const query = searchQuery.toLowerCase();
    return u.displayName.toLowerCase().includes(query) || u.id.toLowerCase().includes(query);
  });

  // Calculate total unread count across all rooms
  const totalUnreads = (Object.values(unreadCounts) as number[]).reduce((sum, val) => sum + val, 0);

  return (
    <div 
      className={`fixed bottom-0 right-4 sm:right-8 z-40 bg-white border border-[#DBDBDB] rounded-t-xl shadow-2xl flex flex-col transition-all duration-300 w-80 md:w-96 ${
        isOpen ? "h-[450px]" : "h-12"
      }`} 
      id="messenger-drawer-widget"
    >
      {/* Drawer Header Toolbar */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 px-4.5 bg-zinc-900 text-white rounded-t-xl flex items-center justify-between text-left shrink-0 cursor-pointer"
        id="messenger-toggle-btn"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider font-sans">
            MiniSocial Messenger
          </span>
          {totalUnreads > 0 && (
            <span className="bg-red-500 text-white font-sans text-[8px] font-extrabold px-1.5 py-0.5 rounded-full animate-bounce">
              {totalUnreads}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 shadow-[0_0_8px_#34D399]" : "bg-red-400"}`} title={isConnected ? "Active WebSocket Sync" : "Reconnecting..."} />
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Inner Viewport */}
      {isOpen && (
        <div className="flex-1 min-h-0 flex flex-col bg-white">
          {activeChatId ? (
            /* Active Channel View */
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-50">
              {/* Converation Hub SubHeader */}
              <div className="bg-white border-b border-[#DBDBDB] py-2.5 px-3 flex items-center gap-2.5 shrink-0">
                <button 
                  onClick={() => setActiveChatId(null)}
                  className="p-1 text-gray-500 hover:text-[#262626] rounded-md hover:bg-gray-50 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 flex items-center gap-2 min-w-0 text-left">
                  {activeChatId === "global" ? (
                    <>
                      <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[11px] font-bold">
                        G
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 leading-tight">Global Channel</p>
                        <span className="text-[9px] text-[#0095F6] font-bold uppercase tracking-wider">Public Developer Space</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <img 
                        src={usersMap[activeChatId]?.avatarUrl || "https://api.dicebear.com/7.x/identicon/svg?seed=fallback"} 
                        className="w-7 h-7 rounded-full object-cover border border-[#DBDBDB]" 
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate leading-tight">
                          {usersMap[activeChatId]?.displayName || activeChatId}
                        </p>
                        <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                          @{activeChatId}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Thread Scroller */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-xs text-gray-400 font-medium italic">No instant letters exchanged yet.</p>
                    <p className="text-[10px] text-gray-405 font-medium mt-1">Send a message to instantly handshake! ✨</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSelf = m.senderId === currentUser.id;
                    const sender = usersMap[m.senderId];
                    return (
                      <div 
                        key={m.id} 
                        className={`flex flex-col max-w-[85%] ${
                          isSelf ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        {!isSelf && (
                          <span className="text-[9px] text-gray-450 font-bold ml-1 mb-0.5 font-sans">
                            {sender ? sender.displayName : m.senderId}
                          </span>
                        )}
                        <div 
                          className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed font-sans ${
                            isSelf 
                              ? "bg-zinc-900 text-white rounded-tr-xs" 
                              : "bg-white text-zinc-800 border border-gray-150 rounded-tl-xs shadow-2xs"
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[8px] text-gray-400 font-mono mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#DBDBDB] flex gap-2 shrink-0">
                <input 
                  type="text"
                  placeholder="Ask, share, connect live..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 bg-transparent border border-[#DBDBDB] rounded-lg focus:outline-none focus:border-zinc-800 transition font-medium text-zinc-900"
                  maxLength={500}
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 bg-zinc-950 hover:bg-zinc-800 text-white disabled:opacity-40 rounded-lg transition cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            /* Threads & Contacts directory */
            <div className="flex-1 flex flex-col min-h-0 bg-white">
              {/* Search contacts bar */}
              <div className="p-3 border-b border-[#DBDBDB] bg-white space-y-2.5 shrink-0">
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search people to instant chat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8.5 pr-3 py-1.5 bg-[#FAFAFA] border border-[#DBDBDB] rounded-lg focus:outline-none focus:border-zinc-350 font-medium"
                  />
                </div>
              </div>

              {/* Threads list scroller */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {/* 1. PUBLIC DEV ROOM */}
                <button 
                  onClick={() => setActiveChatId("global")}
                  className="w-full p-3.5 flex items-center gap-3.5 text-left hover:bg-zinc-50 transition border-l-4 border-l-indigo-500 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-xs shrink-0 font-extrabold text-sm">
                    <Globe className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-zinc-800 text-xs">Global Public Lounge</p>
                      <span className="text-[8px] uppercase tracking-wider text-indigo-500 font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" /> Live
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">Participate with all active directory builders.</p>
                  </div>
                  {unreadCounts["global"] > 0 && (
                    <span className="bg-red-500 text-white font-sans text-[8px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0">
                      {unreadCounts["global"]}
                    </span>
                  )}
                </button>

                {/* 2. VERIFIED DIRECTORIES */}
                <div className="bg-gray-50 py-1.5 px-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider">Direct Messages</span>
                  <span className="text-[9px] text-[#0095F6] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> active sync
                  </span>
                </div>

                {filteredUsers.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic text-center py-6 font-medium">No other directory members match.</p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setActiveChatId(u.id)}
                      className="w-full p-3 flex items-center gap-3 text-left hover:bg-zinc-50 transition border-l-4 border-l-transparent hover:border-l-zinc-350 cursor-pointer"
                    >
                      <img 
                        src={u.avatarUrl} 
                        alt={u.displayName} 
                        className="w-8.5 h-8.5 rounded-full object-cover border border-[#DBDBDB] shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-zinc-800 text-xs truncate">{u.displayName}</p>
                        <p className="text-[9.5px] text-gray-400 font-medium">@{u.id}</p>
                      </div>
                      {unreadCounts[u.id] > 0 && (
                        <span className="bg-red-500 text-white font-sans text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0">
                          {unreadCounts[u.id]}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
