/**
 * konter/test/sharing_test.js
 *
 * KONTER - content repository for Javascript
 *
 * (c) 2012 by TAS10WERK
 *
 * tests the content plugin
 *
 */
var should = require("should")
  , mongoose = require('mongoose')
  , konter = require( __dirname + '/../index' )
  , testHelper = require( __dirname + '/test_helper' )
  , User = konter.models.User;

describe('SHARING', function(){
	var CO = testHelper.CO
		, co, u1, u2;

	before( function( done ){
		CO.remove({}, function(){
			testHelper.removeAll( function(){
				u1 = new konter.models.User( testHelper.userAttrs );
				co = new CO( { name: 'cos', holder: u1 } );
				var u2Attrs = testHelper.userAttrs;
				u2Attrs.email = "u3@localhost.loc";
				u2Attrs.name.nick = "alf3";
				u2 = new konter.models.User( u2Attrs );
				u1.save( function( err ){
					if( err ) console.log( err );
					u2.save( function( err ){
						if( err ) console.log( err );
						co.save( done );
					} );
				} );
			});
		});
	});

	it('shares a content object', function( done ){
		CO.findOne( {name: 'cos' } ).execWithUser( u2, function( err, eco ){
			should.not.exist( err );
			should.not.exist( eco );
			co.share( u2, 'rwsd' );
			co.save( function( err ){
				should.not.exist( err );
				CO.findOne( {name: 'cos' } ).execWithUser( u2, function( err, eco ){
					should.not.exist( err );
					eco.name.should.eql( 'cos' );
					done();
				});
			});
		});	
	});

	it('shares a content object with user anybody', function( done ){
		CO.findOne( {name: 'cos' } ).execWithUser( User.anybody, function( err, eco ){
			should.not.exist( err );
			should.not.exist( eco );
			co.share( User.anybody, 'r' );
			co.save( function( err ){
				should.not.exist( err );
				CO.findOne( {name: 'cos' } ).execWithUser( User.anybody, function( err, eco ){
					should.not.exist( err );
					eco.name.should.eql( 'cos' );
					done();
				});
			});
		});	
	});

	it('unshares a content object for anybody user', function( done ){
		CO.findOne( {name: 'cos' } ).execWithUser( u1, function( err, co ){
			co.unshare( User.anybody );
			co.save( function( err ){
				should.not.exist( err );
				CO.findOne( {name: 'cos' } ).execWithUser( User.anybody, function( err, co ){
					should.not.exist( err );
					should.not.exist( co );
					done();
				});
			});
		});
	})

	it('shares a content object with user everybody', function( done ){
		CO.findOne( {name: 'cos' } ).execWithUser( User.everybody, function( err, eco ){
			should.not.exist( err );
			should.not.exist( eco );
			co.share( User.everybody, 'rw' );
			co.save( function( err ){
				should.not.exist( err );
				CO.findOne( {name: 'cos' } ).execWithUser( User.everybody, function( err, eco ){
					should.not.exist( err );
					eco.name.should.eql( 'cos' );
					done();
				});
			});
		});	
	});

});