import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, Check, User as UserIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import Navbar from "@/components/Navbar";

const Users = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setCurrentUser(parsed);
            fetchUsers(parsed.id || parsed._id);
        }
    }, []);

    const fetchUsers = async (excludeId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users?exclude=${excludeId}`);
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowRequest = async (receiverId: string) => {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/follow/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    senderId: currentUser.id || currentUser._id,
                    receiverId
                })
            });
            if (res.ok) {
                toast.success("Follow request sent!");
                // Update local state to show 'Requested'
                setUsers(users.map(u => u._id === receiverId ? { ...u, requested: true } : u));
            }
        } catch (err) {
            toast.error("Failed to send request");
        }
    };

    const filteredUsers = users.filter(u =>
        u.displayName.toLowerCase().includes(search.toLowerCase()) ||
        u.department?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <Navbar currentUser={currentUser} />
            <div className="pt-24 px-4 md:px-8 pb-12">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-black mb-2 glow-text">Discover Peers</h1>
                            <p className="text-muted-foreground">Find and connect with fellow students from your campus.</p>
                        </div>

                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by name or department..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input-glass pl-10 w-full"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {filteredUsers.map((user, idx) => (
                                    <motion.div
                                        key={user._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="glass-card group p-6 flex flex-col items-center text-center relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-3">
                                            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                {user.role}
                                            </span>
                                        </div>

                                        <div className="w-20 h-20 rounded-full border-2 border-primary/30 p-1 mb-4 group-hover:border-primary transition-colors">
                                            <img
                                                src={user.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`}
                                                className="w-full h-full rounded-full object-cover"
                                                alt={user.displayName}
                                            />
                                        </div>

                                        <h3 className="text-xl font-bold mb-1">{user.displayName}</h3>
                                        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-tighter">
                                            {user.department || "No Department Set"}
                                        </p>

                                        <div className="flex items-center gap-3 w-full mt-auto pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => handleFollowRequest(user._id)}
                                                disabled={user.requested}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${user.requested
                                                    ? "bg-accent/50 text-muted-foreground cursor-not-allowed"
                                                    : "bg-primary text-primary-foreground hover:scale-[1.02] shadow-lg shadow-primary/20"
                                                    }`}
                                            >
                                                {user.requested ? (
                                                    <>
                                                        <Clock className="w-4 h-4" />
                                                        Requested
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus className="w-4 h-4" />
                                                        Follow
                                                    </>
                                                )}
                                            </button>

                                            <button className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                                <UserIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Users;
