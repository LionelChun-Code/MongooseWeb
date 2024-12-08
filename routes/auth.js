const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { checkSignup, checkSignin } = require('../middlewares/validators');
const { hashPassword, comparePassword } = require('../utils/bcryptHelper');
const { ensureAuthenticated, ensureNotAuthenticated } = require('../middlewares/auth');
const User = require('../models/user');

/* GET signin page. */
router.get('/signin', ensureNotAuthenticated, function (req, res, next) {
    res.render('signin', { title: 'Sign In' });
});

/* GET signup page. */
router.get('/signup', ensureNotAuthenticated, function (req, res, next) {
    res.render('signup', { title: 'Sign Up' });
});

/* GET signout page. */
router.get('/signout', ensureAuthenticated, function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/auth/signin');
    });
});

/* POST signin form. */
router.post('/signin', ensureNotAuthenticated, checkSignin, async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const db = req.app.locals.db;
        const user = await db.collection('users').findOne({ email: email });
        console.log(user);

        if (!user) {
            return res.status(400).json({ error: 'Account not found.' });
        }

        const isPasswordValid = comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'The password you entered is incorrect.' });
        }

        req.session.user = { 
            id: user._id, 
            username: user.username, 
            email: user.email, 
            avatar: user.avatar,
            role: user.role,
            isActivated: user.isActivated,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
        console.log(req.session);
        return res.json({ success: 'Signin successful!', redirectUrl: '/dashboard' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An internal error occurred. Please try again later.' });
    }
});

/* POST signup form. */
router.post('/signup', ensureNotAuthenticated, checkSignup, async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors); // 記錄錯誤信息
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const hashedPassword = hashPassword(password);

    const db = req.app.locals.db;
    const users = await db.collection('users').find({}).toArray();
    const ADMIN_ROLE = 'admin';
    const USER_ROLE = 'user';
    let userRole = users.length === 0 ? ADMIN_ROLE : USER_ROLE;

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
        return res.status(400).json({ error: 'Email is already registered' });
    }

    const newUser = new User({
        username: email.split('@')[0],
        email: email,
        password: hashedPassword,
        role: userRole,
        avatar: '', // 默認 avatar 
        isActivated: false, // 默認未激活 
        updatedAt: new Date()
    });

    try {
        const savedUser = await newUser.save();
        console.log(`[${new Date().toISOString()}] 資料已經儲存完畢，儲存的資料是：`);
        console.log(savedUser);
        req.session.user = { 
            id: savedUser._id, 
            username: savedUser.username, 
            email: savedUser.email, 
            avatar: savedUser.avatar,
            role: savedUser.role,
            isActivated: savedUser.isActivated,
            createdAt: savedUser.createdAt,
            updatedAt: savedUser.updatedAt
        };
        console.log(req.session);
        return res.json({ success: 'Signup successful!', redirectUrl: '/dashboard' });
    } catch (error) {
        console.error(error); // 記錄錯誤信息
        if (error.name === 'ValidationError') {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: errorMessages });
        }
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Email is already registered' });
        }
        return res.status(500).json({ error: 'An error occurred while saving user' });
    }
});


module.exports = router;
