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
          if( ! self.acl[i] ){
            self.acl[i] = parent.acl[i];
            self.acl[i].from = {};
          } else
            if( parent.acl[i].privileges.length > self.acl[i].privileges.length )
              self.acl[i].privileges = parent.acl[i].privileges;
          if( self.acl[i].from )
            self.acl[i].from[parent.id] = {privileges: parent.acl.privileges, createdAt: new Date() };
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
   * performs an incremental update to child object
   * to syncronize their acl with parent content
   */
  syncChildren: function _syncChildren( next ){

    var self = this
      , thisChildren = []
      , childrenCount = 0;

    function nextChild(){
      var child = thisChildren[ childrenCount ];
      for( var i in self.acl){
        if( child.acl[i] )
          child.acl[i].privileges = self.acl[i].privileges;
        else
          child.acl[i] = { privileges: self.acl[i].privileges, from: {} };
        if( child.acl[i].from )
          child.acl[i].from[self.id] = {privileges: self.acl[i].privileges, createdAt: new Date() };
      }
      // check for dead bodies which should not exist after
      // parent's unsharing
      for( var i in child.acl )
        if( !self.acl[i] && child.acl[i].from[self.id] && Object.keys(child.acl[i].from).length === 1 )
          delete child.acl[i];
      child.markModified('acl');
      child.save( function( err ){
        if( err )
          next( err );
        else{
          if( ++childrenCount < thisChildren.length )
            nextChild();
          else
            next();
        }
      })
    }

    this.children( function( err, children ){
      thisChildren = children;
      if( err )
        next( err );
      else if( children.length === 0 )
        next();
      else
        nextChild();
    })
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
    if( privileges.indexOf('d') >= 0 )
      privileges = 'rwsd';
    else if( privileges.indexOf('s') >= 0 )
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
  },

  /**
   * returns privileges of given user
   *
   * @param {User} [user] the user to get information for
   *
   */
  privileges: function _privileges( user ){
    var uid = this.holder.id.toString();
    if( user )
      if( typeof(user) === 'object' && user.id )
        uid = user.id.toString();
      else
        uid = user;
    if( this.acl[uid] )
      return this.acl[uid].privileges;
    else if( uid !== User.anybodyId && this.acl[User.everybodyId] )
      return this.acl[User.everybodyId].privileges;
    else if( this.acl[User.anybodyId] )
      return this.acl[User.anybodyId].privileges;
    else
      return '';
  },

  /**
   * returns true if the given user can
   * read this content
   *
   * @param {User} [user] the user to get information for
   *
   */
  canRead: function _canRead( user ){
    return (this.privileges( user ).indexOf('r') >= 0);
  },

  /**
   * returns true if the given user can
   * write this content
   *
   * @param {User} [user] the user to get information for
   *
   */
  canWrite: function _canWrite( user ){
    return( this.privileges( user ).indexOf('w') >= 0);
  },

  /**
   * returns true if the given user can
   * share this content
   *
   * @param {User} [user] the user to get information for
   *
   */
  canShare: function _canShare( user ){
    var p = this.privileges( user );
    return( p.indexOf('s') >= 0);
  },

  /**
   * returns true if the given user can
   * share this content
   *
   * @param {User} [user] the user to get information for
   *
   */
  canDelete: function _canDelete( user ){
    return( this.privileges( user ).indexOf('d') >= 0);
  }
  
}

module.exports = exports = accessControl;