const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
    createBoard,
    getBoards,
    updateBoard,
    deleteBoard,
    inviteMember,
    getBoardMembers,
    removeMember
} = require("../controllers/boardController");

const router = express.Router();

router.post("/", protect, createBoard);
router.get("/", protect, getBoards);
router.put("/:id", protect, updateBoard);
router.delete("/:id", protect, deleteBoard);

// Member Routes
router.post("/:id/members", protect, inviteMember);
router.get("/:id/members", protect, getBoardMembers);
router.delete("/:id/members/:userId", protect, removeMember);

module.exports = router;