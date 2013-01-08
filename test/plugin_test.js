/**
 * iomapper/test/authority_test.js
 *
 * ioMapper - content repository for Javascript
 *
 * (c) 2012 by TAS10WERK
 *
 * tests the content plugin
 *
 */
var should = require("should")
  , mongoose = require('mongoose')
  , iomapper = require( __dirname + '/../index' )
  , testHelper = require( __dirname + '/test_helper' );

describe('defining new content objects', function(){

	/**
	 * define a plain content repostiroy object with
	 * one additional field called 'num'
	 */
	var COSchema = mongoose.Schema({num: Number});
	COSchema.plugin( iomapper.plugin );

	var CO = mongoose.models.CO
	  , co
	  , u1

	before( function( done ){
		CO.remove({}, function(){
			testHelper.removeAll( function(){
				u1 = new iomapper.models.User( testHelper.userAttrs );
				u1.save( done );
			});
		});
	});


	beforeEach( function(){
		co = new CO({name: 'co', holder: u1});
	});

	describe('default properties', function(){

		it('has a name property', function(){
			co.should.have.property('name');		
		});

		it('has timestamp properties', function(){
			co.should.have.property('createdAt');
			co.should.have.property('updatedAt');
		});

		it('has user properties', function(){
			co.should.have.property('holder');
		})

		it('has property id', function(){
			co.should.have.property('_id');
		});

	});

	describe('database interaction', function(){

		it('finds no CO objects in the database', function( done ){
			CO.find( function( err, results ){
				should.not.exist(err);
				results.should.have.lengthOf(0);
				done();
			});
		});

		it('creates a new content object and stores it in the database', function( done ){
			var co2 = new CO({name: 'co2', holder: u1});
			co2.isNew.should.be.ok;
			co2.save( function( err ){
				err && console.log('error:', err);
				co2.isNew.should.not.be.ok;
				done();
			})
		});

		it('finds one CO object in the database', function( done ){
			CO.find( function( err, results ){
				should.not.exist(err);
				results.should.have.lengthOf(1);
				done();
			})
		});

	});

	describe('auto attributes', function(){

		var co3;

		before(function(done){
			var co3t = new CO({name: 'co3', holder: u1});
			co3t.save( function( err ){
				CO.findById( co3t._id ).populate('_creator').populate('_updater').exec( function( err, _co3 ){
					co3 = _co3;
					done();
				});
			});
		});

		it('sets up creator', function(){
			co3.should.have.property('_creator');
			co3._creator._id.should.eql( u1._id );
		})

		it('sets up updater', function(){
			co3.should.have.property('_updater');
			co3._updater._id.should.eql( u1._id );
		})

		it('sets up full access for creator', function(){
			co3.acl[u1._id].privileges.should.eql('rwsd');
		})

	})

});