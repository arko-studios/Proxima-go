import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, LayoutDashboard, Ticket, Settings, Bell, Plus, CheckCircle2, Clock, X, Send, ChevronRight,
  Users, LogOut, UserPlus, Trash2, TrendingUp, Activity, Archive, AlertCircle, Lock, ArrowRight,
  Check, MoreHorizontal, Filter, ListFilter, Loader2, Shield, CheckCheck
} from 'lucide-react';

// --- CONFIGURATION ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LOGO_URL = "https://github.com/arko-studios/Nightcore-Studio-lite/blob/main/logo%20for%20nightcore.png?raw=true";

// Theme Gradient classes
const GRADIENT_TEXT = "bg-clip-text text-transparent bg-gradient-to-r from-[#F347EE] to-[#FFF566]"; 
const GRADIENT_BG = "bg-gradient-to-r from-[#F347EE] to-[#FFF566]";
const BTN_GRADIENT = "bg-gradient-to-r from-[#F347EE] to-[#FCD34D] hover:from-[#d636d2] hover:to-[#FCD34D]";

const TICKET_TYPES = ['Incident', 'Outage', 'Bug', 'Issue', 'Feature Request'];
const TICKET_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed', 'Upcoming', 'Planned'];
const CATEGORIES = ['Getting Started', 'Apps', 'Account Settings', 'Billing', 'Interface', 'Trust & Safety', 'Server Setup'];
const USER_ROLES = ['Helper', 'Admin'];

// --- SUB-COMPONENTS ---

const Logo = ({ size = "sm" }) => {
  const dim = size === "lg" ? "w-16 h-16" : "w-8 h-8";
  return (
    <img src={LOGO_URL} alt="Logo" className={`${dim} object-contain drop-shadow-md`} />
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-full flex items-center space-x-4 px-6 py-4 transition-all duration-200 group relative
      ${active ? 'text-[#F347EE] font-bold bg-pink-50' : 'text-gray-500 hover:text-[#F347EE] hover:bg-gray-50'}
    `}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F347EE] rounded-r-full" />}
    <Icon className={`w-5 h-5 ${active ? 'stroke-[#F347EE]' : ''}`} strokeWidth={active ? 2.5 : 2} />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const Badge = ({ text }) => {
  const styles = {
    'Critical': 'bg-red-100 text-red-700 border-red-200',
    'High': 'bg-orange-100 text-orange-700 border-orange-200',
    'Medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Low': 'bg-green-100 text-green-700 border-green-200',
    'Open': 'bg-blue-100 text-blue-700 border-blue-200',
    'In Progress': 'bg-purple-100 text-purple-700 border-purple-200',
    'Resolved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Closed': 'bg-gray-100 text-gray-600 border-gray-200 line-through',
    'Upcoming': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Planned': 'bg-pink-100 text-pink-700 border-pink-200',
    'Outage': 'bg-red-50 text-red-600 border-transparent',
    'Bug': 'bg-amber-50 text-amber-600 border-transparent',
    'Incident': 'bg-slate-50 text-slate-600 border-transparent',
    'Issue': 'bg-indigo-50 text-indigo-600 border-transparent',
  };
  
  const className = styles[text] || 'bg-gray-100 text-gray-600 border-gray-200';
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${className}`}>
      {text}
    </span>
  );
};

const StatsCard = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
      <p className="text-xs text-gray-400 mt-2">{subtext}</p>
    </div>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} text-white shadow-lg shadow-gray-200`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

// --- MAIN APPLICATION ---

export default function ProximaGoApp() {
  // --- SUPABASE STATE ---
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- APP STATE ---
  const [activeTab, setActiveTab] = useState('home');
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // UI States - Unified Menu System
  const [activeMenu, setActiveMenu] = useState(null); 
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  
  // Forms
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTicket, setNewTicket] = useState({
    title: '',
    type: 'Incident',
    category: 'Apps',
    priority: 'Medium',
    description: ''
  });
  
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'Helper' });
  const [newComment, setNewComment] = useState('');

  // --- INITIALIZATION ---

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) initData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        initData(session.user.id);
      } else {
        setProfile(null);
        setTickets([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Global Click Listener for Menu Closing
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.menu-container') && !event.target.closest('.menu-trigger')) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initData = async (userId) => {
    setLoading(true);
    await Promise.all([fetchProfile(userId), fetchTickets(), fetchNotifications(userId)]);
    setLoading(false);
  };

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const fetchTickets = async () => {
    const { data, error } = await supabase.from('tickets').select('*, comments(*)').order('created_at', { ascending: false });
    if (!error) setTickets(data || []);
  };

  const fetchNotifications = async (userId) => {
    // Only fetch notifications for THIS user
    const { data } = await supabase.from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  // --- PERMISSIONS ---
  // "Helpers should be able to edit tickets as well, but not create accounts"
  const isAdmin = profile?.role === 'Admin';
  const isStaff = ['Admin', 'Helper'].includes(profile?.role);
  
  // Capabilities
  const canManageUsers = isAdmin; 
  const canManageTickets = isStaff; // Edit status, Create tickets
  const canDeleteTickets = isAdmin; // Usually safer to keep delete restricted to Admin

  // --- HANDLERS ---

  // Auth
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: authForm.email,
      password: authForm.password
    });
    setIsSubmitting(false);
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveTab('home');
    setActiveMenu(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!canManageUsers) return;

    setIsSubmitting(true);
    
    const { data, error } = await supabase.auth.signUp({
      email: newUserForm.email,
      password: newUserForm.password,
      options: { 
        data: { 
          name: newUserForm.name,
          role: newUserForm.role 
        } 
      }
    });

    if (error) {
      alert("Error: " + error.message);
      setIsSubmitting(false);
    } else {
      alert(`Account created for ${newUserForm.name}. NOTE: You have been switched to this new account.`);
      setShowAddUserModal(false);
      setNewUserForm({ name: '', email: '', password: '', role: 'Helper' });
      window.location.reload(); 
    }
  };

  // Tickets
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 1. Create Ticket
    const { data, error } = await supabase.from('tickets').insert([{
      ...newTicket,
      created_by: session.user.id,
      status: 'Open'
    }]).select();

    if (!error && data) {
      const createdTicket = data[0];
      setTickets([createdTicket, ...tickets]);
      setShowCreateModal(false);
      setNewTicket({ title: '', type: 'Incident', category: 'Apps', priority: 'Medium', description: '' });
      setActiveTab('tickets');

      // 2. BROADCAST NOTIFICATIONS
      // Fetch ALL profiles to send notifications to everyone
      const { data: allProfiles } = await supabase.from('profiles').select('id');
      
      if (allProfiles && allProfiles.length > 0) {
        const notificationsToInsert = allProfiles.map(user => ({
          user_id: user.id,
          ticket_id: createdTicket.id,
          text: `New Ticket: ${createdTicket.title}`,
          is_read: false
        }));

        await supabase.from('notifications').insert(notificationsToInsert);
        
        // Optimistically update current user's feed
        const myNotif = notificationsToInsert.find(n => n.user_id === session.user.id);
        if (myNotif) {
             // We need the ID for keying, but optimistic updates usually lack ID.
             // We'll just fetch fresh to be safe or mock it.
             fetchNotifications(session.user.id);
        }
      }

    } else {
      alert(error?.message);
    }
    setIsSubmitting(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;
    const { data, error } = await supabase.from('comments').insert([{
      ticket_id: selectedTicket.id,
      user_name: profile?.username || 'Unknown',
      text: newComment
    }]).select();

    if (!error && data) {
      const updatedTicket = { ...selectedTicket, comments: [...(selectedTicket.comments || []), data[0]] };
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setNewComment('');
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', ticketId);
    if (!error) {
      const updatedTickets = tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t);
      setTickets(updatedTickets);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      setActiveMenu(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmationId) return;
    const { error } = await supabase.from('tickets').delete().eq('id', deleteConfirmationId);
    if (!error) {
      setTickets(tickets.filter(t => t.id !== deleteConfirmationId));
      if (selectedTicket?.id === deleteConfirmationId) {
        setSelectedTicket(null);
        setActiveTab('tickets');
      }
      setDeleteConfirmationId(null);
    }
  };

  const handleNotificationClick = async (notif) => {
    // 1. Mark as read
    if (!notif.is_read) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }

    // 2. Navigate to ticket if linked
    if (notif.ticket_id) {
        const ticket = tickets.find(t => t.id === notif.ticket_id);
        if (ticket) {
            setSelectedTicket(ticket);
            setActiveTab('detail');
        } else {
            const { data } = await supabase.from('tickets').select('*, comments(*)').eq('id', notif.ticket_id).single();
            if (data) {
                setSelectedTicket(data);
                setActiveTab('detail');
            }
        }
    }
    setActiveMenu(null);
  };

  const handleClearAllNotifications = async () => {
    if (!session?.user?.id) return;
    
    // Update all unread notifications for THIS user to read
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  // --- HELPERS ---

  const toggleMenu = (e, menuName) => {
    e.stopPropagation();
    setActiveMenu(prev => prev === menuName ? null : menuName);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const stats = useMemo(() => ({
    total: tickets.length,
    resolved: tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length,
    active: tickets.filter(t => ['Open', 'In Progress'].includes(t.status)).length,
    upcoming: tickets.filter(t => ['Upcoming', 'Planned'].includes(t.status)).length
  }), [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchCat = filterCategory ? t.category === filterCategory : true;
      const matchStatus = filterStatus ? t.status === filterStatus : true;
      return matchCat && matchStatus;
    });
  }, [tickets, filterCategory, filterStatus]);

  const getProfileInitials = () => {
    const name = profile?.username || session?.user?.email;
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // --- RENDERERS ---

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F9FD]">
        <Loader2 className="w-8 h-8 animate-spin text-[#F347EE]" />
      </div>
    );
  }

  // LOGIN SCREEN
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD] font-sans p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border border-white relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#F347EE] to-[#FFF566]"></div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 p-4 bg-gray-50 rounded-3xl shadow-inner">
               <Logo size="lg" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Proxima<span className={GRADIENT_TEXT}>Go</span></h1>
            <p className="text-gray-400 mt-2">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {authError && (
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {authError}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input 
                  type="email" 
                  value={authForm.email}
                  onChange={e => setAuthForm({...authForm, email: e.target.value})}
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-[#F347EE] outline-none transition-all"
                  placeholder="admin@proxima.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input 
                  type="password" 
                  value={authForm.password}
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-[#F347EE] outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full ${BTN_GRADIENT} text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-200 transition-transform active:scale-95 flex items-center justify-center gap-2`}
            >
               {isSubmitting ? <Loader2 className="animate-spin" /> : 'Sign In'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          
          <p className="text-center text-xs text-gray-300 mt-8">
            Internal System. Authorized Personnel Only.
          </p>
        </div>
      </div>
    );
  }

  // --- INTERNAL VIEWS ---

  const renderHome = () => (
    <div className="animate-fade-in max-w-2xl mx-auto pt-20 text-center">
      <div className="w-24 h-24 bg-white rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-pink-100 mb-8 rotate-3 transition-transform hover:rotate-6 border border-gray-50">
        <Logo size="lg" />
      </div>
      <h1 className="text-6xl font-black text-gray-900 mb-6 tracking-tight">
        Proxima<span className={GRADIENT_TEXT}>Go</span>
      </h1>
      <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-lg mx-auto">
        Let's get things moving. Streamlined ticket management platform for the Proxima services.
      </p>
      
      {canManageTickets ? (
        <button 
          onClick={() => setShowCreateModal(true)}
          className={`bg-gray-900 hover:bg-black text-white text-lg font-bold px-10 py-4 rounded-2xl transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center gap-3 mx-auto`}
        >
          <Plus className="w-5 h-5" /> Start a Ticket
        </button>
      ) : (
        <div className="bg-pink-50 text-pink-800 px-6 py-4 rounded-xl inline-flex items-center gap-2 border border-pink-100">
          <AlertCircle className="w-5 h-5" />
          <span>Read-Only Mode</span>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500">Real-time metrics for {new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Tickets" 
          value={stats.total} 
          icon={Ticket} 
          color="bg-[#F347EE]" 
          subtext="All time volume"
        />
        <StatsCard 
          title="Resolved" 
          value={stats.resolved} 
          icon={CheckCircle2} 
          color="bg-emerald-500" 
          subtext={`${stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(0) : 0}% completion rate`}
        />
        <StatsCard 
          title="Active Issues" 
          value={stats.active} 
          icon={Activity} 
          color="bg-[#FCD34D]" 
          subtext="Requires attention"
        />
        <StatsCard 
          title="Upcoming" 
          value={stats.upcoming} 
          icon={TrendingUp} 
          color="bg-cyan-500" 
          subtext="Scheduled items"
        />
      </div>

      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Analysis</h3>
        <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200 text-gray-400">
          Analytics Graph Placeholder (Data Visualization)
        </div>
      </div>
    </div>
  );

  const renderTicketList = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 min-h-[600px] flex flex-col animate-fade-in">
      <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Tickets</h2>
          <p className="text-gray-500 text-sm mt-1">Track issues and feature requests</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="relative">
             <button 
               onClick={(e) => toggleMenu(e, 'filter-category')}
               className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors menu-trigger ${filterCategory ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
             >
               <Filter className="w-4 h-4" /> 
               {filterCategory || 'Category'}
             </button>
             {activeMenu === 'filter-category' && (
               <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-xl rounded-xl border border-gray-100 p-1 z-20 animate-in fade-in zoom-in-95 menu-container">
                 {CATEGORIES.map(c => (
                   <button 
                     key={c}
                     onClick={() => { setFilterCategory(c); setActiveMenu(null); }}
                     className={`block w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${filterCategory === c ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                   >
                     {c}
                     {filterCategory === c && <Check className="w-3 h-3" />}
                   </button>
                 ))}
               </div>
             )}
          </div>

          {/* Status Filter */}
          <div className="relative">
             <button 
               onClick={(e) => toggleMenu(e, 'filter-status')}
               className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors menu-trigger ${filterStatus ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
             >
               <ListFilter className="w-4 h-4" /> 
               {filterStatus || 'Status'}
             </button>
             {activeMenu === 'filter-status' && (
               <div className="absolute right-0 top-full mt-2 w-40 bg-white shadow-xl rounded-xl border border-gray-100 p-1 z-20 animate-in fade-in zoom-in-95 menu-container">
                 {TICKET_STATUSES.map(s => (
                   <button 
                     key={s}
                     onClick={() => { setFilterStatus(s); setActiveMenu(null); }}
                     className={`block w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${filterStatus === s ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                   >
                     {s}
                     {filterStatus === s && <Check className="w-3 h-3" />}
                   </button>
                 ))}
               </div>
             )}
          </div>

          {(filterCategory || filterStatus) && (
            <button 
              onClick={() => { setFilterCategory(null); setFilterStatus(null); }}
              className="text-xs text-gray-400 hover:text-red-500 font-bold px-2"
            >
              Clear
            </button>
          )}

          <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>

          {canManageTickets && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className={`flex items-center gap-2 text-white ${BTN_GRADIENT} px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md shadow-pink-100`}
            >
              <Plus className="w-4 h-4" /> New Ticket
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
            <p>No tickets found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredTickets.map((ticket) => (
              <div 
                key={ticket.id}
                onClick={() => { setSelectedTicket(ticket); setActiveTab('detail'); }}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group flex items-start gap-4"
              >
                <div className={`w-2 h-2 mt-2.5 rounded-full 
                  ${['Open', 'In Progress'].includes(ticket.status) ? 'bg-[#F347EE]' : 
                    ['Resolved', 'Closed'].includes(ticket.status) ? 'bg-emerald-500' : 
                    'bg-cyan-500'}`} 
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 group-hover:text-[#F347EE] transition-colors">
                      {ticket.title}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">#{ticket.id}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1 mb-3">{ticket.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge text={ticket.status} />
                    <Badge text={ticket.type} />
                    <Badge text={ticket.priority} />
                    <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#F347EE] self-center" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTicketDetail = () => {
    if (!selectedTicket) return null;

    return (
      <div className="flex flex-col h-full animate-fade-in">
        <button 
          onClick={() => setActiveTab('tickets')}
          className="text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-2 w-fit font-medium text-sm"
        >
          &larr; Back to Tickets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{selectedTicket.title}</h1>
                    <span className="text-sm text-gray-400 font-mono">#{selectedTicket.id}</span>
                  </div>
                  <div className="flex gap-2">
                     <Badge text={selectedTicket.status} />
                     <Badge text={selectedTicket.priority} />
                  </div>
                </div>
                
                {canManageTickets && (
                  <div className="flex gap-2 relative">
                    <div className="relative">
                       <button 
                         onClick={(e) => toggleMenu(e, 'status')}
                         className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 transition-colors flex items-center gap-2 menu-trigger"
                       >
                         Update Status <MoreHorizontal className="w-3 h-3" />
                       </button>
                       
                       {activeMenu === 'status' && (
                         <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl rounded-xl border border-gray-100 p-1 z-20 animate-in fade-in zoom-in-95 duration-100 menu-container">
                           {TICKET_STATUSES.map(s => (
                             <button 
                                key={s} 
                                onClick={() => handleStatusChange(selectedTicket.id, s)}
                                className={`block w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${selectedTicket.status === s ? 'bg-pink-50 text-[#F347EE] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                             >
                               {s}
                               {selectedTicket.status === s && <Check className="w-3 h-3" />}
                             </button>
                           ))}
                         </div>
                       )}
                    </div>

                    {canDeleteTickets && (
                      <button 
                        onClick={() => setDeleteConfirmationId(selectedTicket.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-xs font-bold border border-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="prose prose-blue max-w-none">
                <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  {selectedTicket.description}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Activity</h3>
              
              <div className="space-y-6 mb-8">
                {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                  <p className="text-gray-400 text-sm italic">No comments yet.</p>
                ) : (
                  selectedTicket.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0 uppercase">
                        {comment.user_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-sm">{comment.user_name}</span>
                          <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-gray-700 text-sm bg-gray-50 px-4 py-3 rounded-2xl rounded-tl-none inline-block border border-gray-100">
                          {comment.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-3 items-end">
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Reply as ${profile?.username}...`}
                  className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 focus:ring-2 focus:ring-[#F347EE] focus:bg-white outline-none resize-none text-sm min-h-[80px]"
                />
                <button 
                  onClick={handleAddComment}
                  className={`${BTN_GRADIENT} text-white p-4 rounded-2xl transition-all shadow-lg shadow-pink-200 active:scale-95`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-wider">Ticket Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Category</span>
                  <span className="font-medium text-gray-900">{selectedTicket.category}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Type</span>
                  <span className="font-medium text-gray-900">{selectedTicket.type}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Created</span>
                  <span className="font-medium text-gray-900">{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold mb-6">General Preferences</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Email Notifications</div>
              <div className="text-sm text-gray-500">Receive daily summaries</div>
            </div>
            <div className={`w-12 h-6 ${GRADIENT_BG} rounded-full relative cursor-pointer`}>
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-red-600">Danger Zone</h3>
        <button className="text-red-600 border border-red-200 bg-red-50 px-6 py-3 rounded-xl font-medium text-sm hover:bg-red-100 w-full text-left flex items-center justify-between">
           Archive all resolved tickets
           <Archive className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FD] font-sans text-slate-800 overflow-hidden selection:bg-pink-100">
      
      {/* Sidebar */}
      <aside className="w-72 bg-white h-full flex flex-col py-8 border-r border-gray-100 hidden md:flex shrink-0 z-20">
        <div className="px-8 mb-12 flex items-center gap-3">
          <Logo />
          <span className="text-xl font-bold tracking-tight">Proxima<span className={GRADIENT_TEXT}>Go</span></span>
        </div>

        <div className="flex-1 space-y-2 px-4">
          <SidebarItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Ticket} label="My Tickets" active={activeTab === 'tickets' || activeTab === 'detail'} onClick={() => setActiveTab('tickets')} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>

        <div className="px-8 mt-auto">
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-[#F8F9FD] shrink-0 z-40">
          <div className="md:hidden flex items-center gap-3">
             <Logo />
             <span className="font-bold text-lg">Proxima<span className={GRADIENT_TEXT}>Go</span></span>
          </div>
          
          <div className="ml-auto flex items-center gap-6">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={(e) => toggleMenu(e, 'notifications')}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors menu-trigger"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#F8F9FD]"></span>
                )}
              </button>
              
              {activeMenu === 'notifications' && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 menu-container">
                  <div className="flex justify-between items-center mb-3 px-2">
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                           <>
                              <button onClick={handleClearAllNotifications} className="text-xs text-gray-400 hover:text-[#F347EE] font-bold flex items-center gap-1 transition-colors">
                                <CheckCheck className="w-3 h-3" /> Clear All
                              </button>
                              <span className="text-xs text-[#F347EE] font-bold">New Updates</span>
                           </>
                        )}
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? <p className="text-sm text-gray-400 px-2">No new updates.</p> : 
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 rounded-xl transition-colors cursor-pointer flex items-start gap-3 ${n.is_read ? 'bg-gray-50' : 'bg-pink-50'}`}
                        >
                           <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-[#F347EE]'}`} />
                           <div>
                             <p className={`text-sm ${n.is_read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>{n.text}</p>
                             <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleTimeString()}</p>
                           </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative">
              <button 
                onClick={(e) => toggleMenu(e, 'user')}
                className="flex items-center gap-3 pl-6 border-l border-gray-200 hover:opacity-80 transition-opacity menu-trigger"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-gray-900">{profile?.username}</div>
                  <div className="text-xs text-gray-500">{profile?.role}</div>
                </div>
                {/* Updated Profile Icon - Now shows Initial */}
                <div className={`w-10 h-10 rounded-full ${profile?.avatarColor || 'bg-[#F347EE]'} overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-white font-bold`}>
                  {getProfileInitials()}
                </div>
              </button>

              {/* User Dropdown */}
              {activeMenu === 'user' && (
                <div className="absolute right-0 top-full mt-4 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 menu-container">
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Account Actions</div>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                     <LogOut className="w-4 h-4" /> Sign Out
                  </button>

                  {canManageUsers && (
                    <>
                      <div className="border-t border-gray-100 my-2"></div>
                      <button 
                        onClick={() => { setShowAddUserModal(true); setActiveMenu(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" /> Create Account
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full pt-4">
            {activeTab === 'home' && renderHome()}
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'tickets' && renderTicketList()}
            {activeTab === 'detail' && renderTicketDetail()}
            {activeTab === 'settings' && renderSettings()}
          </div>
        </div>
      </main>

      {/* Modals & Overlays */}
      
      {/* Delete Confirmation Overlay */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Ticket?</h3>
              <p className="text-center text-gray-500 mb-6">This action cannot be undone. Are you sure you want to proceed?</p>
              <div className="flex gap-3">
                 <button onClick={() => setDeleteConfirmationId(null)} className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                 <button onClick={confirmDelete} className="flex-1 py-3 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200">Delete</button>
              </div>
           </div>
        </div>
      )}

      {/* Internal Create Account Modal */}
      {showAddUserModal && canManageUsers && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
             <button onClick={() => setShowAddUserModal(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
             <h2 className="text-xl font-bold text-gray-900 mb-4">Add Account</h2>
             
             <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4 flex gap-2">
               <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
               <p className="text-xs text-orange-700">Creating a new account will sign you out and sign the new user in immediately.</p>
             </div>

             <form onSubmit={handleCreateUser} className="space-y-4">
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                 <input required type="text" value={newUserForm.name} onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})} className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#F347EE]" />
               </div>
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                 <input required type="email" value={newUserForm.email} onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})} className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#F347EE]" />
               </div>
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                 <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select 
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                      className="w-full bg-gray-50 border-gray-100 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#F347EE] appearance-none"
                    >
                      {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                 <input required type="password" value={newUserForm.password} onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#F347EE]" />
               </div>
               
               <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white font-bold py-3 rounded-xl mt-2 hover:bg-gray-800 transition-colors">
                  {isSubmitting ? 'Creating...' : 'Create & Switch'}
               </button>
             </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && canManageTickets && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input required type="text" value={newTicket.title} onChange={(e) => setNewTicket({...newTicket, title: e.target.value})} className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F347EE] outline-none" placeholder="What's wrong?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select value={newTicket.type} onChange={(e) => setNewTicket({...newTicket, type: e.target.value})} className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F347EE] outline-none">
                    {TICKET_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select value={newTicket.priority} onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})} className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F347EE] outline-none">
                    {TICKET_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select value={newTicket.category} onChange={(e) => setNewTicket({...newTicket, category: e.target.value})} className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F347EE] outline-none">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea required value={newTicket.description} onChange={(e) => setNewTicket({...newTicket, description: e.target.value})} className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F347EE] outline-none min-h-[100px] resize-none" placeholder="Details..." />
              </div>
              <button type="submit" disabled={isSubmitting} className={`w-full ${BTN_GRADIENT} text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-200 transition-all mt-4`}>{isSubmitting ? 'Saving...' : 'Submit Ticket'}</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E2E8F0; border-radius: 20px; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}