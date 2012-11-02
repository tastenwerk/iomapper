/**
 * user model
 *
 * written by TASTENWERK http://tastenwerk.com
 * plugin repository: http://github.com/tastenwerk/konter
 *
 */
var mongoose = require('mongoose')
  , crypto = require('crypto');

var UserSchema = mongoose.Schema({
      name: {
        first: String,
        last: String,
        nick: {type: String, lowercase: true}
      },
      hashedPassword: {type: String, required: true},
      salt: {type: String, required: true},
      settings: {type: mongoose.Schema.Types.Mixed, default: {locale: 'en'} },
      email: {type: String, 
              lowercase: true,
              required: true,
              index: { unique: true },
              match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i },
      contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
      confirmation: {
        key: String,
        expires: Date
      }
});

/**
 * name.full virtual
 *
 * constructs a string which is definitely not null
 * and represents a (not unique) name of this user
 */
UserSchema.virtual('name.full').get( function() {
  if( this.name.first && this.name.last )
    return this.name.first + ' ' + this.name.last;
  else if( this.name.first )
    return this.name.first;
  else if( this.name.last )
    return this.name.last;
  else if( this.name.nick )
    return this.name.nick;
  else
    return this.email;
});

/**
 * set hashedPassword
 *
 * @param {String} password - the unencrypted password to be set
 */
UserSchema.virtual('password').set(function( password ) {
    this._password = password;
    this.salt = this.generateSalt();
    this.hashedPassword = this.encryptPassword(password);
})

/**
 * get unenrypted password
 *
 * @return {String} the unencrypted password (exists only for the time of obejct
 * creation)
 */
UserSchema.virtual('password').get(function() { 
  return this._password; 
});

/**
 * save validations (before saving this user object to the database)
 *
 */
UserSchema.pre('save', function( next ) {
  if( this.password )
    next( !this.validatePasswordCriteria(this.password) ? (new Error('user.errors.password_criteria')) : null );
  else
    next();
});

/**
 * validates presence and format of
 * email address
 *
 */
UserSchema.method('validatePasswordCriteria', function(password){
  if (password && password.length == 0) return false;
  return true;
});

/**
 * authenticate user
 *
 * compares hashed password with given plain text password
 *
 * @param {String} plainTextPassword the plain text password which
 * will be hase-compared against the original password saved to
 * the database
 */
UserSchema.method('authenticate', function(plainTextPassword) {
  return this.encryptPassword(plainTextPassword) === this.hashedPassword;
});

/**
 * generate salt
 *
 * generate the password salt
 */
UserSchema.method('generateSalt', function() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
});

/**
 *
 * encrypt password
 *
 * @param {String} password - clear text password string
 * to be encrypted
 */
UserSchema.method('encryptPassword', function(password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});

module.exports = mongoose.model('User', UserSchema);