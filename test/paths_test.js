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

describe('path relation', function(){
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

	it('creates a root object', function( done ){
		co = new CO({name: 'co', holder: u1});
		co.save( function( err ){
			should.not.exist(err);
			co.paths.should.be.lengthOf( 0 );
			done();
		});
	});

	it('finds only root objects', function( done ){
		CO.rootsOnly(true).find({name: 'co'}).exec( function( err, res ){
			should.not.exist(err);
			res.should.be.lengthOf(1);
			done();
		});
	});

	describe('should label a content with another content', function(){

		it('(parent: object)', function( done ){
			var co2 = new CO({name: 'co2', holder: u1, parent: co });
			co2.save( function( err ){
				should.not.exist(err);
				co2.parents( function( err, res ){
					should.not.exist(err);
					res.should.be.lengthOf(1)
					res[0].name.should.eql(co.name);
					done();
				});
			});
		});

		it('(parent: string)', function( done ){
			var co3 = new CO({name: 'co3', holder: u1, parent: co.id+':'+co.constructor.modelName });
			co3.save( function( err ){
				should.not.exist(err);
				co3.parents( function( err, res ){
					should.not.exist(err);
					res.should.be.lengthOf(1)
					res[0].name.should.eql(co.name);
					done();
				});
			});
		});

	});

	describe('children', function(){
		
		it('should return a content\'s children', function( done ){
			co.children( function( err, children ){
				should.not.exist(err);
				children.should.be.lengthOf(2);
				done();
			});
		});
		

	})

});
