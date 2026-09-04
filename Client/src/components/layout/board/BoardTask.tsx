import EditableField from "../inbox/EditableField";

interface BoardTaskProps {
    id: string | number;
    title: string;
    onUpdate: (taskId: string | number, title: string) => void;
    onDelete: (taskId: string | number) => void;
}

const BoardTask = ({ id, title, onUpdate, onDelete }: BoardTaskProps) => {
    return (
        <EditableField
            value={title}
            onSave={(newTitle) => onUpdate(id, newTitle)}
            onDelete={() => onDelete(id)}
        />
    );
};

export default BoardTask;
