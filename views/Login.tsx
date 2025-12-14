import React, { useState } from 'react';
import { User } from '../types';
import { DataService } from '../services/storageService';
import { Button, Input } from '../components/UI';
import { ArrowRight, Lock, Mail, RefreshCw } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API latency
    setTimeout(() => {
      const users = DataService.getUsers();
      // Mock authentication
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user && user.status === 'Active') {
        // Verify Password
        if (user.password && user.password !== password) {
          setError('Invalid credentials.');
        } else {
          // Success
          onLogin(user);
        }
      } else {
        setError('Invalid credentials or inactive account.');
        // For demo purposes, hint at valid credentials
        if (!email) setError('Try "admin@firsttech.ae" with password "password"');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleResetData = () => {
    if (window.confirm('This will reset all data (Users, Makes, Mappings) to the default state. Continue?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-900 px-8 py-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-slash-red to-rose-600 shadow-lg mb-6">
            <span className="text-3xl font-bold text-white">F/</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">First Tech Mapping Portal</h1>
          <p className="text-slate-400 mt-2 text-sm">Vehicle Master Data Management</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute top-9 left-3 text-slate-400" size={18} />
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="name@firsttech.ae"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute top-9 left-3 text-slate-400" size={18} />
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full py-3 text-base" 
            isLoading={isLoading}
          >
            Sign In <ArrowRight size={18} />
          </Button>

          <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
             <p className="text-center text-xs text-slate-400">
                Protected by enterprise-grade security. <br/>
                Contact IT for access.
             </p>
             
             <button 
               type="button"
               onClick={handleResetData}
               className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mt-2"
               title="Clear local storage and reset to defaults"
             >
               <RefreshCw size={12} /> Reset Demo Data
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};