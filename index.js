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
  this
    .or( acl )
    .where('deletedAt').equals(null);
  this.exec( function( err, doc ){
    if( err )
      callback( err );
    else if( !doc )
      callback( null, null );
    else{
      if( doc instanceof Array )
        doc.map( function(d){ d.holder = user; });
      else
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
               _deletedAt: Date,
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
   * the name of the collection (also used in urls)
   * which makes it easier to not allways check for
   * singular and plural
   *
   * @returns {String} collectionName
   */
  schema.virtual('collectionName').get( function(){
    return this.constructor.collectionName;
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
   * return if this document is published
   *
   * @returns {Boolean} [published]
   */
  schema.virtual('published').get( function isPublished(){
    return this.canRead( konter.mongoose.models.User.anybody );
  });

  /**
   * return if the privileges for current document
   * holder
   *
   * @returns {String} [privileges] 'rwsd'
   *
   */
  schema.virtual('holderPrivileges').get( function holderPrivileges(){
    return this.privileges();
  });

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
  schema.method('ancestors', paths.ancestors);
  schema.method('children', paths.children);
  schema.method('countChildren', paths.countChildren);
  schema.method('setParent', paths.setParent);
  schema.method('addParent', paths.setParent);
  schema.method('removeParent', paths.unsetParent);
  schema.method('parentIds', paths.parentIds);
  schema.statics.rootsOnly = paths.rootsOnly;
  schema.statics.childrenOf = paths.childrenOf;
  /**
   * options for konter plugin
   */
  if (options && options.index) {
    schema.path('updatedAt').index(options.index)
  }

  schema.set('toJSON', { getters: true }); // not working!!!

}

module.exports = exports = konter = {
	plugin: KonterPlugin,
	models: require( __dirname + '/lib/models'),
  connection: null,
  connect: function( url, debug ){
    konter.connection = mongoose.connect( url );
    mongoose.set('debug', debug);
  },

  firstAnyWithUser: function( user, query, options, callback ){

    konter.findAnyWithUser( user, query, options, function( err, res ){

      if( typeof( callback ) === 'undefined' ){
        if( typeof( options ) === 'undefined' )
          callback = query;
        else
          callback = options;
        options = null;
      }

      if( err )
        callback( err );
      else if( res.length > 0 )
        callback( null, res[0]);
      else
        callback( null, null );
    });
  },

  findAnyWithUser: function(user, query, options, callback ){

    var count = 0
      , childrenArr = []
      , self = this
      , resultsArr = []
      , childrenCount = 0
      , models = konter.mongoose.models
      , collectionsLength = Object.keys(models).length;


    function runInitChild(){
      var item = childrenArr[childrenCount++];
      models[item._type].findById( item._id ).execWithUser( user, function( err, child ){
        child.holder = user;
        resultsArr.push( child );
        if( childrenCount < childrenArr.length )
          runInitChild();
        else
          callback( null, paths._sortArray( resultsArr, options && options.sort ) );
      })
    }

    function runCallback(){
      if( ++count === collectionsLength )
        if( childrenArr.length > 0 )
          runInitChild();
        else
          callback( null, [] );
    }

    if( typeof( callback ) === 'undefined' ){
      if( typeof( options ) === 'undefined' )
        callback = query;
      else
        callback = options;
      options = null;
    }

    // setup query
    var q = {};
    if( query )
      for( var i in query )
        q[i] = query[i];

    for( var i in mongoose.connection.collections ){
      mongoose.connection.collections[i].find(q, function( err, cursor ){
        if( err ){
          callback( err );
          return;
        } else{
          cursor.toArray(function(err, items) {
            if( err ){
              callback( err );
              return;
            }
            items.forEach( function( item ){
              if( item._type )
                childrenArr.push( item );
            });
            runCallback();
          });
        }
      });
    }

  },

  mongoose: mongoose
};