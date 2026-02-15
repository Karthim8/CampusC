import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { Send, Hash, User as UserIcon, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL, SOCKET_URL } from "@/lib/api";
import Navbar from "@/components/Navbar";

const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    transports: ["websocket", "polling"]
});

const Chat = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [room, setRoom] = useState("General");
    const [user, setUser] = useState<any>(null);
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [chatType, setChatType] = useState<"channel" | "p2p">("channel");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            fetchFriends(parsed.id || parsed._id);
            fetchRequests(parsed.id || parsed._id);
        }
    }, []);

    const fetchFriends = async (uid: string) => {
        const res = await fetch(`${API_BASE_URL}/api/users/friends/${uid}`);
        const data = await res.json();
        setFriends(data);
    };

    const fetchRequests = async (uid: string) => {
        const res = await fetch(`${API_BASE_URL}/api/follow/requests/${uid}`);
        const data = await res.json();
        setRequests(data);
    };

    const fetchHistory = async (roomId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/messages/${roomId}`);
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAccept = async (requestId: string) => {
        const res = await fetch(`${API_BASE_URL}/api/follow/accept`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId })
        });
        if (res.ok) {
            toast.success("Request accepted!");
            fetchRequests(user.id || user._id);
            fetchFriends(user.id || user._id);
        }
    };

    useEffect(() => {
        if (!user) return;

        console.log("Setting up socket listeners for room:", room);

        const onConnect = () => {
            console.log("Socket connected!");
            socket.emit("join_room", room);
        };

        const onDisconnect = () => {
            console.log("Socket disconnected");
        };

        const onConnectError = (err: any) => {
            console.error("Socket connection error:", err);
            toast.error("Real-time connection failed. Retrying...");
        };

        const onReceiveMessage = (message: any) => {
            console.log("Message received:", message);
            if (message.room === room) {
                setMessages((prev) => [...prev, message]);
            }
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", onConnectError);
        socket.on("receive_message", onReceiveMessage);

        if (socket.connected) {
            socket.emit("join_room", room);
        }

        fetchHistory(room);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error", onConnectError);
            socket.off("receive_message", onReceiveMessage);
        };
    }, [room, user]);

    const selectP2P = (friend: any) => {
        const myId = user.id || user._id;
        const friendId = friend._id;
        const roomId = [myId, friendId].sort().join("--");
        setRoom(roomId);
        setChatType("p2p");
    };

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        if (!user) {
            toast.error("You must be logged in to send messages");
            return;
        }

        if (!socket.connected) {
            console.log("Attempting to reconnect socket...");
            socket.connect();
            toast.error("Connection lost. Reconnecting...");
            return;
        }

        console.log("Emitting message to room:", room, { content: input });
        socket.emit("send_message", {
            room,
            sender: user.id || user._id,
            content: input
        });

        setInput("");
    };

    const rooms = ["General", "Study Room 1", "Study Room 2", "Peer Support"];

    return (
        <div className="h-screen bg-background overflow-hidden">
            <Navbar currentUser={user} />
            <div className="flex h-full pt-16">
                {/* Sidebar */}
                <div className="w-64 border-r border-border bg-card/50 backdrop-blur-sm">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Channels
                        </h2>
                    </div>
                    <div className="p-2 space-y-1">
                        {rooms.map((r) => (
                            <button
                                key={r}
                                onClick={() => { setRoom(r); setChatType("channel"); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${room === r && chatType === "channel" ? "bg-primary/20 text-primary" : "hover:bg-accent"
                                    }`}
                            >
                                <Hash className="w-4 h-4" />
                                {r}
                            </button>
                        ))}
                    </div>

                    {/* Direct Messages */}
                    <div className="p-4 border-t border-border mt-4">
                        <h2 className="text-sm font-bold flex items-center gap-2 mb-2 text-muted-foreground uppercase tracking-widest">
                            Direct Messages
                        </h2>
                        <div className="space-y-1">
                            {friends.length > 0 ? friends.map((f) => (
                                <button
                                    key={f._id}
                                    onClick={() => selectP2P(f)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${room.includes(f._id) && chatType === "p2p" ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-accent"
                                        }`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <UserIcon className="w-3 h-3 text-emerald-400" />
                                    </div>
                                    <span className="text-sm">{f.displayName}</span>
                                </button>
                            )) : (
                                <p className="text-[10px] text-muted-foreground p-2 italic">Follow someone and get accepted to start chatting!</p>
                            )}
                        </div>
                    </div>

                    {/* Pending Requests */}
                    {requests.length > 0 && (
                        <div className="p-4 border-t border-border mt-auto">
                            <h2 className="text-xs font-bold text-orange-400 mb-2">FOLLOW REQUESTS</h2>
                            <div className="space-y-2">
                                {requests.map(req => (
                                    <div key={req._id} className="p-2 rounded bg-orange-400/10 border border-orange-400/20">
                                        <p className="text-[10px] font-bold mb-1">{req.sender.displayName}</p>
                                        <button
                                            onClick={() => handleAccept(req._id)}
                                            className="w-full py-1 bg-orange-400 text-white text-[10px] rounded hover:bg-orange-500"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col relative">
                    {/* Header */}
                    <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between">
                        <div>
                            <h3 className="font-bold flex items-center gap-2">
                                {chatType === "channel" ? <Hash className="w-5 h-5 text-primary" /> : <UserIcon className="w-5 h-5 text-emerald-400" />}
                                {chatType === "channel" ? room : friends.find(f => room.includes(f._id))?.displayName || "Private Chat"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {chatType === "channel" ? "Real-time collaboration" : "Personal Conversation"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/50 border border-border">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-medium">Live</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={msg._id || idx}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${msg.sender?._id === (user?.id || user?._id) ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`flex gap-3 max-w-[70%] ${msg.sender?._id === (user?.id || user?._id) ? "flex-row-reverse" : "flex-row"}`}>
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                                            <UserIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <div className={`flex items-center gap-2 mb-1 ${msg.sender?._id === (user?.id || user?._id) ? "justify-end" : "justify-start"}`}>
                                                <span className="text-xs font-bold text-foreground/80">{msg.sender?.displayName || "User"}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className={`p-3 rounded-2xl ${msg.sender?._id === (user?.id || user?._id)
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-muted text-foreground rounded-tl-none"
                                                }`}>
                                                <p className="text-sm">{msg.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={scrollRef} />
                    </div>

                    {/* Input area */}
                    <div className="p-4 bg-background/50 backdrop-blur-md">
                        <form
                            onSubmit={handleSendMessage}
                            className="flex items-center gap-2 max-w-4xl mx-auto"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Message #${room}`}
                                className="flex-1 input-glass min-h-[44px]"
                            />
                            <button
                                type="submit"
                                className="w-11 h-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
