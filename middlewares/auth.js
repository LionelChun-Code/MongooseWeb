// 確保用戶已認證
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/auth/signin');
  }
}

// 確保用戶未認證
function ensureNotAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  } else {
    return next();
  }
}

// 確保用戶是管理員或超級管理員
function ensureAdmin(req, res, next) {
  const userRole = req.session.user.role;
  if (userRole === 'admin' || userRole === 'superadmin') {
    return next();
  } else {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
}

// 確保用戶是超級管理員
function ensureSuperadmin(req, res, next) {
  const userRole = req.session.user.role;
  if (userRole === 'superadmin') {
    return next();
  } else {
    return res.status(403).json({ error: 'Access denied. Superadmins only.' });
  }
}

module.exports = { ensureAuthenticated, ensureNotAuthenticated, ensureAdmin, ensureSuperadmin };
