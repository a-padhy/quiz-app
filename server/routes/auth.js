import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { UserModel } from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();
const secret = process.env.JWT_SECRET;

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password, preferredLanguage } = req.body;

    const user = await UserModel.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({
      username,
      password: hashedPassword,
      preferredLanguage,
    });
    await newUser.save();
    res.json({ message: "User registered successfully" });
  } catch (error) {
    console.log(error);
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await UserModel.findOne({ username });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Username or password is incorrect" });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res
      .status(400)
      .json({ message: "Username or password is incorrect" });
  }
  const token = jwt.sign({ id: user._id }, secret);
  res.json({ token, userID: user._id, username });
});

export { router as userRouter };

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    jwt.verify(authHeader, secret, (err) => {
      if (err) {
        return res.sendStatus(403);
      }
      next();
    });
  } else {
    res.sendStatus(401);
  }
};
