const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");


const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    try {

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

       
        return res.status(201).json({
            message: "User registered successfully",
            user
        });

    } catch (error) {
        console.log(error);

return res.status(500).json({
    message: "Internal Server Error"
});

    }
};


const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and Password are required"
        });
    }

    try {

        const user = await User.findOne({ email });
        if (!user) {
            
    return res.status(400).json({
        message: "Invalid Email or Password"
    });
}
const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
    return res.status(400).json({
        message: "Invalid Email or Password"
    });
}
 const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
);
const userData = {
    id: user._id,
    name: user.name,
    email: user.email
};
return res.status(200).json({
    message: "Login successful",
     token,
    user: userData
});

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};
const getProfile = async (req, res) => {
    return res.status(200).json({
        message: "Profile fetched successfully",
        user: req.user
    });
};




module.exports = {
    register,
    login,
    getProfile
};