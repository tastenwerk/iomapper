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

/**
 * loads all path items and injects
 * this.acl with found parent's acl
 * overriding from last parent to first parent
 */
function _setupAclFromPath( callback ){
  var parentsLength = this.paths.length
    , self = this;
  function nextParent(){
    var str = self.paths[--parentsLength]
      , arr = str.split(':');
    self.db.model(arr[1]).findById(arr[0], function( err, parent ){
      if( err )
        callback( err );
      else {
        for( var i in parent.acl ){
          self.acl[i] = parent.acl[i];
          self.acl[i].from = { documentId: parent.id, createdAt: new Date() };
        }
        if( parentsLength > 0 )
          nextParent();
        else{
          // ensure creator has correct privileges set;
          self.acl[self.holder.id] = { privileges: 'rwsd' };
          callback();
        }
      }
    });
  }
  nextParent();
}

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
      if( this.paths && this.paths.length > 0 )
        _setupAclFromPath.call( this, next );
      else{
        this.acl[this.holder.id] = { privileges: 'rwsd' };
        next();
      }
    } else
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
      this.acl[uid].from['0'] = {invitedBy: this.holder.id, createdAt: new Date() };
    } else
      this.acl[uid] = { privileges: privileges, from: {'0': { invitedBy: this.holder.id, createdAt: new Date()} } };
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