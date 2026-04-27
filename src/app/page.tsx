"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import HeroAnimation from "@/components/HeroAnimation";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseAnonKey) : null;

const features = [
  { title: "Context Builder", icon: "🏗️", desc: "Craft, optimize, and evaluate system prompts in real-time." },
  { title: "Context Analyzer", icon: "🔍", desc: "Detect contradictions, tone drift, and hidden edge cases." },
  { title: "Compaction Lab", icon: "🗜️", desc: "Distill massive conversation logs into dense, structured summaries." },
  { title: "Few-Shot Engine", icon: "🎯", desc: "Build and analyze diverse XML examples to guide model behavior." },
  { title: "Memory & Notes", icon: "🧠", desc: "Persist guidelines and architectures across all your sessions." },
  { title: "Sub-Agents", icon: "🤖", desc: "Orchestrate complex multi-agent architectures effortlessly." }
];

export default function LandingPage() {
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("contextcraft_theme");
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
    
    // Check if user is already logged in
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) router.push("/dashboard");
      });
    }
  }, [router]);

  const toggleDarkMode = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("contextcraft_theme", newTheme);
  };

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setError("");
    setIsModalOpen(true);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      alert("Supabase is not configured. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are in your .env.local");
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    setError("");

    let res;
    if (authMode === "signup") {
      res = await supabase.auth.signUp({ email, password });
    } else {
      res = await supabase.auth.signInWithPassword({ email, password });
    }

    setLoading(false);

    if (res.error) {
      setError(res.error.message);
    } else {
      if (authMode === "signup" && !res.data.session) {
        setError("Check your email for the confirmation link.");
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <>
      <nav className="navbar">
        <a href="#" className="logo">
          <span className="logo-context">Context</span>
          <span className="logo-craft">Craft</span>
        </a>
        <div className="nav-links">
          <button className="btn btn-outline" onClick={() => openAuth("login")}>
            Log in
          </button>
        </div>
      </nav>

      <section className="hero">
        <HeroAnimation />
        <h1>The Context Engineering Studio</h1>
        <div className="claude-badge">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Optimized for Claude models
        </div>
        <div className="features-marquee-container">
          <div className="features-marquee">
            {[...features, ...features].map((f, i) => (
              <div className="feature-card" key={i}>
                <h3><span>{f.icon}</span> {f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ fontSize: "16px", padding: "14px 32px" }}
          onClick={() => openAuth("signup")}
        >
          Start Building for Free
        </button>
      </section>

      <section className="pricing-section">
        <h2 className="section-title">Simple, usage-based pricing</h2>
        <div className="pricing-grid">
          {/* Dev */}
          <div className="pricing-card">
            <div className="tier-name">Dev</div>
            <div className="tier-price">
              $15<span>/mo</span>
            </div>
            <div className="trial-tag">7-day free trial</div>
            <div className="tier-desc">Perfect for individuals experimenting with context engineering and basic agent flows.</div>
            <ul className="feature-list">
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Anthropic Developer Key (BYOK)
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> All Claude Models (Haiku, Sonnet, Opus)
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Basic Context Compaction
              </li>
            </ul>
            <div style={{textAlign: "center"}}>
              <button className="btn btn-outline" onClick={() => openAuth("signup")}>
                Get Started
              </button>
            </div>
          </div>

          {/* Engineer */}
          <div className="pricing-card popular">
            <div className="popular-badge">MOST POPULAR</div>
            <div className="tier-name">Engineer</div>
            <div className="tier-price">
              $39<span>/mo</span>
            </div>
            <div className="trial-tag">7-day free trial</div>
            <div className="tier-desc">For professional developers building production-grade AI agents and multi-step workflows.</div>
            <ul className="feature-list">
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Anthropic Developer Key (BYOK)
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Unlimited Cloud Sync
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Advanced Orchestrator Agents
              </li>
            </ul>
            <div style={{textAlign: "center"}}>
              <button className="btn btn-primary" onClick={() => openAuth("signup")}>
                Upgrade to Engineer
              </button>
            </div>
          </div>

          {/* Professional */}
          <div className="pricing-card">
            <div className="tier-name">Professional</div>
            <div className="tier-price">
              $99<span>/mo</span>
            </div>
            <div className="trial-tag">7-day free trial</div>
            <div className="tier-desc">For AI teams collaborating on agent memory, prompts, and unified architectural designs.</div>
            <ul className="feature-list">
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Up to 5 Seats Included
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Shared Workspace Memory
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Collaborative Few-Shot Builder
              </li>
            </ul>
            <div style={{textAlign: "center"}}>
              <button className="btn btn-outline" onClick={() => openAuth("signup")}>
                Create Team
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        © 2026 ContextCraft. All rights reserved.
      </footer>

      {/* Auth Modal */}
      {isModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setIsModalOpen(false)}>&times;</button>
            <h2>{authMode === "login" ? "Welcome Back" : "Create Account"}</h2>
            
            {error && <div id="auth-error" style={{ display: "block", color: error.includes("Check") ? "var(--brand)" : "var(--red, #e74c3c)" }}>{error}</div>}
            
            <form onSubmit={handleAuth}>
              <div className="input-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <div style={{textAlign: "center"}}>
                <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }} disabled={loading}>
                  {loading ? "Please wait..." : authMode === "login" ? "Log In" : "Sign Up"}
                </button>
              </div>
            </form>
            
            <div className="toggle-auth">
              <span>{authMode === "login" ? "Don't have an account? " : "Already have an account? "}</span>
              <a onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setError(""); }}>
                {authMode === "login" ? "Sign up" : "Log in"}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
