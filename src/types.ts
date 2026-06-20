export interface User {
  id: string; // username
  displayName: string;
  bio: string;
  avatarUrl: string;
  followers: string[]; // usernames of followers
  following: string[]; // usernames being followed
  createdAt: string;
  googleEmail?: string;
  isGoogleUser?: boolean;
}

export interface Comment {
  id: string;
  authorId: string; // username
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string; // username
  content: string;
  imageUrl?: string;
  likes: string[]; // usernames who liked the post
  comments: Comment[];
  createdAt: string;
  postType?: "instagram" | "snapchat" | "telegram";
  telegramReactions?: Record<string, number>; // reactions like {"👍": 4, "🔥": 2} ...
  filterStyle?: string; // CSS class for Snapchat filter
  expireHours?: number; // e.g. 24
}

export interface Story {
  id: string;
  authorId: string;
  mediaUrl?: string;
  text?: string;
  bgGradient?: string;
  createdAt: string;
}

export interface DBState {
  users: Record<string, User>;
  posts: Post[];
  stories: Story[];
}

