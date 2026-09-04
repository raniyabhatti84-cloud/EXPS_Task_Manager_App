export interface BoardTaskItem {
  id: string | number;
  title: string;
}

export interface BoardColumnData {
  id: string | number;
  title: string;
  tasks: BoardTaskItem[];
}

export interface ColumnsState {
  inbox: BoardTaskItem[];
  board: BoardColumnData[];
}
