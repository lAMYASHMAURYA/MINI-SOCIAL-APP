import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Story, User } from "../types";

interface StoryViewerModalProps {
  userId: string;
  stories: Story[];
  usersMap: Record<string, User>;
  onClose: () => void;
}

export default function StoryViewerModal({
  userId,
  stories,
  usersMap,
  onClose,
}: StoryViewerModalProps) {
  // Filter stories belonging to this specific user
  const userStories = stories.filter((s) => s.authorId === userId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const author = usersMap[userId] || {
    displayName: userId,
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${userId}`,
  };

  const activeStory = userStories[currentIndex];

  useEffect(() => {
    if (userStories.length === 0) {
      onClose();
    }
  }, [userStories, onClose]);

  // Auto-advance mechanism (5 seconds per story slide)
  useEffect(() => {
    setProgress(0);
    const intervalTime = 50; // Ticks every 50ms
    const step = 100 / (5000 / intervalTime); // increment step

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      onClose(); // Exit viewer if hitting back at first story
    }
  };

  const handleNext = () => {
    if (currentIndex < userStories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose(); // Exit viewer if reaching the end
    }
  };

  if (!activeStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-0 md:p-4 text-white" id="story-viewer-portal">
      {/* Container simulating compact Instagram Mobile story frame */}
      <div className="w-full max-w-sm h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-zinc-950 relative flex flex-col justify-between shadow-2xl">
        
        {/* Animated Segmented slide progress indicators at extreme top */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5 home-stories-progress">
          {userStories.map((_, i) => {
            let widthVal = "0%";
            if (i < currentIndex) widthVal = "100%";
            if (i === currentIndex) widthVal = `${progress}%`;

            return (
              <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all ease-linear" 
                  style={{ width: widthVal }} 
                />
              </div>
            );
          })}
        </div>

        {/* Story Metadata Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-shadow-md">
          <div className="flex items-center gap-2.5">
            <img
              src={author.avatarUrl}
              alt={author.displayName}
              className="w-8.5 h-8.5 rounded-full object-cover border-2 border-[#FAFAFA]"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <p className="text-xs font-bold font-sans drop-shadow-md">{author.displayName}</p>
              <p className="text-[9px] text-zinc-300 font-medium drop-shadow-xs font-sans">
                {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 p-1.5 rounded-full hover:bg-black/20 focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center content display area (Supports Gradient bg vs Photo uploads) */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Tapping sectors layout: Tap left to go prev, Tap right to go next */}
          <div className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer" onClick={handlePrev} />
          <div className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer" onClick={handleNext} />

          {activeStory.mediaUrl ? (
            <div className="w-full h-full relative">
              <img
                src={activeStory.mediaUrl}
                alt="Story media"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/55 pointer-events-none" />
              {activeStory.text && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center select-none">
                  <p className="bg-black/60 backdrop-blur-xs text-white text-base md:text-lg font-black font-sans px-4.5 py-3 rounded-xl max-w-[85%] leading-relaxed border border-white/10 shadow-lg select-none">
                    {activeStory.text}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div 
              className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
              style={{ background: activeStory.bgGradient || "linear-gradient(135deg, #12c2e9, #c471ed, #f64f59)" }}
            >
              <p className="text-white text-lg md:text-xl font-extrabold tracking-tight max-w-[90%] leading-relaxed drop-shadow-md font-sans">
                {activeStory.text || "Daily Vibe! ✨🌈"}
              </p>
            </div>
          )}
        </div>

        {/* Bottom swipe/advance footer tip */}
        <div className="absolute bottom-4 left-3 right-3 z-30 flex items-center justify-between text-[10px] text-zinc-300/80 font-bold uppercase tracking-wider font-sans select-none pointer-events-none drop-shadow-xs">
          <span>← Tap Left</span>
          <span>Tap Right →</span>
        </div>
      </div>
    </div>
  );
}
