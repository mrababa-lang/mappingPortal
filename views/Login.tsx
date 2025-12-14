import React, { useState } from 'react';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { Button, Input } from '../components/UI';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await AuthService.login(email, password);
      onLogin(user);
      toast.success(`Welcome back, ${user.name}`);
    } catch (error) {
      console.error("Login Error", error);
      toast.error("Invalid credentials or server error.");
    } finally {
      setIsLoading(false);
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
                placeholder="admin@example.com"
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
                placeholder="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full py-3 text-base" 
            isLoading={isLoading}
          >
            Sign In <ArrowRight size={18} />
          </Button>

          <div className="pt-4 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400">
               Connects to Local Backend (Port 8080)
             </p>
          </div>
        </form>
      </div>
    </div>
  );
};
