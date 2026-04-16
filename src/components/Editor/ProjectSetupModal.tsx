import React, { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectIO } from '../../hooks/useProjectIO';
import { useNotificationStore } from '../../store/useNotificationStore';
import { GridConfig } from '../../types/map';
import { 
    Layout, User, Grid, X, ArrowRight, FolderOpen, Heart, 
    Github, ExternalLink, Loader2, Crown, Trophy, ShieldCheck, Coffee
} from 'lucide-react';
import { clsx } from 'clsx';

interface Contributor {
    login: string;
    avatar_url: string;
    html_url: string;
    contributions: number;
}

type TabType = 'setup' | 'credits';

export const ProjectSetupModal: React.FC = () => {
    const { id, name, author, defaultGridType, newProject, updateProjectMetadata } = useProjectStore();
    const { isProjectSetupOpen, setIsProjectSetupOpen } = useEditorStore();
    const { triggerBundleImport } = useProjectIO();
    const { showToast } = useNotificationStore();

    // Critical: Declare this before useEffect use
    const isInitialSetup = !id;

    const [activeTab, setActiveTab] = useState<TabType>('setup');
    const [localName, setLocalName] = useState(name || 'My Awesome Map Pack');
    const [localAuthor, setLocalAuthor] = useState(author || '');
    const [localGrid, setLocalGrid] = useState<GridConfig['type']>(defaultGridType || 'square');

    // Sync with store when modal is opened for editing
    useEffect(() => {
        if (isProjectSetupOpen || isInitialSetup) {
            setLocalName(name || 'My Awesome Map Pack');
            setLocalAuthor(author || '');
            setLocalGrid(defaultGridType || 'square');
        }
    }, [isProjectSetupOpen, isInitialSetup, name, author, defaultGridType]);

    // GitHub Contributors State
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (activeTab === 'credits' && contributors.length === 0) {
            fetchContributors();
        }
    }, [activeTab]);

    const fetchContributors = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await fetch('https://api.github.com/repos/roodriiigooo/PWNAGOTCHI-CUSTOM-FACES-MOD/contributors');
            if (!response.ok) throw new Error('Failed to fetch');
            const data: Contributor[] = await response.json();
            // Sort by contributions descending
            setContributors(data.sort((a, b) => b.contributions - a.contributions));
        } catch (err) {
            console.error('Error fetching contributors:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    // Filter author from the main list for the special card
    const mainAuthor = useMemo(() => contributors.find(c => c.login === 'roodriiigooo'), [contributors]);
    const otherContributors = useMemo(() => contributors.filter(c => c.login !== 'roodriiigooo'), [contributors]);

    if (!isProjectSetupOpen && !isInitialSetup) return null;

    const handleConfirm = () => {
        if (isInitialSetup) {
            newProject({
                name: localName,
                author: localAuthor,
                defaultGridType: localGrid
            });
        } else {
            updateProjectMetadata({
                name: localName,
                author: localAuthor,
                defaultGridType: localGrid
            });
        }
        setIsProjectSetupOpen(false);
    };

    const handleLoadProject = () => {
        triggerBundleImport();
        setIsProjectSetupOpen(false);
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown size={14} className="text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]" />;
        if (index === 1) return <Trophy size={14} className="text-[#C0C0C0] drop-shadow-[0_0_8px_rgba(192,192,192,0.4)]" />;
        if (index === 2) return <Trophy size={14} className="text-[#CD7F32] drop-shadow-[0_0_8px_rgba(205,127,50,0.4)]" />;
        return null;
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 font-sans text-main">
            <div className="bg-panel border border-theme rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                
                {/* Tabs Navigation */}
                <div className="flex bg-black/40 p-2 gap-2 border-b border-theme shrink-0">
                    <button 
                        onClick={() => setActiveTab('setup')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'setup' ? "bg-orange-600 text-white shadow-lg shadow-orange-900/40" : "text-muted hover:bg-black/20"
                        )}
                    >
                        <Layout size={14} /> Project Setup
                    </button>
                    <button 
                        onClick={() => setActiveTab('credits')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'credits' ? "bg-pink-600 text-white shadow-lg shadow-pink-900/40" : "text-muted hover:bg-black/20"
                        )}
                    >
                        <Heart size={14} /> Contributors
                    </button>
                </div>

                {/* Header */}
                <div className="p-8 border-b border-theme bg-black/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={clsx(
                            "p-4 rounded-2xl text-white shadow-lg",
                            activeTab === 'setup' ? "bg-orange-600 shadow-orange-900/40" : "bg-pink-600 shadow-pink-900/40"
                        )}>
                            {activeTab === 'setup' ? <Layout size={28} /> : <Heart size={28} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-widest text-main leading-tight">
                                {activeTab === 'setup' 
                                    ? (isInitialSetup ? 'New Project' : 'Project Settings')
                                    : 'Special Thanks'}
                            </h2>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-tighter opacity-60">
                                {activeTab === 'setup' 
                                    ? 'Configure your workspace parameters' 
                                    : 'The amazing people behind our assets and code'}
                            </p>
                        </div>
                    </div>
                    {!isInitialSetup && (
                        <button 
                            onClick={() => setIsProjectSetupOpen(false)}
                            className="p-3 hover:bg-black/20 rounded-2xl text-muted hover:text-main transition-all"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {activeTab === 'setup' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Project Name */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-500 tracking-widest">
                                    <Layout size={14} /> Project Name
                                </label>
                                <input 
                                    type="text"
                                    value={localName}
                                    onChange={(e) => setLocalName(e.target.value)}
                                    placeholder="e.g. The Lost Mines of Phandelver"
                                    className="w-full bg-black/40 border border-theme rounded-2xl px-5 py-4 text-sm text-main placeholder:text-muted/30 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold"
                                />
                            </div>

                            {/* Author */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-500 tracking-widest">
                                    <User size={14} /> Author / Creator
                                </label>
                                <input 
                                    type="text"
                                    value={localAuthor}
                                    onChange={(e) => setLocalAuthor(e.target.value)}
                                    placeholder="Your name or pseudonym"
                                    className="w-full bg-black/40 border border-theme rounded-2xl px-5 py-4 text-sm text-main placeholder:text-muted/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                                />
                            </div>

                            {/* Default Grid Type */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 tracking-widest">
                                    <Grid size={14} /> Default Grid Style
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {(['square', 'hex-pointy', 'hex-flat', 'none'] as const).map((type) => {
                                        const isDisabled = type === 'hex-pointy' || type === 'hex-flat';
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    if (isDisabled) {
                                                        showToast('Hexagonal grids are coming soon!', 'info');
                                                        return;
                                                    }
                                                    setLocalGrid(type);
                                                }}
                                                className={clsx(
                                                    "px-3 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border flex flex-col items-center justify-center gap-3 relative overflow-hidden",
                                                    localGrid === type 
                                                        ? "bg-emerald-600/10 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-900/10" 
                                                        : "bg-black/20 border-theme text-muted hover:border-muted hover:bg-black/40",
                                                    isDisabled && "opacity-40 cursor-not-allowed grayscale"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "p-2 rounded-lg",
                                                    localGrid === type ? "bg-emerald-600 text-white" : "bg-black/20"
                                                )}>
                                                    <Grid size={16} />
                                                </div>
                                                {type.replace('-', ' ')}
                                                {isDisabled && (
                                                    <div className="absolute top-1 right-1">
                                                        <div className="bg-orange-500/20 text-orange-500 text-[6px] px-1.5 py-0.5 rounded-full border border-orange-500/30">
                                                            SOON
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[9px] text-muted/50 font-bold italic text-center pt-2">
                                    * This will be the default grid for all new levels in this project.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 size={40} className="text-pink-500 animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Fetching contributors...</p>
                                </div>
                            ) : error ? (
                                <div className="p-8 bg-red-950/20 border border-red-900/30 rounded-3xl text-center space-y-4">
                                    <Github size={32} className="mx-auto text-red-500" />
                                    <p className="text-xs font-bold text-red-400">Failed to load contributors from GitHub.</p>
                                    <button 
                                        onClick={fetchContributors}
                                        className="px-6 py-2 bg-red-900/40 hover:bg-red-800/40 text-red-200 rounded-xl text-[10px] font-black uppercase transition-all"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : otherContributors.length > 0 ? (
                                <div className="max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {otherContributors.map((c, index) => (
                                            <a 
                                                key={c.login}
                                                href={c.html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center gap-4 p-3.5 bg-black/20 hover:bg-black/40 border border-theme hover:border-pink-500/50 rounded-[1.5rem] transition-all"
                                            >
                                                <div className="relative shrink-0">
                                                    <img 
                                                        src={c.avatar_url} 
                                                        alt={c.login} 
                                                        className="w-10 h-10 rounded-full border-2 border-theme group-hover:border-pink-500 transition-colors shadow-lg"
                                                    />
                                                    {index < 3 && (
                                                        <div className="absolute -bottom-1 -right-1 bg-black/80 text-white p-1 rounded-full border border-theme shadow-lg group-hover:bg-pink-600 transition-colors">
                                                            {getRankIcon(index)}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-xs font-black text-main uppercase tracking-tight">{c.login}</h3>
                                                        {index < 3 && (
                                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest shadow-sm" style={{ 
                                                                backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                                                                color: index === 2 ? '#FFFFFF' : '#000000'
                                                            }}>
                                                                TOP {index + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] font-bold text-muted uppercase tracking-tighter opacity-60">
                                                        {c.contributions} Contributions
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 text-[8px] font-black text-pink-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all pr-2 translate-x-2 group-hover:translate-x-0">
                                                    Profile <ExternalLink size={10} />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                                    <span className="text-4xl grayscale">😔</span>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted text-center leading-loose">
                                        There are no contributions<br/>for this project yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer / Action */}
                <div className="relative p-8 pt-4 border-t border-theme shrink-0 space-y-4 bg-black/20">
                    {activeTab === 'setup' ? (
                        <>
                            <button 
                                onClick={handleConfirm}
                                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-orange-900/40 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 group"
                            >
                                {isInitialSetup ? 'Create Project' : 'Save Changes'}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            {isInitialSetup && (
                                <>
                                    <div className="flex items-center gap-4 py-1">
                                        <div className="h-px flex-1 bg-theme opacity-50" />
                                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">OR</span>
                                        <div className="h-px flex-1 bg-theme opacity-50" />
                                    </div>

                                    <button 
                                        onClick={handleLoadProject}
                                        className="w-full bg-black/40 hover:bg-black/60 border border-theme text-muted hover:text-main font-black py-5 rounded-3xl transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 group"
                                    >
                                        <FolderOpen size={18} className="text-orange-500" />
                                        Load Saved Project (.zip)
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-500">
                            {/* Minimalist Author Card */}
                            {mainAuthor && (
                                <a 
                                    href={mainAuthor.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-4 p-3 bg-orange-600/10 border border-orange-500/20 hover:border-orange-500/40 rounded-2xl transition-all"
                                >
                                    <div className="w-8 h-8 rounded-full border border-orange-500/30 overflow-hidden shrink-0">
                                        <img src={mainAuthor.avatar_url} alt="Author" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Project Lead</span>
                                            <ShieldCheck size={10} className="text-orange-500" />
                                        </div>
                                        <h4 className="text-[11px] font-black text-main uppercase tracking-tight">{mainAuthor.login}</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a 
                                            href="https://buymeacoffee.com/rodrigoo"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-orange-600/20 hover:bg-orange-600/40 text-orange-500 rounded-xl transition-all group/coffee"
                                            title="Buy me a coffee"
                                        >
                                            <Coffee size={14} className="group-hover/coffee:scale-110 transition-transform" />
                                        </a>
                                        <div className="px-3 py-1 bg-orange-600 text-[8px] font-black text-white rounded-lg uppercase tracking-widest group-hover:scale-105 transition-transform">
                                            Creator
                                        </div>
                                    </div>
                                </a>
                            )}
                            
                            <p className="text-[9px] font-black text-center text-muted/40 uppercase tracking-[0.2em] leading-relaxed">
                                Made with <Heart size={10} className="inline text-pink-600 mx-0.5 mb-0.5 fill-pink-600/20" /> by the open source community
                            </p>
                        </div>
                    )}
                    
                    <p className="text-[9px] text-muted text-center font-bold uppercase tracking-tighter opacity-20">
                        {isInitialSetup ? 'Session data is persistent in local storage' : `Project Reference: ${id}`}
                    </p>
                </div>
            </div>
        </div>
    );
};
