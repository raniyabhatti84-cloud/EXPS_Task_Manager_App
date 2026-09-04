const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
    {
        listId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "List",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium"
        },
        dueDate: {
            type: Date,
            default: null
        },
        position: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const Card = mongoose.model("Card", cardSchema);

module.exports = Card;