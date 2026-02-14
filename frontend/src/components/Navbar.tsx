import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { LogOut, User as UserIcon, BookOpen, Users as UsersIcon, MessageSquare, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";

interface NavbarProps {
    currentUser?: any;
}

const Navbar = ({ currentUser }: NavbarProps) => {
    const [user, setUser] = useState<any>(currentUser || null);
    const { scrollY } = useScroll();
    const navigate = useNavigate();

    const navOpacity = useTransform(scrollY, [0, 100], [0, 1]);
    const navBlur = useTransform(scrollY, [0, 100], [0, 12]);

    useEffect(() => {
        if (!currentUser) {
            try {
                const storedUser = localStorage.getItem("user");
                if (storedUser && storedUser !== "undefined") {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        } else {
            setUser(currentUser);
        }
    }, [currentUser]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.success("Logged out successfully");
        window.location.href = "/login";
    };

    return (
        <motion.nav
            style={{
                backgroundColor: `rgba(10, 10, 10, ${navOpacity.get() * 0.5})`,
                backdropFilter: `blur(${navBlur.get()}px)`
            }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 transition-all duration-300"
        >
            <Link to="/" className="flex items-center gap-2 group">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(23,94,80,0.4)] group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="text-xl font-bold tracking-tighter text-white group-hover:text-primary transition-colors">CampusConnect</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
                <NavLink to="/resources" icon={<BookOpen className="w-4 h-4" />}>Resources</NavLink>
                <NavLink to="/users" icon={<UsersIcon className="w-4 h-4" />}>Find Peers</NavLink>
                <NavLink to="/chat" icon={<MessageSquare className="w-4 h-4" />}>Chatrooms</NavLink>
                <NavLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</NavLink>

                {user ? (
                    <div className="flex items-center gap-3 ml-2">
                        <Link to="/profile" className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-all">
                            <img
                                src={user.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`}
                                className="h-6 w-6 rounded-full"
                                alt="User"
                            />
                            <span className="text-sm font-medium">{user.displayName}</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all group"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                ) : (
                    <Link to="/login" className="btn-primary text-sm px-6 py-2">Sign In</Link>
                )}
            </div>
        </motion.nav>
    );
};

const NavLink = ({ to, children, icon }: { to: string, children: React.ReactNode, icon?: React.ReactNode }) => (
    <Link
        to={to}
        className="text-[10px] font-bold text-white/70 hover:text-primary transition-colors tracking-widest uppercase flex items-center gap-2"
    >
        {icon}
        {children}
    </Link>
);

export default Navbar;
