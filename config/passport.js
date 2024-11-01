const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user.model');



passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return done(null, false, { message: 'Incorrect credentials.' });
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

module.exports = passport;
