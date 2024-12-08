const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin, ensureSuperadmin } = require('../middlewares/auth');
const User = require('../models/user');

// 顯示管理員儀表板
router.get('/dashboard', ensureAuthenticated, ensureAdmin, async function(req, res, next) {
  try {
    const users = await User.find();
    res.render('adminDashboard', { title: 'Admin Dashboard', users });
  } catch (error) {
    console.error('An error occurred while fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users. Please try again later.' });
  }
});

router.put('/change-role/:id', ensureAuthenticated, ensureSuperadmin, async function(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 防止用戶修改自己的角色
    if (user._id.equals(req.session.user.id)) {
      return res.status(403).json({ error: 'Superadmins cannot change their own roles' });
    }

    const { role } = req.body;
    user.role = role;
    await user.save();
    console.log('User role changed successfully.');
    return res.json({ success: 'User role changed successfully' });
  } catch (error) {
    console.error('Error occurred while changing user role:', error);
    return res.status(500).json({ error: 'An error occurred while changing user role. Please try again later.' });
  }
});

module.exports = router;
