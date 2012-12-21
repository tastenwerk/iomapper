/**
 * user model
 *
 * written by TASTENWERK http://tastenwerk.com
 * plugin repository: http://github.com/tastenwerk/konter
 *
 */
var mongoose = require('mongoose')
  , crypto = require('crypto');

var UserLoginLogSchema = new mongoose.Schema({
  ip: String,
  createdAt: { type: Date, default: Date.now }
});

var UserMessagesSchema = new mongoose.Schema({
  content: String,
  read: {type: Boolean, default: false},
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});
UserMessagesSchema.add({
  followUps: [UserMessagesSchema]
});

var UserSchema = mongoose.Schema({
      name: {
        first: String,
        last: String,
        nick: { type: String, lowercase: true, index: { unique: true } }
      },
      hashedPassword: {type: String, required: true},
      salt: {type: String, required: true},
      preferences: {type: mongoose.Schema.Types.Mixed, default: { common: { locale: 'en', hosts: [] }, docklets: [ 'users/docklets/messages' ] } },
      picCropCoords: { type: mongoose.Schema.Types.Mixed, default: { w: 0, h: 0, x: 0, y: 0 } },
      messages: [ UserMessagesSchema ],
      email: {type: String, 
              lowercase: true,
              required: true,
              index: { unique: true },
              match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i },
      contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
      loginLog: [ UserLoginLogSchema ],
      roles: { type: Array, default: ['user'] },
      lastRequest: {
        createdAt: Date,
        ip: String
      },
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
 * show the number of unread messages
 *
 */
UserSchema.virtual('unreadMessages').get( function(){
  var unread = 0;
  this.messages.forEach( function( message ){
    if( !message.read ) unread+=1;
  });
  return unread;
});

/**
 * returns, if the user can be changed by currentUser
 */
UserSchema.method('canWrite', function( user ){
  return user._id === this._id || user.roles.indexOf('manager');
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
 * returns if user has role 'manager' set
 */
UserSchema.method('isAdmin', function(){
  return this.roles.indexOf('manager') >= 0;
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

/**
 * anybody user id
 */
UserSchema.statics.anybodyId = 'a00000000000';

/**
 * the anybody user
 * is similar to publishing something. If anybody user has
 * access to an object, it will be schown to the public.
 *
 */
UserSchema.statics.anybody = { name: 'anybody', _id: UserSchema.statics.anybodyId, id: UserSchema.statics.anybodyId };

/**
 * system user id
 */
UserSchema.statics.systemId = 's00000000000';

/**
 * the system user
 * is used to create content from public access (without a user
 * being logged in)
 *
 */
UserSchema.statics.system = { name: 'system', _id: UserSchema.statics.systemId, id: UserSchema.statics.systemId };

/**
 * everybody user id
 */
UserSchema.statics.everybodyId = 'e00000000000';

/**
 * the everybody user
 * if a content object is shared with the everybody user, 
 * any logged in user can access this content with the
 * given privileges.
 *
 * An everybody-shared content cannot be shared with other
 * users ( would avoid everybody access, if removed later )
 * nor can everybody-user get deletion privileges
 *
 */
UserSchema.statics.everybody = { name: 'everybody', _id: UserSchema.statics.everybodyId, id: UserSchema.statics.everybodyId };

UserSchema.method('badGuys',
 'loginLog hashedPassword salt password preferences roles lastRequest confirmation'
);

UserSchema.method('toSafeObject', function(){
  safeObj = this.toObject({ hide: this.badGuys });
  for( var i in safeObj )
    if( this.badGuys.indexOf( i ) >= 0 )
      delete safeObj[i];
  return safeObj;
})

UserSchema.method('toJSON', function() {
  obj = this.toObject();
  bg = this.badGuys.split(' ');
  for( var i in bg )
    delete obj[bg[i]];
  return obj;
});

module.exports = mongoose.model('User', UserSchema);