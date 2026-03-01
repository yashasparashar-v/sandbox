import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Home, 
  Users, 
  MessageSquare, 
  BookOpen, 
  Bot, 
  Settings, 
  Search, 
  Bell, 
  MessageCircle, 
  User as UserIcon,
  LogOut,
  Plus,
  Heart,
  Repeat,
  Share2,
  FileText,
  Download,
  Bookmark,
  ChevronRight,
  TrendingUp,
  Calendar,
  LayoutDashboard,
  CheckCircle,
  BarChart3,
  Send,
  UserPlus,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';

import { User, Post, Role, Subject, Resource, Message, StudyGroup } from './types';
import { api } from './lib/api';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Components ---

const Navbar = () => {
  const { user, logout } = useAuth();
  return (
    <nav className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-8 flex-1">
        <Link to="/" className="text-2xl font-bold text-primary-blue tracking-tighter">SandBox</Link>
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search campus, resources, people..." 
            className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-xl transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary-red rounded-full border-2 border-background"></span>
        </button>
        <Link to="/messages" className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-xl transition-all">
          <MessageCircle className="w-5 h-5" />
        </Link>
        <div className="h-8 w-px bg-border mx-2"></div>
        <div className="flex items-center gap-3">
          <Link to={`/profile/${user?.id}`} className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-primary-blue/20 border border-primary-blue/30 flex items-center justify-center text-primary-blue font-bold text-xs overflow-hidden">
              {user?.profile_pic ? (
                <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0)
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium group-hover:text-primary-blue transition-colors">{user?.name}</p>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">{user?.role}</p>
            </div>
          </Link>
          <button onClick={logout} className="p-2 text-text-secondary hover:text-primary-red hover:bg-primary-red/5 rounded-xl transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/community', icon: Users, label: 'Community' },
    { to: '/connect', icon: MessageSquare, label: 'Connect' },
    { to: '/study-groups', icon: Layers, label: 'Study Groups' },
    { to: '/resources', icon: BookOpen, label: 'Resources' },
    { to: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
  ];

  if (user?.role === 'teacher') {
    links.push({ to: '/teacher-dashboard', icon: LayoutDashboard, label: 'Dashboard' });
  }

  return (
    <aside className="w-64 border-r border-border h-[calc(100vh-64px)] sticky top-16 p-4 hidden lg:flex flex-col gap-2">
      {links.map((link) => {
        const isActive = location.pathname === link.to;
        return (
          <Link 
            key={link.to} 
            to={link.to} 
            className={cn(isActive ? "nav-link-active" : "nav-link")}
          >
            <link.icon className="w-5 h-5" />
            <span>{link.label}</span>
          </Link>
        );
      })}
      <div className="mt-auto pt-4 border-t border-border">
        <Link to="/settings" className="nav-link">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <div className="max-w-[1440px] mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-6 min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
};

// --- Pages ---

const LoginPage = () => {
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [semester, setSemester] = useState(3);
  const [section, setSection] = useState('A');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        const res = await api.auth.register({ email, password, role, name, branch, semester, section });
        login(res.token, res.user);
      } else {
        const res = await api.auth.login({ email, password, role });
        login(res.token, res.user);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary-blue tracking-tighter">SandBox</h1>
          <p className="text-text-secondary">Your Campus. Now Intelligent.</p>
        </div>

        <div className="flex p-1 bg-white/5 rounded-xl">
          <button 
            onClick={() => setRole('student')}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              role === 'student' ? "bg-primary-blue text-white shadow-lg" : "text-text-secondary hover:text-text-primary"
            )}
          >
            Student
          </button>
          <button 
            onClick={() => setRole('teacher')}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              role === 'teacher' ? "bg-primary-blue text-white shadow-lg" : "text-text-secondary hover:text-text-primary"
            )}
          >
            Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Branch</label>
                  <select 
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-white/5 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Sem</label>
                  <input 
                    type="number" 
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full bg-white/5 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Sec</label>
                  <input 
                    type="text" 
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-white/5 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                  />
                </div>
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
            />
          </div>
          {error && <p className="text-xs text-primary-red">{error}</p>}
          <button type="submit" className="w-full btn-primary py-3 rounded-xl shadow-lg shadow-primary-blue/20">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-text-secondary hover:text-primary-blue transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PostCard = ({ post }: { post: Post }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <Link to={`/profile/${post.user_id}`} className="w-10 h-10 rounded-full bg-primary-blue/20 border border-primary-blue/30 flex items-center justify-center text-primary-blue font-bold overflow-hidden">
            {post.profile_pic ? (
              <img src={post.profile_pic} alt={post.name} className="w-full h-full object-cover" />
            ) : (
              post.name.charAt(0)
            )}
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link to={`/profile/${post.user_id}`} className="font-semibold hover:text-primary-blue transition-colors">{post.name}</Link>
              <span className="text-xs text-text-secondary">•</span>
              <span className="text-xs text-text-secondary">{post.branch} - Sem {post.semester}</span>
            </div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-0.5">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button className="text-text-secondary hover:text-text-primary">
          <Plus className="w-5 h-5 rotate-45" />
        </button>
      </div>
      
      <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{post.content}</p>
      
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-text-secondary hover:text-primary-blue transition-colors group">
            <div className="p-2 group-hover:bg-primary-blue/10 rounded-full transition-all">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-xs">24</span>
          </button>
          <button className="flex items-center gap-2 text-text-secondary hover:text-primary-red transition-colors group">
            <div className="p-2 group-hover:bg-primary-red/10 rounded-full transition-all">
              <Heart className="w-4 h-4" />
            </div>
            <span className="text-xs">128</span>
          </button>
          <button className="flex items-center gap-2 text-text-secondary hover:text-emerald-500 transition-colors group">
            <div className="p-2 group-hover:bg-emerald-500/10 rounded-full transition-all">
              <Repeat className="w-4 h-4" />
            </div>
            <span className="text-xs">12</span>
          </button>
        </div>
        <button className="p-2 text-text-secondary hover:text-primary-blue hover:bg-primary-blue/10 rounded-full transition-all">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const HomePage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    api.posts.getAll().then(setPosts);
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        <header className="space-y-1">
          <h2 className="text-xs font-bold text-primary-blue uppercase tracking-[0.2em]">Academic Hub</h2>
          <h1 className="text-3xl font-bold">{user?.branch} – Semester {user?.semester} – Section {user?.section}</h1>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/community" className="glass-card p-6 flex items-center justify-between group hover:border-primary-blue/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-blue/10 flex items-center justify-center text-primary-blue group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Community</h3>
                <p className="text-xs text-text-secondary">Section-based academic hub</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-secondary group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/ai-assistant" className="glass-card p-6 flex items-center justify-between group hover:border-primary-blue/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-blue/10 flex items-center justify-center text-primary-blue group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">AI Assistant</h3>
                <p className="text-xs text-text-secondary">Personal study companion</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-secondary group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-blue" />
              Trending in Connect
            </h2>
            <Link to="/connect" className="text-xs text-primary-blue hover:underline">View Feed</Link>
          </div>
          <div className="space-y-4">
            {posts.slice(0, 3).map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-red" />
            Upcoming Assignments
          </h2>
          <div className="space-y-3">
            {[
              { title: 'DBMS Normalization', subject: 'DBMS', due: 'Tomorrow' },
              { title: 'OS Process Scheduling', subject: 'OS', due: 'In 3 days' },
              { title: 'DSA Graph Algorithms', subject: 'DSA', due: 'Next Week' },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-xl border border-border flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                <div>
                  <h4 className="text-sm font-medium">{item.title}</h4>
                  <p className="text-[10px] text-text-secondary uppercase tracking-wider">{item.subject}</p>
                </div>
                <span className="text-[10px] font-bold text-primary-red uppercase">{item.due}</span>
              </div>
            ))}
          </div>
          <button className="w-full btn-secondary text-xs py-2">View All Assignments</button>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary-blue" />
            AI Recommendation
          </h2>
          <div className="p-4 bg-primary-blue/5 rounded-xl border border-primary-blue/10 space-y-2">
            <p className="text-sm italic text-text-primary">"Based on your recent activity, I suggest reviewing **B-Trees** for your upcoming DBMS quiz. Would you like a summary?"</p>
            <button className="text-xs font-bold text-primary-blue flex items-center gap-1 hover:underline">
              Start Review <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConnectPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [feedType, setFeedType] = useState<'for-you' | 'following' | 'branch'>('for-you');
  const { user } = useAuth();

  useEffect(() => {
    api.posts.getAll().then(setPosts);
  }, []);

  const handlePost = async () => {
    if (!content.trim()) return;
    try {
      const newPost = await api.posts.create({ content, type: 'social' });
      setPosts([newPost, ...posts]);
      setContent('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass-card p-5 space-y-4">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-blue/20 border border-primary-blue/30 flex items-center justify-center text-primary-blue font-bold overflow-hidden">
            {user?.profile_pic ? (
              <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name.charAt(0)
            )}
          </div>
          <textarea 
            placeholder="What's happening in campus?" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-lg resize-none min-h-[100px]"
          />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <button className="p-2 text-primary-blue hover:bg-primary-blue/10 rounded-full transition-all">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-primary-blue hover:bg-primary-blue/10 rounded-full transition-all">
              <Users className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handlePost}
            disabled={!content.trim()}
            className="btn-primary px-6 py-2 rounded-full disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>

      <div className="flex border-b border-border sticky top-16 bg-background/80 backdrop-blur-md z-10">
        {[
          { id: 'for-you', label: 'For You' },
          { id: 'following', label: 'Following' },
          { id: 'branch', label: 'Branch' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setFeedType(tab.id as any)}
            className={cn(
              "flex-1 py-4 text-sm font-medium transition-all relative",
              feedType === tab.id ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
            {feedType === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-blue rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

const CommunityPage = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    api.subjects.getAll().then(setSubjects);
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-xs font-bold text-primary-blue uppercase tracking-[0.2em]">Academic Community</h2>
        <h1 className="text-3xl font-bold">{user?.branch} – Semester {user?.semester} – Section {user?.section}</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Link 
            key={subject.id} 
            to={`/community/subject/${subject.id}`}
            className="glass-card p-6 space-y-4 group hover:border-primary-blue/30 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary-blue/10 flex items-center justify-center text-primary-blue group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{subject.name}</h3>
              <p className="text-sm text-text-secondary">Branch: {subject.branch} • Sem: {subject.semester}</p>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <div className="text-center flex-1">
                <p className="text-lg font-bold">12</p>
                <p className="text-[10px] text-text-secondary uppercase">Posts</p>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center flex-1">
                <p className="text-lg font-bold">4</p>
                <p className="text-[10px] text-text-secondary uppercase">Assignments</p>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center flex-1">
                <p className="text-lg font-bold">2</p>
                <p className="text-[10px] text-text-secondary uppercase">Quizzes</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const ResourcesPage = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.resources.getAll().then(setResources);
  }, []);

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-primary-blue uppercase tracking-[0.2em]">Resource Archive</h2>
          <h1 className="text-3xl font-bold">Searchable Materials</h1>
        </div>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search by title, subject, or keywords..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all"
          />
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['All', 'PDFs', 'Notes', 'Question Papers', 'Presentations', 'Videos'].map((filter) => (
          <button key={filter} className="px-4 py-2 bg-white/5 border border-border rounded-full text-xs font-medium hover:bg-white/10 transition-all whitespace-nowrap">
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <motion.div 
            key={resource.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 space-y-4 group hover:border-primary-blue/30 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary-red/10 flex items-center justify-center text-primary-red">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-text-secondary hover:text-primary-blue hover:bg-primary-blue/10 rounded-lg transition-all">
                  <Bookmark className="w-4 h-4" />
                </button>
                <button className="p-2 text-text-secondary hover:text-primary-blue hover:bg-primary-blue/10 rounded-lg transition-all">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg group-hover:text-primary-blue transition-colors">{resource.title}</h3>
              <p className="text-xs text-text-secondary line-clamp-2 mt-1">{resource.description}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                  {resource.uploader_name.charAt(0)}
                </div>
                <span className="text-[10px] text-text-secondary">{resource.uploader_name}</span>
              </div>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Sem {resource.semester}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const AIAssistantPage = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, resources?: Resource[] }[]>([
    { role: 'ai', content: "Hello! I'm your SandBox AI Assistant. I can help you with study plans, summaries, academic doubts, and more. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Define tool for searching resources
      const searchResourcesTool = {
        functionDeclarations: [{
          name: "searchResources",
          parameters: {
            type: Type.OBJECT,
            description: "Search for academic resources like notes, papers, and materials.",
            properties: {
              query: {
                type: Type.STRING,
                description: "The search query for resources."
              }
            },
            required: ["query"]
          }
        }]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: "You are SandBox AI, a helpful academic assistant. You help with study plans, summaries, and academic doubts. You have access to a tool called 'searchResources' to find relevant materials in the campus archive. If a user asks about a topic or needs resources, use the tool to find them and then recommend them in your response. Keep your tone professional and structured.",
          tools: [searchResourcesTool]
        }
      });
      
      let finalContent = response.text || "";
      let recommendedResources: Resource[] = [];

      // Check for function calls
      const functionCalls = response.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'searchResources') {
            const { query } = call.args as { query: string };
            const results = await api.resources.search(query);
            recommendedResources = results;
            
            // Send results back to model for final response
            const secondResponse = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: [
                { role: 'user', parts: [{ text: userMsg }] },
                { role: 'model', parts: [{ functionCall: call }] },
                { role: 'user', parts: [{ functionResponse: { name: 'searchResources', response: { results } } }] }
              ],
              config: {
                systemInstruction: "You are SandBox AI. Based on the search results provided, finalize your answer and recommend the most relevant resources found. Mention them by title."
              }
            });
            finalContent = secondResponse.text || "";
          }
        }
      }
      
      setMessages(prev => [...prev, { role: 'ai', content: finalContent, resources: recommendedResources }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col glass-card overflow-hidden">
      <header className="p-6 border-b border-border flex items-center gap-4 bg-white/5">
        <div className="w-12 h-12 rounded-2xl bg-primary-blue/10 flex items-center justify-center text-primary-blue">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">SandBox AI</h1>
          <p className="text-xs text-text-secondary flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Online & Ready to help
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex flex-col gap-2",
              msg.role === 'user' ? "items-end" : "items-start"
            )}
          >
            <div className={cn(
              "flex gap-4 max-w-[80%]",
              msg.role === 'user' ? "flex-row-reverse" : ""
            )}>
              <div className={cn(
                "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center",
                msg.role === 'user' ? "bg-primary-blue text-white" : "bg-white/10 text-primary-blue"
              )}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' ? "bg-primary-blue text-white" : "bg-white/5 border border-border"
              )}>
                <div className="markdown-body">
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            </div>
            {msg.resources && msg.resources.length > 0 && (
              <div className="ml-12 mt-2 space-y-2 w-full max-w-md">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Recommended Resources:</p>
                <div className="grid gap-2">
                  {msg.resources.map(res => (
                    <div key={res.id} className="p-3 bg-white/5 border border-border rounded-xl flex items-center justify-between group hover:border-primary-blue/30 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-primary-red" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{res.title}</p>
                          <p className="text-[10px] text-text-secondary uppercase">Sem {res.semester}</p>
                        </div>
                      </div>
                      <Download className="w-3 h-3 text-text-secondary group-hover:text-primary-blue transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex gap-4 max-w-[80%]">
            <div className="w-8 h-8 rounded-xl bg-white/10 text-primary-blue flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-border flex gap-1">
              <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border bg-white/5">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask me anything about your studies..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full bg-background border border-border rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all"
          />
          <button 
            onClick={handleSend}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary-blue text-white rounded-xl hover:bg-blue-600 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-text-secondary text-center mt-3 uppercase tracking-widest">Powered by Gemini 3 Flash</p>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { id } = useLocation().pathname.split('/').slice(-1)[0] as any;
  const [profile, setProfile] = useState<{ user: User, posts: Post[] } | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    api.profile.get(id).then(setProfile);
  }, [id]);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass-card overflow-hidden">
        <div className="h-48 bg-primary-blue/10 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 rounded-3xl bg-background border-4 border-background overflow-hidden shadow-xl">
              {profile.user.profile_pic ? (
                <img src={profile.user.profile_pic} alt={profile.user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-blue/20 flex items-center justify-center text-primary-blue text-4xl font-bold">
                  {profile.user.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="pt-20 pb-8 px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{profile.user.name}</h1>
            <p className="text-text-secondary">{profile.user.branch} • Semester {profile.user.semester} • Section {profile.user.section}</p>
            <p className="text-sm max-w-lg">{profile.user.bio || "No bio yet."}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {profile.user.interests?.split(',').map(interest => (
                <span key={interest} className="px-3 py-1 bg-white/5 border border-border rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {interest.trim()}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            {currentUser?.id !== profile.user.id && (
              <>
                <button className="btn-primary px-8 rounded-xl">Follow</button>
                <button className="btn-secondary px-8 rounded-xl flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              </>
            )}
            {currentUser?.id === profile.user.id && (
              <button className="btn-secondary px-8 rounded-xl">Edit Profile</button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-border">
            <button className="px-6 py-4 text-sm font-bold border-b-2 border-primary-blue">Posts</button>
            <button className="px-6 py-4 text-sm font-medium text-text-secondary hover:text-text-primary">Resources</button>
            <button className="px-6 py-4 text-sm font-medium text-text-secondary hover:text-text-primary">Likes</button>
          </div>
          <div className="space-y-4">
            {profile.posts.map(post => (
              <PostCard key={post.id} post={{ ...post, name: profile.user.name, branch: profile.user.branch || '', semester: profile.user.semester || 0, profile_pic: profile.user.profile_pic }} />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-bold">Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-border text-center">
                <p className="text-2xl font-bold">1.2k</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest">Followers</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-border text-center">
                <p className="text-2xl font-bold">450</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest">Following</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    api.teacher.getAnalytics().then(setAnalytics);
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-xs font-bold text-primary-red uppercase tracking-[0.2em]">Faculty Control</h2>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Total Students</p>
            <Users className="w-4 h-4 text-primary-blue" />
          </div>
          <p className="text-4xl font-bold">{analytics?.totalStudents || 0}</p>
          <p className="text-xs text-emerald-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12% from last sem
          </p>
        </div>
        <div className="glass-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Avg Attendance</p>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-4xl font-bold">{analytics?.averageAttendance || '0%'}</p>
          <p className="text-xs text-text-secondary">Target: 75%</p>
        </div>
        <div className="glass-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Pending Grading</p>
            <BarChart3 className="w-4 h-4 text-primary-red" />
          </div>
          <p className="text-4xl font-bold">{analytics?.pendingAssignments || 0}</p>
          <p className="text-xs text-primary-red">Due this week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-6 bg-white/5 border border-border rounded-2xl hover:bg-white/10 transition-all text-left space-y-2 group">
              <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center text-primary-blue group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <p className="font-bold">Post Material</p>
              <p className="text-[10px] text-text-secondary uppercase">Upload notes or resources</p>
            </button>
            <button className="p-6 bg-white/5 border border-border rounded-2xl hover:bg-white/10 transition-all text-left space-y-2 group">
              <div className="w-10 h-10 rounded-xl bg-primary-red/10 flex items-center justify-center text-primary-red group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <p className="font-bold">Create Assignment</p>
              <p className="text-[10px] text-text-secondary uppercase">Set deadlines & tasks</p>
            </button>
            <button className="p-6 bg-white/5 border border-border rounded-2xl hover:bg-white/10 transition-all text-left space-y-2 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="font-bold">Mark Attendance</p>
              <p className="text-[10px] text-text-secondary uppercase">Daily section tracking</p>
            </button>
            <button className="p-6 bg-white/5 border border-border rounded-2xl hover:bg-white/10 transition-all text-left space-y-2 group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="font-bold">Faculty Chat</p>
              <p className="text-[10px] text-text-secondary uppercase">Private staff discussion</p>
            </button>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h2 className="text-xl font-bold">Recent Submissions</h2>
          <div className="space-y-4">
            {[
              { name: 'Rahul Sharma', assignment: 'DBMS Normalization', time: '2h ago' },
              { name: 'Priya Patel', assignment: 'DBMS Normalization', time: '3h ago' },
              { name: 'Amit Kumar', assignment: 'OS Scheduling', time: '5h ago' },
              { name: 'Sneha Reddy', assignment: 'OS Scheduling', time: 'Yesterday' },
            ].map((sub, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-blue/20 flex items-center justify-center text-xs font-bold">
                    {sub.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{sub.name}</p>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">{sub.assignment}</p>
                  </div>
                </div>
                <span className="text-[10px] text-text-secondary uppercase font-bold">{sub.time}</span>
              </div>
            ))}
          </div>
          <button className="w-full btn-secondary text-xs py-2">View All Submissions</button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const SubjectPage = () => {
  const { id } = useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'assignments' | 'quizzes' | 'discussions'>('posts');

  useEffect(() => {
    // In a real app, we'd fetch the subject by ID
    api.subjects.getAll().then(subs => {
      const s = subs.find((s: any) => s.id === Number(id));
      setSubject(s);
    });
  }, [id]);

  if (!subject) return null;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-xs font-bold text-primary-blue uppercase tracking-[0.2em]">Subject Hub</h2>
        <h1 className="text-3xl font-bold">{subject.name}</h1>
        <p className="text-sm text-text-secondary">{subject.branch} • Semester {subject.semester}</p>
      </header>

      <div className="flex border-b border-border">
        {[
          { id: 'posts', label: 'Posts' },
          { id: 'assignments', label: 'Assignments' },
          { id: 'quizzes', label: 'Quizzes' },
          { id: 'discussions', label: 'Discussions' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-4 text-sm font-medium transition-all relative",
              activeTab === tab.id ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="subjectTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-blue rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              <div className="glass-card p-5 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold">T</div>
                <div className="flex-1 space-y-3">
                  <textarea placeholder="Share something with the class..." className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none" />
                  <div className="flex justify-end">
                    <button className="btn-primary text-xs px-4 py-2">Post</button>
                  </div>
                </div>
              </div>
              <div className="p-12 text-center glass-card space-y-2">
                <BookOpen className="w-12 h-12 text-text-secondary mx-auto opacity-20" />
                <p className="text-text-secondary">No posts in this subject yet.</p>
              </div>
            </div>
          )}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              {[
                { title: 'Lab Record 1', due: 'Tomorrow', status: 'Pending' },
                { title: 'Assignment 2: Normalization', due: 'Next Week', status: 'Submitted' },
              ].map((item, i) => (
                <div key={i} className="glass-card p-6 flex items-center justify-between group hover:border-primary-blue/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-red/10 flex items-center justify-center text-primary-red">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="text-xs text-text-secondary">Due: {item.due}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                      item.status === 'Submitted' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary-red/10 text-primary-red"
                    )}>
                      {item.status}
                    </span>
                    <button className="btn-secondary text-xs px-4 py-2">View</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'quizzes' && (
            <div className="p-12 text-center glass-card space-y-2">
              <Calendar className="w-12 h-12 text-text-secondary mx-auto opacity-20" />
              <p className="text-text-secondary">No active quizzes.</p>
            </div>
          )}
          {activeTab === 'discussions' && (
            <div className="p-12 text-center glass-card space-y-2">
              <MessageSquare className="w-12 h-12 text-text-secondary mx-auto opacity-20" />
              <p className="text-text-secondary">Start a new discussion thread.</p>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold">Faculty</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-red/10 flex items-center justify-center text-primary-red font-bold">DR</div>
              <div>
                <p className="text-sm font-bold">Dr. Rajesh Kumar</p>
                <p className="text-[10px] text-text-secondary uppercase">Subject Expert</p>
              </div>
            </div>
            <button className="w-full btn-secondary text-xs py-2">Message Faculty</button>
          </div>
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold">Resources</h3>
            <div className="space-y-2">
              {['Syllabus.pdf', 'Lecture_Notes_1.pdf', 'Reference_Books.txt'].map((file, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-text-secondary" />
                    <span className="text-xs">{file}</span>
                  </div>
                  <Download className="w-3 h-3 text-text-secondary" />
                </div>
              ))}
            </div>
            <Link to="/resources" className="block text-center text-xs text-primary-blue hover:underline">View All Resources</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const MessagingPage = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Mock chats
    setChats([
      { id: 2, name: 'Rahul Sharma', lastMsg: 'Hey, did you finish the assignment?', time: '10m ago' },
      { id: 3, name: 'Priya Patel', lastMsg: 'The lecture notes are uploaded.', time: '1h ago' },
    ]);
  }, []);

  useEffect(() => {
    if (activeChat) {
      api.messages.getChat(activeChat.id).then(setMessages);
    }
  }, [activeChat]);

  const handleSend = async () => {
    if (!input.trim() || !activeChat) return;
    try {
      const msg = await api.messages.send({ receiver_id: activeChat.id, content: input });
      setMessages([...messages, msg]);
      setInput('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex glass-card overflow-hidden">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map(chat => (
            <button 
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={cn(
                "w-full p-4 rounded-xl flex items-center gap-3 transition-all text-left",
                activeChat?.id === chat.id ? "bg-primary-blue/10 border border-primary-blue/20" : "hover:bg-white/5"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold">
                {chat.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold truncate">{chat.name}</p>
                  <span className="text-[10px] text-text-secondary">{chat.time}</span>
                </div>
                <p className="text-xs text-text-secondary truncate">{chat.lastMsg}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <header className="p-6 border-b border-border flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold">
                  {activeChat.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{activeChat.name}</p>
                  <p className="text-[10px] text-emerald-500 uppercase font-bold">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-xl transition-all">
                  <Users className="w-5 h-5" />
                </button>
                <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-xl transition-all">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex",
                  msg.sender_id === user?.id ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[70%] p-3 rounded-2xl text-sm",
                    msg.sender_id === user?.id ? "bg-primary-blue text-white" : "bg-white/5 border border-border"
                  )}>
                    {msg.content}
                    <p className={cn(
                      "text-[8px] mt-1 uppercase font-bold",
                      msg.sender_id === user?.id ? "text-white/60" : "text-text-secondary"
                    )}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-border bg-white/5">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-background border border-border rounded-2xl py-3 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary-blue hover:bg-primary-blue/10 rounded-xl transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-text-secondary">
              <MessageSquare className="w-10 h-10 opacity-20" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Your Messages</h3>
              <p className="text-sm text-text-secondary">Select a chat to start messaging your campus peers.</p>
            </div>
            <button className="btn-primary rounded-xl px-8">New Message</button>
          </div>
        )}
      </div>
    </div>
  );
};

const StudyGroupsPage = () => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', subject_id: '', branch: 'CSE' });
  const { user } = useAuth();

  useEffect(() => {
    api.studyGroups.getAll().then(setGroups);
    api.subjects.getAll().then(setSubjects);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const group = await api.studyGroups.create({
        ...newGroup,
        subject_id: newGroup.subject_id ? Number(newGroup.subject_id) : undefined
      });
      setGroups([group, ...groups]);
      setIsModalOpen(false);
      setNewGroup({ name: '', description: '', subject_id: '', branch: 'CSE' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (id: number) => {
    try {
      await api.studyGroups.join(id);
      api.studyGroups.getAll().then(setGroups);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-primary-blue uppercase tracking-[0.2em]">Collaboration</h2>
          <h1 className="text-3xl font-bold">Study Groups</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 rounded-xl"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <motion.div 
            key={group.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-4 group hover:border-primary-blue/30 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-primary-blue/10 flex items-center justify-center text-primary-blue">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                <Users className="w-3 h-3" />
                {group.member_count} Members
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold group-hover:text-primary-blue transition-colors">{group.name}</h3>
              <p className="text-xs text-text-secondary line-clamp-2 mt-1">{group.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-white/5 border border-border rounded-md text-[10px] font-bold text-text-secondary uppercase">
                {group.branch}
              </span>
              {group.subject_name && (
                <span className="px-2 py-1 bg-primary-blue/5 border border-primary-blue/10 rounded-md text-[10px] font-bold text-primary-blue uppercase">
                  {group.subject_name}
                </span>
              )}
            </div>
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                  {group.creator_name.charAt(0)}
                </div>
                <span className="text-[10px] text-text-secondary">By {group.creator_name}</span>
              </div>
              <Link to={`/study-groups/${group.id}`} className="btn-secondary text-xs px-4 py-1.5 rounded-lg">
                View Group
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card p-8 space-y-6"
            >
              <h2 className="text-2xl font-bold">Create Study Group</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Group Name</label>
                  <input 
                    type="text" 
                    required
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    className="w-full bg-white/5 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Description</label>
                  <textarea 
                    required
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    className="w-full bg-white/5 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Branch</label>
                    <select 
                      value={newGroup.branch}
                      onChange={(e) => setNewGroup({ ...newGroup, branch: e.target.value })}
                      className="w-full bg-white/5 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Subject (Optional)</label>
                    <select 
                      value={newGroup.subject_id}
                      onChange={(e) => setNewGroup({ ...newGroup, subject_id: e.target.value })}
                      className="w-full bg-white/5 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                    >
                      <option value="">None</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary py-3 rounded-xl">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary py-3 rounded-xl">Create</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StudyGroupDetailPage = () => {
  const { id } = useParams();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'resources' | 'members'>('chat');
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    api.studyGroups.getAll().then(groups => {
      const g = groups.find((g: any) => g.id === Number(id));
      setGroup(g);
    });
    api.studyGroups.getMessages(Number(id)).then(setMessages);
    api.studyGroups.getResources(Number(id)).then(setResources);
  }, [id]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      const msg = await api.studyGroups.sendMessage(Number(id), input);
      setMessages([...messages, msg]);
      setInput('');
    } catch (err) {
      console.error(err);
    }
  };

  if (!group) return null;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col glass-card overflow-hidden">
      <header className="p-6 border-b border-border flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-blue/10 flex items-center justify-center text-primary-blue">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{group.name}</h1>
            <p className="text-xs text-text-secondary">{group.branch} {group.subject_name ? `• ${group.subject_name}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", activeTab === 'chat' ? "bg-primary-blue text-white" : "text-text-secondary hover:bg-white/5")}
          >
            Chat
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", activeTab === 'resources' ? "bg-primary-blue text-white" : "text-text-secondary hover:bg-white/5")}
          >
            Resources
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", activeTab === 'members' ? "bg-primary-blue text-white" : "text-text-secondary hover:bg-white/5")}
          >
            Members
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex gap-3",
                  msg.user_id === user?.id ? "flex-row-reverse" : ""
                )}>
                  <div className="w-8 h-8 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold text-xs overflow-hidden flex-shrink-0">
                    {msg.profile_pic ? <img src={msg.profile_pic} className="w-full h-full object-cover" /> : msg.name.charAt(0)}
                  </div>
                  <div className={cn(
                    "max-w-[70%] p-3 rounded-2xl text-sm",
                    msg.user_id === user?.id ? "bg-primary-blue text-white" : "bg-white/5 border border-border"
                  )}>
                    {msg.user_id !== user?.id && <p className="text-[10px] font-bold mb-1 opacity-60">{msg.name}</p>}
                    {msg.content}
                    <p className={cn("text-[8px] mt-1 opacity-60", msg.user_id === user?.id ? "text-right" : "")}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-border bg-white/5">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Message the group..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-background border border-border rounded-2xl py-3 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary-blue hover:bg-primary-blue/10 rounded-xl transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'resources' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Shared Resources</h2>
              <button className="btn-secondary text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Resource
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map(res => (
                <div key={res.id} className="p-4 bg-white/5 border border-border rounded-2xl flex items-center justify-between group hover:border-primary-blue/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-red/10 flex items-center justify-center text-primary-red">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{res.title}</h4>
                      <p className="text-[10px] text-text-secondary uppercase">By {res.uploader_name}</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-text-secondary group-hover:text-primary-blue transition-colors cursor-pointer" />
                </div>
              ))}
              {resources.length === 0 && (
                <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-2xl">
                  <BookOpen className="w-12 h-12 text-text-secondary mx-auto opacity-20 mb-2" />
                  <p className="text-text-secondary text-sm">No resources shared in this group yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <h2 className="font-bold">Group Members ({group.member_count})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(group.member_count)].map((_, i) => (
                <div key={i} className="p-4 bg-white/5 border border-border rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold">
                    {i === 0 ? group.creator_name.charAt(0) : 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{i === 0 ? group.creator_name : `Student ${i + 1}`}</p>
                    <p className="text-[10px] text-text-secondary uppercase">{i === 0 ? 'Admin' : 'Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <Layout><HomePage /></Layout> : <Navigate to="/login" />} />
      <Route path="/connect" element={user ? <Layout><ConnectPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/community" element={user ? <Layout><CommunityPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/community/subject/:id" element={user ? <Layout><SubjectPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/study-groups" element={user ? <Layout><StudyGroupsPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/study-groups/:id" element={user ? <Layout><StudyGroupDetailPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/resources" element={user ? <Layout><ResourcesPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/ai-assistant" element={user ? <Layout><AIAssistantPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/messages" element={user ? <Layout><MessagingPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/profile/:id" element={user ? <Layout><ProfilePage /></Layout> : <Navigate to="/login" />} />
      <Route path="/teacher-dashboard" element={user?.role === 'teacher' ? <Layout><TeacherDashboard /></Layout> : <Navigate to="/" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
