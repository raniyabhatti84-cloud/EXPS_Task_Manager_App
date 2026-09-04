import { useState, type KeyboardEvent, type ChangeEvent } from "react";
import Btn from "./AddCardBtn";

interface EditableFieldProps {
    value?: string;
    onSave?: (value: string) => void;
    onDelete?: () => void;
    multiline?: boolean;
    placeholder?: string;
}

function EditableField({
    value,
    onSave,
    onDelete,
    multiline = false,
    placeholder = "Add card",
}: EditableFieldProps) {
    const isAddMode = value === undefined;
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [draft, setDraft] = useState<string>("");

    const handleEditClick = () => {
        setDraft(isAddMode ? "" : value);
        setIsEditing(true);
    };

    const handleSave = () => {
        const trimmed = draft.trim();
        if (!trimmed) return;

        onSave?.(trimmed);
        setDraft("");
        setIsEditing(false);
    };

    const handleCancel = () => {
        setDraft("");
        setIsEditing(false);
    };

    const handleDelete = () => {
        onDelete?.();
        setDraft("");
        setIsEditing(false);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDraft(e.target.value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !multiline) handleSave();
        if (e.key === "Escape") handleCancel();
    };

    if (!isEditing) {
        if (isAddMode) {
            return (
                <Btn onClick={handleEditClick}>
                    {placeholder}
                </Btn>
            );
        }

        return (
            <div
                onClick={handleEditClick}
                className="w-full bg-[#111827] py-2 px-4 items-center cursor-pointer rounded hover:bg-[#1a2332] transition-colors"
            >
                <div className="text-white break-words">{value}</div>
            </div>
        );
    }

    return (
        <>
            <div className="text-white w-full bg-[#111827] py-2 px-4 items-center rounded flex flex-col gap-2">
                {multiline ? (
                    <textarea
                        value={draft}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full bg-[#111827] py-2 px-4 items-center rounded flex flex-start gap-2"
                    />
                ) : (
                    <input
                        type="text"
                        value={draft}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full bg-[#111827] py-2 px-4 items-center rounded flex flex-start gap-2"
                    />
                )}
            </div>
            <div className="flex gap-2 w-full">
                <Btn onClick={handleSave} className="px-[25px] py-[9px] bg-[#006400] hover:bg-[#008000]">Save</Btn>
                <Btn onClick={handleCancel} className="px-[25px] py-[9px] ">Cancel</Btn>
                {!isAddMode && onDelete && (
                    <Btn onClick={handleDelete} className="px-[25px] py-[9px] bg-[#690000] hover:bg-[#800000]">Delete</Btn>
                )}
            </div>
        </>
    );
}

export default EditableField;
