const express = require("express");
const protect = require("../middleware/authMiddleware");
const { createList, getLists, updateList, deleteList, moveList } = require("../controllers/listController");

const router = express.Router();

router.post("/", protect, createList);
router.get("/", protect, getLists);
router.put("/:id", protect, updateList);
router.delete("/:id", protect, deleteList);
router.put("/:id/move", protect, moveList);


module.exports = router;