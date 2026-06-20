import React from "react";
import { Plus, Sparkles } from "lucide-react";
import { User, Story } from "../types";

interface StoryBubbleTrayProps {
  currentUser: User | null;
  stories: Story[];
  usersMap: Record<string, User>;
  onAddStoryClick: () => void;
  onUserStorySelect: (userId: string) => void;
}

export default function StoryBubbleTray({
  currentUser,
  stories,
  usersMap,
  onAddStoryClick,
  onUserStorySelect,
}: StoryBubbleTrayProps) {
  // Group stories by authorId
  const storiesMap: Record<string, Story[]> = {};
  stories.forEach((s) => {
    if (!storiesMap[s.authorId]) {
      storiesMap[s.authorId] = [];
    }
    storiesMap[s.authorId].push(s);
  });

  const authorsWithStories = Object.keys(storiesMap);

  return (
    <div className="bg-white border border-[#DBDBDB] rounded-xl p-4.5 shadow-xs" id="stories-root">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 font-sans">Instagram Active Stories</h3>
      </div>
      
      <div className="flex gap-4.5 overflow-x-auto pb-1 scrollbar-none items-center text-center">
        {/* Current User Add Story bubble */}
        {currentUser && (
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative group">
              <button
                type="button"
                onClick={() => onUserStorySelect(currentUser.id)}
                className="w-14 h-14 rounded-full p-[2px] bg-gray-200 hover:bg-gray-300 transition duration-150 cursor-pointer overflow-hidden block"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover rounded-full border-2 border-white"
                  referrerPolicy="no-referrer"
                />
              </button>
              {/* Plus trigger to add story */}
              <button
                type="button"
                onClick={onAddStoryClick}
                className="absolute bottom-0 right-0 bg-[#0095F6] hover:bg-[#007cd1] text-white p-1 rounded-full border-2 border-white shadow-xs cursor-pointer transition"
                title="Add a daily story"
                id="add-story-plus-btn"
              >
                <Plus className="w-3.5 h-3.5 font-extrabold" />
              </button>
            </div>
            <span className="text-[10px] text-gray-400 font-semibold mt-1.5 font-sans">Your Story</span>
          </div>
        )}

        {/* Other users story bubbles */}
        {authorsWithStories.map((authorId) => {
          // If it's already the current user, handled above
          if (currentUser && authorId === currentUser.id) return null;

          const author = usersMap[authorId] || {
            displayName: authorId,
            avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${authorId}`,
          };

          return (
            <button
              key={authorId}
              type="button"
              onClick={() => onUserStorySelect(authorId)}
              className="flex-shrink-0 flex flex-col items-center cursor-pointer group text-center focus:outline-none"
              id={`story-bubble-${authorId}`}
            >
              {/* Vibrant Instagram Colorful Ring gradient box */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FFB300] via-[#F44336] to-[#9C27B0] p-[2.5px] transition group-hover:scale-105 active:scale-95 duration-200">
                <div className="w-full h-full rounded-full bg-white p-[1.5px]">
                  <img
                    src={author.avatarUrl}
                    alt={author.displayName}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <span className="text-[10px] text-gray-700 font-bold mt-1.5 font-sans truncate w-14">
                {author.displayName.split(" ")[0]}
              </span>
            </button>
          );
        })}

        {authorsWithStories.length === 0 && (
          <div className="flex-1 py-3 text-center text-xs text-gray-400 font-medium">
            No active shared stories. Post your story above! 🌟
          </div>
        )}
      </div>
    </div>
  );
}
