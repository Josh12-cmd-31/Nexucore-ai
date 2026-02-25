import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, ArrowRight, Github, Chrome, ShieldCheck, User } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSent(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Neural Link</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Secure Authentication</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isSent ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-zinc-200 mb-2">Welcome back</h3>
                    <p className="text-sm text-zinc-500">Sign in to sync your strategic assets and neural links across devices.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                    >
                      Continue with Email
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest">
                      <span className="bg-zinc-900 px-4 text-zinc-600">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all text-sm font-medium">
                      <Github className="w-4 h-4" />
                      GitHub
                    </button>
                    <button className="flex items-center justify-center gap-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all text-sm font-medium">
                      <Chrome className="w-4 h-4" />
                      Google
                    </button>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <Mail className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
                    <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                      We've sent a secure magic link to <strong className="text-emerald-500">{email}</strong>. Click the link to sign in.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSent(false)}
                    className="text-xs text-zinc-500 hover:text-emerald-500 transition-colors underline underline-offset-4"
                  >
                    Use a different email
                  </button>
                </motion.div>
              )}

              <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  By signing in, you agree to our <span className="text-zinc-400 hover:text-emerald-500 cursor-pointer">Terms of Service</span> and <span className="text-zinc-400 hover:text-emerald-500 cursor-pointer">Privacy Policy</span>.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
