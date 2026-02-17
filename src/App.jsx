import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { auth, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Generator from './Generator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Cpu,
  PenTool,
  Globe,
  Zap,
  Shield,
  ChevronRight,
  Github,
  Twitter,
  Layout,
  Layers,
  Key,
  Home
} from 'lucide-react';

const Navbar = ({ user }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <div className="container nav-content">
        <a href="#" className="logo">
          <BookOpen className="text-gradient" size={28} />
          <span>AetherWriter</span>
        </a>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How it Works</a></li>
          <li><a href="#models">AI Models</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
              >
                <img src={user.photoURL} alt={user.displayName} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: '600', paddingRight: '0.5rem' }}>{user.displayName.split(' ')[0]}</span>
              </div>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', top: '120%', right: 0, background: '#0f172a', border: '1px solid var(--glass-border)', borderRadius: '1rem', padding: '0.5rem', minWidth: '160px', zIndex: 100 }}
                  >
                    <a href="/generator" style={{ display: 'block', padding: '0.75rem 1rem', color: 'white', textDecoration: 'none', fontSize: '0.85rem' }}>My Books</a>
                    <button
                      onClick={logout}
                      style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ user }) => {
  const navigate = useNavigate();
  const handleStart = (e) => {
    e.preventDefault();
    if (user) navigate('/generator');
    else signInWithGoogle();
  };
  return (
    <section className="hero">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="badge glass" style={{ display: 'inline-flex', padding: '0.5rem 1rem', borderRadius: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', fontWeight: '500' }}>
            <Sparkles size={14} style={{ marginRight: '0.5rem', color: '#a855f7' }} />
            The Future of Digital Publishing is Here
          </div>
          <h1>
            Write Your Masterpiece <br />
            <span className="text-gradient">With Agentic AI</span>
          </h1>
          <p>
            The world's most powerful AI book generator. From plot outlines to full-length novels, AetherWriter turns your vision into a published reality in minutes.
          </p>
          <div className="hero-btns">
            <button onClick={handleStart} className="btn btn-primary">
              Start Writing For Free
              <ChevronRight size={18} />
            </button>
            <a href="#templates" className="btn btn-secondary">
              Explore Templates
            </a>
          </div>
        </motion.div>

        <motion.div
          className="hero-image section"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '2rem', width: '100%', textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></div>
              </div>
              <div style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                <p style={{ color: '#6366f1' }}>&gt; Initializing Gemini 2.0 Flash...</p>
                <p>&gt; Crafting Chapter 1: The Quantum Paradox</p>
                <p style={{ marginTop: '1rem', color: '#f8fafc' }}>
                  The obsidian sky over Neo-Tokyo hummed with the rhythmic pulse of a thousand neon signs. Elara stood at the edge of the Spire, her cybernetic iris recalibrating as the rain slicked her synthetic skin...
                </p>
                <motion.span
                  animate={{ opacity: [0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  style={{ borderRight: '2px solid #a855f7', marginLeft: '2px' }}
                />
              </div>
            </div>
            {/* Decorative Blobs */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(50px)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', background: 'rgba(168, 85, 247, 0.1)', filter: 'blur(50px)', borderRadius: '50%' }}></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Concept & Style",
      desc: "Enter your title and choose from 30+ genres or your own custom niche.",
      icon: PenTool
    },
    {
      number: "02",
      title: "Agentic Outlining",
      desc: "Review AI-suggested chapters or build your own roadmap with surgical precision.",
      icon: Layers
    },
    {
      number: "03",
      title: "One-Click Publishing",
      desc: "Generate your full book, including AI covers, and export to Kindle or PDF.",
      icon: Zap
    }
  ];

  return (
    <section id="how-it-works" className="section" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
      <div className="container">
        <div className="section-header">
          <h2 className="text-gradient">How it Works</h2>
          <p>From a single prompt to a published masterpiece in under 10 minutes.</p>
        </div>
        <div className="steps-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <span style={{ fontSize: '4rem', fontWeight: '900', color: 'rgba(255,255,255,0.03)', position: 'absolute', top: '-1rem', left: '0' }}>{step.number}</span>
              <div className="feature-icon" style={{ position: 'relative', zIndex: 1 }}>
                <step.icon size={24} />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>{step.title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SampleBooks = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const samples = [
    { title: "The Circuit of Souls", author: "A.I. Genesis", cover: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=400&h=600&auto=format&fit=crop" },
    { title: "Grains of Eternity", author: "Digital Scribe", cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&h=600&auto=format&fit=crop" },
    { title: "Protocol Zero", author: "Agent Black", cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&h=600&auto=format&fit=crop" },
    { title: "The Last Singularity", author: "Future Mind", cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=400&h=600&auto=format&fit=crop" },
    { title: "Neon Frontiers", author: "Cyber Pen", cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=600&auto=format&fit=crop" },
    { title: "Shadows of Aether", author: "Mystic AI", cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&h=600&auto=format&fit=crop" },
    { title: "The Silicon Heart", author: "Bionic Bard", cover: "https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=400&h=600&auto=format&fit=crop" },
    { title: "Echoes of Orion", author: "Star Writer", cover: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400&h=600&auto=format&fit=crop" }
  ];

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % samples.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [isPaused, samples.length]);

  const nextStep = () => {
    setIndex((prev) => (prev + 1) % samples.length);
  };

  const prevStep = () => {
    setIndex((prev) => (prev - 1 + samples.length) % samples.length);
  };

  return (
    <section
      className="section"
      style={{ overflow: 'hidden', position: 'relative' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container">
        <div className="section-header" style={{ marginBottom: '4rem' }}>
          <h2 className="text-gradient">Recent Masterpieces</h2>
          <p>Thousands of books are being written right now. Join the revolution.</p>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          {/* Side Arrows */}
          <button
            onClick={prevStep}
            className="btn-v-secondary glass"
            style={{
              position: 'absolute',
              left: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
          </button>

          <button
            onClick={nextStep}
            className="btn-v-secondary glass"
            style={{
              position: 'absolute',
              right: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <ChevronRight size={24} />
          </button>

          <div style={{ padding: '1rem 0' }}>
            <motion.div
              style={{
                display: 'flex',
                gap: '2rem',
                cursor: 'grab'
              }}
              animate={{ x: -index * (300 + 32) }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              {samples.map((book, i) => (
                <motion.div
                  key={i}
                  className="book-card"
                  whileHover={{ y: -10 }}
                  style={{
                    flex: '0 0 300px',
                    opacity: 1,
                    transition: '0.5s',
                    scale: index === i ? 1.05 : 0.95,
                    filter: Math.abs(index - i) > 1 ? 'blur(1px) opacity(0.5)' : 'none'
                  }}
                >
                  <div className="book-cover" style={{
                    height: '420px',
                    borderRadius: '1.5rem',
                    overflow: 'hidden',
                    marginBottom: '1.5rem',
                    boxShadow: index === i ? '0 30px 60px -12px rgba(99, 102, 241, 0.3)' : '0 20px 40px -12px rgba(0,0,0,0.5)',
                    border: index === i ? '2px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                    position: 'relative'
                  }}>
                    <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div className="book-hover-overlay" style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: '0.3s'
                    }}>
                      <button className="btn btn-primary" style={{ transform: 'scale(0.8)' }}>Read Story</button>
                    </div>
                  </div>
                  <h4 style={{
                    fontSize: '1.25rem',
                    marginBottom: '0.5rem',
                    fontWeight: '700',
                    color: index === i ? 'white' : 'rgba(255,255,255,0.7)'
                  }}>{book.title}</h4>
                  <p style={{
                    color: index === i ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    letterSpacing: '2px',
                    fontWeight: '800'
                  }}>BY {book.author.toUpperCase()}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div
    className="glass-card"
    whileHover={{ y: -10 }}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
  >
    <div className="feature-icon">
      <Icon size={24} />
    </div>
    <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
    <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>{description}</p>
  </motion.div>
);

const Features = () => {
  const features = [
    {
      icon: Cpu,
      title: "Multi-Brain Intelligence",
      description: "Harness the power of Gemini, GPT-4, or Claude. Connect your own API keys for ultimate flexibility."
    },
    {
      icon: Layers,
      title: "Story Architecture",
      description: "AI-powered plotting engines that build consistent worlds, character arcs, and narrative tension."
    },
    {
      icon: Key,
      title: "Bring Your Own Key",
      description: "Pay for what you use. We support direct integration with major AI providers for enterprise-grade control."
    },
    {
      icon: Zap,
      title: "Instant Generation",
      description: "Go from a single sentence prompt to a 50,000-word manuscript in under 10 minutes."
    },
    {
      icon: Layout,
      title: "Auto-Formatting",
      description: "Beautifully formatted books ready for Kindle, Apple Books, and Print-on-Demand."
    },
    {
      icon: Shield,
      title: "Copyright Ownership",
      description: "You own everything you create. Our AI models are trained to prioritize uniqueness and style."
    }
  ];

  return (
    <section id="features" className="section">
      <div className="container">
        <div className="section-header">
          <h2 className="text-gradient">Superpowered Writing</h2>
          <p>Everything you need to go from idea to bestseller, powered by the latest in large language models.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </div>
    </section>
  );
};

const ModelSection = () => {
  return (
    <section id="models" className="section" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Compatible With <br /><span className="text-gradient">Leading AI Models</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Whether you prefer the creative flair of Claude, the logical precision of GPT-4, or the blazing speed of Gemini, AetherWriter lets you choose your weapon.
          </p>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                <Sparkles size={20} color="#4285F4" />
              </div>
              <span>Google Gemini</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                <Zap size={20} color="#10a37f" />
              </div>
              <span>OpenAI GPT-4</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                <Shield size={20} color="#d97706" />
              </div>
              <span>Anthropic Claude</span>
            </div>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: '600' }}>Custom API Configuration</span>
              <div style={{ padding: '0.2rem 0.6rem', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', borderRadius: '1rem', fontSize: '0.75rem' }}>Enterprise</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ height: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
                <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>sk-proj-**********************</span>
              </div>
              <div style={{ height: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
                <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>gemini-api-key-****************</span>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Test Connection</button>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '150px', height: '150px', background: 'rgba(99, 102, 241, 0.2)', filter: 'blur(40px)', borderRadius: '50%' }}></div>
        </div>
      </div>
    </section>
  )
}

const Footer = () => {
  return (
    <footer style={{ padding: '4rem 0 2rem', borderTop: '1px solid var(--glass-border)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', marginBottom: '4rem' }}>
          <div style={{ maxWidth: '300px' }}>
            <a href="#" className="logo" style={{ marginBottom: '1.5rem' }}>
              <BookOpen className="text-gradient" size={24} />
              <span>AetherWriter</span>
            </a>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              The world's premium AI book generation platform. Built for authors who want to push the boundaries of storytelling.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '4rem' }}>
            <div>
              <h4 style={{ marginBottom: '1.5rem' }}>Product</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Features</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Models</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '1.5rem' }}>Company</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>About Us</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Terms</a></li>
              </ul>
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '1.5rem' }}>Social</h4>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="#" style={{ color: 'var(--text-secondary)' }}><Twitter size={20} /></a>
              <a href="#" style={{ color: 'var(--text-secondary)' }}><Github size={20} /></a>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          &copy; {new Date().getFullYear()} AetherWriter AI. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

const TemplateShowcase = () => {
  const templates = [
    { title: "Sci-Fi Odyssey", genre: "Science Fiction", color: "rgba(99, 102, 241, 0.2)" },
    { title: "Forbidden Realm", genre: "Fantasy", color: "rgba(168, 85, 247, 0.2)" },
    { title: "Shadow Protocol", genre: "Thriller", color: "rgba(34, 211, 238, 0.2)" }
  ];

  return (
    <section id="templates" className="section">
      <div className="container">
        <div className="section-header">
          <h2 className="text-gradient">Ready-to-Start Templates</h2>
          <p>Standardized frameworks for every genre. Just add your spark and let the AI handle the complex plotting.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {templates.map((t, i) => (
            <motion.div
              key={i}
              className="glass-card"
              style={{ padding: '0', overflow: 'hidden' }}
              whileHover={{ scale: 1.02 }}
            >
              <div style={{ height: '200px', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={48} color="white" />
              </div>
              <div style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: '700' }}>{t.genre}</span>
                <h3 style={{ margin: '0.5rem 0' }}>{t.title}</h3>
                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.9rem' }}>Use Template</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SocialProof = () => {
  return (
    <section style={{ padding: '2rem 0', borderBottom: '1px solid var(--glass-border)' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '600', marginBottom: '2rem' }}>Powered by Industry Leaders</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', opacity: '0.5', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>GOOGLE CLOUD</span>
          <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>OPENAI</span>
          <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>ANTHROPIC</span>
          <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>AWS</span>
        </div>
      </div>
    </section>
  );
};

const AppHome = ({ user }) => {
  // Original App Component Content (Navbar, Hero, Features, etc.)
  return (
    <div className="app">
      <Navbar user={user} />
      <Hero user={user} />
      <SocialProof />
      <HowItWorks />
      <SampleBooks />
      <Features />
      <TemplateShowcase />
      <ModelSection />
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container">
          <div className="glass-card" style={{ background: 'var(--accent-gradient)', border: 'none' }}>
            <h2 style={{ color: 'white', marginBottom: '1rem' }}>Ready to Write Your Bestseller?</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
              Join 10,000+ authors who are using AetherWriter to create professional books 10x faster.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <a href="/generator" className="btn" style={{ background: 'white', color: 'var(--accent-primary)', textDecoration: 'none' }}>Start Free Trial</a>
              <button className="btn btn-secondary" style={{ background: 'rgba(0,0,0,0.2)', border: 'none' }}>Contact Sales</button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020203' }}>
        <div className="spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }}></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppHome user={user} />} />
        <Route
          path="/generator"
          element={user ? <Generator user={user} /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
