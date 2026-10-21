import React, { useEffect, useState } from 'react';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setMessage(data.session ? 'Your account is ready! Welcome to NutriPastel 💗' : 'Check your email to confirm your account, then come back to log in. 💌');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  }

  async function resetPassword() {
    if (!supabase || !email.trim()) { setMessage('Enter your email address first.'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setMessage(error ? error.message : 'Password reset instructions have been sent if this email is registered. 💌');
  }

  if (loading) return <div style={styles.center}>Loading your pastel space… 🌷</div>;
  if (session) return <>{children}<button onClick={() => supabase?.auth.signOut()} style={styles.logout}>Log out</button></>;
  if (!supabase) return <div style={styles.center}><section style={styles.card}><h1 style={styles.title}>NutriPastel 🥑</h1><p>Almost ready! Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to the app's environment variables, then redeploy.</p></section></div>;

  return <div style={styles.center}>
    <section style={styles.card}>
      <div style={{fontSize: 42}}>🥑🌷</div>
      <h1 style={styles.title}>NutriPastel</h1>
      <p style={styles.subtitle}>Your little space for joyful, mindful eating ✨</p>
      <div style={styles.tabs}>
        <button type="button" onClick={() => {setMode('signup');setMessage('');}} style={mode === 'signup' ? styles.activeTab : styles.tab}>Sign up</button>
        <button type="button" onClick={() => {setMode('login');setMessage('');}} style={mode === 'login' ? styles.activeTab : styles.tab}>Log in</button>
      </div>
      <form onSubmit={submit} style={{display:'grid',gap:14,textAlign:'left'}}>
        <label style={styles.label}>Email address<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={styles.input}/></label>
        <label style={styles.label}>Password<input required type="password" minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" style={styles.input}/></label>
        <button disabled={busy} type="submit" style={styles.submit}>{busy ? 'One moment…' : mode === 'signup' ? 'Create my account ✨' : 'Welcome back 💗'}</button>
      </form>
      {mode === 'login' && <button type="button" onClick={resetPassword} style={styles.forgot}>Forgot your password?</button>}
      {message && <p role="status" style={styles.message}>{message}</p>}
      <p style={styles.privacy}>Your account is protected by Supabase authentication. 🌸</p>
    </section>
  </div>;
}

const styles: Record<string, React.CSSProperties> = {
  center:{minHeight:'100vh',display:'grid',placeItems:'center',padding:20,background:'linear-gradient(135deg,#fff4f8,#f4efff 55%,#eafff5)',fontFamily:"'Quicksand','Arial',sans-serif",color:'#51445e'},
  card:{width:'100%',maxWidth:430,boxSizing:'border-box',padding:'34px 30px',borderRadius:28,background:'rgba(255,255,255,.92)',border:'1px solid #f4dbea',boxShadow:'0 18px 60px #d8c4e855',textAlign:'center'},
  title:{fontSize:32,fontWeight:800,letterSpacing:'-1px',margin:'12px 0 6px',color:'#8f5db7'},
  subtitle:{color:'#87788f',margin:'0 0 22px',fontSize:14},
  tabs:{display:'flex',gap:8,padding:5,background:'#faf3fc',borderRadius:14,marginBottom:22},
  tab:{flex:1,border:0,background:'transparent',padding:12,borderRadius:10,color:'#887b91',fontWeight:700,cursor:'pointer'},
  activeTab:{flex:1,border:0,background:'#fff',padding:12,borderRadius:10,color:'#9b63c0',fontWeight:800,boxShadow:'0 2px 9px #d8c4e855',cursor:'pointer'},
  label:{display:'grid',gap:7,fontSize:13,fontWeight:700,color:'#6d5c79'},
  input:{width:'100%',boxSizing:'border-box',padding:'13px 14px',border:'1px solid #ead9f1',borderRadius:12,outlineColor:'#c99ee5',background:'#fffdfd',fontSize:15,color:'#51445e'},
  submit:{border:0,borderRadius:14,padding:15,background:'linear-gradient(100deg,#e9a7d0,#bca5ed)',color:'#fff',fontSize:15,fontWeight:800,cursor:'pointer',boxShadow:'0 7px 18px #d6b8e866'},
  forgot:{marginTop:16,border:0,background:'transparent',color:'#9364b2',fontWeight:700,cursor:'pointer'},
  message:{marginTop:16,padding:12,borderRadius:12,background:'#fff3fa',color:'#76528a',fontSize:13,lineHeight:1.5},
  privacy:{fontSize:11,color:'#a497ad',margin:'22px 0 0'},
  logout:{position:'fixed',right:16,top:16,zIndex:1000,border:'1px solid #ead9f1',borderRadius:20,padding:'9px 14px',background:'#fff',color:'#8f5db7',fontWeight:700,cursor:'pointer'}
};
