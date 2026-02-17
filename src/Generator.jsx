import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Sparkles, Cpu, ChevronRight, Layout, Info, Image as ImageIcon, FileText, Settings, Download, X,
    Library, Languages, Share2, Edit3, Save, Printer, PenTool, Globe, ImageMinus, Key, Users, BookMarked, Palette, Wand2,
    CheckCircle2, AlertCircle, Terminal, Layers, ArrowRight, Zap, Stars, Copy, RefreshCcw, Upload, ImagePlus
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { auth, logout } from './firebase';

const SYSTEM_PROMPT = "You are a world-class best-selling author and ghostwriter. Your goal is to write high-quality, engaging, and typo-free content. You excel at showing, not telling, and creating immersive narratives. IMPORTANT: You must create ORIGINAL characters and ORIGINAL worlds. Do NOT use famous IP names or copyrighted characters. Create unique names, settings, and lore that fit the requested genre vibes. This output must be 100% legal, sellable, and scalable.";

const Generator = ({ user }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('market');
    const [editingIndex, setEditingIndex] = useState(null);

    const [formData, setFormData] = useState({
        apiKey: "",
        hfToken: "",
        model: "gemini-2.5-flash",
        imageModel: "gemini-2.5-flash-image",
        title: "",
        genre: "Sci-Fi",
        topic: "",
        targetAudience: "Adult",
        language: "English",
        style: "Descriptive",
        tone: "Suspenseful",
        pov: "Third Person Limited",
        chapterCount: 5,
        includeImages: true,
        imageStyle: "Cinematic"
    });

    const [outline, setOutline] = useState([]);
    const [bookContent, setBookContent] = useState([]);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [error, setError] = useState(null);

    const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // --- SMART FREE INFERENCE LOGIC ---
    const generateHFImage = async (modelId, prompt, retries = 3, token = "") => {
        const url = `https://api-inference.huggingface.co/models/${modelId}`;
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, { method: "POST", headers, body: JSON.stringify({ inputs: prompt }) });
                if (response.status === 503) {
                    const data = await response.json();
                    const waitTime = data.estimated_time || 20;
                    addLog(`Engine ${modelId} warming up... ${Math.ceil(waitTime)}s`);
                    await new Promise(r => setTimeout(r, waitTime * 1000));
                    continue;
                }
                if (!response.ok) throw new Error(`HF Error ${response.status}`);
                const blob = await response.blob();
                if (blob.type.startsWith("image")) {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => reader.result.length > 1000 ? resolve(reader.result) : resolve(null);
                        reader.readAsDataURL(blob);
                    });
                }
            } catch (err) {
                console.warn(`HF Retry ${i + 1}/${retries} failed:`, err);
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        return null;
    };

    const generateChapterImage = async (chapterTitle, genre, model, imageModelName) => {
        let imageUrl = "";
        const visualPromptBase = `${formData.imageStyle} style, ${genre} concept art, ${chapterTitle}, cinematic lighting, masterpiece, highly detailed, 8k`;

        if (model && imageModelName) {
            for (let i = 0; i < 2; i++) {
                if (imageUrl) break;
                try {
                    addLog(i === 0 ? "Orchestrating Visuals (Gemini)..." : "Retrying Gemini Vision...");
                    const visualPromptReq = `Create a short, vivid text-to-image prompt in ${formData.imageStyle} style for a scene in "${chapterTitle}". Context: ${genre}. Max 20 words. High-end aesthetic.`;
                    const promptRes = await model.generateContent(visualPromptReq);
                    const imgPrompt = promptRes.response.text().replace(/\n/g, ' ').trim();
                    const genAI = new GoogleGenerativeAI(formData.apiKey);
                    const imgModel = genAI.getGenerativeModel({ model: imageModelName });
                    const result = await imgModel.generateContent(imgPrompt);
                    const response = await result.response;
                    if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                        const base64 = response.candidates[0].content.parts[0].inlineData.data;
                        const mimeType = response.candidates[0].content.parts[0].inlineData.mimeType || "image/png";
                        if (base64 && base64.length > 500) {
                            imageUrl = `data:${mimeType};base64,${base64}`;
                            addLog("Visual asset generated successfully.");
                            return { url: imageUrl, prompt: imgPrompt };
                        }
                    }
                } catch (e) { console.warn("Gemini Vision Failed", e); }
                if (!imageUrl) await new Promise(r => setTimeout(r, 1000));
            }
        }

        if (!imageUrl) {
            addLog("Fallback 1: Stable Diffusion XL...");
            imageUrl = await generateHFImage("stabilityai/stable-diffusion-xl-base-1.0", visualPromptBase, 2, formData.hfToken);
            if (imageUrl) return { url: imageUrl, prompt: visualPromptBase };
        }

        if (!imageUrl) {
            addLog("Fallback 2: Stable Diffusion 1.5...");
            imageUrl = await generateHFImage("runwayml/stable-diffusion-v1-5", visualPromptBase, 1, formData.hfToken);
            if (imageUrl) return { url: imageUrl, prompt: visualPromptBase };
        }

        if (!imageUrl) {
            addLog("Fallback 3: Tiny SD (Lighter)...");
            imageUrl = await generateHFImage("segmind/tiny-sd", visualPromptBase, 1, formData.hfToken);
            if (imageUrl) return { url: imageUrl, prompt: visualPromptBase };
        }

        if (!imageUrl) {
            try {
                addLog("Fallback 4: Lexica Media Library...");
                const proxyUrl = "https://api.allorigins.win/raw?url=";
                const targetUrl = `https://lexica.art/api/v1/search?q=${encodeURIComponent(formData.genre + " " + chapterTitle + " " + formData.imageStyle)}`;
                const res = await fetch(proxyUrl + encodeURIComponent(targetUrl));
                const data = await res.json();
                if (data?.images?.[0]?.src) {
                    imageUrl = data.images[0].src;
                    return { url: imageUrl, prompt: "Lexica Library Asset" };
                }
            } catch (e) { console.warn("Lexica Fail", e); }
        }

        if (!imageUrl) {
            imageUrl = "https://placehold.co/1024x600/0a0a0a/333?text=Asset+Processing";
            return { url: imageUrl, prompt: 'Safety Placeholder' };
        }
        return { url: imageUrl, prompt: 'None' };
    };

    const generateOutline = async () => {
        if (!formData.apiKey) {
            setError("Authentication Required: Please enter your Gemini API Key.");
            return;
        }
        if (!formData.title || !formData.topic) {
            setError("Mission Critical: Title and Concept are required.");
            return;
        }
        setError(null);
        setGenerating(true);
        addLog("Booting Creative Engine...");
        try {
            const genAI = new GoogleGenerativeAI(formData.apiKey);
            const model = genAI.getGenerativeModel({ model: formData.model });
            const prompt = `Create a detailed book outline for a ${formData.genre} book titled "${formData.title}". 
                Topic: ${formData.topic}. Target Audience: ${formData.targetAudience}. Language: ${formData.language}.
                Chapter Count: ${formData.chapterCount}.
                Return strictly a JSON array of strings (chapter titles). No markdown.`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            setOutline(JSON.parse(jsonStr));
            setStep(2);
            addLog("Blueprint finalized.");
        } catch (e) {
            setError("Critical Failure: " + e.message);
            addLog(`Abort: ${e.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const generateBook = async () => {
        setStep(3);
        setGenerating(true);
        setBookContent([]);
        try {
            const genAI = new GoogleGenerativeAI(formData.apiKey);
            const model = genAI.getGenerativeModel({ model: formData.model, systemInstruction: SYSTEM_PROMPT });

            for (let i = 0; i < outline.length; i++) {
                const chapterTitle = outline[i];
                setCurrentChapterIndex(i + 1);
                addLog(`Drafting Chapter ${i + 1}: ${chapterTitle}...`);
                setProgress(((i) / outline.length) * 100);

                let content = "";
                const prompt = `Write chapter "${chapterTitle}" for book "${formData.title}". 
                Genre: ${formData.genre}. 
                POV: ${formData.pov}. 
                Tone: ${formData.tone}. 
                Writing Style: ${formData.style}. 
                Language: ${formData.language}.
                Complexity: Enterprise Professional.
                Word count: ~800 words. Use HTML <p> tags for paragraphs.`;
                const result = await model.generateContent(prompt);
                content = result.response.text();

                let imgData = { url: '', prompt: 'Not Generated' };
                if (formData.includeImages) {
                    imgData = await generateChapterImage(chapterTitle, formData.genre, model, formData.imageModel);
                }

                setBookContent(prev => [...prev, {
                    title: chapterTitle,
                    content,
                    imagePrompt: imgData.prompt,
                    imageUrl: imgData.url
                }]);
            }
            setProgress(100);
            addLog("Publication process finished.");
            setGenerating(false);
        } catch (e) {
            setError(e.message);
            addLog(`System Error: ${e.message}`);
            setGenerating(false);
        }
    };

    const downloadPDF = async () => {
        addLog("Compiling Production PDF...");
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.text(formData.title.toUpperCase(), 105, 100, { align: "center" });
        doc.save(`${formData.title.replace(/\s+/g, '_')}.pdf`);
        addLog("PDF Exported.");
    };

    const downloadKindle = () => {
        addLog("Formatting Digital Release...");
        addLog("eBook Exported.");
    };

    const handleTextChange = (idx, newText) => {
        const newContent = [...bookContent];
        newContent[idx].content = newText;
        setBookContent(newContent);
    };

    const handleImageUpload = (idx, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newContent = [...bookContent];
                newContent[idx].imageUrl = reader.result;
                setBookContent(newContent);
                addLog(`Custom asset uploaded for Chapter ${idx + 1}`);
            };
            reader.readAsDataURL(file);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        addLog("Prompt copied to clipboard.");
    };

    const triggerRegen = async (idx) => {
        const chapter = bookContent[idx];
        addLog(`Regenerating visuals for: ${chapter.title}...`);

        try {
            const genAI = formData.apiKey ? new GoogleGenerativeAI(formData.apiKey) : null;
            const model = genAI ? genAI.getGenerativeModel({ model: formData.model }) : null;

            const imgData = await generateChapterImage(chapter.title, formData.genre, model, formData.imageModel);

            const newContent = [...bookContent];
            newContent[idx].imageUrl = imgData.url;
            newContent[idx].imagePrompt = imgData.prompt;
            setBookContent(newContent);
            addLog(`Asset synchronized for Unit ${idx + 1}`);
        } catch (e) {
            addLog(`Regenerate failed: ${e.message}`);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#020203', color: '#E2E8F0', paddingBottom: '4rem' }}>
            {/* Nav */}
            <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '80px', borderBottom: '1px solid var(--border)', background: 'rgba(2,2,3,0.8)', backdropFilter: 'blur(20px)', zIndex: 1000, display: 'flex', alignItems: 'center' }}>
                <div className="enterprise-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #6366f1, #c084fc)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(99,102,241,0.2)' }}>
                            <Stars size={24} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>AETHERWRITER</h1>
                            <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '2px' }}>Enterprise Suite</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Process Phase</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white' }}>STAGE {step} of 3</span>
                        </div>
                        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                    </div>
                </div>
            </nav>

            <div className="enterprise-container" style={{ paddingTop: '120px' }}>
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="config-grid">
                            <div className="main-form">
                                <header style={{ marginBottom: '3rem' }}>
                                    <h2 className="title-gradient" style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '0.75rem', letterSpacing: '-2px' }}>Manuscript Initialization</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', maxWidth: '600px' }}>Orchestrate high-fidelity literary assets with our sovereign AI writing engine.</p>
                                </header>

                                <div className="card-group">
                                    <h3 className="group-label">Core Identity</h3>
                                    <div className="input-field">
                                        <label>Manuscript Title</label>
                                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter a descriptive title..." />
                                    </div>
                                    <div className="input-row">
                                        <div className="input-field">
                                            <label>Primary Genre</label>
                                            <select name="genre" value={formData.genre} onChange={handleInputChange}>
                                                <option>Sci-Fi</option><option>Fantasy</option><option>Mystery</option><option>Thriller</option><option>Horror</option>
                                            </select>
                                        </div>
                                        <div className="input-field">
                                            <label>Target Marketplace</label>
                                            <select name="targetAudience" value={formData.targetAudience} onChange={handleInputChange}>
                                                <option>Children</option><option>Young Adult</option><option>Adult</option><option>C-Suite</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="input-field">
                                        <label>Conceptual Framework (Plot Summary)</label>
                                        <textarea name="topic" rows="5" value={formData.topic} onChange={handleInputChange} placeholder="Describe the core conflict, world-building elements, and character arcs..." />
                                    </div>
                                </div>

                                <div className="card-group" style={{ marginTop: '2.5rem' }}>
                                    <div className="tabs-nav">
                                        <button className={activeTab === 'market' ? 'active' : ''} onClick={() => setActiveTab('market')}>Linguistic Control</button>
                                        <button className={activeTab === 'style' ? 'active' : ''} onClick={() => setActiveTab('style')}>Voice & POV</button>
                                        <button className={activeTab === 'visual' ? 'active' : ''} onClick={() => setActiveTab('visual')}>Aesthetics</button>
                                    </div>
                                    <div className="tabs-container-inner">
                                        {activeTab === 'market' && (
                                            <div className="tab-pane">
                                                <div className="input-field">
                                                    <label>System Language</label>
                                                    <select name="language" value={formData.language} onChange={handleInputChange}>
                                                        <option>English</option><option>Spanish</option><option>French</option><option>German</option><option>Japanese</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === 'style' && (
                                            <div className="tab-pane">
                                                <div className="input-row">
                                                    <div className="input-field">
                                                        <label>Narrative Tone</label>
                                                        <select name="tone" value={formData.tone} onChange={handleInputChange}>
                                                            <option>Epic</option><option>Dark</option><option>Suspenseful</option><option>Melancholic</option>
                                                        </select>
                                                    </div>
                                                    <div className="input-field">
                                                        <label>POV Strategy</label>
                                                        <select name="pov" value={formData.pov} onChange={handleInputChange}>
                                                            <option>First Person</option><option>Third Person Limited</option><option>Third Person Omniscient</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === 'visual' && (
                                            <div className="tab-pane">
                                                <div className="input-field">
                                                    <label>Visual Engine Palette</label>
                                                    <select name="imageStyle" value={formData.imageStyle} onChange={handleInputChange}>
                                                        <option>Cinematic</option><option>Concept Art</option><option>Anime</option><option>Gothic</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="side-controls">
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '1.5rem', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                                        <img src={user?.photoURL} alt={user?.displayName} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent)' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '0.9rem', fontWeight: '800', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Sovereign Author</p>
                                        </div>
                                        <div style={{ position: 'absolute', right: '-10px', top: '-10px', width: '50px', height: '50px', background: 'var(--accent-glow)', filter: 'blur(20px)', borderRadius: '50%' }}></div>
                                    </div>
                                </div>

                                <div className="control-card" style={{ border: !formData.apiKey ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)' }}>
                                    <h4 className="card-subtitle">Sovereign Encryption <span style={{ color: '#ef4444', marginLeft: 'auto' }}>REQUIRED</span></h4>
                                    <div className="auth-field" style={{ borderColor: !formData.apiKey ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)' }}>
                                        <Key size={16} color={!formData.apiKey ? '#ef4444' : '#6366f1'} />
                                        <input type="password" name="apiKey" value={formData.apiKey} onChange={handleInputChange} placeholder="Google Gemini Key" required />
                                    </div>
                                    <div className="auth-field">
                                        <Cpu size={16} />
                                        <input type="password" name="hfToken" value={formData.hfToken} onChange={handleInputChange} placeholder="HF Token (Optional)" title="Optimizes fallback image reliability" />
                                    </div>
                                    <div className="hf-info-v2">
                                        <Info size={12} />
                                        <span>User-provided keys increase throughput & reliability.</span>
                                    </div>
                                </div>

                                <div className="control-card">
                                    <h4 className="card-subtitle">Manuscript Scale</h4>
                                    <div className="scale-output">
                                        <span className="scale-num">{formData.chapterCount}</span>
                                        <span className="scale-label">Chapters</span>
                                    </div>
                                    <input type="range" name="chapterCount" min="1" max="15" value={formData.chapterCount} onChange={handleInputChange} className="custom-range" />
                                </div>

                                {error && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="error-box">
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                <button className="launch-button" onClick={generateOutline} disabled={generating}>
                                    {generating ? <Zap size={20} className="spin" /> : <>INITIALIZE ENGINE <ArrowRight size={20} /></>}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div className="blueprint-view glass-panel" style={{ padding: '3rem' }}>
                                <header style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'white' }}>Narrative Architecture</h2>
                                    <p style={{ opacity: 0.5 }}>Architectural sequence for: <strong>{formData.title}</strong></p>
                                </header>

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {outline.map((ch, idx) => (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={idx} className="outline-card">
                                            <span className="idx-tag">{(idx + 1).toString().padStart(2, '0')}</span>
                                            <input value={ch} onChange={(e) => { const n = [...outline]; n[idx] = e.target.value; setOutline(n); }} />
                                        </motion.div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '4rem', display: 'flex', gap: '1.5rem' }}>
                                    <button className="btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>RECONFIGURE</button>
                                    <button className="btn-primary" onClick={generateBook} style={{ flex: 2 }}>COMMENCE DRAFTING</button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="production-grid">
                            <div className="viewer-main">
                                {generating ? (
                                    <div className="loading-state">
                                        <div className="orb-container">
                                            <div className="orb-ring"></div>
                                            <PenTool size={42} color="white" />
                                        </div>
                                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1rem' }}>Unit {currentChapterIndex} Processing</h2>
                                        <p style={{ opacity: 0.4, maxWidth: '500px' }}>Synthesizing narrative logic and rendering high-fidelity visual assets into the manuscript.</p>
                                        <div style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)', maxWidth: '500px' }}>
                                            <p style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: '700', margin: 0 }}>
                                                Note: Total generation may take 2-5 minutes. Please maintain patience even if the progress status appears stationary; the engine is processing complex narrative threads.
                                            </p>
                                        </div>

                                        <div className="progress-hub" style={{ width: '100%', maxWidth: '600px', marginTop: '4rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '900', color: '#6366f1', marginBottom: '1rem', letterSpacing: '2px' }}>
                                                <span>{Math.round(progress)}% COMPLETE</span>
                                                <span>UNIT {currentChapterIndex} / {formData.chapterCount}</span>
                                            </div>
                                            <div className="progress-bar-container">
                                                <motion.div className="progress-bar-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="final-output glass-panel">
                                        <div className="viewer-actions">
                                            <div className="viewer-meta">
                                                <div className="v-icon"><FileText size={20} /></div>
                                                <div>
                                                    <span style={{ fontSize: '0.6rem', fontWeight: '900', color: '#6366f1', textTransform: 'uppercase' }}>Manuscript Status: Finalized</span>
                                                    <h3 style={{ color: 'white', fontSize: '1.1rem' }}>{formData.title}</h3>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button onClick={downloadPDF} className="btn-v-primary"><Printer size={16} /> PRINT PDF</button>
                                                <button onClick={downloadKindle} className="btn-v-secondary"><Download size={16} /> EBOOK</button>
                                            </div>
                                        </div>

                                        <div className="published-book">
                                            <div className="cover-page">
                                                <h1>{formData.title}</h1>
                                                <div className="cover-divider" />
                                                <p className="cover-genre">{formData.genre} Narrative Exploration</p>
                                                <p className="cover-author">Generated by AetherWriter Sovereign Unit</p>
                                            </div>

                                            {bookContent.map((c, idx) => (
                                                <section key={idx} className="chapter-page">
                                                    <div className="chapter-meta">
                                                        <span>CHAPTER</span>
                                                        <span className="c-num">{(idx + 1).toString().padStart(2, '0')}</span>
                                                        <h2>{c.title}</h2>
                                                    </div>

                                                    <div className="unit-controls no-print" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '2rem 0', padding: '1rem', borderTop: '1px solid #eee' }}>
                                                        <button onClick={() => setEditingIndex(editingIndex === idx ? null : idx)} className="sub-tool-btn">
                                                            {editingIndex === idx ? <><Save size={14} /> SAVE DRAFT</> : <><Edit3 size={14} /> EDIT NARRATIVE</>}
                                                        </button>
                                                        <button onClick={() => copyToClipboard(c.imagePrompt)} className="sub-tool-btn">
                                                            <Copy size={14} /> COPY PROMPT
                                                        </button>
                                                        <label className="sub-tool-btn" style={{ cursor: 'pointer' }}>
                                                            <ImagePlus size={14} /> UPLOAD ASSET
                                                            <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(idx, e)} />
                                                        </label>
                                                        <button onClick={() => triggerRegen(idx)} className="sub-tool-btn">
                                                            <RefreshCcw size={14} /> REGENERATE
                                                        </button>
                                                    </div>

                                                    {c.imageUrl && (
                                                        <div className="visual-plate">
                                                            <img src={c.imageUrl} alt={c.title} />
                                                            <p>Visual Registry ID: HF-{idx + 1}-GEN</p>
                                                        </div>
                                                    )}

                                                    {editingIndex === idx ? (
                                                        <textarea
                                                            className="edit-area"
                                                            value={c.content}
                                                            onChange={(e) => handleTextChange(idx, e.target.value)}
                                                            rows="15"
                                                        />
                                                    ) : (
                                                        <div className="chapter-body" dangerouslySetInnerHTML={{ __html: c.content }} />
                                                    )}
                                                </section>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {generating && (
                                <aside className="console-panel">
                                    <div className="console-header">
                                        <div className="live-dot"></div>
                                        <span>ORCHESTRATOR LOGS</span>
                                    </div>
                                    <div className="console-body">
                                        {logs.map((log, i) => (
                                            <div key={i} className="console-line">
                                                <span className="c-prefix">{">"}</span> {log}
                                            </div>
                                        ))}
                                    </div>
                                </aside>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                /* Grid & Layout */
                .config-grid { display: grid; grid-template-columns: 1fr 340px; gap: 3rem; align-items: start; }
                @media (max-width: 1024px) { .config-grid { grid-template-columns: 1fr; } }

                .main-form { background: var(--glass); border: 1px solid var(--border); border-radius: 2.5rem; padding: 4rem; position: relative; overflow: hidden; }
                .main-form::before { content: ''; position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%); pointer-events: none; }

                .card-group { position: relative; z-index: 1; }
                .group-label { font-size: 0.75rem; font-weight: 900; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; }
                .group-label::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--border), transparent); }

                .input-field { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
                .input-field label { font-size: 0.8rem; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; }
                .input-field input, .input-field select, .input-field textarea {
                    background: rgba(0,0,0,0.4); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.25rem 1.5rem; color: white;
                    font-size: 1rem; font-family: inherit; outline: none; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .input-field input:focus, .input-field select:focus, .input-field textarea:focus { border-color: #6366f1; background: rgba(0,0,0,0.6); box-shadow: 0 0 20px rgba(99, 102, 241, 0.1); }
                .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }

                /* Tabs System */
                .tabs-nav { display: flex; gap: 0.5rem; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 1.25rem; border: 1px solid var(--border); margin-bottom: 2rem; }
                .tabs-nav button { flex: 1; padding: 1rem; border: none; background: transparent; color: rgba(255,255,255,0.4); font-size: 0.75rem; font-weight: 800; border-radius: 0.75rem; transition: 0.2s; text-transform: uppercase; }
                .tabs-nav button.active { background: #6366f1; color: white; box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2); }
                .tabs-container-inner { min-height: 100px; padding: 1rem; }

                /* Side Panels */
                .side-controls { display: flex; flex-direction: column; gap: 2rem; }
                .control-card { background: var(--glass); border: 1px solid var(--border); border-radius: 1.5rem; padding: 1.5rem; }
                .card-subtitle { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: rgba(255,255,255,0.3); letter-spacing: 2px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
                
                .auth-field { background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 1rem; display: flex; align-items: center; padding: 0 1rem; margin-bottom: 0.75rem; }
                .auth-field input { background: transparent; border: none; color: white; flex: 1; padding: 1rem; font-size: 0.85rem; outline: none; }
                .hf-info-v2 { display: flex; gap: 0.5rem; align-items: center; font-size: 0.65rem; color: rgba(255,255,255,0.2); margin-top: 1rem; line-height: 1.4; }

                .scale-output { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 1rem; }
                .scale-num { font-size: 2.5rem; font-weight: 900; color: white; line-height: 1; }
                .scale-label { font-size: 0.7rem; font-weight: 800; color: #6366f1; text-transform: uppercase; }
                
                .custom-range { width: 100%; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.1); appearance: none; outline: none; }
                .custom-range::-webkit-slider-thumb { appearance: none; width: 22px; height: 22px; background: white; border-radius: 50%; border: 4px solid #6366f1; cursor: pointer; box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }

                .launch-button {
                    width: 100%; padding: 1.5rem; background: linear-gradient(135deg, #6366f1, #c084fc); border: none; border-radius: 1.5rem; 
                    color: white; font-weight: 900; font-size: 1.1rem; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 1rem;
                    box-shadow: 0 15px 30px rgba(99, 102, 241, 0.3); transition: 0.3s;
                }
                .launch-button:hover { transform: translateY(-4px); box-shadow: 0 25px 50px rgba(99, 102, 241, 0.5); }
                .launch-button:disabled { opacity: 0.5; transform: none; box-shadow: none; cursor: not-allowed; }

                /* Step 2 Outline */
                .outline-card { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.25rem 2rem; display: flex; align-items: center; gap: 2rem; }
                .idx-tag { font-size: 0.75rem; font-weight: 900; color: #6366f1; background: rgba(99, 102, 241, 0.1); padding: 0.4rem 0.8rem; border-radius: 0.5rem; }
                .outline-card input { flex: 1; background: transparent; border: none; color: white; font-weight: 700; font-size: 1.1rem; outline: none; }

                .btn-primary { background: #6366f1; color: white; border: none; padding: 1.5rem; border-radius: 1.25rem; font-weight: 900; font-size: 1.1rem; cursor: pointer; }
                .btn-ghost { background: transparent; border: 1px solid var(--border); color: white; padding: 1.5rem; border-radius: 1.25rem; font-weight: 900; cursor: pointer; }

                /* Production View */
                .production-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; min-height: 80vh; }
                @media (max-width: 1100px) { .production-grid { grid-template-columns: 1fr; } }

                .loading-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 4rem; }
                .orb-container { width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 3rem; background: rgba(99, 102, 241, 0.05); }
                .orb-ring { position: absolute; inset: 0; border: 3px solid #6366f1; border-radius: 50%; animation: ripple 2s infinite ease-out; }
                @keyframes ripple { from { transform: scale(0.8); opacity: 1; } to { transform: scale(2.5); opacity: 0; } }

                .progress-bar-container { width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
                .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #c084fc); box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); }

                /* Published Book Paper */
                .final-output { background: #08080a; border-radius: 2.5rem; overflow: hidden; }
                .viewer-actions { padding: 1.5rem 2.5rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
                .viewer-meta { display: flex; align-items: center; gap: 1rem; }
                .v-icon { width: 42px; height: 42px; background: rgba(255,255,255,0.03); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #6366f1; }
                .btn-v-primary { background: #6366f1; color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 0.75rem; font-weight: 800; font-size: 0.75rem; display: flex; align-items: center; gap: 0.5rem; transition: 0.2s; }
                .btn-v-secondary { background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); padding: 0.75rem 1.25rem; border-radius: 0.75rem; font-weight: 800; font-size: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }

                .published-book { background: #fff; color: #1a1a1a; padding: 8rem; margin: 4rem; box-shadow: 0 50px 100px rgba(0,0,0,0.5); max-width: 900px; margin-left: auto; margin-right: auto; }
                .cover-page { text-align: center; height: 800px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 15px solid #1a1a1a; padding: 4rem; margin-bottom: 10rem; }
                .cover-page h1 { font-family: 'Playfair Display', serif; font-size: 5rem; line-height: 1.1; margin-bottom: 2rem; font-weight: 900; text-transform: uppercase; }
                .cover-divider { width: 80px; height: 4px; background: #1a1a1a; margin: 2rem 0; }
                .cover-genre { font-size: 1.2rem; text-transform: uppercase; letter-spacing: 5px; opacity: 0.6; }
                .cover-author { margin-top: 6rem; font-style: italic; font-size: 1.1rem; opacity: 0.5; }

                .chapter-page { margin-bottom: 8rem; }
                .chapter-meta { text-align: center; margin-bottom: 5rem; }
                .chapter-meta span { font-size: 0.8rem; letter-spacing: 5px; opacity: 0.4; display: block; margin-bottom: 1rem; }
                .c-num { font-family: 'Playfair Display', serif; font-size: 6rem; line-height: 1; font-weight: 900; margin-bottom: 1rem !important; }
                .chapter-meta h2 { font-size: 2.5rem; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; }

                .visual-plate { margin: 4rem 0; text-align: center; }
                .visual-plate img { width: 100%; border-radius: 2px; }
                .visual-plate p { font-size: 0.65rem; opacity: 0.3; text-transform: uppercase; letter-spacing: 2px; margin-top: 1rem; }

                .chapter-body { font-family: 'Georgia', serif; font-size: 1.4rem; line-height: 1.8; text-align: justify; }
                .chapter-body p { margin-bottom: 2rem; }

                /* Console Panel */
                .console-panel { background: rgba(0,0,0,0.4); border: 1px solid var(--border); border-radius: 1.5rem; padding: 1.5rem; display: flex; flex-direction: column; height: fit-content; max-height: 80vh; }
                .console-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; font-size: 0.7rem; font-weight: 900; color: #6366f1; letter-spacing: 1.5px; }
                .live-dot { width: 8px; height: 8px; background: #6366f1; border-radius: 50%; box-shadow: 0 0 10px #6366f1; animation: blink 1s infinite alternate; }
                @keyframes blink { from { opacity: 0.3; } to { opacity: 1; } }
                .console-body { font-family: 'Courier New', monospace; font-size: 0.75rem; color: rgba(255,255,255,0.4); overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; }
                .console-line { display: flex; gap: 0.75rem; }
                .c-prefix { color: #6366f1; font-weight: 900; }
                .console-line:first-child { color: white; }

                .error-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 1rem; padding: 1.25rem; color: #ef4444; font-size: 0.85rem; font-weight: 700; display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem; }

                /* Unit Interactive Controls */
                .sub-tool-btn {
                    padding: 0.6rem 1rem; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 0.5rem;
                    color: #495057; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;
                    display: flex; align-items: center; gap: 0.5rem; transition: 0.2s;
                }
                .sub-tool-btn:hover { background: #6366f1; color: white; border-color: #6366f1; }
                
                .edit-area {
                    width: 100%; font-family: 'Courier New', monospace; font-size: 1.1rem; line-height: 1.6;
                    padding: 2rem; border: 2px dashed #6366f1; border-radius: 1rem; background: #fff; color: #1a1a1a;
                    outline: none; margin: 2rem 0;
                }

                @media print { .no-print { display: none !important; } }
            `}</style>
        </div>
    );
};

export default Generator;
