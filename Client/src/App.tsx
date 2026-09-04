import Board from "./components/layout/board/Board";
import InboxPortion from "./components/layout/inbox/Inbox";
import SplitPanel from "./components/layout/SplitPanel";
import Nav from "./components/Nav";
import Auth from "./components/Auth";
import {
  DragDropProvider,
  type DragEndEvent,
} from "@dnd-kit/react";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  type ColumnsState,
  type BoardTaskItem,
} from "./type";

const App = () => {
  const [columns, setColumns] = useState<ColumnsState>({
    inbox: [],
    board: [],
  });

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  // =====================================================
  // REAL MONGODB BOARD IDS
  // =====================================================

  const [inboxBoardId, setInboxBoardId] = useState<
    string | null
  >(localStorage.getItem("inboxBoardId"));

  const [mainBoardId, setMainBoardId] = useState<
    string | null
  >(localStorage.getItem("mainBoardId"));

  const [socket, setSocket] = useState<Socket | null>(null);

  // =====================================================
  // SOCKET.IO
  // =====================================================

  useEffect(() => {
    if (!token) return;

    const socketInstance: Socket = io("http://localhost:5000");
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
    });

    // -----------------------------------------------------
    // CARD CREATED
    // -----------------------------------------------------

    socketInstance.on("cardCreated", ({ card }) => {
      if (!card) return;

      setColumns((prev) => {
        const alreadyExists = prev.board.some((column) =>
          column.tasks.some(
            (task) =>
              String(task.id) === String(card._id)
          )
        );

        if (alreadyExists) {
          return prev;
        }

        return {
          ...prev,

          board: prev.board.map((column) =>
            String(column.id) === String(card.listId)
              ? {
                  ...column,

                  tasks: [
                    ...column.tasks,
                    {
                      id: card._id,
                      title: card.title,
                    },
                  ],
                }
              : column
          ),
        };
      });
    });

    // -----------------------------------------------------
    // CARD UPDATED
    // -----------------------------------------------------

    socketInstance.on("cardUpdated", ({ card }) => {
      if (!card) return;

      setColumns((prev) => ({
        ...prev,

        board: prev.board.map((column) => ({
          ...column,

          tasks: column.tasks.map((task) =>
            String(task.id) === String(card._id)
              ? {
                  ...task,
                  title: card.title,
                }
              : task
          ),
        })),
      }));
    });

    // -----------------------------------------------------
    // CARD DELETED
    // -----------------------------------------------------

    socketInstance.on("cardDeleted", ({ cardId }) => {
      if (!cardId) return;

      setColumns((prev) => ({
        ...prev,

        board: prev.board.map((column) => ({
          ...column,

          tasks: column.tasks.filter(
            (task) =>
              String(task.id) !== String(cardId)
          ),
        })),
      }));
    });

    // -----------------------------------------------------
    // CARD MOVED
    // -----------------------------------------------------

    socketInstance.on("cardMoved", ({ card }) => {
      if (!card) return;

      setColumns((prev) => {
        const cardId = String(card._id);
        const targetListId = String(card.listId);

        const updatedBoard = prev.board.map((column) => ({
          ...column,
          tasks: column.tasks.filter(
            (task) => String(task.id) !== cardId
          ),
        }));

        return {
          ...prev,
          board: updatedBoard.map((column) =>
            String(column.id) === targetListId
              ? {
                  ...column,
                  tasks: [
                    ...column.tasks,
                    {
                      id: cardId,
                      title: card.title,
                    },
                  ],
                }
              : column
          ),
        };
      });
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [token]);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        // =================================================
        // 1. GET USER BOARDS
        // =================================================

        const resBoards = await fetch(
          "http://localhost:5000/api/boards",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const dataBoards = await resBoards.json();

        if (!resBoards.ok) {
          console.error(
            "Error fetching boards:",
            dataBoards.message
          );

          if (
            resBoards.status === 401 ||
            resBoards.status === 403
          ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("inboxBoardId");
            localStorage.removeItem("mainBoardId");

            setToken(null);
          }

          return;
        }

        let boards = dataBoards.boards || [];

        // =================================================
        // 2. FIND INBOX + MAIN BOARD
        // =================================================

        let inboxBoard = boards.find(
          (board: any) =>
            board.title === "Inbox"
        );

        let mainBoard = boards.find(
          (board: any) =>
            board.title === "My Board"
        );

        // =================================================
        // 3. CREATE INBOX BOARD
        // =================================================

        if (!inboxBoard) {
          const resCreateInbox = await fetch(
            "http://localhost:5000/api/boards",
            {
              method: "POST",

              headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${token}`,
              },

              body: JSON.stringify({
                title: "Inbox",
              }),
            }
          );

          const inboxData =
            await resCreateInbox.json();

          if (
            resCreateInbox.ok &&
            inboxData.board
          ) {
            inboxBoard = inboxData.board;
          } else {
            console.error(
              "Failed to create Inbox board:",
              inboxData.message
            );
          }
        }

        // =================================================
        // 4. CREATE MAIN BOARD
        // =================================================

        if (!mainBoard) {
          const resCreateBoard = await fetch(
            "http://localhost:5000/api/boards",
            {
              method: "POST",

              headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${token}`,
              },

              body: JSON.stringify({
                title: "My Board",
              }),
            }
          );

          const boardData =
            await resCreateBoard.json();

          if (
            resCreateBoard.ok &&
            boardData.board
          ) {
            mainBoard = boardData.board;
          } else {
            console.error(
              "Failed to create My Board:",
              boardData.message
            );
          }
        }

        // =================================================
        // CHECK BOARDS
        // =================================================

        if (!inboxBoard || !mainBoard) {
          console.error(
            "Required boards could not be loaded."
          );
          return;
        }

        // =================================================
        // 5. REAL MONGODB IDS
        // =================================================

        const currentInboxBoardId =
          String(inboxBoard._id);

        const currentMainBoardId =
          String(mainBoard._id);

        console.log(
          "REAL INBOX BOARD ID:",
          currentInboxBoardId
        );

        console.log(
          "REAL MAIN BOARD ID:",
          currentMainBoardId
        );

        // Save IDs in state
        setInboxBoardId(currentInboxBoardId);
        setMainBoardId(currentMainBoardId);

        // Save IDs in localStorage
        localStorage.setItem(
          "inboxBoardId",
          currentInboxBoardId
        );

        localStorage.setItem(
          "mainBoardId",
          currentMainBoardId
        );

        // =================================================
        // 6. LOAD INBOX LISTS
        // =================================================

        const resInbox = await fetch(
          `http://localhost:5000/api/lists?boardId=${currentInboxBoardId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const dataInbox =
          await resInbox.json();

        if (!resInbox.ok) {
          console.error(
            "Error fetching inbox lists:",
            dataInbox.message
          );

          return;
        }

        const inboxCards = (
          dataInbox.lists || []
        ).map((item: any) => ({
          id: String(item._id),
          title: item.title,
        }));

        // =================================================
        // 7. LOAD MAIN BOARD LISTS
        // =================================================

        const resBoard = await fetch(
          `http://localhost:5000/api/lists?boardId=${currentMainBoardId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const dataBoard =
          await resBoard.json();

        if (!resBoard.ok) {
          console.error(
            "Error fetching board lists:",
            dataBoard.message
          );

          return;
        }

        let boardLists =
          dataBoard.lists || [];

        // =================================================
        // REQUIRED LISTS
        // =================================================

        const requiredTitles = [
          "Today",
          "Tomorrow",
          "This Week",
        ];

        // =================================================
        // 8. CREATE MISSING LISTS
        // =================================================

        for (const title of requiredTitles) {
          const existingList =
            boardLists.find(
              (list: any) =>
                list.title === title
            );

          if (!existingList) {
            const resCreate =
              await fetch(
                "http://localhost:5000/api/lists",
                {
                  method: "POST",

                  headers: {
                    "content-type":
                      "application/json",

                    Authorization:
                      `Bearer ${token}`,
                  },

                  body: JSON.stringify({
                    title,
                    boardId:
                      currentMainBoardId,

                    position:
                      requiredTitles.indexOf(
                        title
                      ),
                  }),
                }
              );

            const newListData =
              await resCreate.json();

            if (
              resCreate.ok &&
              newListData.list
            ) {
              boardLists.push(
                newListData.list
              );
            } else {
              console.error(
                `Failed to create list ${title}:`,
                newListData.message
              );
            }
          }
        }

        // =================================================
        // 9. REMOVE DUPLICATE LISTS
        // =================================================

        const uniqueLists =
          Array.from(
            new Map(
              boardLists.map(
                (list: any) => [
                  String(list._id),
                  list,
                ]
              )
            ).values()
          );

        // =================================================
        // 10. SORT LISTS
        // =================================================

        uniqueLists.sort(
          (a: any, b: any) =>
            requiredTitles.indexOf(
              a.title
            ) -
            requiredTitles.indexOf(
              b.title
            )
        );

        // =================================================
        // 11. LOAD CARDS
        // =================================================

        const boardColumns =
          await Promise.all(
            uniqueLists.map(
              async (list: any) => {
                const resCards =
                  await fetch(
                    `http://localhost:5000/api/cards/${list._id}`,
                    {
                      headers: {
                        Authorization:
                          `Bearer ${token}`,
                      },
                    }
                  );

                const dataCards =
                  await resCards.json();

                if (!resCards.ok) {
                  console.error(
                    `Failed to load cards for list ${list._id}:`,
                    dataCards.message
                  );
                }

                return {
                  id: String(list._id),

                  title: list.title,

                  tasks: (
                    dataCards.cards || []
                  ).map(
                    (card: any) => ({
                      id: String(
                        card._id
                      ),
                      title:
                        card.title,
                    })
                  ),
                };
              }
            )
          );

        // =================================================
        // 12. SET STATE
        // =================================================

        setColumns({
          inbox: inboxCards,
          board: boardColumns,
        });
      } catch (error) {
        console.error(
          "Error in loading data:",
          error
        );
      }
    };

    loadData();
  }, [token]);

  // =====================================================
  // INBOX - ADD
  // =====================================================

  const handleInboxAddCard = async (
    title: string
  ) => {
    if (!token) return;

    if (!inboxBoardId) {
      console.error(
        "Inbox Board ID is not available yet."
      );
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:5000/api/lists",
        {
          method: "POST",

          headers: {
            "content-type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            title,
            boardId: inboxBoardId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Failed to add inbox card:",
          data.message
        );

        if (
          res.status === 401 ||
          res.status === 403
        ) {
          console.error(
            "Authorization failed."
          );
        }

        return;
      }

      if (!data.list) {
        console.error(
          "Backend did not return list."
        );
        return;
      }

      const newCard = {
        id: String(data.list._id),
        title: data.list.title,
      };

      setColumns((prev) => {
        const alreadyExists =
          prev.inbox.some(
            (card) =>
              String(card.id) ===
              String(newCard.id)
          );

        if (alreadyExists) {
          return prev;
        }

        return {
          ...prev,

          inbox: [
            ...prev.inbox,
            newCard,
          ],
        };
      });
    } catch (error) {
      console.error(
        "Failed to add inbox card:",
        error
      );
    }
  };

  // =====================================================
  // INBOX - UPDATE
  // =====================================================

  const handleUpdateCard = async (
    id: number | string,
    title: string
  ) => {
    if (!token) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/lists/${id}`,
        {
          method: "PUT",

          headers: {
            "content-type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            title,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Failed to update inbox card:",
          data.message
        );

        return;
      }

      setColumns((prev) => ({
        ...prev,

        inbox: prev.inbox.map(
          (card) =>
            String(card.id) ===
            String(id)
              ? {
                  ...card,
                  title,
                }
              : card
        ),
      }));
    } catch (error) {
      console.error(
        "Failed to update inbox card:",
        error
      );
    }
  };

  // =====================================================
  // BOARD - ADD TASK
  // =====================================================

  const handleBoardAddTask = async (
    listId: string | number,
    title: string
  ) => {
    if (!token) return;

    const realListId = String(listId);

    try {
      const res = await fetch(
        "http://localhost:5000/api/cards",
        {
          method: "POST",

          headers: {
            "content-type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            title,
            listId: realListId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Failed to add board task:",
          data.message
        );
        return;
      }

      if (!data.card) {
        console.error(
          "Backend did not return card."
        );
        return;
      }

      setColumns((prev) => {
        const cardAlreadyExists =
          prev.board.some(
            (column) =>
              column.tasks.some(
                (task) =>
                  String(task.id) ===
                  String(data.card._id)
              )
          );

        if (cardAlreadyExists) {
          return prev;
        }

        return {
          ...prev,

          board: prev.board.map(
            (column) =>
              String(column.id) ===
              realListId
                ? {
                    ...column,

                    tasks: [
                      ...column.tasks,
                      {
                        id: String(
                          data.card._id
                        ),
                        title:
                          data.card.title,
                      },
                    ],
                  }
                : column
          ),
        };
      });
    } catch (error) {
      console.error(
        "Failed to add board task:",
        error
      );
    }
  };

  // =====================================================
  // BOARD - UPDATE TASK
  // =====================================================

  const handleBoardUpdateTask = async (
    listId: string | number,
    taskId: string | number,
    title: string
  ) => {
    if (!token) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/cards/${taskId}`,
        {
          method: "PUT",

          headers: {
            "content-type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            title,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Failed to update board task:",
          data.message
        );
        return;
      }

      setColumns((prev) => ({
        ...prev,

        board: prev.board.map(
          (column) =>
            String(column.id) ===
            String(listId)
              ? {
                  ...column,

                  tasks:
                    column.tasks.map(
                      (task) =>
                        String(
                          task.id
                        ) ===
                        String(taskId)
                          ? {
                              ...task,
                              title,
                            }
                          : task
                    ),
                }
              : column
        ),
      }));
    } catch (error) {
      console.error(
        "Failed to update board task:",
        error
      );
    }
  };

  // =====================================================
  // BOARD - DELETE TASK
  // =====================================================

  const handleBoardDeleteTask = async (
    listId: string | number,
    taskId: string | number
  ) => {
    if (!token) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/cards/${taskId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Failed to delete board task:",
          data.message
        );
        return;
      }

      setColumns((prev) => ({
        ...prev,

        board: prev.board.map(
          (column) =>
            String(column.id) ===
            String(listId)
              ? {
                  ...column,

                  tasks:
                    column.tasks.filter(
                      (task) =>
                        String(
                          task.id
                        ) !==
                        String(taskId)
                    ),
                }
              : column
        ),
      }));
    } catch (error) {
      console.error(
        "Failed to delete board task:",
        error
      );
    }
  };

  // =====================================================
  // INBOX - DELETE
  // =====================================================

  const handleDeleteCard = async (
    id: number | string
  ) => {
    if (!token) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/lists/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Failed to delete inbox card:",
          data.message
        );
        return;
      }

      setColumns((prev) => ({
        ...prev,

        inbox: prev.inbox.filter(
          (card) =>
            String(card.id) !==
            String(id)
        ),
      }));
    } catch (error) {
      console.error(
        "Failed to delete inbox card:",
        error
      );
    }
  };

  // =====================================================
  // DRAG & DROP
  // =====================================================

  const handleDragEnd = async (
    event: DragEndEvent
  ) => {
    if (event.canceled) return;

    if (!token) return;

    const cardId =
      event.operation.source?.id;

    const targetId =
      event.operation.target?.id;

    if (
      cardId == null ||
      targetId == null
    ) {
      return;
    }

    const currentColumns = columns;

    // =================================================
    // FIND SOURCE
    // =================================================

    let sourceLocation:
      | "inbox"
      | string
      | null = null;

    const inboxCard =
      currentColumns.inbox.find(
        (card) =>
          String(card.id) ===
          String(cardId)
      );

    if (inboxCard) {
      sourceLocation = "inbox";
    } else {
      for (const column of currentColumns.board) {
        const task =
          column.tasks.find(
            (card) =>
              String(card.id) ===
              String(cardId)
          );

        if (task) {
          sourceLocation =
            String(column.id);
          break;
        }
      }
    }

    // =================================================
    // FIND TARGET
    // =================================================

    let targetLocation:
      | "inbox"
      | string
      | null = null;

    if (
      String(targetId) ===
      "inbox"
    ) {
      targetLocation = "inbox";
    } else if (
      typeof targetId === "string" &&
      targetId.startsWith("column-")
    ) {
      targetLocation =
        targetId.substring(7);
    }

    if (
      sourceLocation === null ||
      targetLocation === null
    ) {
      return;
    }

    // Same location
    if (
      String(sourceLocation) ===
      String(targetLocation)
    ) {
      return;
    }

    // =================================================
    // FIND DRAGGED CARD
    // =================================================

    let draggedCard:
      | BoardTaskItem
      | undefined;

    const inboxDraggedCard =
      currentColumns.inbox.find(
        (card) =>
          String(card.id) ===
          String(cardId)
      );

    if (inboxDraggedCard) {
      draggedCard = inboxDraggedCard;
    } else {
      for (const column of currentColumns.board) {
        const task =
          column.tasks.find(
            (card) =>
              String(card.id) ===
              String(cardId)
          );

        if (task) {
          draggedCard = task;
          break;
        }
      }
    }

    if (!draggedCard) {
      return;
    }

    const draggedTitle =
      draggedCard.title;

    // =================================================
    // UPDATE UI FIRST
    // =================================================

    setColumns((prev) => {
      let newInbox = [
        ...prev.inbox,
      ];

      let newBoard = [
        ...prev.board,
      ];

      // Remove from source
      if (
        sourceLocation === "inbox"
      ) {
        newInbox =
          newInbox.filter(
            (card) =>
              String(card.id) !==
              String(cardId)
          );
      } else {
        newBoard =
          newBoard.map(
            (column) =>
              String(column.id) ===
              String(sourceLocation)
                ? {
                    ...column,

                    tasks:
                      column.tasks.filter(
                        (card) =>
                          String(
                            card.id
                          ) !==
                          String(cardId)
                      ),
                  }
                : column
          );
      }

      // Add to target
      if (
        targetLocation ===
        "inbox"
      ) {
        newInbox = [
          ...newInbox,
          draggedCard!,
        ];
      } else {
        newBoard =
          newBoard.map(
            (column) =>
              String(column.id) ===
              String(targetLocation)
                ? {
                    ...column,

                    tasks: [
                      ...column.tasks,
                      draggedCard!,
                    ],
                  }
                : column
          );
      }

      return {
        inbox: newInbox,
        board: newBoard,
      };
    });

    // =================================================
    // INBOX → BOARD
    // =================================================

    if (
      sourceLocation === "inbox" &&
      targetLocation !== "inbox"
    ) {
      try {
        const res = await fetch(
          "http://localhost:5000/api/cards",
          {
            method: "POST",

            headers: {
              "content-type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              title: draggedTitle,
              listId:
                targetLocation,
            }),
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          console.error(
            "Failed to create board card:",
            data.message
          );

          return;
        }

        if (!data.card) {
          console.error(
            "No card returned from backend."
          );

          return;
        }

        // Replace temporary inbox/card ID
        // with actual MongoDB card ID
        setColumns((prev) => ({
          ...prev,

          board: prev.board.map(
            (column) =>
              String(column.id) ===
              String(
                targetLocation
              )
                ? {
                    ...column,

                    tasks:
                      column.tasks.map(
                        (task) =>
                          String(
                            task.id
                          ) ===
                          String(cardId)
                            ? {
                                ...task,

                                id: String(
                                  data.card
                                    ._id
                                ),

                                title:
                                  data.card
                                    .title,
                              }
                            : task
                      ),
                  }
                : column
          ),
        }));

        // Delete old inbox list
        const deleteRes =
          await fetch(
            `http://localhost:5000/api/lists/${cardId}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (!deleteRes.ok) {
          const deleteData =
            await deleteRes.json();

          console.error(
            "Failed to delete old inbox list:",
            deleteData.message
          );
        }
      } catch (error) {
        console.error(
          "Inbox → Board failed:",
          error
        );
      }

      return;
    }

    // =================================================
    // BOARD → INBOX
    // =================================================

    if (
      sourceLocation !==
        "inbox" &&
      targetLocation === "inbox"
    ) {
      try {
        // IMPORTANT:
        // Use actual MongoDB Inbox Board ID
        const actualInboxBoardId =
          inboxBoardId ||
          localStorage.getItem(
            "inboxBoardId"
          );

        if (!actualInboxBoardId) {
          console.error(
            "Inbox Board ID not found."
          );

          return;
        }

        const res = await fetch(
          "http://localhost:5000/api/lists",
          {
            method: "POST",

            headers: {
              "content-type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              title: draggedTitle,

              boardId:
                actualInboxBoardId,
            }),
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          console.error(
            "Failed to create inbox list:",
            data.message
          );

          return;
        }

        if (!data.list) {
          console.error(
            "No inbox list returned."
          );

          return;
        }

        // Replace temporary board card
        // with actual inbox list ID
        setColumns((prev) => ({
          ...prev,

          inbox: prev.inbox.map(
            (item) =>
              String(item.id) ===
              String(cardId)
                ? {
                    ...item,

                    id: String(
                      data.list._id
                    ),

                    title:
                      data.list.title,
                  }
                : item
          ),
        }));

        // Delete old board card
        const deleteRes =
          await fetch(
            `http://localhost:5000/api/cards/${cardId}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (!deleteRes.ok) {
          const deleteData =
            await deleteRes.json();

          console.error(
            "Failed to delete old board card:",
            deleteData.message
          );
        }
      } catch (error) {
        console.error(
          "Board → Inbox failed:",
          error
        );
      }

      return;
    }

    // =================================================
    // BOARD → BOARD
    // =================================================

    if (
      sourceLocation !==
        "inbox" &&
      targetLocation !== "inbox"
    ) {
      try {
        const res = await fetch(
          `http://localhost:5000/api/cards/${cardId}/move`,
          {
            method: "PUT",

            headers: {
              "content-type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              listId:
                targetLocation,
            }),
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          console.error(
            "Failed to move board card:",
            data.message
          );

          return;
        }

        console.log(
          "Card moved successfully:",
          data
        );
      } catch (error) {
        console.error(
          "Board → Board failed:",
          error
        );
      }
    }
  };

  // =====================================================
  // AUTH
  // =====================================================

  if (!token) {
    return (
      <Auth
        setToken={setToken}
      />
    );
  }

  const user = JSON.parse(
    localStorage.getItem("user") ||
      "null"
  );

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "inboxBoardId"
    );

    localStorage.removeItem(
      "mainBoardId"
    );

    setInboxBoardId(null);
    setMainBoardId(null);

    setColumns({
      inbox: [],
      board: [],
    });

    setToken(null);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="bg-[#111827] w-screen h-screen flex flex-col">
      <Nav
        user={user}
        onLogout={handleLogout}
      />

      <DragDropProvider
        onDragEnd={handleDragEnd}
      >
        <SplitPanel
          left={
            <InboxPortion
              cards={columns.inbox}
              onAddCard={
                handleInboxAddCard
              }
              onUpdateCard={
                handleUpdateCard
              }
              onDeleteCard={
                handleDeleteCard
              }
            />
          }
          right={
            <Board
              columns={columns.board}
              boardId={mainBoardId}
              token={token}
              socket={socket}
              onAddCard={
                handleBoardAddTask
              }
              onUpdateCard={
                handleBoardUpdateTask
              }
              onDeleteCard={
                handleBoardDeleteTask
              }
            />
          }
          initialLeftPercent={25}
        />
      </DragDropProvider>
    </div>
  );
};

export default App;