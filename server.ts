import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { DBState, User, Post, Comment } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, "db.json");

app.use(express.json());

// Initialize and Seed Database
function getInitialDB(): DBState {
  return {
    users: {
      yash_m: {
        id: "yash_m",
        displayName: "Yash Maurya",
        bio: "Passionate full-stack hacker building modern reactive web applications! Let's build something epic! 🚀💻",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250",
        followers: ["alice_dev", "tech_pioneer"],
        following: ["alice_dev"],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      alice_dev: {
        id: "alice_dev",
        displayName: "Alice Chen",
        bio: "UX designer & frontend engineer. Passionate about typography, animations, and clean layouts. 📐✨🎨",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250",
        followers: ["yash_m"],
        following: ["yash_m", "tech_pioneer"],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      tech_pioneer: {
        id: "tech_pioneer",
        displayName: "Marcus Vance",
        bio: "Cloud Architect and Open Source Developer. Exploring Node, TypeScript, and Docker. Fuelled by caffeine. 🫖☕️",
        avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=250",
        followers: ["alice_dev"],
        following: ["yash_m"],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    posts: [
      {
        id: "p1",
        authorId: "alice_dev",
        content: "Just finished designing rules for standard visual contrast & whitespace. In UI design, spacing is just as functional as color! Less cognitive load leads to happier users. 🎨🖌️📐",
        imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600",
        likes: ["yash_m"],
        comments: [
          {
            id: "c1",
            authorId: "yash_m",
            content: "Completely agree, Alice! Proper tracking and leading combined with breathing-room creates an instant premium feel.",
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
          }
        ],
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "p2",
        authorId: "yash_m",
        content: "Hello world! 🚀 Welcoming everyone to the Mini Social Media App. Explore the dynamic profile switching capability, follow back your friends, and comment on trending items in real-time! Written in TypeScript + React + Express.",
        likes: ["alice_dev", "tech_pioneer"],
        comments: [
          {
            id: "c2",
            authorId: "alice_dev",
            content: "This is super snappy!",
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "c3",
            authorId: "tech_pioneer",
            content: "Great job on implementing the full-stack loop correctly. Everything is functional right in the preview window.",
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          }
        ],
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "p3",
        authorId: "tech_pioneer",
        content: "Local node setups are highly robust for isolated microservices. Clean endpoints, validated models, simple JSON file payloads. Perfection. 📂☕️💻",
        likes: [],
        comments: [],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  };
}

let dbState: DBState;

function readDB(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to read database, resetting to seed data:", error);
  }
  const initial = getInitialDB();
  writeDB(initial);
  return initial;
}

function writeDB(state: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to database:", error);
  }
}

// Load DB local state
dbState = readDB();

// Active fake session to simulate user logins & switching
let currentActiveUserId = "yash_m";

// --- API ROUTES ---

// Auth Session Helpers
app.get("/api/auth/current", (req, res) => {
  const activeUser = dbState.users[currentActiveUserId];
  if (activeUser) {
    res.json(activeUser);
  } else {
    // Falls back to first available user
    const firstUserId = Object.keys(dbState.users)[0];
    if (firstUserId) {
      currentActiveUserId = firstUserId;
      res.json(dbState.users[firstUserId]);
    } else {
      res.status(404).json({ error: "No users exist." });
    }
  }
});

app.post("/api/auth/switch", (req, res) => {
  const { userId } = req.body;
  if (dbState.users[userId]) {
    currentActiveUserId = userId;
    res.json(dbState.users[userId]);
  } else {
    res.status(404).json({ error: "User not found." });
  }
});

// Users Management
app.get("/api/users", (req, res) => {
  res.json(Object.values(dbState.users));
});

app.get("/api/users/:id", (req, res) => {
  const user = dbState.users[req.params.id];
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.post("/api/users", (req, res) => {
  const { username, displayName, bio, avatarUrl } = req.body;

  if (!username || !displayName) {
    return res.status(400).json({ error: "Username and display name are required." });
  }

  const normalizedId = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!normalizedId) {
    return res.status(400).json({ error: "Invalid username character sequence." });
  }

  if (dbState.users[normalizedId]) {
    return res.status(409).json({ error: "Username already taken." });
  }

  const newUser: User = {
    id: normalizedId,
    displayName: displayName.trim(),
    bio: (bio || "").trim(),
    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${normalizedId}`,
    followers: [],
    following: [],
    createdAt: new Date().toISOString()
  };

  dbState.users[normalizedId] = newUser;
  writeDB(dbState);
  res.status(210).json(newUser);
});

// Follow / Unfollow System
app.post("/api/users/:id/follow", (req, res) => {
  const targetId = req.params.id;
  const loggedInId = currentActiveUserId;

  if (targetId === loggedInId) {
    return res.status(400).json({ error: "You cannot follow yourself!" });
  }

  const target = dbState.users[targetId];
  const loggedIn = dbState.users[loggedInId];

  if (!target || !loggedIn) {
    return res.status(404).json({ error: "Target or current user not found." });
  }

  const isFollowing = loggedIn.following.includes(targetId);

  if (isFollowing) {
    // Unfollow
    loggedIn.following = loggedIn.following.filter(uid => uid !== targetId);
    target.followers = target.followers.filter(uid => uid !== loggedInId);
  } else {
    // Follow
    loggedIn.following.push(targetId);
    target.followers.push(loggedInId);
  }

  writeDB(dbState);
  res.json({
    user: loggedIn,
    target: target,
    isFollowing: !isFollowing
  });
});

// Posts Management
app.get("/api/posts", (req, res) => {
  // Sort posts by date descending
  const sortedPosts = [...dbState.posts].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  res.json(sortedPosts);
});

app.post("/api/posts", (req, res) => {
  const { content, imageUrl } = req.body;
  if (!content || !content.trim()) {
    return res.status(100).json({ error: "Post content cannot be empty." });
  }

  const newPost: Post = {
    id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    authorId: currentActiveUserId,
    content: content.trim(),
    imageUrl: imageUrl ? imageUrl.trim() : undefined,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  };

  dbState.posts.push(newPost);
  writeDB(dbState);
  res.status(210).json(newPost);
});

// Like Posts Toggle System
app.post("/api/posts/:id/like", (req, res) => {
  const postId = req.params.id;
  const userId = currentActiveUserId;

  const post = dbState.posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found." });
  }

  const isLiked = post.likes.includes(userId);
  if (isLiked) {
    post.likes = post.likes.filter(id => id !== userId);
  } else {
    post.likes.push(userId);
  }

  writeDB(dbState);
  res.json({ id: post.id, likes: post.likes, isLiked: !isLiked });
});

// Comments on Posts
app.post("/api/posts/:id/comment", (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Comment cannot be empty." });
  }

  const post = dbState.posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found." });
  }

  const newComment: Comment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    authorId: currentActiveUserId,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  post.comments.push(newComment);
  writeDB(dbState);
  res.status(210).json(newComment);
});

// Reset Database endpoint for debugging and interactive refresh
app.post("/api/admin/reset", (req, res) => {
  dbState = getInitialDB();
  writeDB(dbState);
  currentActiveUserId = "yash_m";
  res.json({ message: "Database reset to initial seed data successfully." });
});

// --- INGRESS & VITE DEV SERVER MIDDLEWARE HANDLERS ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express] Mini Social Backend running securely on http://localhost:${PORT}`);
  });
}

startServer();
