const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: true, // Allow all origins for local network testing
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Ensure uploads directory exists
const uploadDir = 'uploads/notes';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  displayName: String,
  email: { type: String, unique: true, required: true },
  password: { type: String }, // Hashed password for email/pass users
  photo: String,
  isVerified: { type: Boolean, default: false },
  verificationCode: String,
  verificationCodeExpires: Date,
  // New Profile Fields
  department: String,
  college: String,
  class: String,
  year: String,
  placedAt: String,
  leetCodeHandle: String,
  codeForcesHandle: String,
  role: { type: String, enum: ['student', 'secretary', 'admin'], default: 'student' },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Bi-directional/Accepted follows
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Note Schema
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: String,
  fileUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', noteSchema);

// Announcement Schema
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['hackathon', 'club', 'general'], default: 'general' },
  createdAt: { type: Date, default: Date.now }
});
const Announcement = mongoose.model('Announcement', announcementSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  room: String, // Can be roomId or combined userId for P2P
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Follow Request Schema
const followRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const FollowRequest = mongoose.model('FollowRequest', followRequestSchema);

// Multer Config for File Uploads
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/notes');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Nodemailer Config
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error (Nodemailer):', error);
  } else {
    console.log('Email server is ready to take our messages');
  }
});

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy (Google users are automatically verified)
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL || '/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            user.photo = profile.photos[0].value;
            user.isVerified = true;
            await user.save();
          } else {
            user = new User({
              googleId: profile.id,
              displayName: profile.displayName,
              email: profile.emails[0].value,
              photo: profile.photos[0].value,
              isVerified: true
            });
            await user.save();
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// --- Notes Routes ---

// Upload Note
app.post('/api/notes/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, subject, tags, uploadedBy } = req.body;

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/notes/${req.file.filename}`;
    console.log('Uploading note:', { title, subject, fileUrl, uploadedBy });

    const note = new Note({
      title,
      subject,
      fileUrl,
      uploadedBy,
      tags: tags ? tags.split(',') : []
    });

    await note.save();
    console.log('Note saved successfully');
    res.status(201).json({ message: 'Note uploaded successfully', note });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Get All Notes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find().populate('uploadedBy', 'displayName photo');
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

// --- Announcement Routes ---

// Post Announcement
app.post('/api/announcements', async (req, res) => {
  try {
    const { title, content, postedBy, type } = req.body;
    const announcement = new Announcement({ title, content, postedBy, type });
    await announcement.save();
    res.status(201).json({ message: 'Announcement posted', announcement });
  } catch (err) {
    res.status(500).json({ message: 'Failed to post announcement' });
  }
});

// Get Latest Announcements
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('postedBy', 'displayName role')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

// --- Auth Routes ---

// 1. Register with 6-Digit Code
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Registration attempt:', { name, email });

    let user = await User.findOne({ email });
    if (user) {
      if (user.isVerified) {
        console.log('User already exists and is verified:', email);
        return res.status(400).json({ message: 'User already exists and is verified.' });
      } else {
        console.log('Unverified user exists. Updating and resending code:', email);
        // Fall through to update existing unverified user
      }
    } else {
      user = new User({ email });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Send Verification Email
    const mailOptions = {
      from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code - CampusConnect',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #175e50; font-size: 28px; margin: 0; letter-spacing: 1px;">CampusConnect</h1>
          </div>
          <div style="color: #333333; font-size: 16px; line-height: 1.6;">
            <p style="margin-top: 0;">Hi <strong>${name}</strong>,</p>
            <p>Welcome! Please use the 6-digit verification code below to complete your registration:</p>
            <div style="text-align: center; margin: 40px 0;">
              <span style="display: inline-block; background-color: #f4fbf9; color: #175e50; font-size: 36px; font-weight: 700; padding: 15px 40px; border-radius: 8px; border: 2px dashed #175e50; letter-spacing: 8px;">${verificationCode}</span>
            </div>
            <p style="font-size: 14px; color: #666;">This code is valid for <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999999; text-align: center;">&copy; 2024 CampusConnect. All rights reserved.</p>
        </div>
      `
    };

    console.log(`Attempting to send verification email to: ${email}`);
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');

    user.displayName = name;
    user.password = hashedPassword;
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;

    await user.save();
    console.log('User registered successfully (pending verification)');

    res.status(201).json({ message: 'Code sent to your email. Please verify.' });
  } catch (err) {
    console.error('Registration/Email failure:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: `Server error: ${err.message || 'Unknown error'}` });
  }
});

// 2. Verify Code
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: 'Verification failed.' });
  }
});

// 3. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified) return res.status(401).json({ message: 'Please verify your email before logging in.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, displayName: user.displayName, email: user.email, photo: user.photo } });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// 4. Logout
app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return res.status(500).json({ message: 'Logout failed' }); }
    res.json({ message: 'Logged out successfully' });
  });
});

// --- Profile Routes ---

// Get Profile
app.get('/api/auth/profile', async (req, res) => {
  try {
    // In a real app, you'd use a JWT middleware to get the user ID
    // For now, we'll try to find user by email from query (for dev ease)
    const email = req.query.email;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Profile
app.put('/api/auth/profile', async (req, res) => {
  try {
    const { email, ...updateData } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check Authentication Status and Get User Info
app.get('/api/auth/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        return res.json({ authenticated: true, user });
      }
    }

    // Fallback to passport session if available
    if (req.isAuthenticated()) {
      return res.json({ authenticated: true, user: req.user });
    }

    res.json({ authenticated: false });
  } catch (err) {
    res.json({ authenticated: false });
  }
});

// --- Social & Follow Routes ---

// Get All Users (Discovery)
app.get('/api/users', async (req, res) => {
  try {
    const { exclude } = req.query;
    const users = await User.find({ _id: { $ne: exclude } }).select('displayName email photo department role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Send Follow Request
app.post('/api/follow/request', async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    const existingRequest = await FollowRequest.findOne({ sender: senderId, receiver: receiverId, status: 'pending' });
    if (existingRequest) return res.status(400).json({ message: 'Request already pending' });

    const request = new FollowRequest({ sender: senderId, receiver: receiverId });
    await request.save();
    res.status(201).json({ message: 'Follow request sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send request' });
  }
});

// Get Incoming Requests
app.get('/api/follow/requests/:userId', async (req, res) => {
  try {
    const requests = await FollowRequest.find({ receiver: req.params.userId, status: 'pending' }).populate('sender', 'displayName photo email');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// Accept Follow Request
app.post('/api/follow/accept', async (req, res) => {
  const { requestId } = req.body;
  try {
    const request = await FollowRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'accepted';
    await request.save();

    // Add to each other's friends list for P2P chat
    await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
    await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

    res.json({ message: 'Follow request accepted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to accept request' });
  }
});

// Get Friends (Connections for P2P Chat)
app.get('/api/users/friends/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('friends', 'displayName photo email department');
    res.json(user.friends);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch connections' });
  }
});

// Get P2P Messages
app.get('/api/messages/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room }).populate('sender', 'displayName photo').sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Google Auth
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login/failed' }), (req, res) => {
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:8080'}/dashboard?token=${token}`);
});

// --- Socket.io Logic ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('send_message', async (data) => {
    const { room, sender, content } = data;
    try {
      const newMessage = new Message({ room, sender, content });
      await newMessage.save();

      // Populate sender info for the frontend
      const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'displayName photo');

      io.to(room).emit('receive_message', populatedMessage);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(process.env.PORT || 5000, () => console.log(`Server running on http://localhost:${process.env.PORT || 5000}`));
