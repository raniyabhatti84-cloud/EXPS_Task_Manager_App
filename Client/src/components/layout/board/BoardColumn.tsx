import EditableField from "../inbox/EditableField";
import BoardTask from "./BoardTask";
import Draggable from "../../dragable";
import Droppable from "../../dropable";
import { type BoardColumnData } from "../../../type";

interface BoardColumnProps {
    column: BoardColumnData;
    onAddTask: (columnId: string | number, title: string) => void;
    onUpdateTask: (columnId: string | number, taskId: string | number, title: string) => void;
    onDeleteTask: (columnId: string | number, taskId: string | number) => void;
}

const BoardColumn = ({
    column,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
}: BoardColumnProps) => {
    return (
        <div className="w-72 shrink-0 overflow-y-scroll flex flex-col max-h-full bg-[#20183b91] rounded-lg">
            <div className="px-4 py-3 border-b border-white/10">
                <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                    {column.title}
                </h2>
            </div>

            <Droppable id={`column-${column.id}`}>
                <div className="flex flex-col gap-2 p-3 overflow-y-auto flex-1 min-h-[100px]">
                    <div className="flex flex-top flex-col gap-2">
                        <EditableField
                            onSave={(title) => onAddTask(column.id, title)}
                            placeholder="Add task"
                        />
                    </div>
                    {column.tasks.map((task) => (
                        <Draggable key={task.id} id={task.id}>
                            <BoardTask
                                id={task.id}
                                title={task.title}
                                onUpdate={(taskId, title) => onUpdateTask(column.id, taskId, title)}
                                onDelete={(taskId) => onDeleteTask(column.id, taskId)}
                            />
                        </Draggable>
                    ))}
                </div>
            </Droppable>
        </div>
    );
};

export default BoardColumn;