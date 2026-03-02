// Import necessary modules
const express = require('express');
const { MongoClient } = require('mongodb'); // MongoDB client for database interactions
const cors = require('cors'); // CORS middleware to handle cross-origin requests
const multer = require('multer'); // Middleware for handling file uploads
const bcrypt = require('bcryptjs'); // For hashing passwords
const path = require('path'); // For handling file and directory paths
const mongoose = require('mongoose'); // MongoDB object modeling tool 
const router = express.Router(); // Express Router for handling API routes
const { ObjectId } = require('mongodb'); // For handling MongoDB ObjectIds
const jwt = require('jsonwebtoken'); // For creating and verifying JSON Web Tokens (JWT)
const app = express(); // Create an instance of an Express app
const port = 8080; // Define the port the app will run on

// MongoDB connection URI and setup
const uri = "mongodb://127.0.0.1:27017"; // MongoDB URI to connect locally
const client = new MongoClient(uri); // MongoDB client instance
let db; // Placeholder for the database connection

// Middlewares
app.use(router); // Use the Express router for routing requests
app.use(express.json({ limit: '10mb' })); // Middleware to parse JSON request bodies, limiting size to 10mb
app.use(cors()); // Enable CORS (Cross-Origin Resource Sharing)
app.use(express.static('Public')); // Serve static files from the 'Public' directory

// Serve static files from 'Public' directory and 'uploads' sub-directory
app.use('/Public', express.static(path.join(__dirname, 'Public')));
app.use('/uploads', express.static(path.join(__dirname, 'Public', 'uploads')));

// Endpoint for serving the index.html file from the 'Public' folder
app.get('/M00942167', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'), (err) => {
    if(err) {
      console.error(`Error serving index.html: ${err}`); // Log any error when serving the file
      res.status(500).send('Error serving the file'); // Send error message if there's an issue
    }
  });
});

// Multer storage configuration for handling image uploads
const storage = multer.diskStorage({
  // Define the destination folder for uploads
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Set the upload directory to 'public/uploads'
  },
  // Define a custom filename for each uploaded file
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use a timestamp to ensure unique filenames
  },
});

// Initialize multer with the defined storage configuration
const upload = multer({ storage });

// MongoDB connection function
async function connectDB() {
  try {
    await client.connect(); // Attempt to connect to the MongoDB server
    console.log("Connected to MongoDB!"); // Log success message
    db = client.db('photoSharingApp'); // Connect to the 'photoSharingApp' database
  } catch (err) {
    console.error("Error connecting to MongoDB:", err); // Log connection errors
    process.exit(1); // Exit the application if MongoDB connection fails
  }
}

// Call the function to connect to the database
connectDB();

// User registration route
app.post('/M00942167/users', async (req, res) => {
  const { username, password } = req.body; // Extract username and password from request body

  // Check if user already exists in the database
  const user = await db.collection('users').findOne({ username });
  if (user) {
    return res.status(400).json({ error: 'User already exists' }); // Return error if user already exists
  }

  // Hash the password using bcrypt
  const hashedPassword = await bcrypt.hash(password, 10); // Hash password with salt rounds
  const newUser = { username, password: hashedPassword }; // Create user object with hashed password
  const result = await db.collection('users').insertOne(newUser); // Insert new user into the database

  res.status(201).json({ message: 'User registered successfully!' }); // Send success message
});

// User login route
app.post('/M00942167/login', async (req, res) => {
  const { username, password } = req.body; // Extract username and password from request body

  // Find user by username
  const user = await db.collection('users').findOne({ username });
  if (!user) {
    return res.status(400).json({ error: 'User not found' }); // Return error if user not found
  }

  // Compare password with stored hashed password
  const isMatch = await bcrypt.compare(password, user.password); 
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid password' }); // Return error if passwords don't match
  }
  
  // Generate JWT token for the user
  const token = jwt.sign({ username }, 'your-secret-key', { expiresIn: '1h' }); // Create token with 1 hour expiration

  res.status(200).json({
    message: 'Login successful',
    token, // Send the token to the client
    username, // Send username as part of the response
  });
});

// Profile update route
app.post('/M00942167/complete-profile', upload.single('profilePic'), async (req, res) => {
  const { username, bio } = req.body; // Extract username and bio from request body
  const profilePic = req.file ? req.file.path : null; // Get the file path if profile picture is uploaded

  // Check if all required fields are provided
  if (!username || !bio || !profilePic) {
    return res.status(400).json({ 
      message: 'All fields (username, bio, profile picture) are required.'
    });
  }

  try {
    // Update user profile in the database
    const result = await db.collection('users').updateOne(
      { username }, // Find user by username
      { $set: { bio, profilePic } } // Update bio and profile picture
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found.' }); // Return error if user not found
    }

    res.json({ message: 'Profile updated successfully.' }); // Send success message
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile.', error: error.message }); // Handle error in updating profile
  }
});

// JWT authentication middleware
const JWT_SECRET = 'your-secret-key'; 

function authenticateToken(req, res, next) {
  const authHeader = req.header('Authorization'); // Get the Authorization header
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null; // Extract token if present

  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No token provided.' }); // Return error if no token is provided
  }

  try {
    const user = jwt.verify(token, JWT_SECRET); // Verify the token using the secret key
    req.user = user; // Attach user data to the request object
    console.log('Decoded User:', user); // Log the decoded user data for debugging
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error('JWT Verification Error:', err.message); // Log any errors during token verification
    return res.status(403).json({ message: 'Invalid or expired token.' }); // Return error if token is invalid or expired
  }
}

module.exports = authenticateToken; // Export the authenticateToken middleware

// Profile fetch route (protected with JWT authentication)
app.get('/M00942167/profile', authenticateToken, async (req, res) => {
  // `req.user` contains user information after successful token verification
  try {
    // Fetch user profile from database
    const user = await db.collection('users').findOne({ username: req.user.username });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' }); // Return error if user not found
    }

    res.status(200).json({
      username: user.username, // Return username
      bio: user.bio, // Return bio
      profilePic: user.profilePic, // Return profile picture
    });
  } catch (error) {
    console.error("Error fetching profile:", error); // Log any errors
    res.status(500).json({ message: 'Error fetching profile.' }); // Return error if there's an issue fetching the profile
  }
});

// Get list of all users (publicly accessible)
app.get('/M00942167/users', async (req, res) => {
  try {
    const users = await db.collection('users').find({}).toArray(); // Fetch all users from the database
    // Return an array of user data excluding sensitive information
    res.json(users.map(user => ({
      username: user.username, // Return username
      bio: user.bio, // Return bio
      profilePic: user.profilePic // Return profile picture
    })));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' }); // Return error if there's an issue fetching users
  }
});

// Get posts for a specific user (with pagination)
app.get('/M00942167/contents/:username', async (req, res) => {
  const username = req.params.username; // Get the username from the URL parameter
  const page = parseInt(req.query.page) || 1; // Get the current page number (default is 1)
  const limit = parseInt(req.query.limit) || 5; // Get the limit for number of posts per page (default is 5)

  try {
    // Fetch posts for the specified username with pagination
    const posts = await db.collection('contents')
      .find({ username }) // Filter posts by username
      .sort({ createdAt: -1 }) // Sort posts by creation date in descending order
      .skip((page - 1) * limit) // Implement pagination
      .limit(limit) // Limit the number of posts returned
      .toArray();

    // Return the posts in a specific format
    res.json(posts.map(post => ({
      username: post.username, // Return the username of the poster
      caption: post.caption, // Return the caption of the post
      imageUrl: post.imageUrl, // Return the URL of the post image
      profilePic: post.profilePic || '../Public/Images/default-profile.jpg', // Return the user's profile picture or a default
      createdAt: post.createdAt, // Return the creation date of the post
      comments: post.comments || [], // Return comments (if any)
    })));
  } catch (err) {
    console.error('Error fetching posts:', err); // Log any errors
    res.status(500).json({ message: 'Error fetching posts' }); // Return error if there's an issue fetching posts
  }
});

// Get a specific user's profile (publicly accessible)
app.get('/M00942167/user-profile/:username', async (req, res) => {
  const username = req.params.username; // Get the username from the URL parameter
  try {
    // Fetch user profile by username
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' }); // Return error if user not found
    }
    // Return user profile data
    res.json({
      username: user.username, // Return username
      bio: user.bio, // Return bio
      profilePic: user.profilePic // Return profile picture
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user profile' }); // Return error if there's an issue fetching the profile
  }
});


// Toggle follow/unfollow status for a user
app.post('/M00942167/toggle-follow/:username', async (req, res) => {
  const username = req.params.username; // Extract the username of the user to be followed/unfollowed
  const currentUser = req.body.currentUser; // Ensure the current user's identity is being sent in the request body
  
  // If the current user is not provided, return a bad request error
  if (!currentUser) {
    return res.status(400).json({ message: 'Current user is not provided' });
  }

  try {
    // Check if the user to be followed/unfollowed exists
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the current user is already following the target user
    const isFollowing = user.followers?.includes(currentUser);

    if (isFollowing) {
      // If the current user is following the target user, remove them from followers
      await db.collection('users').updateOne(
        { username }, // Find user by username
        { $pull: { followers: currentUser } } // Remove current user from followers
      );
      return res.json({ isFollowing: false, message: `Unfollowed ${username}` });
    } else {
      // If the current user is not following, add them to followers
      await db.collection('users').updateOne(
        { username }, // Find user by username
        { $addToSet: { followers: currentUser } } // Add current user to followers set (avoiding duplicates)
      );
      return res.json({ isFollowing: true, message: `Followed ${username}` });
    }
  } catch (error) {
    // Handle any errors that occur during the follow/unfollow process
    console.error('Error toggling follow status:', error);
    return res.status(500).json({ message: 'Error toggling follow status' });
  }
});

// Retrieve the profile details of a specific user by username
app.get('/M00942167/user-profile/:username', async (req, res) => {
  const username = req.params.username; // Extract the username of the profile to be retrieved

  try {
    // Check if the user exists in the database
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user's public details excluding sensitive information like password
    res.json({
      username: user.username, // Username
      bio: user.bio,           // User bio
      profilePic: user.profilePic, // User profile picture
    });
  } catch (error) {
    // Handle any errors that occur during the profile retrieval process
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});



// Endpoint to search users based on a query
app.get('/M00942167/search-users', async (req, res) => {
  const query = req.query.q; // Get the search query from the request
  
  try {
    // Perform a case-insensitive search for users based on the username
    const users = await db.collection('users') // 
      .find({ username: { $regex: query, $options: 'i' } }) // Case-insensitive search
      .toArray();

    // Return the list of users that match the search query
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Endpoint to get user profile details
app.get('/M00942167/user-profile/:username', async (req, res) => {
  const username = req.params.username; // Extract the username from the URL

  try {
    // Fetch the user data based on the username
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch follower and following details from the database
    const followers = await db.collection('users').find({ username: { $in: user.followers } }).toArray();
    const following = await db.collection('users').find({ username: { $in: user.following } }).toArray();

    // Return user details excluding sensitive information
    res.json({
      username: user.username,  // User's username
      bio: user.bio,            // User's bio
      profilePic: user.profilePic, // User's profile picture
      followers: user.followers || [], // List of followers
      following: user.following || []  // List of following users
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Route to create a new content post
app.post('/M00942167/contents', authenticateToken, upload.single('image'), async (req, res) => {
  const { caption } = req.body;
  const username = req.user.username; // Access the username from the decoded JWT

  if (!req.file || !caption) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user exists
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a new content entry
    const newContent = {
      username,
      caption,
      imageUrl: `/uploads/${req.file.filename}`, // Store image file URL
      createdAt: new Date(), // Timestamp of creation
    };

    // Insert the new content into the 'contents' collection
    await db.collection('contents').insertOne(newContent);

    // Return success response with the new content details
    res.status(201).json({
      message: 'Post created successfully',
      content: newContent,
      profilePic: user.profilePic, // User's profile picture
      username: user.username,    // Username of the user who posted
    });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ message: 'Error creating content' });
  }
});

// Route to get user contents with pagination
app.get('/M00942167/contents/:username', async (req, res) => {
  const username = req.params.username; // Extract the username from the URL
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 3; // Default to 3 contents per page if not provided

  try {
    // Fetch contents from the database with pagination
    const contents = await db.collection('contents')
      .find({ username: username }) // Filter contents by username
      .sort({ createdAt: -1 }) // Sort by creation date in descending order
      .skip((page - 1) * limit) // Skip contents for previous pages
      .limit(limit) // Limit the number of contents per page
      .toArray();

    // For each content, fetch the profile picture from the users collection
    const contentsWithProfilePics = await Promise.all(contents.map(async (content) => {
      const user = await db.collection('users').findOne({ username: content.username });
      content.profilePic = user && user.profilePic ? user.profilePic : '/path/to/default-profile-pic.jpg'; // Set the profile picture or default if not found
      return content; // Return content with profile picture added
    }));

    console.log(`Page ${page} Contents retrieved:`, contentsWithProfilePics);
    res.json(contentsWithProfilePics); // Send contents with profilePic included
  } catch (error) {
    console.error("Error retrieving contents:", error);
    res.status(500).json({ error: "Failed to retrieve contents" });
  }
});

// Route to unfollow a user
app.delete('/:studentId/follow/:username', async (req, res) => {
  const { studentId, username } = req.params; // Extract student ID and username from URL
  const currentUser = req.body.currentUser;  // Assuming the current user is sent in the body

  if (!currentUser) {
    return res.status(400).json({ message: 'Current user is required' });
  }

  try {
    // Update the database to remove the followed user from the current user's following list
    const result = await db.collection('follows').updateOne(
      { username: currentUser },
      { $pull: { following: username } } // Remove the user from the following list
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Follow relationship not found' });
    }

    res.json({ message: `${username} has been unfollowed successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred while unfollowing the user.' });
  }
});

// Middleware to verify the JWT token for authentication
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']; // Get token from headers

  if (!token) {
      return res.status(403).send({ error: 'No token provided' });
  }

  try {
      console.log('Token verified');
      next(); // Proceed to the next middleware or route handler
  } catch (err) {
      res.status(401).send({ error: 'Invalid token' }); // Token is invalid
  }
};

// Start the server on the specified port
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/M00942167`);
});
