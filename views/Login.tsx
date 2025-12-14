import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { Button, Input } from '../components/UI';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await AuthService.login(email, password);
      
      if (!user) {
        throw new Error("Received empty user data");
      }

      // Explicitly check properties before accessing
      const welcomeName = (user && user.fullName) ? user.fullName : 'User';
      toast.success(`Welcome back, ${welcomeName}`);
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login Error", error);
      toast.error(error.message || "Invalid credentials or server error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-900 px-8 py-10 text-center relative overflow-hidden">
          {/* Decorative slash */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-slash-red opacity-10 transform translate-x-10 -translate-y-10 rotate-45"></div>
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slash-red shadow-lg mb-6 relative z-10">
            <span className="text-3xl font-bold text-white">S/</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight relative z-10">SlashData Portal</h1>
          <p className="text-slate-400 mt-2 text-sm relative z-10">Vehicle Master Data Management</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute top-9 left-3 text-slate-400" size={18} />
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="admin@slashdata.ae"
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
            className="w-full py-3 text-base bg-slash-red hover:bg-rose-700" 
            isLoading={isLoading}
          >
            Sign In <ArrowRight size={18} />
          </Button>

          <div className="pt-4 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400">
               Secured by SlashData Identity
             </p>
          </div>
        </form>
      </div>
    </div>
  );
};