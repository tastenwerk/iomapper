/**
 * iomapper/test/notifications_test.js
 *
 * ioMapper - content repository for Javascript
 *
 * (c) 2012 by TAS10WERK
 *
 * tests the notification system
 *
 */
var should = require("should")
  , iomapper = require( __dirname + '/../index' )
  , testHelper = require( __dirname + '/test_helper' );

describe('notifications', function(){

  var CO = testHelper.CO;

  before( function( done ){
    var self = this;
    CO.remove({}, function(){
      testHelper.removeAll( function(){
        var uattrs = { name: {nick: 'nots'}, email: 'nots@localhost.loc', password: 'alftest2' };
        self.u1 = new iomapper.models.User( uattrs );
        self.u1.save( function( err ){
          if( err ) console.log( err );
          done();
        } );
      });
    });
  });

  it('has no notification objects at beginning of test', function( done ){
    iomapper.mongoose.models.Notification.find( {}, function( err, nots ){
      should.not.exist(err);
      nots.should.be.empty;
      done();
    });
  });

  it('creates a notification on object creation', function( done ){
    var self = this;
    CO.create({ name: 'test', holder: this.u1 }, function( err, co ){
      should.not.exist(err);
      co.should.be.a('object');
      iomapper.mongoose.models.Notification.find( {}, function( err, nots ){
        nots.should.have.length(1);
        nots[0].docId.should.equal( co._id.toString() );
        nots[0].type.should.equal( 'DBNotification' );
        nots[0]._creator.toString().should.equal( self.u1._id.toString() );
        nots[0].read.should.include( self.u1._id.toString() );
        nots[0].message.should.equal('creation.ok');
        done();
      });
    });
  });

  it('creates a notification on object deletion', function( done ){

    var self = this;
    CO.create({ name: 'test', holder: this.u1 }, function( err, co ){
      should.not.exist(err);
      co.remove( function( err ){
        should.not.exist(err);
        iomapper.mongoose.models.Notification.findOne().sort({createdAt: -1}).exec( function( err, notif ){
          should.not.exist(err);
          should.exist(notif);
          notif.message.should.equal('removing.permanent_ok');
          done();
        });
      });
    });

  });


});