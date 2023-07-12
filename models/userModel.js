const crypto = require('crypto');
const mongoose = require('mongoose');
//const { default: isEmail } = require('validator/lib/isEmail');
const validator = require('validator');
const bcrypt = require('bcrypt');

// 1) Shema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
    trim: true,
    maxlength: [20, 'A name must have less or equal than 20 characters'],
    minlength: [2, 'A name must have more than 1 character']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    trim: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    // enum: restricted strings
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm the password'],
    validate: {
      // This works only on .save() and .create()
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// Encrypting password before pre save
// pre midleware on save (between getting data and saving it)
userSchema.pre('save', async function(next) {
  // Returns if password field is NOT modified
  if (!this.isModified('password')) return next();
  // changing the password (hashing/ encrypting)
  this.password = await bcrypt.hash(this.password, 12);
  // deleting passwordConfirm field so its not saved on DB
  this.passwordConfirm = undefined;
  // setting passwordChangedAt to the current time
  this.passwordChangedAt = Date.now();
  next();
});

userSchema.pre('save', function(next) {
  // exit is password was not changed or document is new
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; // because token can be signed faster than saving to DB. So -1000ms to generate token after the saving document
  next();
});

// Regular expression of all strings starting with "find"
// pre middle ware of User.findById() or simillar
userSchema.pre(/^find/, function(next) {
  // this points at the current query
  // {$ne: false} instead of true, so instances with no active field would still be included
  this.find({ active: { $ne: false } }); // adding a filter object
  next();
});

// Instance method. It will be available on all instances!
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  //this.password is not available so we pass in both to this function
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to see if passward was recently changed
userSchema.methods.changedPasswordAfter = async function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //console.log(changedTimeStamp, JWTTimestamp);
    // time when token was issued must be less than passward was changed to be ture
    // token was issued before password change? true
    return JWTTimestamp < changedTimeStamp;
  }
  // false - not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // encrypting resetToken
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //console.log({ resetToken }, this.passwordResetToken); // will print key:value
  // 10 min = 10m * 60s * 1000ms
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // returning unencrypted token. So that the token sent by email is not the same as encryptedToken in DB
  return resetToken;
};

// 2) Model created out of shema
const User = mongoose.model('User', userSchema);

module.exports = User;
