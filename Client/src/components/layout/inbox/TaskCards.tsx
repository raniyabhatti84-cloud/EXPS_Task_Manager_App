import EditableField from "./EditableField";

interface TaskCardProps {
    id: string | number;
    title: string;
    onUpdate?: (id: string | number, title: string) => void;
    onDelete?: (id: string | number) => void;
}

const TaskCards = ({ id, title, onUpdate, onDelete }: TaskCardProps) => {
    return (
        <EditableField
            value={title}
            onSave={(newTitle) => onUpdate?.(id, newTitle)}
            onDelete={() => onDelete?.(id)}
        />
    );
};

export default TaskCards;
