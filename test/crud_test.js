/**
 * iomapper/test/paths_test.js
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
  , iomapper = require( __dirname + '/../index' )
  , testHelper = require( __dirname + '/test_helper' );

describe('CRUD', function(){
	var CO = testHelper.CO
		, co, u1, u2;

	before( function( done ){
		CO.remove({}, function(){
			testHelper.removeAll( function(){
				u1 = new iomapper.models.User( testHelper.userAttrs );
				var u2Attrs = testHelper.userAttrs;
				u2Attrs.email = "u2@localhost.loc";
				u2Attrs.name.nick = "alf2";
				u2 = new iomapper.models.User( u2Attrs );
				u1.save( function( err ){
					if( err ) console.log( err );
					u2.save( done );
				} );
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
		var co1e = co = new CO({name: 'co1e'});
		co1e.save( function( err ){
			should.exist(err);
			err.should.eql(new Error('[pre.save.setupCreatorAndAccess] iomapper.securityleak: no holder object has been provided!'));
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
		CO.findOne({name: 'co1-1'}).execWithUser(u1, function( err, co1 ){
			should.not.exist( err );
			co1.name.should.eql('co1-1');
			co1.holder.id.should.eql(u1.id);
			done();
		});
	});

	it('finds an object with findAnyWithUser method (by parsing all collections)', function( done ){
		iomapper.findAnyWithUser( u1, {name: 'co1-1'}, function( err, co1 ){
			should.not.exist( err );
			co1[0].name.should.equal('co1-1');
			done();
		})
	})

	it('finds an object with firstAnyWithUser method (by parsing all collections)', function( done ){
		iomapper.firstAnyWithUser( u1, {name: 'co1-1'}, function( err, co1 ){
			should.not.exist( err );
			co = co1;
			co1.name.should.equal('co1-1');
			done();
		})
	})

	it('finds an object with firstAnyWithUser method (by parsing all collections)', function( done ){
		iomapper.firstAnyWithUser( u1, {_id: co._id }, function( err, co1 ){
			should.not.exist( err );
			co1.name.should.equal('co1-1');
			done();
		})
	})

	it('does not find an object with wrong user', function( done ){
		CO.findOne({name: 'co1-1'}).execWithUser(u2, function( err, co1 ){
			should.not.exist( err );
			should.not.exist( co1 );
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