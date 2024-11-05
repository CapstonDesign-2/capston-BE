const express = require('express');
const {
    // registerUser,
    loginUser,
    logoutUser,
    getProfile,
    updateProfile
} = require('../controllers/userController');

const router = express.Router();

// POST /api/user/register
// router.post('/register', registerUser);

// POST /api/user/login
router.post('/login', loginUser);

// POST /api/user/logout
router.post('/logout', logoutUser);

// GET /api/user/profile
router.get('/profile', getProfile);

// PUT /api/user/profile
router.put('/profile', updateProfile);

module.exports = router;