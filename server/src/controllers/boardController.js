const Board = require("../models/Board");
const User = require("../models/User");
const { getIo } = require("../socket");

// Create Board
const createBoard = async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({
            message: "Title is required"
        });
    }

    try {
        const board = await Board.create({
            title,
            owner: req.user.id,
            members: [req.user.id]
        });

        // Socket.IO: notify clients about new board
        getIo().emit("boardCreated", {
            board
        });

        return res.status(201).json({
            message: "Board created successfully",
            board
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Get Boards
const getBoards = async (req, res) => {
    try {
        const boards = await Board.find({
            $or: [{ owner: req.user.id }, { members: req.user.id }]
        });

        return res.status(200).json({
            message: "Boards fetched successfully",
            boards
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Update Board
const updateBoard = async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({
            message: "Title is required"
        });
    }

    try {
        const board = await Board.findOneAndUpdate(
            {
                _id: id,
                owner: req.user.id
            },
            {
                title
            },
            {
                new: true
            }
        );

        if (!board) {
            return res.status(404).json({
                message: "Board not found"
            });
        }

        // Socket.IO: notify clients about updated board
        getIo().emit("boardUpdated", {
            board
        });

        return res.status(200).json({
            message: "Board updated successfully",
            board
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Delete Board
const deleteBoard = async (req, res) => {
    const { id } = req.params;

    try {
        const board = await Board.findOneAndDelete({
            _id: id,
            owner: req.user.id
        });

        if (!board) {
            return res.status(404).json({
                message: "Board not found"
            });
        }

        // Socket.IO: notify clients about deleted board
        getIo().emit("boardDeleted", {
            boardId: id
        });

        return res.status(200).json({
            message: "Board deleted successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Invite Member
const inviteMember = async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const board = await Board.findById(id);
        if (!board) {
            return res.status(404).json({ message: "Board not found" });
        }

        const isOwner = board.owner.toString() === req.user.id;
        const isMember = board.members.some(m => m.toString() === req.user.id);
        if (!isOwner && !isMember) {
            return res.status(403).json({ message: "Unauthorized to invite members" });
        }

        const userToInvite = await User.findOne({ email: email.toLowerCase().trim() });
        if (!userToInvite) {
            return res.status(404).json({ message: "User with this email not found" });
        }

        const inviteeId = userToInvite._id.toString();

        if (board.owner.toString() === inviteeId) {
            return res.status(400).json({ message: "User is already the owner of this board" });
        }

        if (board.members.some(m => m.toString() === inviteeId)) {
            return res.status(400).json({ message: "User is already a member of this board" });
        }

        board.members.push(userToInvite._id);
        await board.save();

        getIo().emit("boardMembersUpdated", { boardId: id });

        const updatedBoard = await Board.findById(id)
            .populate("owner", "name email")
            .populate("members", "name email");

        return res.status(200).json({
            message: "Member invited successfully",
            members: updatedBoard.members,
            owner: updatedBoard.owner
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


// Get Board Members
const getBoardMembers = async (req, res) => {
    const { id } = req.params;

    try {
        const board = await Board.findById(id)
            .populate("owner", "name email")
            .populate("members", "name email");

        if (!board) {
            return res.status(404).json({ message: "Board not found" });
        }

        const isOwner = board.owner._id.toString() === req.user.id;
        const isMember = board.members.some(m => m._id.toString() === req.user.id);

        if (!isOwner && !isMember) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        return res.status(200).json({
            owner: board.owner,
            members: board.members
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


// Remove Member / Leave Board
const removeMember = async (req, res) => {
    const { id, userId } = req.params;

    try {
        const board = await Board.findById(id);
        if (!board) {
            return res.status(404).json({ message: "Board not found" });
        }

        const requesterId = req.user.id;
        const isOwner = board.owner.toString() === requesterId;
        const isSelf = requesterId === userId;

        if (!isOwner && !isSelf) {
            return res.status(403).json({ message: "Unauthorized to remove member" });
        }

        if (board.owner.toString() === userId) {
            return res.status(400).json({ message: "Cannot remove the board owner" });
        }

        board.members = board.members.filter(m => m.toString() !== userId);
        await board.save();

        getIo().emit("boardMembersUpdated", { boardId: id });

        return res.status(200).json({ message: "Member removed successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


module.exports = {
    createBoard,
    getBoards,
    updateBoard,
    deleteBoard,
    inviteMember,
    getBoardMembers,
    removeMember
};