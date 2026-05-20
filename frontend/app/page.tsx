"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, LayoutDashboard, Ticket, MessageSquare, Send, Bot, User, Sparkles, Clock, AlertTriangle, CheckCircle, FileText, Lock, ShieldCheck, LogOut } from 'lucide-react';

interface LiveTicket {
  id: string;
  title: string;
  priority: string;
  status: string;
}

export default function Home() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'EMPLOYEE' | null>(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets' | 'dashboard'>('chat');
  
  // Core Application States
  const [tickets, setTickets] = useState<LiveTicket[]>([]);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your OpsMind IT Support Agent. You can now chat natively or upload raw .txt system log files using the file icon below for automated AI root-cause analysis!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll database records automatically
  const fetchLiveTickets = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/tickets');
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Database connection dropped:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLiveTickets();
      const interval = setInterval(fetchLiveTickets, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mock Authentication Triggers
  const handleLogin = (role: 'ADMIN' | 'EMPLOYEE') => {
    setUserRole(role);
    setIsAuthenticated(true);
    // If login is Employee, default them straight to the permitted Chat terminal
    if (role === 'EMPLOYEE') {
      setActiveTab('chat');
    } else {
      setActiveTab('dashboard'); // Admins land on telemetry monitor
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8080/api/chat?message=${encodeURIComponent(userMessage)}`);
      if (!response.ok) throw new Error('Backend error');
      
      const data = await response.text();
      setMessages((prev) => [...prev, { role: 'assistant', content: data }]);
      fetchLiveTickets();
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: '❌ System Error: Communication breakdown with Spring Boot core configuration.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.log') && !file.name.endsWith('.txt')) {
      alert("Please upload only standard text (.txt) or system log (.log) files.");
      return;
    }

    const reader = new FileReader();
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: `📁 Uploaded system log file for audit: "${file.name}"` }]);

    reader.onload = async (event) => {
      const textContent = event.target?.result as string;
      try {
        const response = await fetch(`http://localhost:8080/api/chat/analyze-log?logContent=${encodeURIComponent(textContent)}`);
        if (!response.ok) throw new Error("Parser exception");
        
        const aiAnalysis = await response.text();
        setMessages((prev) => [...prev, { role: 'assistant', content: aiAnalysis }]);
      } catch (err) {
        console.error(err);
        setMessages((prev) => [...prev, { role: 'assistant', content: "❌ System Error: Unable to stream file log stream matrix to local LLM." }]);
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const triggerResolve = async (id: string) => {
    try {
      await fetch(`http://localhost:8080/api/tickets/resolve?id=${id}`);
      fetchLiveTickets();
    } catch (err) { console.error(err); }
  };

  const triggerEscalate = async (id: string) => {
    try {
      await fetch(`http://localhost:8080/api/tickets/escalate?id=${id}`);
      fetchLiveTickets();
    } catch (err) { console.error(err); }
  };

  // 🚪 RENDER GATEWAY 1: MOCK AUTHENTICATION FORM SCREEN
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 font-sans relative overflow-hidden select-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
        
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-xl z-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-xl shadow-blue-500/20">
              <Lock size={32} />
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-2xl tracking-wide bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">OpsMind Access Gateway</h1>
            <p className="text-xs text-slate-400 font-medium mt-1.5">Select your enterprise role parameter to instantiate runtime control session.</p>
          </div>

          <div className="space-y-3 pt-4">
            <button 
              onClick={() => handleLogin('ADMIN')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-3 shadow-lg shadow-blue-500/10 border border-blue-400/10"
            >
              <ShieldCheck size={18} />
              Login as Admin (Amirullah)
            </button>
            
            <button 
              onClick={() => handleLogin('EMPLOYEE')}
              className="w-full bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-semibold py-4 px-6 rounded-xl transition border border-slate-700/60 cursor-pointer flex items-center justify-center gap-3"
            >
              <User size={18} />
              Login as Corporate Employee
            </button>
          </div>
          
          <p className="text-[10px] font-mono text-slate-500">Security Node Architecture: Session State Volatile Context</p>
        </div>
      </div>
    );
  }

  // 🎛️ RENDER GATEWAY 2: CORE APPLICATION DASHBOARD (SECURED VIA CURRENT ACTIVE ROLE STATE)
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans select-none">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-20">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-500/20"><Terminal size={20} /></div>
            <div>
              <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">OpsMind AI</h1>
              <p className="text-xs text-slate-400 font-medium tracking-tight">{userRole === 'ADMIN' ? '🛡️ Admin Suite' : '👥 Staff Portal'}</p>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            {/* ROLE PROTECTION: ONLY ADMIN CAN VIEW TELEMETRY AND GLOBAL METRICS */}
            {userRole === 'ADMIN' && (
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}><LayoutDashboard size={18} />Dashboard Overview</button>
            )}
            
            <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition ${activeTab === 'chat' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}><MessageSquare size={18} />AI Support Agent</button>
            
            {/* ROLE PROTECTION: ONLY ADMIN CAN VIEW DATASTORE INSTANCES GRID */}
            {userRole === 'ADMIN' && (
              <button onClick={() => setActiveTab('tickets')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition ${activeTab === 'tickets' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}><Ticket size={18} />Support Tickets ({tickets.length})</button>
            )}
          </nav>
        </div>

        {/* FOOTER CONTROLLER WITH INTEGRATED LOGOUT TRIGGER */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 z-30 relative space-y-2">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0 ${userRole === 'ADMIN' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-slate-700'}`}>
                {userRole === 'ADMIN' ? 'A' : 'E'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{userRole === 'ADMIN' ? 'Amirullah' : 'Corporate User'}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Active</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              title="Terminate Secure Session"
              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800/50 transition cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN SCREEN MAP CONTAINER */}
      <main className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-400" />
            <span className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
              {activeTab === 'chat' && 'Llama3 AI Chat & Log RAG Engine'}
              {activeTab === 'tickets' && 'MongoDB Live Ticket Datastore'}
              {activeTab === 'dashboard' && 'Enterprise System Telemetry'}
            </span>
          </div>
          <div className="text-xs bg-slate-800 px-3 py-1.5 rounded-full font-mono text-slate-400 border border-slate-700/60">host://localhost:8080</div>
        </header>

        {/* TAB VIEW 1: AI SUPPORT CHAT TERMINAL (SHARED) */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            <section className="flex-1 overflow-y-auto p-8 space-y-6 z-10">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-4 max-w-4xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-blue-400 border-slate-800'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-300 border border-slate-800 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 max-w-4xl mr-auto">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-900 text-blue-400 border border-slate-800"><Bot size={16} /></div>
                  <div className="bg-slate-900 text-slate-400 border border-slate-800 px-6 py-4 rounded-2xl rounded-tl-none text-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </section>

            <footer className="p-6 border-t border-slate-800 bg-slate-900/30 backdrop-blur-md z-10">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3 items-center">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.log" className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  title="Upload system log file (.txt, .log)"
                  className="bg-slate-900 text-slate-400 hover:text-blue-400 border border-slate-800 p-4 rounded-xl flex items-center justify-center transition focus:outline-none hover:border-blue-500/30 disabled:opacity-30 cursor-pointer shadow-md"
                >
                  <FileText size={18} />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about profiles, report issues, or attach systemic crash logs..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl flex items-center justify-center transition shadow-md disabled:opacity-40 cursor-pointer">
                  <Send size={16} />
                </button>
              </form>
            </footer>
          </div>
        )}

        {/* TAB VIEW 2: TICKET DATASTORE (RESTRICTED TO ADMIN ONLY) */}
        {activeTab === 'tickets' && userRole === 'ADMIN' && (
          <div className="flex-1 p-8 overflow-y-auto z-10 max-w-6xl w-full mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-100">Active Trouble Tickets</h2>
                <p className="text-xs text-slate-400">Manage cluster data nodes in real time. Actions seamlessly push modifications to MongoDB.</p>
              </div>
              <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-mono font-medium">db.tickets.find()</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Ticket ID</th>
                    <th className="py-4 px-6">Issue Context</th>
                    <th className="py-4 px-6 text-center">Priority</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Database Mod Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {tickets.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-xs text-slate-500 font-mono">No documents found inside tickets collection.</td></tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 font-mono text-xs font-bold text-blue-400">{ticket.id}</td>
                        <td className="py-4 px-6 truncate max-w-xs font-medium text-slate-200">{ticket.title}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ticket.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}><AlertTriangle size={12} />{ticket.priority}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}><Clock size={12} className={ticket.status === 'OPEN' ? 'animate-pulse' : ''} />{ticket.status}</span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          {ticket.status === 'OPEN' && (
                            <>
                              {ticket.priority !== 'CRITICAL' && <button onClick={() => triggerEscalate(ticket.id)} className="px-2.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-md transition cursor-pointer">Escalate</button>}
                              <button onClick={() => triggerResolve(ticket.id)} className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition cursor-pointer">Resolve</button>
                            </>
                          )}
                          {ticket.status === 'RESOLVED' && <span className="text-xs text-slate-500 font-mono italic px-2">Archived</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB VIEW 3: LIVE ANALYTICS MONITOR (RESTRICTED TO ADMIN ONLY) */}
        {activeTab === 'dashboard' && userRole === 'ADMIN' && (
          <div className="flex-1 p-8 overflow-y-auto z-10 max-w-6xl w-full mx-auto space-y-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100">System Performance Metrics</h2>
              <p className="text-xs text-slate-400">Real-time status tracking across connected application nodes and localized database instances.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Logged Tickets</p><p className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">{tickets.length}</p><p className="text-[11px] text-blue-400 mt-2 font-medium">Persisted inside cluster storage</p></div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Open Issues</p><p className="text-3xl font-extrabold text-red-400 mt-2 font-mono">{tickets.filter(t => t.status === 'OPEN').length}</p><p className="text-[11px] text-slate-400 mt-2 font-medium">Requires rapid hardware staging</p></div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resolved Documents</p><p className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">{tickets.filter(t => t.status === 'RESOLVED').length}</p><p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-medium"><CheckCircle size={12} /> Optimization Node Synced</p></div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Infrastructure Topology Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/60"><span className="text-sm font-medium font-mono text-slate-300">Client UI Layer (Next.js Node)</span><span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold font-mono">PORT 3000 // ONLINE</span></div>
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/60"><span className="text-sm font-medium font-mono text-slate-300">Application Orchestrator (Spring Core)</span><span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold font-mono">PORT 8080 // ONLINE</span></div>
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/60"><span className="text-sm font-medium font-mono text-slate-300">NoSQL Datastore Core (MongoDB Node)</span><span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold font-mono">PORT 27017 // ONLINE</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}