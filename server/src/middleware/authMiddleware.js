const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "No token provided"
        });
    }

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Invalid token format"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or Expired Token"
        });
    }
};

module.exports = protect;