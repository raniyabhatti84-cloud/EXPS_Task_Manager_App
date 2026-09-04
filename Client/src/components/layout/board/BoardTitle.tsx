import { Filter, Share2, Users } from "lucide-react";
import profile from "../../../assets/profile-placeholder.jpeg";

interface BoardTitleProps {
    title: string;
    onToggleInvite?: () => void;
    memberCount?: number;
}

const BoardTitle = ({ title, onToggleInvite, memberCount }: BoardTitleProps) => {
    return (
        <div className="flex items-center justify-between px-4 h-12 bg-[#20183b91] text-white border-b border-white/10">
            <h1 className="text-white text-2xl font-bold">{title}</h1>

            <div className="flex items-center gap-3">
                <img src={profile} alt="profile" className="w-6 cursor-pointer h-6 rounded-full" />

                <button
                    type="button"
                    onClick={onToggleInvite}
                    className="flex items-center cursor-pointer gap-2 bg-white text-gray-800 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-gray-100 transition-colors shadow-xs active:scale-95"
                >
                    <Share2 className="w-4 h-4 cursor-pointer" />
                    <span>Invite</span>
                    {typeof memberCount === "number" && memberCount > 0 && (
                        <span className="flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded-full font-bold ml-1">
                            <Users className="w-3 h-3" />
                            {memberCount}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    className="flex items-center cursor-pointer justify-center bg-white text-gray-800 rounded-md p-1.5 hover:bg-gray-100 transition-colors"
                    aria-label="Filter"
                >
                    <Filter className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default BoardTitle;

