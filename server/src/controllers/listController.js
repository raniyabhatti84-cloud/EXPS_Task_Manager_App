const mongoose = require("mongoose");
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

const checkListAccess = async (list, userId) => {
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

// Create List
const createList = async (req, res) => {
    const { boardId, title, position } = req.body;

    if (!boardId || !title) {
        return res.status(400).json({
            message: "Board ID and Title are required"
        });
    }

    try {
        if (!isDummyBoardId(boardId) && mongoose.Types.ObjectId.isValid(boardId)) {
            const board = await Board.findById(boardId);
            if (board) {
                const isMember = board.owner.toString() === req.user.id || 
                    (board.members && board.members.some(m => m.toString() === req.user.id));
                if (!isMember) {
                    return res.status(403).json({ message: "Unauthorized" });
                }
            }
        }

        const list = await List.create({
            boardId,
            title,
            position,
            owner: req.user.id
        });

        // Socket.IO: notify clients about new list
        getIo().emit("listCreated", {
            list
        });

        return res.status(201).json({
            message: "List created successfully",
            list
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Get Lists
const getLists = async (req, res) => {
    const { boardId } = req.query;

    try {
        const userBoards = await Board.find({
            $or: [{ owner: req.user.id }, { members: req.user.id }]
        }).select("_id");

        const allowedBoardIds = userBoards.map((b) => b._id);

        const filter = {
            $or: [
                { owner: req.user.id },
                { owner: { $exists: false } },
                { owner: null },
                { boardId: { $in: allowedBoardIds } }
            ]
        };

        if (boardId) {
            filter.boardId = boardId;
        }

        const lists = await List.find(filter).sort({ position: 1 });

        return res.status(200).json({
            message: "Lists fetched successfully",
            lists
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Update List
const updateList = async (req, res) => {
    const { id } = req.params;
    const { title, position } = req.body;

    try {
        const list = await List.findById(id);

        if (!list) {
            return res.status(404).json({
                message: "List not found"
            });
        }

        const hasAccess = await checkListAccess(list, req.user.id);
        if (!hasAccess) {
            return res.status(403).json({
                message: "Forbidden: Access denied"
            });
        }

        if (title !== undefined) list.title = title;
        if (position !== undefined) list.position = position;

        await list.save();

        // Socket.IO: notify clients about updated list
        getIo().emit("listUpdated", {
            list
        });

        return res.status(200).json({
            message: "List updated successfully",
            list
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Delete List
const deleteList = async (req, res) => {
    const { id } = req.params;

    try {
        const list = await List.findById(id);

        if (!list) {
            return res.status(404).json({
                message: "List not found"
            });
        }

        const hasAccess = await checkListAccess(list, req.user.id);
        if (!hasAccess) {
            return res.status(403).json({
                message: "Forbidden: Access denied"
            });
        }

        await List.findByIdAndDelete(id);

        // Socket.IO: notify clients about deleted list
        getIo().emit("listDeleted", {
            listId: id
        });

        return res.status(200).json({
            message: "List deleted successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Move List
const moveList = async (req, res) => {
    const { id } = req.params;
    const { position } = req.body;

    try {
        const list = await List.findById(id);

        if (!list) {
            return res.status(404).json({
                message: "List not found"
            });
        }

        const hasAccess = await checkListAccess(list, req.user.id);
        if (!hasAccess) {
            return res.status(403).json({
                message: "Forbidden: Access denied"
            });
        }

        list.position = position;
        await list.save();

        // Socket.IO: notify clients about moved list
        getIo().emit("listMoved", {
            list
        });

        return res.status(200).json({
            message: "List moved successfully",
            list
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


module.exports = {
    createList,
    getLists,
    updateList,
    deleteList,
    moveList
};
