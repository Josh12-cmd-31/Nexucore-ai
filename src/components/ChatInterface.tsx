import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon, Loader2, Sparkles, Brain, BookOpen, Microscope, Megaphone, PenTool, Terminal, User, Plus, MessageSquare, Trash2, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateNexuCoreResponse } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import D3Visualizer from './D3Visualizer';

interface Message {
  role: 'user' | 'model';
  text: string;
  files?: { name: string; type: string; url: string }[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  mode: string;
  persona: 'user' | 'developer';
  timestamp: number;
}

interface FileData {
  name: string;
  type: string;
  data: string; // base64
  url: string;
}

const MODES = [
  { id: 'general', name: 'General', icon: Brain, color: 'text-zinc-400' },
  { id: 'creative', name: 'Creative', icon: PenTool, color: 'text-purple-400' },
  { id: 'analysis', name: 'Analysis', icon: FileText, color: 'text-blue-400' },
  { id: 'marketing', name: 'Marketing', icon: Megaphone, color: 'text-orange-400' },
  { id: 'academic', name: 'Academic', icon: BookOpen, color: 'text-emerald-400' },
  { id: 'scientific', name: 'Scientific', icon: Microscope, color: 'text-cyan-400' },
];

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello, I am NexuCore AI. What would you like to create, analyze, or strategize today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([]);
  const [activeMode, setActiveMode] = useState('general');
  const [persona, setPersona] = useState<'user' | 'developer'>('user');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nexucore_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
      } catch (e) {
        console.error('Failed to parse conversations', e);
      }
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('nexucore_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Update current conversation when messages change
  useEffect(() => {
    if (currentConversationId) {
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? { ...conv, messages, mode: activeMode, persona, timestamp: Date.now() } 
          : conv
      ));
    }
  }, [messages, activeMode, persona, currentConversationId]);

  const createNewChat = () => {
    setCurrentConversationId(null);
    setMessages([
      { role: 'model', text: "Hello, I am NexuCore AI. What would you like to create, analyze, or strategize today?" }
    ]);
    setActiveMode('general');
    setPersona('user');
    setIsSidebarOpen(false);
  };

  const loadConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentConversationId(conv.id);
      setMessages(conv.messages);
      setActiveMode(conv.mode);
      setPersona(conv.persona);
      setIsSidebarOpen(false);
    }
  };

  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      createNewChat();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          data: base64,
          url: URL.createObjectURL(file)
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: input,
      files: attachedFiles.map(f => ({ name: f.name, type: f.type, url: f.url }))
    };

    let newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    // If it's a new conversation, create it
    if (!currentConversationId) {
      const newId = Date.now().toString();
      const newConv: Conversation = {
        id: newId,
        title: input.substring(0, 30) || 'New Conversation',
        messages: newMessages,
        mode: activeMode,
        persona: persona,
        timestamp: Date.now()
      };
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newId);
    }

    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const filesForApi = attachedFiles.map(f => ({
        mimeType: f.type,
        data: f.data
      }));

      setAttachedFiles([]);
      
      const response = await generateNexuCoreResponse(input, history, filesForApi, activeMode, persona);
      
      setMessages(prev => [...prev, {
        role: 'model',
        text: response.text || "I'm sorry, I couldn't generate a response."
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "An error occurred while communicating with NexuCore AI. Please check your API key and try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (text: string) => {
    const d3Regex = /```json-d3\n([\s\S]*?)\n```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = d3Regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <div key={`text-${lastIndex}`} className="markdown-body prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{text.substring(lastIndex, match.index)}</ReactMarkdown>
          </div>
        );
      }

      // Add the visualization
      try {
        const config = JSON.parse(match[1]);
        parts.push(<D3Visualizer key={`d3-${match.index}`} config={config} />);
      } catch (e) {
        console.error('Failed to parse D3 config', e);
        parts.push(
          <div key={`error-${match.index}`} className="text-red-400 text-xs p-2 bg-red-900/20 rounded-lg border border-red-800/50 my-2">
            Failed to render visualization: Invalid JSON
          </div>
        );
      }

      lastIndex = d3Regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <div key={`text-${lastIndex}`} className="markdown-body prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{text.substring(lastIndex)}</ReactMarkdown>
        </div>
      );
    }

    return parts;
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-zinc-100 font-sans overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed md:relative w-64 h-full border-r border-zinc-800/50 bg-[#0D0D0D] flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">NexuCore <span className="text-emerald-500">AI</span></h1>
          </div>
        </div>
        
        <div className="p-4">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-all border border-zinc-700/50 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <div className="px-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">History</span>
            </div>
            <div className="space-y-1">
              {conversations.length === 0 ? (
                <p className="px-2 text-xs text-zinc-600 italic">No previous chats</p>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                      currentConversationId === conv.id 
                        ? 'bg-zinc-800 text-white' 
                        : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium truncate flex-1">{conv.title}</span>
                    <button
                      onClick={(e) => deleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="px-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Specialized Modes</span>
            </div>
            <div className="space-y-1">
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    activeMode === mode.id 
                    ? 'bg-zinc-800/50 text-white shadow-sm' 
                    : 'text-zinc-500 hover:bg-zinc-800/30 hover:text-zinc-300'
                  }`}
                >
                  <mode.icon className={`w-4 h-4 ${activeMode === mode.id ? mode.color : 'group-hover:text-zinc-300'}`} />
                  <span className="text-sm font-medium">{mode.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
            <p className="text-xs text-zinc-400 leading-relaxed">
              NexuCore is operating at <span className="text-emerald-500 font-mono">99.8%</span> efficiency.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-6 bg-[#0A0A0A]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              <button
                onClick={() => setPersona('user')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  persona === 'user' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <User className="w-3 h-3" />
                User
              </button>
              <button
                onClick={() => setPersona('developer')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  persona === 'developer' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Terminal className="w-3 h-3" />
                Developer
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={createNewChat}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all text-xs font-medium"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest hidden md:inline">v2.5.0-flash</span>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className={`flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth flex flex-col ${messages.length === 1 ? 'justify-center' : ''}`}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  msg.role === 'user' 
                    ? 'justify-end' 
                    : (messages.length === 1 ? 'justify-center' : 'justify-start')
                }`}
              >
                <div className={`${
                  messages.length === 1 && msg.role === 'model' 
                    ? 'max-w-2xl text-center space-y-6' 
                    : 'max-w-[85%] md:max-w-[70%] space-y-2'
                }`}>
                  {msg.files && msg.files.length > 0 && (
                    <div className={`flex flex-wrap gap-2 mb-2 ${messages.length === 1 ? 'justify-center' : ''}`}>
                      {msg.files.map((file, fi) => (
                        <div key={fi} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
                          {file.type.startsWith('image/') ? (
                            <img src={file.url} className="w-10 h-10 rounded object-cover" alt="" />
                          ) : (
                            <FileText className="w-5 h-5 text-zinc-500" />
                          )}
                          <span className="text-xs text-zinc-400 truncate max-w-[100px]">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {messages.length === 1 && msg.role === 'model' && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mx-auto mb-8 shadow-2xl shadow-emerald-500/10"
                    >
                      <Sparkles className="w-10 h-10 text-emerald-500" />
                    </motion.div>
                  )}

                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'user' 
                    ? (persona === 'developer' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20')
                    : (messages.length === 1 
                        ? 'bg-transparent border-none text-zinc-100 text-3xl font-bold tracking-tight' 
                        : 'bg-zinc-900 border border-zinc-800/50 text-zinc-200')
                  }`}>
                    {renderMessageContent(msg.text)}
                  </div>
                  
                  <div className={`flex items-center gap-2 px-1 ${
                    msg.role === 'user' || messages.length === 1 ? 'justify-center' : 'justify-start'
                  } ${messages.length === 1 ? 'mt-4' : ''}`}>
                    <span className={`text-[10px] font-mono uppercase tracking-tighter ${
                      messages.length === 1 ? 'text-zinc-500' : 'text-zinc-600'
                    }`}>
                      {msg.role === 'user' ? (persona === 'developer' ? 'Dev Access' : 'Authorized User') : 'NexuCore AI'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-zinc-900 border border-zinc-800/50 p-4 rounded-2xl flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                <span className="text-sm text-zinc-400 font-medium">NexuCore is processing...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-[#0A0A0A] to-transparent">
          <div className="max-w-4xl mx-auto">
            {/* File Previews */}
            <AnimatePresence>
              {attachedFiles.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-wrap gap-2 mb-4 p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800/50"
                >
                  {attachedFiles.map((file, i) => (
                    <div key={i} className="relative group">
                      <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center gap-2 pr-8">
                        {file.type.startsWith('image/') ? (
                          <img src={file.url} className="w-8 h-8 rounded object-cover" alt="" />
                        ) : (
                          <FileText className="w-4 h-4 text-zinc-400" />
                        )}
                        <span className="text-xs text-zinc-300 truncate max-w-[120px]">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => removeFile(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-700 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <form 
              onSubmit={handleSubmit}
              className="relative group"
            >
              <div className={`absolute inset-0 blur-xl transition-all duration-500 rounded-full ${
                persona === 'developer' ? 'bg-indigo-500/5 group-focus-within:bg-indigo-500/10' : 'bg-emerald-500/5 group-focus-within:bg-emerald-500/10'
              }`} />
              <div className={`relative flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 pl-4 rounded-2xl shadow-2xl transition-all duration-300 ${
                persona === 'developer' ? 'group-focus-within:border-indigo-500/30' : 'group-focus-within:border-emerald-500/30'
              }`}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 text-zinc-500 transition-colors rounded-xl hover:bg-zinc-800 ${
                    persona === 'developer' ? 'hover:text-indigo-500' : 'hover:text-emerald-500'
                  }`}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    persona === 'developer' 
                      ? "Request technical analysis or code..." 
                      : activeMode === 'creative'
                      ? "Enter a title for a song or poem..."
                      : "Ask NexuCore anything..."
                  }
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 placeholder:text-zinc-600"
                />
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
                  className={`p-3 rounded-xl transition-all duration-200 shadow-lg ${
                    persona === 'developer' 
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20' 
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                  } disabled:opacity-50`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
            <p className="text-[10px] text-zinc-600 text-center mt-4 uppercase tracking-[0.2em] font-bold">
              Secure Neural Link Established • End-to-End Encryption Active
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
