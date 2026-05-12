import User from "../db/models/user.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import AppError from "../utils/ApiError.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});


// Signup
const signup = async (data) => {
  const { name, email, password, role } = data;
  console.log(data);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role === "owner" ? "owner" : "user",
  });

  return sanitizeUser(user);
};

// Login

export const login = async (data) => {
  try {
    const { email, password } = data;

    // 1. Validate input
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // 2. Find user
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // 3. Check password safety
    if (!user.password) {
      throw new Error("User password not set in DB");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    // 4. Create token payload
    const payload = {
      id: user._id,
      role: user.role,
    };

    // 5. Generate tokens
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  } catch (err) {
    console.error("LOGIN SERVICE ERROR:", err.message);
    throw err;
  }
};


// Refresh Token
const refresh = async (refreshToken) => {
  if (!refreshToken) throw new Error("Refresh token required");

  const decoded = verifyRefreshToken(refreshToken);

  const payload = {
    id: decoded.id,
    role: decoded.role,
  };

  const newAccessToken = generateAccessToken(payload);

  return { accessToken: newAccessToken };
};


const getUserById = async (id) => {
  try {
    const user = await User.findById(id).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch user");
  }
};


const updateUser = async (userId, password, updateData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Incorrect password", 401);
  }

  if (updateData.role) {
    throw new AppError("Role cannot be updated", 403);
  }

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateData,
    { returnDocument: "after" }
  ).select("-password");

  return updatedUser;
};


export default {
  signup,
  login,
  refresh,
  getUserById,
  updateUser,
};