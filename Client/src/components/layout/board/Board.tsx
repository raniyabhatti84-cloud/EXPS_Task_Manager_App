import { useState } from "react";
import BoardTitle from "./BoardTitle";
import BoardColumn from "./BoardColumn";
import { type BoardColumnData } from "../../../type";
import Invitation from "./Invitation";
import { type Socket } from "socket.io-client";

interface BoardProps {
    columns: BoardColumnData[];
    boardId?: string | null;
    token?: string | null;
    socket?: Socket | null;
    onAddCard?: (columnId: string | number, title: string) => void;
    onUpdateCard?: (columnId: string | number, taskId: string | number, title: string) => void;
    onDeleteCard?: (columnId: string | number, taskId: string | number) => void;
}

const Board = ({
    columns,
    boardId = null,
    token = null,
    socket = null,
    onAddCard,
    onUpdateCard,
    onDeleteCard
}: BoardProps) => {
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [memberCount, setMemberCount] = useState(0);

    return (
        <div className="h-full w-full bg-gradient-to-br from-purple-600 via-purple-700 to-pink-400 rounded flex flex-col min-h-0 relative">
            <BoardTitle
                title="My Board"
                onToggleInvite={() => setIsInviteOpen((prev) => !prev)}
                memberCount={memberCount}
            />

            <Invitation
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                boardId={boardId}
                token={token}
                socket={socket}
                onMemberCountChange={setMemberCount}
            />

            <div className="flex-1 min-h-0 overflow-x-auto p-4 z-0">
                <div className="flex gap-4 h-full min-w-max">
                    {columns.map((column) => (
                        <BoardColumn
                            key={column.id}
                            column={column}
                            onAddTask={onAddCard || (() => { })}
                            onUpdateTask={onUpdateCard || (() => { })}
                            onDeleteTask={onDeleteCard || (() => { })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Board;

