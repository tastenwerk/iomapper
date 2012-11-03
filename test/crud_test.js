/**
 * konter/test/paths_test.js
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
  , testHelper = require( __dirname + '/test_helper' );

describe('CRUD', function(){
	var CO = testHelper.CO
		, co, u1

	before( function( done ){
		CO.remove({}, function(){
			testHelper.removeAll( function(){
				u1 = new konter.models.User( testHelper.userAttrs );
				u1.save( done );
			});
		});
	});

	it('creates an empty object', function( done ){
		var co1 = new CO({name: 'co1', holder: u1});
		co1.isNew.should.be.ok;
		co1.save( function( err ){
			should.not.exist(err);
			co1.paths.should.be.lengthOf( 0 );
			co1.isNew.should.not.be.ok;
			done();
		});	
	});

	it('doesn\'t create empty objects without a name', function( done ){
		var co1e = new CO({holder: u1});
		co1e.save( function( err ){
			should.exist(err);
			err.should.have.property('errors');
			err.errors.should.have.property('name');
			err.errors.name.should.have.property('path');
			err.errors.name.path.should.eql('name');
			err.errors.name.type.should.eql('required');
			done();
		})
	});

	it('doesn\'t create empty objects without a holder', function( done ){
		var co1e = new CO({name: 'co1e'});
		co1e.save( function( err ){
			should.exist(err);
			err.should.eql(new Error('[pre.save.setupCreatorAndAccess] konter.securityleak: no holder object has been provided!'));
			done();
		})
	});

	it('updates an object', function( done ){
		CO.findOne({name: 'co1'}).exec( function( err, co1 ){
			should.not.exist( err );
			co1.name = 'co1-1';
			co1.save( function( err ){
				should.not.exist(err);
				CO.findById( co1.id, function( err, co1 ){
					co1.name.should.eql( 'co1-1' );
					done();
				});
			});
		});
	});

	it('finds an object with given user', function( done ){
		CO.findOne({name: 'co1-1'}).withUser(u1, function( err, co1 ){
			should.not.exist( err );
			co1.name.should.eql('co1-1');
			co1.holder.id.should.eql(u1.id);
			done();
		});
	});

	it('removes an object', function( done ){
		CO.findOne({name: 'co1-1'}, function( err, co1 ){
			should.not.exist( err );
			should.exist( co1 );
			co1.remove( function( err ){
				should.not.exist( err );
				CO.findOne({name: 'co1-1'}).exec(function( err, co1 ){
					should.not.exist(err);
					should.not.exist(co1);
					done();
				});
			});
		});
	});

});