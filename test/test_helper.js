var mongoose = require('mongoose')
  , konter = require( __dirname + '/../index' );

mongoose.connect( 'mongodb://localhost:27017/test_konter');
//mongoose.set('debug', true);

/**
 * testHelper
 * setup initial parameters for test
 */

var COSchema = mongoose.Schema();
COSchema.plugin( konter.plugin );

var testHelper = {

  removeAll: function removeAllHelper( callback ){

    var i = 0
      , all = [
      konter.models.User
    ];

    function runRemoves(){
      if( i < all.length )
        all[i++].remove({}, runRemoves);
      else
        callback();
    }

    runRemoves();

  },

  CO: mongoose.model( 'CO', COSchema ),

  userAttrs: { name: {first: 'Alfred', last: 'Quack', nick: 'alf'}, email: 'alf@localhost.loc', password: 'alftest' }

}

module.exports = testHelper;