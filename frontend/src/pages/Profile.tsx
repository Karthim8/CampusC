import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Scene3D from "@/components/Scene3D";
import { API_BASE_URL } from "@/lib/api";
import Navbar from "@/components/Navbar";

const Profile = () => {
    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        displayName: "",
        department: "",
        college: "",
        year: "",
        class: "",
        placedAt: "",
        leetCodeHandle: "",
        codeForcesHandle: ""
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (storedUser.email) {
            fetchProfile(storedUser.email);
        }
    }, []);

    const fetchProfile = async (email: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/profile?email=${email}`);
            const data = await response.json();
            if (response.ok) {
                setUser(data);
                setFormData({
                    displayName: data.displayName || "",
                    department: data.department || "",
                    college: data.college || "",
                    year: data.year || "",
                    class: data.class || "",
                    placedAt: data.placedAt || "",
                    leetCodeHandle: data.leetCodeHandle || "",
                    codeForcesHandle: data.codeForcesHandle || ""
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, ...formData }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("Profile updated!");
                setUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
                setIsEditing(false);
            } else {
                toast.error(data.message || "Update failed");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return <div className="text-white text-center mt-20">Loading...</div>;

    return (
        <div className="relative min-h-screen bg-background overflow-x-hidden">
            <Navbar currentUser={user} />
            <Scene3D />
            <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 md:p-12 mb-8"
                >
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                        <div className="relative">
                            <img
                                src={user.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`}
                                alt="Avatar"
                                className="h-32 w-32 rounded-full border-4 border-primary shadow-[0_0_20px_rgba(23,94,80,0.3)]"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </div>
                        </div>

                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-bold glow-text mb-2">{user.displayName}</h1>
                            <p className="text-muted-foreground mb-4">{user.email}</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm border border-primary/20">
                                    {user.role || 'Student'}
                                </span>
                                {user.department && (
                                    <span className="bg-white/5 text-white/70 px-3 py-1 rounded-full text-sm border border-white/10">
                                        {user.department}
                                    </span>
                                )}
                                {user.placedAt && (
                                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm border border-emerald-500/20">
                                        Placed @ {user.placedAt}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <section>
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full"></span>
                                Academic Details
                            </h2>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                                        <input
                                            className="input-glass w-full"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">College</label>
                                        <input
                                            className="input-glass w-full"
                                            value={formData.college}
                                            onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Department</label>
                                            <input
                                                className="input-glass w-full"
                                                value={formData.department}
                                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Year</label>
                                            <input
                                                className="input-glass w-full"
                                                value={formData.year}
                                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <DetailItem label="College" value={user.college || "Not set"} />
                                    <DetailItem label="Department" value={user.department || "Not set"} />
                                    <DetailItem label="Graduation Year" value={user.year || "Not set"} />
                                    <DetailItem label="Class/Section" value={user.class || "Not set"} />
                                </div>
                            )}
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full"></span>
                                Professional & Coding
                            </h2>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Placed At (Company)</label>
                                        <input
                                            className="input-glass w-full"
                                            value={formData.placedAt}
                                            onChange={(e) => setFormData({ ...formData, placedAt: e.target.value })}
                                            placeholder="e.g. Google, TCS, Startup"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">LeetCode Username</label>
                                        <input
                                            className="input-glass w-full"
                                            value={formData.leetCodeHandle}
                                            onChange={(e) => setFormData({ ...formData, leetCodeHandle: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Codeforces Username</label>
                                        <input
                                            className="input-glass w-full"
                                            value={formData.codeForcesHandle}
                                            onChange={(e) => setFormData({ ...formData, codeForcesHandle: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <DetailItem label="Status" value={user.placedAt ? `Placed at ${user.placedAt}` : "Actively Searching"} />
                                    <DetailItem label="LeetCode" value={user.leetCodeHandle || "No handle"} />
                                    <DetailItem label="Codeforces" value={user.codeForcesHandle || "No handle"} />
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex justify-end gap-4">
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="btn-google">Cancel</button>
                                <button onClick={handleUpdate} disabled={isLoading} className="btn-primary">
                                    {isLoading ? "Saving..." : "Save Profile"}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="btn-primary">Edit Profile</button>
                        )}
                    </div>
                </motion.div>

                <button
                    onClick={() => window.location.href = "/dashboard"}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

const DetailItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
    </div>
);

export default Profile;
