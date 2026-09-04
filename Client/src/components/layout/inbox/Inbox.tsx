import { Inbox, Filter, MoreHorizontal } from "lucide-react";
import TaskCards from "./TaskCards";
import EditableField from "./EditableField";
import Draggable from "../../dragable";
import Droppable from "../../dropable";
import { type BoardTaskItem } from "../../../type";

interface InboxPortionProps {
    cards: BoardTaskItem[];
    onAddCard: (title: string) => void;
    onUpdateCard: (id: string | number, title: string) => void;
    onDeleteCard: (id: string | number) => void;
}

const InboxPortion = ({ cards, onAddCard, onUpdateCard, onDeleteCard }: InboxPortionProps) => {

    // Moved All these Handleres to App.tsx   

    // const handleAddCard = (title: string) => {
    //     setColumns((prev) => ({
    //         ...prev,
    //         inbox: [...prev.inbox, { id: Date.now(), title }]
    //     }));
    // };

    // const handleUpdateCard = (id: number, title: string) => {
    //     setColumns((prev) => ({
    //         ...prev,
    //         inbox: prev.inbox.map((card) => (card.id === id ? { ...card, title } : card))
    //     }));
    // };

    // const handleDeleteCard = (id: number) => {
    //     setColumns((prev) => ({
    //         ...prev,
    //         inbox: prev.inbox.filter((card) => card.id !== id)
    //     }));
    // };

    return (
        <div className="h-full w-full bg-[hsl(222,49%,20%)] rounded flex flex-col overflow-y-scroll">
            <div className="flex justify-between items-center px-4 h-[70px] shrink-0 w-full bg-[#142741] rounded-t">
                <div className="flex items-center gap-2">
                    <Inbox className="text-white w-5 h-5" />
                    <h1 className="text-white">Inbox</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Filter className="text-white w-5 h-5 cursor-pointer hover:text-blue-400 transition-colors" />
                    <MoreHorizontal className="text-white w-5 h-5 cursor-pointer hover:text-blue-400 transition-colors" />
                </div>
            </div>

            <Droppable id="inbox">
                <div className="flex flex-col gap-2 p-4 overflow-y-auto flex-1 min-h-[200px]">
                    <EditableField onSave={onAddCard} />
                    {cards.map((card) => (

                        <Draggable key={card.id} id={card.id}>
                            <div className="break-all flex flex-col flex-wrap   ">

                                <TaskCards
                                    id={card.id}
                                    title={card.title}
                                    onUpdate={onUpdateCard}
                                    onDelete={onDeleteCard}
                                />
                            </div>
                        </Draggable>

                    ))}
                </div>
            </Droppable>
        </div>
    );
};

export default InboxPortion;
