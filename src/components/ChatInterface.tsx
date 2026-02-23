import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon, Loader2, Sparkles, Brain, BookOpen, Microscope, Megaphone, PenTool, Terminal, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateNexuCoreResponse } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import D3Visualizer from './D3Visualizer';

interface Message {
  role: 'user' | 'model';
  text: string;
  files?: { name: string; type: string; url: string }[];
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
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello, I am NexuCore AI. What would you like to create, analyze, or strategize today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([]);
  const [activeMode, setActiveMode] = useState('general');
  const [persona, setPersona] = useState<'user' | 'developer'>('user');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setMessages(prev => [...prev, userMessage]);
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
    <div className="flex h-screen bg-[#0A0A0A] text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800/50 bg-[#0D0D0D] flex flex-col hidden md:flex">
        <div className="p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">NexuCore <span className="text-emerald-500">AI</span></h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Specialized Modes</span>
          </div>
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
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-zinc-400">System Online</span>
            </div>
            
            <div className="h-4 w-[1px] bg-zinc-800" />
            
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
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">v2.5.0-flash</span>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] md:max-w-[70%] space-y-2`}>
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
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
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'user' 
                    ? (persona === 'developer' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20')
                    : 'bg-zinc-900 border border-zinc-800/50 text-zinc-200'
                  }`}>
                    {renderMessageContent(msg.text)}
                  </div>
                  <div className={`flex items-center gap-2 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">
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
                  placeholder={persona === 'developer' ? "Request technical analysis or code..." : "Ask NexuCore anything..."}
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
