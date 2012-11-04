/**
 * KONTER
 *
 * content repository plugin for mongoose
 *
 * written by TASTENWERK http://tastenwerk.com
 * plugin repository: http://github.com/tastenwerk/konter
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var logSchema = require( __dirname + '/lib/log_schema' )
  , commentSchema = require( __dirname + '/lib/comment_schema' )
  , User = require( __dirname + '/lib/models/user' )
  , paths = require( __dirname + '/lib/paths' )
  , accessControl = require( __dirname + '/lib/access_control' );

mongoose.Query.prototype.execWithUser = function withUser( user, callback ){
  var acl = []
    , allowed = ['acl.'+user.id+'.privileges', 'acl.'+User.anybodyId+'.privileges', 'acl.'+User.everybodyId+'.privileges']
  for( var i in allowed ){
    var h = {};
    h[allowed[i]] = /r*/;
    acl.push( h );
  }
  this.or( acl );
  this.exec( function( err, doc ){
    if( err )
      callback( err );
    else if( !doc )
      callback( null, null );
    else{
      doc.holder = user;
      callback( null, doc )
    }
  });
};

var KonterPlugin = function KonterPlugin (schema, options) {

  schema.add({ createdAt: { type: Date, default: Date.now },
  						 _creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  						 updatedAt: { type: Date, default: Date.now },
  						 _updater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  						 _starred: [ {type: mongoose.Schema.Types.ObjectId, ref: 'user', index: true} ],
               pos: Number,
  						 logs: [ logSchema ],
               _type: String,
               paths: [ {type: String, index: true} ],
  						 acl: {type: mongoose.Schema.Types.Mixed, default: {}, index: true},
  						 name: {type: String, index: true, required: true},
  						 comments: [ commentSchema ]

  });

  /**
   * holder of this content object
   * there should never be an access to the
   * database without filling this virtual property
   *
   * @returns {User} - the holder user object
   *
   */
  schema.virtual('holder').get( function(){
    return this._holder;
  });

  /**
   * set the holder of this content object.
   *
   * @param {User} - the user object to be holding this
   * content object
   */
  schema.virtual('holder').set( function( holder ){
    this._holder = holder;
  });

  /**
   * set a parent by providing the parent
   * object or it's id
   *
   * @param {Content Object} - a content repository 
   * object (must be persisted)
   *
   */
  schema.virtual('parent').set( paths.setParent );

  /**
   * access control
   * see lib/access_control.js
   */
  schema.pre( 'save', accessControl.setupCreatorAndAccess );
  schema.pre( 'save', accessControl.syncChildren );
  schema.method('share', accessControl.share );
  schema.method('unshare', accessControl.unshare );
  schema.method('privileges', accessControl.privileges );
  schema.method('canRead', accessControl.canRead );
  schema.method('canWrite', accessControl.canWrite );
  schema.method('canShare', accessControl.canShare );
  schema.method('canDelete', accessControl.canDelete );

  /**
   * save the modelname along with the database
   */
  schema.pre('save', function setupModelNameForStorage( next ){
    if( this.isNew )
      this._type = this.constructor.modelName;
    next();
  })

  schema.pre('remove', paths.removeChildrenWithoutAssociations );
  schema.method('parents', paths.parents);
  schema.method('children', paths.children);
  schema.method('countChildren', paths.countChildren);
  schema.statics.rootsOnly = paths.rootsOnly;

  /**
   * options for konter plugin
   */
  if (options && options.index) {
    schema.path('updatedAt').index(options.index)
  }

  schema.set('toObject', { getters: true, virtuals: true });

}

module.exports = exports = {
	plugin: KonterPlugin,
	models: {
		User: require( __dirname + '/lib/models/user' )
	}
};