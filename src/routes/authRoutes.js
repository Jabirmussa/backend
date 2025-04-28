import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({
    userId
  }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
}

router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: 'Email already exists'
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: 'Username already exists'
      });
    }

    //get random avatar
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}.svg`;

    const user = new User({
      email,
      username,
      password,
      profileImage,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user:{
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });

  } catch (error) {
   console.error("Error in register route",error);
   res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
        });
    } catch (error) {
        console.error("Error in login route", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;