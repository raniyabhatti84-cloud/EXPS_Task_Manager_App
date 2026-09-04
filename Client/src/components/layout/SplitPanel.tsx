import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

interface SplitPanelProps {
    left: ReactNode;
    right: ReactNode;
    initialLeftPercent?: number;
    minLeftPercent?: number;
    maxLeftPercent?: number;
}

const SplitPanel = ({
    left,
    right,
    initialLeftPercent = 25,
    minLeftPercent = 15,
    maxLeftPercent = 75,
}: SplitPanelProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [leftPercent, setLeftPercent] = useState(initialLeftPercent);
    const [isDragging, setIsDragging] = useState(false);

    const clampPercent = useCallback(
        (percent: number) => Math.min(maxLeftPercent, Math.max(minLeftPercent, percent)),
        [minLeftPercent, maxLeftPercent]
    );

    const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const nextPercent = ((e.clientX - rect.left) / rect.width) * 100;
            setLeftPercent(clampPercent(nextPercent));
        };

        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isDragging, clampPercent]);

    return (
        <div
            ref={containerRef}
            className="flex flex-1 min-h-0 items-stretch px-4 pb-4 gap-1"
        >
            <div
                className="min-w-0 h-full shrink-0"
                style={{ width: `${leftPercent}%` }}
            >
                {left}
            </div>

            <div
                role="separator"
                aria-orientation="vertical"
                aria-valuenow={leftPercent}
                onMouseDown={handleMouseDown}
                className={`w-1.5 shrink-0 rounded-full transition-colors ${
                    isDragging ? "bg-blue-400" : "bg-gray-600 hover:bg-blue-400"
                } cursor-col-resize`}
            />

            <div
                className="min-w-0 h-full shrink-0"
                style={{ width: `${100 - leftPercent}%` }}
            >
                {right}
            </div>
        </div>
    );
};

export default SplitPanel;
