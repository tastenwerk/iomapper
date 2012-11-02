var mongoose = require('mongoose')
  , konter = require( __dirname + '/../index' );

mongoose.connect( 'mongodb://localhost:27017/test_konter');

/**
 * testHelper
 * setup initial parameters for test
 */

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

  userAttrs: { name: {first: 'Alfred', last: 'Quack', nick: 'alf'}, email: 'alf@localhost.loc', password: 'alftest' }

}

module.exports = testHelper;