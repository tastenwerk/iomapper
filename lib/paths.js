/**
 * KONTER
 *
 * content repository plugin for mongoose
 *
 * written by TASTENWERK http://tastenwerk.com
 * plugin repository: http://github.com/tastenwerk/konter
 *
 */

function _sortArray( arr, sortOptions ){
  var sort;
  if( typeof(sortOptions) === 'undefined' )
    sort = {pos: 'asc', name: 'asc'};
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
  return arr;
}

var paths = {

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
    else
      this.paths.push( co );
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
      , collectionsLength = Object.keys(this.db.collections).length;

    function runCallback(){
      if( ++count === collectionsLength )
        callback( null, _sortArray( childrenArr, options && options.sort ) );
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
              if( options && options.json )
                childrenArr.push( item );
              else{
                var child = eval("new self.db.models."+item._type+"(item)" );
                child.holder = self.holder;
                childrenArr.push( child );
              }
            })
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
              self.db.models[child._type].findByIdAndRemove( child._id, runNext );
            else
              runNext();
          });
        }
      }
    });
  }

}

module.exports = exports = paths;