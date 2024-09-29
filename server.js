require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/epictube', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// User Model
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}));

// Video Model
const Video = mongoose.model('Video', new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    filePath: { type: String, required: true },
}));

// Multer setup for video uploads
const upload = multer({ dest: 'uploads/' });

// User Registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.send('User registered');
});

// User Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user._id }, 'secret_key'); // Replace 'secret_key' with an environment variable
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Video Upload
app.post('/upload', upload.single('video'), async (req, res) => {
    const videoData = new Video({
        userId: req.body.userId, // Get this from token in a real app
        title: req.body.title,
        filePath: req.file.path,
    });
    await videoData.save();
    res.send('Video uploaded successfully');
});

// List Videos
app.get('/videos', async (req, res) => {
    const videos = await Video.find();
    res.json(videos);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
