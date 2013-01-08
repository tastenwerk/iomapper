/**
 * the Notification Model
 * stores any kind of notification for users
 *
 */

var mongoose = require('mongoose');

var NotificationSchema = mongoose.Schema({
  //acl: {type: mongoose.Schema.Types.Mixed, default: {}, index: true},
  _creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: {type: Array, default: [] },
  message: {type: String, required: true },
  docType: String,
  docId: String,
  _affectedUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: {type: Date, default: Date.now},
  type: {type: String, default: 'System Notification'}
});

/**
 * before create check that
 * creator will have access on this object
 */
NotificationSchema.pre('save', function( next ){
  if( this.isNew ){
    //this.acl[this._creator.toString()] = { privileges: 'rwsd' };
    if( this.read.indexOf( this._creator.toString() ) < 0 );
    this.read.push( this._creator.toString() );
    if( this.public && this.read.indexOf( mongoose.models.User.anybodyId ) < 0 )
      this.read.push( mongoose.models.User.anybodyId );
  }
  next();
});

var Notification = mongoose.model( 'Notification', NotificationSchema );

module.exports = exports = Notification;
