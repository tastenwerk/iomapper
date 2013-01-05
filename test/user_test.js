/**
 * iomapper/test/authority_test.js
 *
 * KONTER - content repository for Javascript
 *
 * (c) 2012 by TAS10WERK
 *
 * test the user schema
 *
 */
var should = require("should")
  , iomapper = require( __dirname + '/../index' )
  , testHelper = require( __dirname + '/test_helper' );


var User = iomapper.models.User;

/**
 * a user object holds information about the user connected to
 * the system
 *
 */
describe('user', function(){

  var userAttrs = { name: {first: 'Alfred', last: 'Quack', nick: 'alf'}, email: 'alf@localhost.loc', password: 'alftest' };

  before( function( done ){
    testHelper.removeAll( done );
  });

  describe('general', function(){

    var u;

    /**
     * set up user object every time we run a condition
     */
    beforeEach( function(){
      u = new User(userAttrs);
    });

    it('should instantiate a new user', function(){
      u.should.have.property('name').with.property('first');
    });

    describe('methods', function(){

      describe('#name.full', function(){

        it('should have a full property', function(){
          u.should.have.property('name').with.property('full');
        });

        it('fullname returns firstname[space]lastname', function(){
          should.equal(u.name.first + ' ' + u.name.last, u.name.full);
        });

        it('will return firstname if no lastname is given (without a space)', function(){
          u.name.last = null;
          should.equal(u.name.first, u.name.full);
        });

        it('will return lastname if no firstname is given (without a space)', function(){
          u.name.first = null;
          should.equal(u.name.last, u.name.full);
        });

        it('will return nickname if neither firstname nor lastname is given', function(){
          u.name.last = u.name.first = null;
          should.equal(u.name.nick, u.name.full);
        });

        it('will return email address if none of the above attributes is given', function(){
          u.name.last = u.name.first = u.name.nick = null;
          should.equal(u.email, u.name.full);
        });

      });

    });

  });

  describe('database methods', function(){

    describe('#find()', function(){

      it('should find 0 users in the database', function( done ){
        User.find().exec( function( err, users ){
          if( err )
            done(err);
          (users.length === 0) ? done() : done('users length was: ', users.length);
        })
      });

    });

    describe('#save()', function(){

      it('should save a user object if all validations are hit positive', function( done ){
        User.count().exec( function( err, count ){
          should.equal( 0, count );

          var u = new User(userAttrs);
          u.save( function( err ){
            User.count().exec( function( err, count ){
              should.equal( 1, count );
              done();
            });

          });

        });

      }); // it

      describe('required fields', function(){

        it('email must be present', function( done ){
          User.count().exec( function( err, count ){
            var u = new User({});
            u.save( function( err ){
              err.errors.email.message.should.include('required');
              done();
            });
          });
        });

        it('must be a valid email address', function( done ){
          User.count().exec( function( err, count ){
            var u = new User({email: 'abc'});
            u.save( function( err ){
              err.should.have.property('errors').with.property('email').with.property('message');
              err.errors.email.message.should.include('regexp');
              User.count().exec(function( err, count2 ){
                should.equal(count, count2);
                done();
              })
            });
          });
        });

      });

      describe('hooks', function(){

        /**
         * password generation with given password
         */
        it('should set hashedPassword and salt if password is given', function(done){
          var u = new User(userAttrs);
          u.save( function( err ){
            u.hashedPassword.should.equal( u.encryptPassword(userAttrs.password) );
            u.hashedPassword.should.lengthOf( 40 );
            u.salt.length.should.within( 10, 14 );
            done();
          });

        });

      });

    });

    describe('#preferences', function(){

      var u = new User(userAttrs);
      u.email = 'diff@localhost.loc';

      it('saves all kinds of preferences for the user object', function(){
        u.preferences.should.be.a('object');        
      })
    })

  });

});