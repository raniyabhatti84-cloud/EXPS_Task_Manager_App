import { useDroppable } from "@dnd-kit/react";
import { type ReactNode } from "react";

interface DroppableProps {
  id: string;
  children: ReactNode;
}

const Droppable = ({ id, children }: DroppableProps) => {
  const { ref, isDropTarget } = useDroppable({ id });

  return (
    <div
      ref={ref}
      className={`min-h-[100px] rounded transition-colors ${
        isDropTarget ? "bg-blue-900/30" : ""
      }`}
    >
      {children}
    </div>
  );
};

export default Droppable;