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
    type: String
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

// 2) Model created out of shema
const User = mongoose.model('User', userSchema);

module.exports = User;
