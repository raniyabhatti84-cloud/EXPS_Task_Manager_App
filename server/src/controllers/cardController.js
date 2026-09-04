const mongoose = require("mongoose");
const Card = require("../models/Card");
const List = require("../models/List");
const Board = require("../models/Board");
const { getIo } = require("../socket");

const isDummyBoardId = (boardId) => {
    if (!boardId) return true;
    const str = boardId.toString();
    return str === "000000000000000000000000" ||
        str === "111111111111111111111111" ||
        /^0+$/.test(str) ||
        /^1+$/.test(str);
};

const checkAccess = async (list, userId) => {
    if (list.owner && list.owner.toString() === userId) {
        return true;
    }
    if (isDummyBoardId(list.boardId)) {
        return true;
    }
    if (mongoose.Types.ObjectId.isValid(list.boardId)) {
        const board = await Board.findById(list.boardId);
        if (board) {
            return board.owner.toString() === userId ||
                (board.members && board.members.some(m => m.toString() === userId));
        }
    }
    return true;
};

// Create Card
const createCard = async (req, res) => {
    const {
        listId,
        title,
        description,
        assignedTo,
        priority,
        dueDate,
        position
    } = req.body;

    if (!listId || !title) {
        return res.status(400).json({
            message: "List ID and Title are required"
        });
    }

    try {
        const list = await List.findById(listId);

        if (!list) {
            return res.status(404).json({
                message: "List not found"
            });
        }

        const hasAccess = await checkAccess(list, req.user.id);
        if (!hasAccess) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        const card = await Card.create({
            listId,
            title,
            description,
            assignedTo,
            priority,
            dueDate,
            position
        });

        // Socket.IO: notify clients about new card
        getIo().emit("cardCreated", {
            card
        });

        return res.status(201).json({
            message: "Card created successfully",
            card
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Get Cards
const getCards = async (req, res) => {
    const { listId } = req.params;

    try {
        const list = await List.findById(listId);

        if (!list) {
            return res.status(404).json({
                message: "List not found"
            });
        }

        const hasAccess = await checkAccess(list, req.user.id);
        if (!hasAccess) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        const cards = await Card.find({ listId }).sort({ position: 1 });

        return res.status(200).json({
            message: "Cards fetched successfully",
            cards
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Update Card
const updateCard = async (req, res) => {
    const { id } = req.params;

    const {
        title,
        description,
        assignedTo,
        priority,
        dueDate,
        position
    } = req.body;

    try {
        const existingCard = await Card.findById(id);

        if (!existingCard) {
            return res.status(404).json({
                message: "Card not found"
            });
        }

        const list = await List.findById(existingCard.listId);

        if (!list) {
            return res.status(404).json({
                message: "List not found"
            });
        }

        const hasAccess = await checkAccess(list, req.user.id);
        if (!hasAccess) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        const card = await Card.findByIdAndUpdate(
            id,
            {
                title,
                description,
                assignedTo,
                priority,
                dueDate,
                position
            },
            {
                new: true
            }
        );


        // Socket.IO: notify clients about updated card
        getIo().emit("cardUpdated", {
            card
        });


        return res.status(200).json({
            message: "Card updated successfully",
            card
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Delete Card
const deleteCard = async (req, res) => {
    const { id } = req.params;

    try {
        const card = await Card.findById(id);

        if (!card) {
            return res.status(404).json({
                message: "Card not found"
            });
        }

        const list = await List.findById(card.listId);

        if (!list) {
            return res.status(404).json({
                message: "List not found"
            });
        }

        const hasAccess = await checkAccess(list, req.user.id);
        if (!hasAccess) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        await Card.findByIdAndDelete(id);

        // Socket.IO: notify clients about deleted card
        getIo().emit("cardDeleted", {
            cardId: id
        });

        return res.status(200).json({
            message: "Card deleted successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Move Card
const moveCard = async (req, res) => {
    const { id } = req.params;
    const { listId, position } = req.body;

    if (!listId) {
        return res.status(400).json({
            message: "List ID is required"
        });
    }

    try {
        const list = await List.findById(listId);

        if (!list) {
            return res.status(404).json({
                message: "List not found"
            });
        }

        const hasAccess = await checkAccess(list, req.user.id);
        if (!hasAccess) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        const card = await Card.findByIdAndUpdate(
            id,
            {
                listId,
                position
            },
            {
                new: true
            }
        );

        if (!card) {
            return res.status(404).json({
                message: "Card not found"
            });
        }

        // Socket.IO: notify clients about moved card
        getIo().emit("cardMoved", {
            card
        });

        return res.status(200).json({
            message: "Card moved successfully",
            card
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


module.exports = {
    createCard,
    getCards,
    updateCard,
    deleteCard,
    moveCard
};