var mongoose = require('mongoose')
  , konter = require( __dirname + '/../index' );

var conn = mongoose.connect( 'mongodb://localhost:27017/test_konter');
//mongoose.set('debug', true);

/**
 * testHelper
 * setup initial parameters for test
 */

var COSchema = mongoose.Schema();
COSchema.plugin( konter.plugin );

var testHelper = {

  removeAll: function removeAllHelper( callback ){
    
    conn.connection.collections['users'].drop( function( err ){
      conn.connection.collections['cos'].drop( function( err ){
        callback();
      });
    });
  },

  CO: mongoose.model( 'CO', COSchema ),

  userAttrs: { name: {first: 'Alfred', last: 'Quack', nick: 'alf'}, email: 'alf@localhost.loc', password: 'alftest' },

  buildTree122: function( user, done ){
    var level = 0
      , i = 0;
    testHelper.CO.create({name: 'c_'+level+'_'+i, holder: user}, function( err, root ){
      if( err )
        done( err );
      else
        testHelper.CO.create({name: 'c_'+(++level)+'_'+(++i), holder: user, parent: root}, function( err, doc_l1_1 ){
          if( err )
            done( err );
          else
            testHelper.CO.create({name: 'c_'+(level)+'_'+(++i), holder: user, parent: root}, function( err, doc_l1_2 ){
              if( err )
                done( err );
              else
                testHelper.CO.create({name: 'c_1_3_and_'+(++level)+'_'+(i=1), holder: user, parent: [ root, doc_l1_2 ]}, function( err, doc_l2_1 ){
                  if( err )
                    done( err );
                  else
                    testHelper.CO.create({name: 'c_'+(level)+'_'+(++i), holder: user, parent: doc_l1_2}, function( err, doc_l2_2 ){
                      if( err )
                        done( err );
                      else
                        done( null, root);
                    });
                });
            });
        });
    });
  }

}

module.exports = testHelper;