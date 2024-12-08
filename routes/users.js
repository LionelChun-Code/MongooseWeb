const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { checkUpdatePassword } = require('../middlewares/validators');
const { hashPassword } = require('../utils/bcryptHelper');
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth');
const { createUpload, createThumbnail } = require('../middlewares/uploadImage');
const { deleteOldImage } = require('../middlewares/deleteOldImage');
const User = require('../models/user');

// 定義 avatarUpload
const avatarUpload = createUpload(process.env.AVATAR_ORIGINAL_PATH, 'newAvatar');

// 獲取錯誤信息的輔助函數
const getErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors.array();
  }
  return null;
};

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// 獲取所有用戶信息
router.get('/all-users', ensureAuthenticated, async function(req, res, next) {
  try {
    const users = await User.find();
    res.render('allUsers', { title: 'All Users', users });
  } catch (error) {
    console.error('An error occurred while fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users. Please try again later.' });
  }
});


/* GET user profile page. */
router.get('/profile', ensureAuthenticated, function(req, res, next) {
  res.render('profile', { title: 'Profile', user: req.session.user });
});

/* GET user settings page. */
router.get('/settings', ensureAuthenticated, function(req, res, next) {
  res.render('settings', { title: 'Settings' });
});

/* POST profile form to update user details and upload avatar. */
router.post('/profile', ensureAuthenticated, avatarUpload, (req, res, next) => createThumbnail(req, res, next, process.env.AVATAR_THUMBNAIL_PATH), deleteOldImage(process.env.AVATAR_ORIGINAL_PATH, process.env.AVATAR_THUMBNAIL_PATH), async function(req, res, next) {
  const errors = getErrors(req);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const { email, username, isDormant } = req.body;

  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);
    user.email = email;
    user.username = username;
    user.isDormant = !!isDormant; // 更新休眠狀態

    // 如果有上傳新的 avatar，更新 avatar
    if (req.file) {
      user.avatar = req.file.filename; // 只存儲文件名
    }

    await user.save();
    req.session.user = { ...req.session.user, email, username, avatar: user.avatar, isDormant: user.isDormant };

    return res.json({ success: 'Profile updated successfully!', avatar: user.avatar });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') { 
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errorMessages });
    }
    return res.status(500).json({ error: 'An error occurred while updating profile' });
  }
});


/* POST settings form to update password. */
router.post('/settings', ensureAuthenticated, checkUpdatePassword, async function(req, res, next) {
  const errors = getErrors(req);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const { password } = req.body;
  const hashedPassword = hashPassword(password);

  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);
    user.password = hashedPassword;
    await user.save();

    return res.json({ success: 'Password updated successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'An error occurred while updating password' });
  }
});

router.put('/deactivate/:id', ensureAuthenticated, ensureAdmin, async function(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActivated = false; // 設置帳號為停用
    user.save((err) => {
      if (err) {
        console.error('Failed to deactivate user account:', err);
        return res.status(500).json({ error: 'An error occurred while deactivating user. Please try again later.' });
      } else {
        console.log('User account deactivated successfully.');
        return res.json({ success: 'User account deactivated successfully' });
      }
    });
  } catch (error) {
    console.error('Error occurred while deactivating user:', error);
    return res.status(500).json({ error: 'An error occurred while deactivating user. Please try again later.' });
  }
});



module.exports = router;
