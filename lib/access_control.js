/**
 * KONTER
 *
 * content repository plugin for mongoose
 *
 * written by TASTENWERK http://tastenwerk.com
 * plugin repository: http://github.com/tastenwerk/konter
 *
 */

var User = require( __dirname + '/models/user' );

var accessControl = {


  /**
   * setup the creator and give full access to their 
   * newly created object.
   *
   * if the holder object has not been set up till here
   * an error will be passed to the next callback. It is illegal to create
   * objects without a user being set.
   *
   */
   setupCreatorAndAccess: function setupCreatorAndAccess( next ) {
    if( this.isNew ){
      if( !this.holder ){
        next( new Error("[pre.save.setupCreatorAndAccess] konter.securityleak: no holder object has been provided for " + this.name) );
        return;
      }
      this._creator = this._updater = this.holder._id;
      this.acl[this._creator] = {privileges: 'rwsd'};
    }
    next();
  },

  /**
   * share this content with given user
   *
   * @param {User} [user] the user object
   * @param {String} [privileges] privileges
   * 'r' read
   * 'w' write
   * 's' share
   * 'd' delete
   * combination is ascending. e.g.: rd is not possible
   * and will be converted into rwsd
   */
  share: function _share( user, privileges ){
    if( user.id === User.anybodyId )
      privileges = 'r';
    else if( user.id === User.everybodyId && !privileges.match(/r|rw/) )
      privileges = 'rw';
    if( privileges.indexOf('d') )
      privileges = 'rwsd';
    else if( privileges.indexOf('s') )
      privileges = 'rws';
    var uid = user;
    if( typeof(user) === 'object' && user.id )
      uid = user.id;
    if( this.acl[uid] ){
      this.acl[uid].privileges = privileges;
      this.acl[uid].log['0'] = {invitedBy: this.holder.id, createdAt: new Date() };
    } else
      this.acl[uid] = { privileges: privileges, log: {'0': { invitedBy: this.holder.id, createdAt: new Date()} } };
    this.markModified('acl');
  },

  /**
   * unsahres a content for given user
   *
   * @param {User} [user] the user object
   *
   */
  unshare: function _unshare( user ){
    var uid = user;
    if( typeof(user) === 'object' && user.id )
      uid = user.id;
    delete this.acl[uid];
    this.markModified('acl');
  }
  
}

module.exports = exports = accessControl;