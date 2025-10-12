const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const authenticate = async (req, res, next) => {
  try {
    // ✅ Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    const token = authHeader.split(" ")[1];

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // ✅ Find user by ID from token
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // ✅ Attach user to request for next middleware
    req.user = user;
    next();

  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authenticate;