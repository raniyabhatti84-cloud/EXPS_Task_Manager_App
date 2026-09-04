let io;

const setIo = (socketIo) => {
    io = socketIo;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.IO is not initialized");
    }

    return io;
};

module.exports = {
    setIo,
    getIo
};