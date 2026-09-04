import { type ReactNode } from "react";

interface AddCardBtnProps {
    onClick?: () => void;
    children?: ReactNode;
    className?: string;
    class?: string;
}

const AddCardBtn = ({ onClick, children, className = "w-full", class: customClass }: AddCardBtnProps) => {
    return (
        <div onClick={onClick} className="flex-1 flex justify-center items-center cursor-pointer hover:text-gray-300 transition-colors">
            <span className={`${className} ${customClass ? customClass : "bg-[#111827]"} py-2 px-4 items-center rounded flex justify-center gap-2`}>
                {/* <Plus className="text-gray-500 w-5 h-5" /> */}
                <span className="text-white whitespace-nowrap">{children ?? "Add card"}</span>
            </span>
        </div>
    )
}

export default AddCardBtn
