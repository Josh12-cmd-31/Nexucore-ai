import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Paperclip, X, FileText, Image as ImageIcon, Loader2, Sparkles, Brain, BookOpen, Microscope, Megaphone, PenTool, Terminal, User, Plus, MessageSquare, Trash2, Menu, Download, Wand2, Type as TypeIcon, Globe, Palette, Layout, Monitor, Eye, Edit2, Check, Code, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
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
  { id: 'image', name: 'Image Gen', icon: ImageIcon, color: 'text-pink-400', beta: true },
  { id: 'ui', name: 'UI Sandbox', icon: Monitor, color: 'text-indigo-400' },
  { id: 'analysis', name: 'Analysis', icon: FileText, color: 'text-blue-400' },
  { id: 'marketing', name: 'Marketing', icon: Megaphone, color: 'text-orange-400' },
  { id: 'academic', name: 'Academic', icon: BookOpen, color: 'text-emerald-400' },
  { id: 'scientific', name: 'Scientific', icon: Microscope, color: 'text-cyan-400' },
];

export default function ChatInterface({ initialPersona = 'user' }: { initialPersona?: 'user' | 'developer' }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "hi ,what can I help you with?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([]);
  const [activeMode, setActiveMode] = useState('general');
  const [persona, setPersona] = useState<'user' | 'developer'>(initialPersona);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [intent, setIntent] = useState<'text' | 'image'>('text');
  const [aspectRatio, setAspectRatio] = useState('1:1');

  // Sync persona state with prop
  useEffect(() => {
    setPersona(initialPersona);
  }, [initialPersona]);
  
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const [isStudioMode, setIsStudioMode] = useState(false);
  const [studioCode, setStudioCode] = useState('');
  const [studioView, setStudioView] = useState<'preview' | 'code'>('preview');
  const [systemInstruction, setSystemInstruction] = useState('You are an expert UI/UX Engineer. Create clean, modern, and responsive designs using HTML and Tailwind CSS.');
  
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
      { role: 'model', text: "hi ,what can I help you with?" }
    ]);
    setActiveMode('general');
    // Keep current persona
    setIsSidebarOpen(false);
  };

  const loadConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      if (conv.persona !== persona) {
        navigate(conv.persona === 'developer' ? '/developer' : '/');
      }
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

  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      setConversations([]);
      localStorage.removeItem('nexucore_conversations');
      createNewChat();
    }
  };

  const startRenaming = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const saveRename = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    setConversations(prev => prev.map(c => 
      c.id === id ? { ...c, title: editTitle.trim() } : c
    ));
    setEditingId(null);
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
      
      // Use intent if it's set to image, otherwise use activeMode
      const effectiveMode = intent === 'image' ? 'image' : activeMode;
      
      // If in studio mode, provide the current code as context
      const studioContext = isStudioMode && studioCode 
        ? `\n\nCURRENT STUDIO CODE:\n\`\`\`html\n${studioCode}\n\`\`\`\n\nPlease refer to this code when making changes.`
        : "";
      
      const customSystemInstruction = isStudioMode ? systemInstruction : undefined;

      const response = await generateNexuCoreResponse(
        input + studioContext, 
        history, 
        filesForApi, 
        effectiveMode, 
        persona,
        effectiveMode === 'image' ? { aspectRatio } : undefined,
        customSystemInstruction
      );
      
      const responseText = response.text || "";
      const responseFiles: { name: string; type: string; url: string }[] = [];

      // Auto-update studio code if in studio mode and AI returns new code
      if (isStudioMode && responseText.includes('```html-preview')) {
        const matches = [...responseText.matchAll(/```html-preview\n([\s\S]*?)\n```/g)];
        if (matches.length > 0) {
          // Take the last match as it's likely the most updated version
          setStudioCode(matches[matches.length - 1][1]);
        }
      }

      // Extract images from response parts
      if (response.candidates?.[0]?.content?.parts) {
        response.candidates[0].content.parts.forEach((part, index) => {
          if (part.inlineData) {
            const base64 = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            const url = `data:${mimeType};base64,${base64}`;
            responseFiles.push({
              name: `generated-image-${index}.png`,
              type: mimeType,
              url: url
            });
          }
        });
      }

      setMessages(prev => [...prev, {
        role: 'model',
        text: responseText || (responseFiles.length > 0 ? "" : "I'm sorry, I couldn't generate a response."),
        files: responseFiles.length > 0 ? responseFiles : undefined
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
    const htmlRegex = /```html-preview\n([\s\S]*?)\n```/g;
    
    const elements: { index: number; content: React.ReactNode }[] = [];
    
    // Process D3 matches
    let match;
    while ((match = d3Regex.exec(text)) !== null) {
      try {
        const config = JSON.parse(match[1]);
        elements.push({
          index: match.index,
          content: <D3Visualizer key={`d3-${match.index}`} config={config} />
        });
      } catch (e) {
        elements.push({
          index: match.index,
          content: (
            <div key={`error-d3-${match.index}`} className="text-red-400 text-xs p-2 bg-red-900/20 rounded-lg border border-red-800/50 my-2">
              Failed to render visualization: Invalid JSON
            </div>
          )
        });
      }
    }

    // Process HTML Preview matches
    htmlRegex.lastIndex = 0;
    while ((match = htmlRegex.exec(text)) !== null) {
      const htmlCode = match[1];
      elements.push({
        index: match.index,
        content: (
          <div key={`html-${match.index}`} className="relative group my-4">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={() => {
                  setStudioCode(htmlCode);
                  setIsStudioMode(true);
                  setStudioView('preview');
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-lg hover:bg-indigo-500 transition-all"
              >
                <Code className="w-3 h-3" />
                Open in Studio
              </button>
              <button
                onClick={() => setPreviewHtml(htmlCode)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs font-bold shadow-lg hover:bg-zinc-700 transition-all border border-zinc-700"
              >
                <Eye className="w-3 h-3" />
                Quick View
              </button>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs overflow-x-auto text-zinc-400">
              <pre><code>{htmlCode.trim()}</code></pre>
            </div>
          </div>
        )
      });
    }

    // Sort elements by index
    elements.sort((a, b) => a.index - b.index);

    const parts = [];
    let lastIndex = 0;

    for (const el of elements) {
      // Add text before the element
      if (el.index > lastIndex) {
        parts.push(
          <div key={`text-${lastIndex}`} className="markdown-body prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{text.substring(lastIndex, el.index)}</ReactMarkdown>
          </div>
        );
      }
      parts.push(el.content);
      
      // Find the end of the match to update lastIndex
      // We need to know which regex matched to find the length
      const d3Match = text.substring(el.index).match(/```json-d3\n[\s\S]*?\n```/);
      const htmlMatch = text.substring(el.index).match(/```html-preview\n[\s\S]*?\n```/);
      
      if (d3Match && text.indexOf(d3Match[0], el.index) === el.index) {
        lastIndex = el.index + d3Match[0].length;
      } else if (htmlMatch && text.indexOf(htmlMatch[0], el.index) === el.index) {
        lastIndex = el.index + htmlMatch[0].length;
      }
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
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors duration-500 ${
              persona === 'developer' 
                ? 'bg-indigo-500/10 border-indigo-500/20' 
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <Sparkles className={`w-5 h-5 transition-colors duration-500 ${
                persona === 'developer' ? 'text-indigo-500' : 'text-emerald-500'
              }`} />
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-lg tracking-tight leading-none">NexuCore <span className={persona === 'developer' ? 'text-indigo-500' : 'text-emerald-500'}>AI</span></h1>
              <span className={`text-[8px] font-bold uppercase tracking-[0.2em] mt-1 ${
                persona === 'developer' ? 'text-indigo-400' : 'text-emerald-400'
              }`}>
                {persona === 'developer' ? 'Developer Engine' : 'Strategic Intelligence'}
              </span>
            </div>
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
            <div className="px-2 mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">History</span>
              {conversations.length > 0 && (
                <button 
                  onClick={clearAllHistory}
                  className="text-[10px] font-bold uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors"
                >
                  Clear All
                </button>
              )}
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
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveRename(e, conv.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-zinc-900 text-white text-xs px-1.5 py-0.5 rounded border border-emerald-500/50 w-full focus:outline-none"
                        />
                        <button
                          onClick={(e) => saveRename(e, conv.id)}
                          className="p-1 text-emerald-500 hover:text-emerald-400"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-medium truncate flex-1">{conv.title}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => startRenaming(e, conv.id, conv.title)}
                            className="p-1 hover:text-emerald-400 transition-all"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => deleteConversation(e, conv.id)}
                            className="p-1 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    activeMode === mode.id 
                    ? 'bg-zinc-800/50 text-white shadow-sm' 
                    : 'text-zinc-500 hover:bg-zinc-800/30 hover:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <mode.icon className={`w-4 h-4 ${activeMode === mode.id ? mode.color : 'group-hover:text-zinc-300'}`} />
                    <span className="text-sm font-medium">{mode.name}</span>
                  </div>
                  {mode.id === 'image' && (
                    <span className="text-[8px] font-bold uppercase tracking-tighter bg-pink-500/10 text-pink-500 px-1.5 py-0.5 rounded border border-pink-500/20">
                      Beta
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {persona === 'developer' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="pt-4 border-t border-zinc-800/50"
            >
              <div className="px-2 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Dev Toolbox</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setIsStudioMode(true)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all text-xs font-medium border border-transparent hover:border-indigo-500/20"
                >
                  <Code className="w-4 h-4" />
                  Open Studio
                </button>
                <button 
                  onClick={() => { setInput("Design a modern web application for..."); setIntent('text'); setPersona('developer'); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all text-xs font-medium border border-transparent hover:border-indigo-500/20"
                >
                  <Globe className="w-4 h-4" />
                  Web App Architect
                </button>
                <button 
                  onClick={() => { setInput("Design a professional logo for..."); setIntent('image'); setPersona('developer'); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all text-xs font-medium border border-transparent hover:border-indigo-500/20"
                >
                  <Palette className="w-4 h-4" />
                  Logo Designer
                </button>
                <button 
                  onClick={() => { setInput("Create a full application structure for..."); setIntent('text'); setPersona('developer'); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all text-xs font-medium border border-transparent hover:border-indigo-500/20"
                >
                  <Layout className="w-4 h-4" />
                  App Engineer
                </button>
                <button 
                  onClick={() => { setInput("Create a UI preview for a dashboard using Tailwind CSS..."); setIntent('text'); setActiveMode('ui'); setPersona('developer'); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all text-xs font-medium border border-transparent hover:border-indigo-500/20"
                >
                  <Monitor className="w-4 h-4" />
                  UI Previewer
                </button>
              </div>
            </motion.div>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <div className={`p-4 rounded-2xl bg-zinc-900/50 border transition-colors duration-500 ${
            persona === 'developer' ? 'border-indigo-500/20' : 'border-zinc-800/50'
          }`}>
            <p className="text-xs text-zinc-400 leading-relaxed">
              NexuCore is operating at <span className={`${persona === 'developer' ? 'text-indigo-500' : 'text-emerald-500'} font-mono`}>99.8%</span> efficiency.
            </p>
          </div>
        </div>
      </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${
            persona === 'developer' ? 'bg-indigo-600' : 'bg-emerald-600'
          }`} />
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
                onClick={() => navigate('/')}
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
                onClick={() => navigate('/developer')}
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border transition-all text-xs font-medium ${
                persona === 'developer' 
                  ? 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10' 
                  : 'border-zinc-800 text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/50'
              }`}
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest hidden md:inline">v2.5.0-flash</span>
            {persona === 'developer' && (
              <button
                onClick={() => setIsStudioMode(!isStudioMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${
                  isStudioMode 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50'
                }`}
              >
                <Layout className="w-4 h-4" />
                Studio
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Messages & Input Container */}
          <div className={`flex flex-col transition-all duration-500 ${isStudioMode ? 'w-1/2 border-r border-zinc-800' : 'w-full'}`}>
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
                        <div key={fi} className={`${
                          msg.role === 'model' && file.type.startsWith('image/') 
                          ? 'w-full' 
                          : 'p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2'
                        }`}>
                          {file.type.startsWith('image/') ? (
                            <div className={msg.role === 'model' ? 'space-y-2' : 'flex items-center gap-2'}>
                              <img 
                                src={file.url} 
                                className={`${msg.role === 'model' ? 'w-full h-auto rounded-2xl shadow-2xl border border-zinc-800' : 'w-10 h-10 rounded object-cover'}`} 
                                alt="" 
                              />
                              {msg.role === 'model' && (
                                <div className="flex justify-end">
                                  <a 
                                    href={file.url} 
                                    download={file.name}
                                    className="text-[10px] text-zinc-500 hover:text-emerald-500 flex items-center gap-1 transition-colors"
                                  >
                                    <Download className="w-3 h-3" />
                                    Download
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-zinc-500" />
                              <span className="text-xs text-zinc-400 truncate max-w-[100px]">{file.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {messages.length === 1 && msg.role === 'model' && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className={`w-20 h-20 rounded-3xl flex items-center justify-center border mx-auto mb-8 shadow-2xl transition-all duration-500 ${
                        persona === 'developer' 
                          ? 'bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/10' 
                          : 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10'
                      }`}
                    >
                      <Sparkles className={`w-10 h-10 transition-colors duration-500 ${
                        persona === 'developer' ? 'text-indigo-500' : 'text-emerald-500'
                      }`} />
                    </motion.div>
                  )}

                  <div className={`p-4 rounded-2xl transition-all duration-500 ${
                    msg.role === 'user' 
                    ? (persona === 'developer' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20')
                    : (messages.length === 1 
                        ? 'bg-transparent border-none text-zinc-100 text-3xl font-bold tracking-tight' 
                        : `bg-zinc-900 border text-zinc-200 ${persona === 'developer' ? 'border-indigo-500/10' : 'border-zinc-800/50'}`)
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className={`max-w-[85%] md:max-w-[70%] p-6 rounded-3xl border backdrop-blur-sm shadow-2xl transition-all duration-500 ${
                intent === 'image' || activeMode === 'image'
                ? 'bg-pink-500/5 border-pink-500/20 shadow-pink-500/5'
                : 'bg-zinc-900/50 border-zinc-800/50 shadow-black/40'
              }`}>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={`absolute inset-0 blur-lg animate-pulse rounded-full ${
                      intent === 'image' || activeMode === 'image' ? 'bg-pink-500/20' : 'bg-emerald-500/20'
                    }`} />
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center border animate-bounce ${
                      intent === 'image' || activeMode === 'image' 
                      ? 'bg-pink-500/10 border-pink-500/20 text-pink-500' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    }`}>
                      {intent === 'image' || activeMode === 'image' ? (
                        <ImageIcon className="w-6 h-6" />
                      ) : (
                        <Brain className="w-6 h-6" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold tracking-tight ${
                        intent === 'image' || activeMode === 'image' ? 'text-pink-400' : 'text-emerald-400'
                      }`}>
                        {intent === 'image' || activeMode === 'image' ? 'Synthesizing Visuals' : 'Processing Intelligence'}
                      </span>
                      <div className="flex gap-1">
                        <motion.div 
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                          className={`w-1 h-1 rounded-full ${intent === 'image' || activeMode === 'image' ? 'bg-pink-500' : 'bg-emerald-500'}`}
                        />
                        <motion.div 
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                          className={`w-1 h-1 rounded-full ${intent === 'image' || activeMode === 'image' ? 'bg-pink-500' : 'bg-emerald-500'}`}
                        />
                        <motion.div 
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                          className={`w-1 h-1 rounded-full ${intent === 'image' || activeMode === 'image' ? 'bg-pink-500' : 'bg-emerald-500'}`}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">
                      {intent === 'image' || activeMode === 'image' 
                        ? "NexuCore is rendering your visual request..." 
                        : "Analyzing neural patterns and generating response..."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-[#0A0A0A] to-transparent">
          <div className="max-w-4xl mx-auto">
            {/* Image Mode Alert & Config */}
            <AnimatePresence>
              {(activeMode === 'image' || intent === 'image') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-4 space-y-3"
                >
                  <div className="p-2 bg-pink-500/5 border border-pink-500/20 rounded-xl flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3 text-pink-500" />
                    <span className="text-[10px] font-medium text-pink-400 uppercase tracking-wider">
                      Image Generation is currently under development
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-2">Aspect Ratio:</span>
                    {['1:1', '3:4', '4:3', '9:16', '16:9'].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          aspectRatio === ratio
                          ? 'bg-pink-500/20 border-pink-500/40 text-pink-400 shadow-lg shadow-pink-500/10'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Previews */}
            <AnimatePresence>
              {attachedFiles.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="flex flex-wrap gap-3 mb-4 p-4 bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/50 shadow-2xl"
                >
                  {attachedFiles.map((file, i) => (
                    <motion.div 
                      key={i}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3 pr-10 shadow-lg group-hover:border-emerald-500/30 transition-all">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center border border-zinc-700">
                          {file.type.startsWith('image/') ? (
                            <img src={file.url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <FileText className="w-5 h-5 text-zinc-500" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-zinc-200 truncate max-w-[120px]">{file.name}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">{file.type.split('/')[1] || 'file'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all border border-zinc-700 group-hover:border-red-500/30"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
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
              <div className={`relative flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl border p-2 pl-4 rounded-2xl shadow-2xl transition-all duration-300 ${
                persona === 'developer' ? 'border-zinc-800 group-focus-within:border-indigo-500/30' : 'border-zinc-800 group-focus-within:border-emerald-500/30'
              }`}>
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-500 pointer-events-none ${
                  persona === 'developer' ? 'bg-indigo-500/5' : 'bg-emerald-500/5'
                }`} />
                <button
                  type="button"
                  onClick={() => setIntent(prev => prev === 'text' ? 'image' : 'text')}
                  className={`p-2 transition-all rounded-xl hover:bg-zinc-800 flex items-center gap-2 ${
                    intent === 'image' ? 'text-pink-500 bg-pink-500/10' : 'text-zinc-500'
                  }`}
                  title={intent === 'image' ? "Switch to Text Mode" : "Switch to Image Mode"}
                >
                  {intent === 'image' ? <Wand2 className="w-5 h-5" /> : <TypeIcon className="w-5 h-5" />}
                </button>
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
                      ? "Enter system command or code request..." 
                      : intent === 'image'
                      ? "Describe an image to generate or edit..."
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
      </div>

      {/* Studio Panel */}
          <AnimatePresence>
            {isStudioMode && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-1/2 flex flex-col bg-[#0D0D0D] border-l border-zinc-800 z-20"
              >
                {/* Studio Header */}
                <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50">
                  <div className="flex items-center gap-4">
                    <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                      <button
                        onClick={() => setStudioView('preview')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                          studioView === 'preview' 
                            ? 'bg-indigo-600 text-white' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => setStudioView('code')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                          studioView === 'code' 
                            ? 'bg-indigo-600 text-white' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        Code
                      </button>
                    </div>
                    <div className="h-4 w-px bg-zinc-800 mx-1" />
                    <button 
                      onClick={() => setInput("Please review and optimize the current studio code.")}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-500/20 transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      Optimize
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const blob = new Blob([studioCode], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'nexucore-design.html';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all"
                      title="Download HTML"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setStudioCode('')}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all"
                      title="Clear Code"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setIsStudioMode(false)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all"
                      title="Close Studio"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Studio Layout: Sidebar + Main */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Studio Left Sidebar: System Instructions */}
                  <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-950/50">
                    <div className="p-4 border-b border-zinc-800">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">System Instructions</span>
                    </div>
                    <div className="flex-1 p-4">
                      <textarea
                        value={systemInstruction}
                        onChange={(e) => setSystemInstruction(e.target.value)}
                        className="w-full h-full bg-transparent text-zinc-400 text-xs leading-relaxed focus:outline-none resize-none placeholder:text-zinc-700"
                        placeholder="Enter system instructions for the AI..."
                      />
                    </div>
                    <div className="p-4 border-t border-zinc-800 space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Temperature</span>
                          <span className="text-[10px] font-mono text-indigo-400">0.7</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 w-[70%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Top P</span>
                          <span className="text-[10px] font-mono text-indigo-400">0.95</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 w-[95%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Studio Main Content */}
                  <div className="flex-1 overflow-hidden relative flex flex-col">
                    <div className="flex-1 overflow-hidden">
                      {studioView === 'code' ? (
                        <textarea
                          value={studioCode}
                          onChange={(e) => setStudioCode(e.target.value)}
                          className="w-full h-full bg-zinc-950 text-zinc-300 font-mono text-xs p-6 focus:outline-none resize-none selection:bg-indigo-500/30"
                          spellCheck={false}
                          placeholder="Enter HTML and Tailwind CSS code here..."
                        />
                      ) : (
                        <div className="w-full h-full bg-white">
                          {studioCode ? (
                            <iframe
                              srcDoc={`
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <script src="https://cdn.tailwindcss.com"></script>
                                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                                    <style>
                                      body { font-family: 'Inter', sans-serif; }
                                      ::-webkit-scrollbar { width: 8px; }
                                      ::-webkit-scrollbar-track { background: #f1f1f1; }
                                      ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
                                      ::-webkit-scrollbar-thumb:hover { background: #555; }
                                    </style>
                                  </head>
                                  <body class="bg-gray-50 min-h-screen">
                                    ${studioCode}
                                  </body>
                                </html>
                              `}
                              className="w-full h-full border-none"
                              title="Studio Preview"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 gap-4">
                              <Monitor className="w-12 h-12 opacity-20" />
                              <p className="text-sm font-medium">No code to preview. Ask NexuCore to generate something!</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* UI Preview Modal */}
      <AnimatePresence>
        {previewHtml && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full h-full max-w-6xl bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
                  <span className="ml-4 text-xs font-mono text-zinc-500">NexuCore UI Sandbox</span>
                </div>
                <button
                  onClick={() => setPreviewHtml(null)}
                  className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 bg-white overflow-auto">
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                        <style>
                          body { font-family: 'Inter', sans-serif; }
                        </style>
                      </head>
                      <body class="bg-gray-50">
                        ${previewHtml}
                      </body>
                    </html>
                  `}
                  className="w-full h-full border-none"
                  title="UI Preview"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
