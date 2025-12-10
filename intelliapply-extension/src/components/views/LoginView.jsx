import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export function LoginView() {
    const { signIn, signInWithGoogle, isLoggingIn, authError } = useAppStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await signIn(email, password);
    };

    const handleGoogleLogin = async () => {
        await signInWithGoogle();
    };

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 bg-slate-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md border border-slate-200">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-center mb-2 text-slate-900">IntelliApply</h1>
                    <p className="text-center text-slate-600">Sign in to access your Resume Vault</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Pb@123..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {authError && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{authError}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full h-10 bg-[#1F1F1F] hover:bg-[#333] text-white font-medium rounded-md transition-colors"
                    >
                        {isLoggingIn ? 'Signing in...' : 'Sign In'}
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500">Or continue with</span>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn}
                        className="w-full h-10 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-md flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </Button>
                </form>
            </div>
        </div>
    );
}
