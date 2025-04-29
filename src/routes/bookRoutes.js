import express from 'express';
import cloudinary from '../lib/cloudinary.js';
import Book from '../models/Book.js';
import { protectRoute } from '../../src/middleware/auth.middleware.js';

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;
    if(!title || !caption || !rating || !image){
      return res.status(400).json({ message: 'Please fill in all fields' });
    }
    // Upload image to cloudinary
    const uploadedResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadedResponse.secure_url;
    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id
    });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// const response = await fetch("http://localhost:300/api/book?page=2&limit=5");
router.get("/", protectRoute, async (req, res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const books = await Book.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username profileImage');

        const totalBooks = await Book.countDocuments();

        res.send({
            books,
            currentPage: page,
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit),
        });
        
    } catch (error) {
        console.log("Error in get all books route", error);
        res.status(500).json({ message: "Internal server error" })
    }
});

//get recommended books
router.get("/user", protectRoute, async (req, res) => {
    try {
        const books = await Book.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        console.log("Error in get recommended books route", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

//delete book
router.delete("/:id", protectRoute, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if(!book){
            return res.status(404).json({ message: "Book not found" });
        }

        if(book.user.toString() !== req.user._id.toString()){
            return res.status(401).json({ message: "Not authorized" });
        }
        // Delete image from cloudinary
        if(book.image && book.image.includes("cloudinary")){
            try {
                const publicId = book.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (error) {
                
                console.log("Error in delete book route", error);
            }
        }

        await book.deleteOne();

        res.json({ message: "Book removed" });

    } catch (error) {
        console.log("Error in delete book route", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router; // Export the router