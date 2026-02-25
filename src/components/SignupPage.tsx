import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowRight, Github, Chrome, Sparkles, ChevronLeft } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-emerald-600 blur-[120px] opacity-10 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-[2rem] border border-zinc-800/50 p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Create Neural Link</h1>
            <p className="text-zinc-500 text-sm max-w-[280px]">
              Join the elite network of creators and strategists powered by NexuCore.
            </p>
          </div>

          {!isSent ? (
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-all focus:ring-1 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 group"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                  <span className="bg-[#0A0A0A] px-4 text-zinc-600 font-bold">Or sign up with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all text-sm font-medium">
                  <Github className="w-5 h-5" />
                  GitHub
                </button>
                <button className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all text-sm font-medium">
                  <Chrome className="w-5 h-5" />
                  Google
                </button>
              </div>

              <p className="text-center text-xs text-zinc-500">
                Already have an account?{' '}
                <Link to="/" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 space-y-8"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-12 h-12 text-emerald-500" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white tracking-tight">Verification Sent</h3>
                <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
                  We've sent a secure activation link to <strong className="text-emerald-500">{email}</strong>. Please check your inbox to complete your registration.
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => setIsSent(false)}
                  className="text-xs text-zinc-500 hover:text-emerald-500 transition-colors underline underline-offset-4"
                >
                  Use a different email address
                </button>
              </div>
            </motion.div>
          )}

          <div className="mt-10 pt-8 border-t border-zinc-800/50 text-center">
            <p className="text-[10px] text-zinc-600 leading-relaxed uppercase tracking-widest font-bold">
              Secure Neural Link Protocol v2.5.0
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
