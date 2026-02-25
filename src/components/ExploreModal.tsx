import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, BookOpen, Brain, Zap, Shield, Globe, Cpu } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  icon: any;
  category: string;
}

const ARTICLES: Article[] = [
  {
    id: 'intro',
    title: 'What is NexuCore AI?',
    excerpt: 'An overview of the strategic intelligence engine designed for high-performance execution.',
    category: 'Basics',
    icon: Brain,
    content: `
      # Welcome to NexuCore AI
      
      NexuCore is not just a chatbot; it is a **Strategic Intelligence Engine** built for creators, founders, researchers, and engineers. Unlike generic AI systems, NexuCore is designed to be an active participant in your workflow, providing structured, actionable, and deployable outcomes.
      
      ### Core Philosophy
      Our mission is to turn vague ideas into concrete systems. Whether you are writing a technical specification, composing a complex marketing funnel, or generating production-ready code, NexuCore provides the analytical depth required for professional success.
      
      ### Key Pillars
      - **Strategic Depth**: We prioritize logic and structure over conversational fluff.
      - **Multimodal Mastery**: Seamlessly handle text, images, and code in a single unified interface.
      - **Persona Adaptation**: Switch between a user-friendly strategic mode and a high-precision developer engine.
    `
  },
  {
    id: 'modes',
    title: 'Understanding Specialized Modes',
    excerpt: 'How to leverage Creative, Analysis, Marketing, and Scientific modes for better results.',
    category: 'Features',
    icon: Zap,
    content: `
      # Specialized Intelligence Modes
      
      NexuCore features dedicated "Intelligence Modes" that reconfigure the underlying model's behavior to suit specific tasks.
      
      ### 1. Creative Director Mode
      Optimized for storytelling, songwriting, and scriptwriting. It understands narrative arcs, character depth, and emotional resonance.
      
      ### 2. CMO Mode (Marketing)
      Think like a Chief Marketing Officer. This mode provides brand positioning, customer persona breakdowns, and conversion-optimized funnel strategies.
      
      ### 3. Research Scientist Mode
      Designed for deep technical and scientific analysis. It stays evidence-based and can even generate D3.js visualizations for complex data structures.
      
      ### 4. UI Sandbox Mode
      A dedicated environment for UI/UX engineers. It generates HTML and Tailwind CSS code that can be instantly previewed in the NexuCore Studio.
    `
  },
  {
    id: 'studio',
    title: 'Mastering Studio Mode',
    excerpt: 'A guide to the live preview and code editing environment for developers.',
    category: 'Technical',
    icon: Cpu,
    content: `
      # NexuCore Studio Mode
      
      Studio Mode is a high-performance workspace for technical execution. It allows you to bridge the gap between AI generation and manual refinement.
      
      ### Features of Studio Mode
      - **Live Preview**: See your HTML/Tailwind changes instantly as you type or as the AI generates code.
      - **System Instructions**: Directly modify the AI's "brain" by providing custom system prompts in the sidebar.
      - **AI Optimizer**: Use the dedicated "Optimize" button to have NexuCore review your code for performance and accessibility.
      - **Export Engine**: Download your creations as standalone, production-ready HTML files.
      
      ### How to use it
      Switch to the **Developer Persona** in the header, then click the **Studio** button. You can now chat with the AI on the left while the code lives on the right.
    `
  },
  {
    id: 'security',
    title: 'Security & Neural Links',
    excerpt: 'How we ensure your data and strategic assets remain protected.',
    category: 'Security',
    icon: Shield,
    content: `
      # Security & Privacy
      
      At NexuCore, we treat your strategic assets with the highest level of confidentiality.
      
      ### Neural Link Encryption
      Every session is protected by end-to-end encryption. Your "Neural Link" to NexuCore is a secure, isolated environment where your data is processed without being used for general model training.
      
      ### Local Persistence
      Your chat history and Studio configurations are stored locally in your browser's encrypted storage, giving you full control over your data lifecycle.
      
      ### Enterprise Readiness
      NexuCore is designed to handle sensitive business logic and proprietary research data, ensuring that your competitive advantages remain yours alone.
    `
  }
];

export default function ExploreModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-5xl h-[80vh] bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-100">NexuCore Explore</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar / List */}
              <div className="w-80 border-r border-zinc-800 overflow-y-auto p-4 space-y-2 bg-zinc-950/30">
                {ARTICLES.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className={`w-full text-left p-4 rounded-2xl transition-all group ${
                      selectedArticle?.id === article.id
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'hover:bg-zinc-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <article.icon className={`w-4 h-4 ${
                        selectedArticle?.id === article.id ? 'text-emerald-500' : 'text-zinc-500'
                      }`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{article.category}</span>
                    </div>
                    <h3 className={`text-sm font-bold mb-1 transition-colors ${
                      selectedArticle?.id === article.id ? 'text-emerald-400' : 'text-zinc-200 group-hover:text-white'
                    }`}>
                      {article.title}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-12 bg-zinc-900/20">
                {selectedArticle ? (
                  <motion.div
                    key={selectedArticle.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-2xl mx-auto"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <selectedArticle.icon className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1 block">
                          {selectedArticle.category}
                        </span>
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                          {selectedArticle.title}
                        </h2>
                      </div>
                    </div>
                    
                    <div className="prose prose-invert prose-emerald max-w-none">
                      {selectedArticle.content.split('\n').map((line, i) => {
                        if (line.trim().startsWith('# ')) {
                          return null; // Skip main title as we handled it
                        }
                        if (line.trim().startsWith('### ')) {
                          return <h3 key={i} className="text-xl font-bold text-zinc-100 mt-8 mb-4">{line.replace('### ', '')}</h3>;
                        }
                        if (line.trim().startsWith('- **')) {
                          const [label, desc] = line.replace('- **', '').split('**: ');
                          return (
                            <div key={i} className="flex gap-3 mb-4">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                              <p className="text-zinc-400 text-sm leading-relaxed">
                                <strong className="text-zinc-200">{label}</strong>: {desc}
                              </p>
                            </div>
                          );
                        }
                        if (line.trim() === '') return <br key={i} />;
                        return <p key={i} className="text-zinc-400 text-sm leading-relaxed mb-4">{line.trim()}</p>;
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-zinc-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">Explore NexuCore Intelligence</h2>
                      <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                        Select an article from the sidebar to understand the mechanics and strategy behind NexuCore AI.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
