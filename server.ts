import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const db = new Database("sandbox.db");
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "sandbox-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT,
    branch TEXT,
    semester INTEGER,
    section TEXT,
    bio TEXT,
    profile_pic TEXT,
    interests TEXT
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    type TEXT, -- 'social' or 'academic'
    subject_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER,
    post_id INTEGER,
    PRIMARY KEY(user_id, post_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(post_id) REFERENCES posts(id)
  );

  CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER,
    following_id INTEGER,
    PRIMARY KEY(follower_id, following_id),
    FOREIGN KEY(follower_id) REFERENCES users(id),
    FOREIGN KEY(following_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    file_url TEXT,
    file_type TEXT,
    subject_id INTEGER,
    semester INTEGER,
    uploaded_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(uploaded_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    branch TEXT,
    semester INTEGER
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER,
    title TEXT,
    description TEXT,
    due_date TEXT,
    created_by INTEGER,
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject_id INTEGER,
    date TEXT,
    status TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  );

  CREATE TABLE IF NOT EXISTS study_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    subject_id INTEGER,
    branch TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS study_group_members (
    group_id INTEGER,
    user_id INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(group_id, user_id),
    FOREIGN KEY(group_id) REFERENCES study_groups(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS study_group_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    user_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(group_id) REFERENCES study_groups(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS study_group_resources (
    group_id INTEGER,
    resource_id INTEGER,
    PRIMARY KEY(group_id, resource_id),
    FOREIGN KEY(group_id) REFERENCES study_groups(id),
    FOREIGN KEY(resource_id) REFERENCES resources(id)
  );
`);

// Seed some subjects if empty
const subjectsCount = db.prepare("SELECT COUNT(*) as count FROM subjects").get() as { count: number };
if (subjectsCount.count === 0) {
  const insertSubject = db.prepare("INSERT INTO subjects (name, branch, semester) VALUES (?, ?, ?)");
  insertSubject.run("DBMS", "CSE", 3);
  insertSubject.run("OS", "CSE", 3);
  insertSubject.run("CN", "CSE", 3);
  insertSubject.run("DSA", "CSE", 3);
  insertSubject.run("Maths", "CSE", 3);
}

app.use(express.json());

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Auth Routes
app.post("/api/auth/register", (req, res) => {
  const { email, password, role, name, branch, semester, section } = req.body;
  try {
    const info = db.prepare("INSERT INTO users (email, password, role, name, branch, semester, section) VALUES (?, ?, ?, ?, ?, ?, ?)").run(email, password, role, name, branch, semester, section);
    const token = jwt.sign({ id: info.lastInsertRowid, email, role }, JWT_SECRET);
    res.json({ token, user: { id: info.lastInsertRowid, email, role, name, branch, semester, section } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password, role } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ? AND role = ?").get(email, password, role) as any;
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  res.json({ token, user });
});

// Posts Routes
app.get("/api/posts", authenticate, (req, res) => {
  const posts = db.prepare(`
    SELECT posts.*, users.name, users.branch, users.semester, users.profile_pic 
    FROM posts 
    JOIN users ON posts.user_id = users.id 
    ORDER BY created_at DESC
  `).all();
  res.json(posts);
});

app.post("/api/posts", authenticate, (req: any, res) => {
  const { content, type, subject_id } = req.body;
  const info = db.prepare("INSERT INTO posts (user_id, content, type, subject_id) VALUES (?, ?, ?, ?)").run(req.user.id, content, type || 'social', subject_id);
  const post = db.prepare(`
    SELECT posts.*, users.name, users.branch, users.semester, users.profile_pic 
    FROM posts 
    JOIN users ON posts.user_id = users.id 
    WHERE posts.id = ?
  `).get(info.lastInsertRowid);
  
  // Broadcast new post
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'NEW_POST', post }));
    }
  });

  res.json(post);
});

// Profile Routes
app.get("/api/profile/:id", authenticate, (req, res) => {
  const user = db.prepare("SELECT id, email, role, name, branch, semester, section, bio, profile_pic, interests FROM users WHERE id = ?").get(req.params.id);
  const posts = db.prepare("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC").all(req.params.id);
  res.json({ user, posts });
});

// Subjects & Community
app.get("/api/subjects", authenticate, (req: any, res) => {
  const user = db.prepare("SELECT branch, semester FROM users WHERE id = ?").get(req.user.id) as any;
  const subjects = db.prepare("SELECT * FROM subjects WHERE branch = ? AND semester = ?").all(user.branch, user.semester);
  res.json(subjects);
});

// Resources
app.get("/api/resources", authenticate, (req, res) => {
  const resources = db.prepare(`
    SELECT resources.*, users.name as uploader_name 
    FROM resources 
    JOIN users ON resources.uploaded_by = users.id 
    ORDER BY created_at DESC
  `).all();
  res.json(resources);
});

app.post("/api/resources", authenticate, (req: any, res) => {
  const { title, description, file_url, file_type, subject_id, semester } = req.body;
  db.prepare("INSERT INTO resources (title, description, file_url, file_type, subject_id, semester, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)").run(title, description, file_url, file_type, subject_id, semester, req.user.id);
  res.json({ success: true });
});

// Messages
app.get("/api/messages/:otherId", authenticate, (req: any, res) => {
  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `).all(req.user.id, req.params.otherId, req.params.otherId, req.user.id);
  res.json(messages);
});

app.post("/api/messages", authenticate, (req: any, res) => {
  const { receiver_id, content } = req.body;
  const info = db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)").run(req.user.id, receiver_id, content);
  const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(info.lastInsertRowid);
  
  // Broadcast message
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'NEW_MESSAGE', message }));
    }
  });

  res.json(message);
});

// Teacher Dashboard
app.get("/api/teacher/analytics", authenticate, (req: any, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: "Forbidden" });
  // Mock analytics
  res.json({
    totalStudents: 120,
    averageAttendance: "85%",
    pendingAssignments: 5
  });
});

// Study Groups Routes
app.get("/api/study-groups", authenticate, (req, res) => {
  const groups = db.prepare(`
    SELECT study_groups.*, subjects.name as subject_name, users.name as creator_name,
    (SELECT COUNT(*) FROM study_group_members WHERE group_id = study_groups.id) as member_count
    FROM study_groups 
    LEFT JOIN subjects ON study_groups.subject_id = subjects.id
    JOIN users ON study_groups.created_by = users.id
    ORDER BY created_at DESC
  `).all();
  res.json(groups);
});

app.post("/api/study-groups", authenticate, (req: any, res) => {
  const { name, description, subject_id, branch } = req.body;
  const info = db.prepare("INSERT INTO study_groups (name, description, subject_id, branch, created_by) VALUES (?, ?, ?, ?, ?)").run(name, description, subject_id, branch, req.user.id);
  db.prepare("INSERT INTO study_group_members (group_id, user_id) VALUES (?, ?)").run(info.lastInsertRowid, req.user.id);
  res.json({ id: info.lastInsertRowid, name, description, subject_id, branch });
});

app.post("/api/study-groups/:id/join", authenticate, (req: any, res) => {
  try {
    db.prepare("INSERT INTO study_group_members (group_id, user_id) VALUES (?, ?)").run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: "Already a member or group not found" });
  }
});

app.get("/api/study-groups/:id/messages", authenticate, (req, res) => {
  const messages = db.prepare(`
    SELECT study_group_messages.*, users.name, users.profile_pic 
    FROM study_group_messages 
    JOIN users ON study_group_messages.user_id = users.id 
    WHERE group_id = ? 
    ORDER BY created_at ASC
  `).all(req.params.id);
  res.json(messages);
});

app.post("/api/study-groups/:id/messages", authenticate, (req: any, res) => {
  const { content } = req.body;
  const info = db.prepare("INSERT INTO study_group_messages (group_id, user_id, content) VALUES (?, ?, ?)").run(req.params.id, req.user.id, content);
  const message = db.prepare(`
    SELECT study_group_messages.*, users.name, users.profile_pic 
    FROM study_group_messages 
    JOIN users ON study_group_messages.user_id = users.id 
    WHERE study_group_messages.id = ?
  `).get(info.lastInsertRowid);
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'NEW_GROUP_MESSAGE', message, group_id: req.params.id }));
    }
  });

  res.json(message);
});

app.get("/api/study-groups/:id/resources", authenticate, (req, res) => {
  const resources = db.prepare(`
    SELECT resources.*, users.name as uploader_name 
    FROM study_group_resources 
    JOIN resources ON study_group_resources.resource_id = resources.id
    JOIN users ON resources.uploaded_by = users.id
    WHERE group_id = ?
  `).all(req.params.id);
  res.json(resources);
});

app.post("/api/study-groups/:id/resources", authenticate, (req: any, res) => {
  const { resource_id } = req.body;
  db.prepare("INSERT INTO study_group_resources (group_id, resource_id) VALUES (?, ?)").run(req.params.id, resource_id);
  res.json({ success: true });
});

// Search Resources for AI
app.get("/api/resources/search", authenticate, (req, res) => {
  const { q } = req.query;
  const resources = db.prepare(`
    SELECT resources.*, users.name as uploader_name 
    FROM resources 
    JOIN users ON resources.uploaded_by = users.id 
    WHERE title LIKE ? OR description LIKE ? OR file_type LIKE ?
    LIMIT 5
  `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  res.json(resources);
});

// WebSocket Handling
wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("message", (message) => {
    console.log("Received:", message.toString());
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
