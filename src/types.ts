export interface User {
  id: string; // username
  displayName: string;
  bio: string;
  avatarUrl: string;
  followers: string[]; // usernames of followers
  following: string[]; // usernames being followed
  createdAt: string;
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
}

export interface DBState {
  users: Record<string, User>;
  posts: Post[];
}
