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
  , commentSchema = require( __dirname + '/lib/comment_schema' );

// paths [ "2029320936:Contact/203920936802936:Label/", "20936236:Label" ]

var KonterPlugin = function KonterPlugin (schema, options) {

  schema.add({ createdAt: { type: Date, default: Date.now },
  						 _creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  						 updatedAt: { type: Date, default: Date.now },
  						 _updater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  						 _starred: [ {type: mongoose.Schema.Types.ObjectId, ref: 'user', index: true} ],
  						 logs: [ logSchema ],
               paths: [ {type: String, index: true} ],
  						 acl: {type: mongoose.Schema.Types.Mixed, default: {}, index: true},
  						 name: {type: String, index: true},
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
  schema.virtual('parent').set( function( co ){
    if( typeof(co) === 'object' && co.id )
      this.paths.push( co.id.toString() + ':' + co.constructor.modelName );
    else
      this.paths.push( co );
  })

  /**
   * setup the creator and give full access to their 
   * newly created object.
   *
   * if the holder object has not been set up till here
   * an error will be thrown. It is illegal to create
   * objects without a user being set.
   *
   */
  schema.pre('save', function setupCreatorAndAccess( next ) {
    if( this.isNew ){
      if( !this.holder )
        throw "konter.securityleak: no holder object has been provided!";
      this._creator = this._updater = this.holder._id;
      this.acl[this._creator] = 'rwsd';
    }
    next();
  });

  /**
   * finds all parents
   *
   * @param {Object} options
   *
   * @param {Function} [callback] - [ err, array ]
   *
   */
  schema.method('parents', function( options, callback ){
    if( typeof(options) === 'function' ){
      callback = options;
      options = null;
    }
    var parentsArr = []
      , self = this;
    self.paths.forEach( function( item, i ){
      if( typeof(item) !== 'string' )
        return;
      var parentArr = item.split('/')
        , parentStr = parentArr[parentArr.length-1]
        , parentType = parentStr.split(':')[1]
        , parentId = parentStr.split(':')[0];
      self.db.model(parentType).findById(parentId, function( err, parent ){
        if( err )
          callback( err );
        else
          parentsArr.push( parent );
        if( i === self.paths.length-1 )
          callback( null, parentsArr );
      });
    });
  });

  /**
   * finds all children labeled with this content
   *
   * @param {Function} [callback] - [err, array]
   *
   */
  schema.method('children', function( options, callback ){

    var count = 0
      , childrenArr = []
      , self = this
      , collectionsLength = Object.keys(this.db.collections).length;

    function runCallback(){
      if( ++count === collectionsLength )
        callback( null, childrenArr );
    }

    if( typeof(options) === 'function' ){
      callback = options;
      options = null;
    }
    for( var i in this.db.collections ){
      if( i === 'users' ){
        count++;
        continue;
      }
      this.db.collections[i].find({paths: new RegExp('^'+self.id.toString())}, {safe: true}, function( err, cursor ){
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
              childrenArr.push( item );
            })
            runCallback();
          });
        }
      });
    }
  });

  /**
   * tells query to only return objects with empty paths
   * array
   *
   */
  schema.statics.rootsOnly = function(bool, callback){
    if( bool )
      this.where('paths').equals([]);
    if( callback )
      this.exec( callback );
    else
      return this;
  };


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