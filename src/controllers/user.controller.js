import authService from "../services/user.service.js";
import connectDB from "../db/connectDB.js";

// Signup
const signup = async (req, res) => {
  try {
    await connectDB();

    const user = await authService.signup(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    await connectDB();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const data = await authService.login({ email, password });

    res.status(200).json(data);
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || "Something went wrong",
    });
  }
};

// Refresh Token
const refresh = async (req, res) => {
  try {
    await connectDB();

    const { refreshToken } = req.body;
    const data = await authService.refresh(refreshToken);
    res.status(200).json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    await connectDB();

    const user = await authService.getUserById(req.user.id);

    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({
      error: err.message || "User not found",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    await connectDB();

    const userId = req.user.id;
    const { password, ...updateData } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "Password is required to update profile",
      });
    }

    const updatedUser = await authService.updateUser(
      userId,
      password,
      updateData
    );

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || "Something went wrong",
    });
  }
};

export default {
  signup,
  login,
  refresh,
  getUserById,
  updateUser,
};