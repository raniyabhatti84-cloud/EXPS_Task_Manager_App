import { useDraggable } from "@dnd-kit/react";
import { type ReactNode } from "react";

interface DraggableProps {
  id: number | string;
  children: ReactNode;
}

const Draggable = ({ id, children }: DraggableProps) => {
  const { ref, isDragging } = useDraggable({ id });

  return (
    <div
      ref={ref}
      className={isDragging ? "opacity-50" : ""}
    >
      {children}
    </div>
  );
};

export default Draggable;