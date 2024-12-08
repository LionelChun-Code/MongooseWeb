var express = require('express');
var router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');

/* GET dashboard page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
  res.render('dashboard');
});

module.exports = router;
