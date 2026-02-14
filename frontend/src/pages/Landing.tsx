import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { API_BASE_URL } from "@/lib/api";
import Navbar from "@/components/Navbar";

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", type: "general" });
    const mainRef = useRef<HTMLDivElement>(null);

    const { scrollY } = useScroll();
    const navOpacity = useTransform(scrollY, [0, 100], [0, 1]);
    const navBlur = useTransform(scrollY, [0, 100], [0, 12]);

    useEffect(() => {
        fetchAnnouncements();
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser && storedUser !== "undefined") setUser(JSON.parse(storedUser));
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
        }
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/announcements`);
            const data = await res.json();
            setAnnouncements(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePostAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || user.role === 'student') return toast.error("Only Admins/Secretaries can post announcements");

        try {
            const res = await fetch(`${API_BASE_URL}/api/announcements`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newAnnouncement, postedBy: user.id || user._id })
            });
            if (res.ok) {
                toast.success("Announcement posted successfully!");
                setIsPosting(false);
                setNewAnnouncement({ title: "", content: "", type: "general" });
                fetchAnnouncements();
            }
        } catch (err) {
            toast.error("Failed to post announcement");
        }
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'secretary';

    return (
        <div ref={mainRef} className="relative min-h-screen bg-background overflow-x-hidden selection:bg-primary/30">

            <Navbar currentUser={user} />

            {/* Hero Section */}
            <section className="relative z-10 flex flex-col items-center justify-center min-h-[100vh] px-4 pt-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-4xl"
                >
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 rounded-full border border-primary/20"
                    >
                        Connecting Seniors & Juniors
                    </motion.span>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
                        Build Your <br />
                        <span className="glow-text bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-400 to-primary">Future</span> Together
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                        The ultimate campus hub for sharing notes, real-time career guidance,
                        and collaborative study rooms. Bridge the gap and grow together.
                    </p>

                    <div className="flex flex-wrap justify-center gap-6">
                        <Link to="/register" className="btn-primary flex items-center gap-3 px-10 py-5 text-lg font-bold shadow-[0_0_30px_rgba(23,94,80,0.3)]">
                            Get Started
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </Link>
                        <button onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`} className="btn-google px-10 py-5 text-lg font-bold border border-white/10 hover:border-primary/50 backdrop-blur-md">
                            Sign In
                        </button>
                    </div>
                </motion.div>

                {/* Floating Stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-24"
                >
                    <StatItem label="Active Students" value="2K+" />
                    <StatItem label="Shared Notes" value="500+" />
                    <StatItem label="Study Rooms" value="50+" />
                    <StatItem label="Placements" value="100+" />
                </motion.div>
            </section>

            {/* Announcements Section */}
            <section className="relative z-10 py-32 px-4 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Latest <span className="text-primary italic">Announcements</span></h2>
                        <p className="text-muted-foreground text-lg">Stay updated with the latest happenings on campus.</p>
                    </motion.div>

                    {isAdmin && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsPosting(true)}
                            className="btn-primary px-6 py-3 flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        >
                            Post Announcement
                        </motion.button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {announcements.length > 0 ? (
                        announcements.map((ann, i) => (
                            <AnnouncementCard key={ann._id} ann={ann} index={i} />
                        ))
                    ) : (
                        <div className="col-span-full py-20 glass-card text-center flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">No announcements yet</h3>
                                <p className="text-muted-foreground">Check back later for exciting college updates.</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Features Grid */}
            <section className="relative z-10 py-32 px-4 bg-white/2 backdrop-blur-xl border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <FeatureCard
                            title="Resource Sharing"
                            description="Access premium notes, previous year papers, and curated resources shared by top-performing seniors."
                            icon="📚"
                        />
                        <FeatureCard
                            title="Real-time Mentorship"
                            description="Chat instantly with seniors in your department. Get advice on subjects, projects, and career paths."
                            icon="💬"
                        />
                        <FeatureCard
                            title="Campus Updates"
                            description="Stay informed about hackathons, club activities, and official college announcements in one place."
                            icon="📢"
                        />
                    </div>
                </div>
            </section>

            {/* Post Modal */}
            <AnimatePresence>
                {isPosting && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPosting(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="glass-card relative z-10 w-full max-w-xl p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-primary/20"
                        >
                            <h2 className="text-3xl font-black mb-8 glow-text">Post Announcement</h2>
                            <form onSubmit={handlePostAnnouncement} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Title</label>
                                    <input
                                        className="input-glass w-full text-lg"
                                        required
                                        value={newAnnouncement.title}
                                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                        placeholder="e.g. Annual Tech Hackathon 2024"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Type</label>
                                    <select
                                        className="input-glass w-full"
                                        value={newAnnouncement.type}
                                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                                    >
                                        <option value="general">General</option>
                                        <option value="hackathon">Hackathon</option>
                                        <option value="club">Club Activity</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Content</label>
                                    <textarea
                                        className="input-glass w-full min-h-[150px] py-4"
                                        required
                                        value={newAnnouncement.content}
                                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                        placeholder="Provide all the details about the event..."
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setIsPosting(false)} className="btn-google flex-1 py-4 uppercase font-bold tracking-widest">Cancel</button>
                                    <button type="submit" className="btn-primary flex-1 py-4 uppercase font-bold tracking-widest">Post Live</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};


const StatItem = ({ label, value }: { label: string; value: string }) => (
    <div className="text-center group cursor-default">
        <motion.div
            whileHover={{ scale: 1.1, color: "var(--primary)" }}
            className="text-5xl font-black text-white transition-colors tracking-tight"
        >
            {value}
        </motion.div>
        <div className="text-xs text-muted-foreground uppercase font-black tracking-widest mt-2 bg-white/5 py-1 px-3 rounded-full border border-white/5">{label}</div>
    </div>
);

const FeatureCard = ({ title, description, icon }: { title: string; description: string; icon: string }) => (
    <motion.div
        whileHover={{ y: -10, scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card p-10 border border-white/5 hover:border-primary/50 transition-all duration-500 overflow-hidden relative group"
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors"></div>
        <div className="text-5xl mb-8">{icon}</div>
        <h3 className="text-2xl font-black mb-4 text-white uppercase tracking-tighter">{title}</h3>
        <p className="text-muted-foreground leading-relaxed text-base">{description}</p>
    </motion.div>
);

const AnnouncementCard = ({ ann, index }: { ann: any, index: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        whileHover={{ x: 5 }}
        className="glass-card p-8 border-l-4 border-l-primary flex flex-col relative group overflow-hidden"
    >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
        </div>

        <div className="flex justify-between items-center mb-6">
            <span className={`text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1.5 rounded-full ${ann.type === 'hackathon' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                ann.type === 'club' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    'bg-primary/20 text-primary border border-primary/30'
                }`}>
                {ann.type}
            </span>
            <span className="text-xs font-bold text-muted-foreground/50 tabular-nums">
                {new Date(ann.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
        </div>

        <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors tracking-tight">{ann.title}</h3>
        <p className="text-muted-foreground leading-relaxed mb-8 flex-1">{ann.content}</p>

        <div className="flex items-center gap-3 mt-auto pt-6 border-t border-white/5">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                {ann.postedBy?.displayName?.charAt(0) || 'A'}
            </div>
            <div className="text-xs">
                <div className="text-white font-bold">{ann.postedBy?.displayName || 'Campus Admin'}</div>
                <div className="text-muted-foreground/60 uppercase tracking-tighter text-[10px] font-bold">{ann.postedBy?.role || 'Authority'}</div>
            </div>
        </div>
    </motion.div>
);

export default Landing;
