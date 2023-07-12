const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router(); // mini app

// only post data for this route
// .post(route, function)
//router.route('/signup').post(authController.signup);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// This middleware protects all routes after this point
router.use(authController.protect); // from this point all paths are accessable ONLY if authenticated

router.patch('/updateMyPassword', authController.updatePassword);

router.get(
  '/me',
  userController.getMe, // faking that user id is coming from URL
  userController.getUser
);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

// Only admins can access routes below
router.use(authController.restrictTo('admin'));
router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
