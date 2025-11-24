'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './auth.module.css';

export default function HomePage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        console.log('Starting auth process...', { isLogin, email });

        try {
            if (isLogin) {
                console.log('Attempting login...');
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    console.error('Login error:', error);
                    throw error;
                }

                console.log('Login successful, user:', data.user);

                if (data.user) {
                    // Check user role
                    console.log('Fetching profile for user:', data.user.id);
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single();

                    if (profileError) {
                        console.error('Error fetching profile:', profileError);
                        // Fallback if profile doesn't exist yet (shouldn't happen if signup flow worked)
                        router.push('/dashboard');
                        return;
                    }

                    console.log('Profile found:', profile);

                    if (profile?.role === 'admin') {
                        router.push('/admin');
                    } else {
                        router.push('/dashboard');
                    }
                }
            } else {
                console.log('Attempting signup...');
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) {
                    console.error('Signup error:', error);
                    throw error;
                }

                console.log('Signup successful, user:', data.user);

                // Create profile
                if (data.user) {
                    console.log('Creating profile...');
                    const { error: profileError } = await supabase.from('profiles').insert({
                        id: data.user.id,
                        email,
                        full_name: fullName,
                        role: 'partner',
                    });

                    if (profileError) {
                        console.error('Profile creation error:', profileError);
                        throw profileError;
                    }

                    alert('Account created! Logging you in...');
                    // Auto login after signup
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (!signInError && signInData.user) {
                        router.push('/dashboard');
                    } else {
                        setIsLogin(true);
                    }
                }
            }
        } catch (err: any) {
            console.error('Auth catch block:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.title}>
                        <span className={styles.gradient}>CoupleConnect</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Strengthen your relationship through clarity, connection, and commitment
                    </p>
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>💬</div>
                            <div className={styles.featureText}>Emotional Intelligence</div>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>❤️</div>
                            <div className={styles.featureText}>Habit Tracking</div>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>📅</div>
                            <div className={styles.featureText}>Shared Planning</div>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>📊</div>
                            <div className={styles.featureText}>Relationship Insights</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.authCard}>
                <h2 className={styles.authTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleAuth} className={styles.form}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                placeholder="Enter your full name"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className={styles.toggle}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className={styles.toggleBtn}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
}
