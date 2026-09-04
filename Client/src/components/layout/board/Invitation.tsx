import { useState, useEffect, useCallback } from "react";
import { X, UserPlus, Trash2, LogOut, Loader2, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { type Socket } from "socket.io-client";

interface Member {
    _id: string;
    name: string;
    email: string;
}

interface InvitationProps {
    isOpen: boolean;
    onClose: () => void;
    boardId: string | null;
    token: string | null;
    socket: Socket | null;
    onMemberCountChange?: (count: number) => void;
}

const Invitation = ({
    isOpen,
    onClose,
    boardId,
    token,
    socket,
    onMemberCountChange
}: InvitationProps) => {
    const [email, setEmail] = useState("");
    const [owner, setOwner] = useState<Member | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Extract current user ID from token
    useEffect(() => {
        if (!token) return;
        try {
            const payloadBase64 = token.split(".")[1];
            const decodedClaims = JSON.parse(atob(payloadBase64));
            setCurrentUserId(decodedClaims.id || decodedClaims._id || null);
        } catch {
            setCurrentUserId(null);
        }
    }, [token]);

    const fetchMembers = useCallback(async () => {
        if (!boardId || !token) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/boards/${boardId}/members`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setOwner(data.owner || null);
                setMembers(data.members || []);
                const totalCount = (data.owner ? 1 : 0) + (data.members?.length || 0);
                if (onMemberCountChange) onMemberCountChange(totalCount);
            }
        } catch {
            // Error silently handled
        } finally {
            setLoading(false);
        }
    }, [boardId, token, onMemberCountChange]);

    useEffect(() => {
        if (isOpen) {
            fetchMembers();
            setError(null);
            setSuccess(null);
        }
    }, [isOpen, fetchMembers]);

    // Socket listener for live member updates
    useEffect(() => {
        if (!socket || !boardId) return;

        const handleMembersUpdated = (data: { boardId: string }) => {
            if (String(data.boardId) === String(boardId)) {
                fetchMembers();
            }
        };

        socket.on("boardMembersUpdated", handleMembersUpdated);
        return () => {
            socket.off("boardMembersUpdated", handleMembersUpdated);
        };
    }, [socket, boardId, fetchMembers]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !boardId || !token) return;

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`http://localhost:5000/api/boards/${boardId}/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email: email.trim() })
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch {
                // If response is non-JSON (e.g. 404 HTML from old server instance)
            }

            if (!res.ok) {
                if (res.status === 404 && !data.message) {
                    setError("Route not found. Please restart your backend server so the new routes load.");
                } else {
                    setError(data.message || `Request failed with status ${res.status}.`);
                }
            } else {
                setSuccess(data.message || "Member invited successfully!");
                setEmail("");
                if (data.members) setMembers(data.members);
                if (data.owner) setOwner(data.owner);
                const totalCount = (data.owner ? 1 : 0) + (data.members?.length || 0);
                if (onMemberCountChange) onMemberCountChange(totalCount);
            }
        } catch {
            setError("Server connection failed. Make sure backend is running.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async (userId: string) => {
        if (!boardId || !token) return;

        try {
            const res = await fetch(`http://localhost:5000/api/boards/${boardId}/members/${userId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch {
                // Non-JSON fallback
            }

            if (!res.ok) {
                setError(data.message || "Failed to remove member.");
            } else {
                setSuccess(data.message || "Member removed successfully.");
                fetchMembers();
            }
        } catch {
            setError("Server connection error.");
        }
    };

    if (!isOpen) return null;

    const isOwner = owner?._id === currentUserId;
    const totalMembers = (owner ? 1 : 0) + members.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-[#1a294c] text-white rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-purple-400" />
                        <h2 className="text-xl font-bold">Invite Members</h2>
                        <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 font-semibold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                            {totalMembers} {totalMembers === 1 ? "member" : "members"}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Invite Form */}
                    <form onSubmit={handleInvite} className="space-y-3">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                            Invite by Email
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="colleague@company.com"
                                required
                                className="flex-1 bg-slate-900/80 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                disabled={submitting || !email.trim()}
                                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Invite"
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Alerts */}
                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-3 py-2.5 rounded-lg">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-2.5 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Members List */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                            Board Members ({totalMembers})
                        </h3>

                        {loading ? (
                            <div className="flex items-center justify-center py-6 text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                            </div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {/* Owner item */}
                                {owner && (
                                    <div className="flex items-center justify-between bg-white/5 border border-white/5 px-3 py-2 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs uppercase text-white shadow-md">
                                                {owner.name?.charAt(0) || "O"}
                                            </div>
                                            <div className="truncate max-w-[170px]">
                                                <p className="text-sm font-medium text-white truncate">{owner.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{owner.email}</p>
                                            </div>
                                        </div>
                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                            <Shield className="w-3 h-3" /> Owner
                                        </span>
                                    </div>
                                )}

                                {/* Members list */}
                                {members.map((member) => {
                                    const isSelf = member._id === currentUserId;
                                    return (
                                        <div
                                            key={member._id}
                                            className="flex items-center justify-between bg-white/5 border border-white/5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs uppercase text-white shadow-md">
                                                    {member.name?.charAt(0) || "M"}
                                                </div>
                                                <div className="truncate max-w-[160px]">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {member.name} {isSelf && <span className="text-gray-400 text-xs">(You)</span>}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate">{member.email}</p>
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            {isOwner && !isSelf && (
                                                <button
                                                    onClick={() => handleRemove(member._id)}
                                                    title="Remove Member"
                                                    className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-md hover:bg-red-500/10 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}

                                            {isSelf && !isOwner && (
                                                <button
                                                    onClick={() => handleRemove(member._id)}
                                                    title="Leave Board"
                                                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-md transition-colors cursor-pointer"
                                                >
                                                    <LogOut className="w-3 h-3" /> Leave
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                {!owner && members.length === 0 && (
                                    <p className="text-center text-xs text-gray-400 py-4">No members found.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Invitation;