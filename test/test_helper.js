var mongoose = require('mongoose')
  , konter = require( __dirname + '/../index' );

var conn = konter.connect( 'mongodb://localhost:27017/test_konter');
//mongoose.set('debug', true);

/**
 * testHelper
 * setup initial parameters for test
 */

var COSchema = mongoose.Schema();
COSchema.plugin( konter.plugin );

var CO = konter.models['CO'] = mongoose.model( 'CO', COSchema );

var testHelper = {

  removeAll: function removeAllHelper( callback ){
    
    mongoose.models['User'].remove({}, function( err ){
      mongoose.models['CO'].remove({}, function( err ){
        callback();
      })
    })
  },

  CO: CO,

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