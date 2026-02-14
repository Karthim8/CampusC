import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import Navbar from "@/components/Navbar";


const Dashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get("token");

        const fetchUser = async (token: string) => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.authenticated) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    localStorage.setItem("token", token);
                    setUser(data.user);
                }
            } catch (err) {
                console.error("Failed to fetch user", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (tokenFromUrl) {
            fetchUser(tokenFromUrl);
        } else {
            const storedUser = localStorage.getItem("user");
            const storedToken = localStorage.getItem("token");
            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-white">
                <p className="animate-pulse">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-background overflow-x-hidden">
            <Navbar currentUser={user} />
            <div className="flex min-h-screen items-center justify-center p-4">


                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse at 30% 50%, hsla(175,80%,50%,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, hsla(260,60%,60%,0.05) 0%, transparent 50%)",
                    }}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="glass-card relative z-10 w-full max-w-2xl px-8 py-10 text-center"
                >
                    <div className="mb-6 flex flex-col items-center">
                        {user?.photo && (
                            <img
                                src={user.photo}
                                alt="Profile"
                                className="h-24 w-24 rounded-full border-2 border-primary shadow-lg mb-4"
                            />
                        )}
                        <h1 className="glow-text text-4xl font-bold">
                            Welcome, {user?.displayName || "to CampusConnect"}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {user?.email || "Signed in successfully"}
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={() => window.location.href = "/"}
                            className="btn-primary"
                        >
                            Go to Home
                        </button>
                        <button
                            onClick={() => window.location.href = "/profile"}
                            className="btn-primary"
                            style={{ background: 'hsla(175,80%,50%,0.2)', border: '1px solid hsla(175,80%,50%,0.5)' }}
                        >
                            My Profile
                        </button>
                        <button
                            onClick={() => window.location.href = "/users"}
                            className="btn-primary"
                            style={{ background: 'hsla(200,80%,50%,0.2)', border: '1px solid hsla(200,80%,50%,0.5)' }}
                        >
                            Connect with Peers
                        </button>
                        <button
                            onClick={() => window.location.href = "/chat"}
                            className="btn-primary"
                            style={{ background: 'hsla(150,80%,50%,0.2)', border: '1px solid hsla(150,80%,50%,0.5)' }}
                        >
                            Real-time Chat
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn-google"
                        >
                            Logout
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
