/**
 * KONTER
 *
 * content repository plugin for mongoose
 *
 * written by TASTENWERK http://tastenwerk.com
 * plugin repository: http://github.com/tastenwerk/konter
 *
 */

var models = require(__dirname+'/models');

var paths = {

  _sortArray: function _sortArray( arr, sortOptions ){
    var sort;
    if( typeof(sortOptions) === 'undefined' || !sortOptions )
      sort = {name: 'asc'};
    else if( sortOptions instanceof String )
      sortOptions.split(' ').forEach( function(so){
        if( so.substring(0,1) === '-' )
          sort[so] = 'desc';
        else
          sort[so] = 'asc';
      })
    else
      sort = sortOptions;
    arr.sort( function( a, b ){
      for( var i in sort )
        if( ( a[i] && b[i] && a[i] < b[i] ) || !a[i] && b[i] )
          return ( sort[i] === 'asc' ? -1 : 1 );
        else if( ( a[i] && b[i] && a[i] > b[i] ) || a[i] && !b[i] )
          return ( sort[i] === 'asc' ? 1 : -1 );
        else
          return 0;
    });
    var a = []
    for( var i in arr )
      a.push( arr[i].name + ':' + arr[i].pos );
    return arr;
  },

  /**
   * finds all parents
   *
   * @param {Object} [query] optional query object
   * @param {Object} [options]
   * @param {Function} [callback] - [ err, array ]
   *
   */
  parents: function pathsParents( query, options, callback ){
    if( typeof( callback ) === 'undefined' ){
      if( typeof( options ) === 'undefined' )
        callback = query;
      else
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
        else{
          parent.holder = self.holder;
          parentsArr.push( parent );
        }
        if( i === self.paths.length-1 )
          callback( null, parentsArr );
      });
    });
  },

  /**
   * retreives document's ancestors
   *
   * @param {Function} [callback]. The callback to be triggered
   * after the database query returns results:
   * [ err, results ]
   */
  ancestors: function ancestors( callback ){
    ancestors = [];
    function nextAncestor( anc ){
      if( anc.parentIds.length > 0 )
        anc.parents( function( err, parents ){
          if( err ) return callback( err );
          if( parents.length > 0 )
            ancestors.push( parents[0] );
          else
            callback( 'first parent ' + anc.paths.join(', ') + ' not found');
          nextAncestor( parents[0] );
        });
      else
        callback( null, ancestors );
    }
    nextAncestor( this );
  },

  /**
   * sets the given string or object as this
   * content object's parent
   *
   * @param {String,Object} [co] content object to be made this content's parent
   *
   * @example 
   *  parent: "23092362:MyModel"
   * @example 
   *  parent: ["203920936:MyModel", "1033923:MyModel"]
   * @example
   *  parent: [myModelObject, myModelObject1]
   * @example
   *  parent: myModelObject
   *
   */
  setParent: function pathsSetParent( co ){
    var self = this;
    if( typeof(co) === 'object' && co instanceof Array )
      if( typeof(co[0]) === 'object' )
        co.forEach(function( item ){ self.paths.push( item.id.toString() + ':' + item.constructor.modelName ); });
      else
        this.paths = co;
    else if( typeof(co) === 'object' && co.id )
      this.paths.push( co.id.toString() + ':' + co.constructor.modelName );
    else if( typeof( co ) === 'string' && co.length > 0 )
      this.paths.push( co );
  },

  /**
   * removes a parent object from this
   * content object
   *
   */
  unsetParent: function pathsUnsetParent( co ){
    var self = this;
    if( typeof(co) === 'object' && co.id )
      this.paths.splice( this.paths.indexOf( co.id.toString() + ':' + co.constructor.modelName ), 1 );
    else
      this.paths.splice( this.paths.indexAt( co ), 1 );
    // remove acl inherited from parent
    for( var i in this.acl )
      if( this.acl[i].from && this.acl[i].from[co.id.toString()] ){
        delete this.acl[i].from[co.id.toString()];
        if( Object.keys(this.acl[i].from).length < 1 )
          delete this.acl[i];
      }
    this.markModified('acl');

  },

  /**
   * finds all children labeled with this content
   *
   * @param {Object} [query] - the query (optional)
   * @param {Object} [options] - options (optional) available options:
   * json: true/false, defaults: false. If false, a mongoose document
   * will be returned
   * sort: array of sort according to mongoosejs options 'name -num'
   * or {name: 'asc', num: 'desc'}
   * @param {Function} [callback] - [err, array]
   *
   */
  children: function pathsChildren( query, options, callback ){

    var count = 0
      , childrenArr = []
      , self = this
      , thisChildren = []
      , childrenCount = 0
      , collectionsLength = Object.keys(this.db.collections).length;

    function runInitChild(){
      var item = childrenArr[childrenCount++];
      models[item._type].findById( item._id ).execWithUser( self.holder, function( err, child ){
        child.holder = self.holder;
        thisChildren.push( child );
        if( childrenCount < childrenArr.length )
          runInitChild();
        else
          callback( null, paths._sortArray( thisChildren, options && options.sort ) );
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
    var q = {paths: new RegExp('^'+self.id.toString()+':[a-zA-Z0-9]*$')};
    for( var i in query )
      q[i] = query[i];

    for( var i in this.db.collections ){
      this.db.collections[i].find(q, function( err, cursor ){
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
            });
            runCallback();
          });
        }
      });
    }
  },

  /**
   * counts this content's children
   *
   * @calls {Function} [callback] with (err, count);
   *
   */
  countChildren: function pathsCountChildren( callback ){

    var count = 0
      , totalCount = 0
      , collectionsLength = Object.keys(this.db.collections).length;

    function runCallback(){
      if( ++count === collectionsLength )
        callback( null, totalCount );
    }

    if( typeof(options) === 'function' ){
      callback = options;
      options = null;
    }

    for( var i in this.db.collections ){
      this.db.collections[i].count({paths: new RegExp('^'+this.id.toString())}, function( err, count ){
        if( err )
          callback( err );
        else{
          totalCount += count;
          runCallback();
        }
      });
    }

  },

  /**
   * tells query to only return objects with empty paths
   * array
   * STATIC METHOD
   *
   */
  rootsOnly: function pathsRootsOnly(bool, callback){
    if( bool )
      this.where('paths').equals([]);
    if( callback )
      this.exec( callback );
    else
      return this;
  },

  /**
   * tells the query to lookup for children objects
   * of given id
   */
  childrenOf: function childrenOf( id, callback ){
    var query = this.find({paths: new RegExp('^'+id.toString()+':[a-zA-Z0-9]*$')});
    if( callback && typeof(callback) === 'function' )
      query.exec( callback );
    else
      return query;
  },

  /**
   * get the parentIds (without type information)
   *
   */
  parentIds: function parentIds(){
    return this.paths.map(function(item){ return item.split(':')[0] });
  },

  /**
   * before removing this content object, all child objects
   * without any other association are being deleted too
   */
  removeChildrenWithoutAssociations: function pathsRemoveChildrenWithoutAssociations( next ){
    var total
      , self = this;
    function runNext( err ){
      if( err )
        next( err )
      else if( total === 0 || --total == 0 )
        next();
    }
    this.children( {}, {json: true}, function( err, children ){
      if( err )
        next( err );
      else{
        total = children.length;
        if( children.length === 0 )
          runNext();
        else{
          children.forEach( function( child ){
            if( child.paths && child.paths.length === 1 )
              models[child._type].findByIdAndRemove( child._id, runNext );
            else
              runNext();
          });
        }
      }
    });
  }

}

module.exports = exports = paths;