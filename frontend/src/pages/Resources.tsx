import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Scene3D from "@/components/Scene3D";
import { API_BASE_URL } from "@/lib/api";
import Navbar from "@/components/Navbar";

const Resources = () => {
    const [notes, setNotes] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadData, setUploadData] = useState({
        title: "",
        subject: "",
        tags: "",
        file: null as File | null
    });

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notes`);
            const data = await response.json();
            if (response.ok) {
                setNotes(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadData.file) return toast.error("Please select a file");

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user.id || user._id;
        if (!userId) return toast.error("Please login to upload");

        const formData = new FormData();
        formData.append("title", uploadData.title);
        formData.append("subject", uploadData.subject);
        formData.append("tags", uploadData.tags);
        formData.append("uploadedBy", userId);
        formData.append("file", uploadData.file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/notes/upload`, {
                method: "POST",
                body: formData
            });
            if (response.ok) {
                toast.success("Note uploaded successfully!");
                setIsUploading(false);
                fetchNotes();
            } else {
                toast.error("Upload failed");
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="relative min-h-screen bg-background overflow-x-hidden">
            <Navbar />
            <Scene3D />

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold glow-text mb-2">Campus Resources</h1>
                        <p className="text-muted-foreground">Browse and share study materials with your peers.</p>
                    </div>
                    <button
                        onClick={() => setIsUploading(true)}
                        className="btn-primary px-8 py-3 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        Upload Note
                    </button>
                </div>

                {/* Notes Grid */}
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading resources...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {notes.map((note) => (
                            <motion.div
                                key={note._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-6 flex flex-col hover:border-primary/30 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">
                                        {note.subject}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{note.title}</h3>
                                <div className="flex items-center gap-2 mb-6">
                                    <img
                                        src={note.uploadedBy?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${note.uploadedBy?.displayName}`}
                                        className="h-6 w-6 rounded-full"
                                        alt="Uploader"
                                    />
                                    <span className="text-xs text-muted-foreground">Uploaded by {note.uploadedBy?.displayName}</span>
                                </div>
                                <div className="mt-auto flex justify-between items-center">
                                    <div className="flex gap-2">
                                        {note.tags?.map((tag: string) => (
                                            <span key={tag} className="text-[10px] uppercase tracking-wider text-muted-foreground">#{tag}</span>
                                        ))}
                                    </div>
                                    <a
                                        href={`${API_BASE_URL}${note.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-sm font-medium"
                                    >
                                        Download
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {isUploading && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUploading(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-card relative z-10 w-full max-w-lg p-8"
                        >
                            <h2 className="text-2xl font-bold mb-6">Upload Resource</h2>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                                    <input
                                        className="input-glass w-full"
                                        required
                                        value={uploadData.title}
                                        onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                        placeholder="e.g. OS Unit 1 Notes"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                                    <input
                                        className="input-glass w-full"
                                        required
                                        value={uploadData.subject}
                                        onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })}
                                        placeholder="e.g. Operating Systems"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Tags (comma separated)</label>
                                    <input
                                        className="input-glass w-full"
                                        value={uploadData.tags}
                                        onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                                        placeholder="OS, BTech, Exam"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">File (PDF/Image)</label>
                                    <input
                                        type="file"
                                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                        onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                                    />
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsUploading(false)}
                                        className="btn-google flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary flex-1"
                                    >
                                        Start Upload
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Resources;
