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

describe('path', function(){
	var CO = testHelper.CO
		, co, u1

	before( function( done ){
		CO.remove({}, function(){
			testHelper.removeAll( function(){
				u1 = new iomapper.models.User( testHelper.userAttrs );
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

		it('(parent: model object or json)', function( done ){
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
			var co3 = new CO({name: 'co3', holder: u1, parent: co.id.toString()+':'+co.constructor.modelName });
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

		it('(parent: array of string(id:type))', function( done ){
			var co3 = new CO({name: 'co3', holder: u1, parent: [ co.id+':'+co.constructor.modelName ] });
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

		it('(parent: array of model objects or json)', function( done ){
			var co3 = new CO({name: 'co3', holder: u1, parent: [ co ] });
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

		it('adds a parent to a content object', function( done ){
			var co4 = new CO({name: 'co4', holder: u1 });
			co4.save( function( err ){
				should.not.exist( err );
				co4.addParent( co );
				co4.save( function( err ){
					should.not.exist( err );
					co4.paths.should.be.lengthOf( 1 );
					done();
				});
			});
		});

		it('removes a parent to a content object', function( done ){
			var co4 = new CO({name: 'co4', holder: u1 });
			co4.save( function( err ){
				should.not.exist( err );
				co4.removeParent( co );
				co4.save( function( err ){
					should.not.exist( err );
					co4.paths.should.be.lengthOf( 0 );
					done();
				});
			});
		});

	});

	describe('children', function(){
		
		it('should be returned for given content', function( done ){
			co.children( function( err, children ){
				should.not.exist(err);
				children.should.be.lengthOf(5);
				done();
			});
		});

		it('should be counted', function( done ){
			co.countChildren( function( err, count ){
				should.not.exist(err);
				count.should.eql( 5 );
				done();
			});
		});

		it('should be destroyed if no other association exists', function( done ){
			co.remove( function( err ){
				should.not.exist(err);
				CO.findById( co.id, function( err, coDel ){
					should.not.exist(err);
					should.not.exist(coDel);
					co.countChildren( function( err, count ){
						should.not.exist(err);
						count.should.eql( 0 );
						done();
					});
				})
			});
		});

		it('should be sorted by pos and name (pos is undefined by default)', function( done ){
			testHelper.buildTree122( u1, function( err, root ){
				root.children( function( err, children ){
					should.not.exist(err);
					children.should.be.lengthOf( 3 );
					children[0].name.should.eql( 'c_1_1' );
					children[1].name.should.eql( 'c_1_2' );
					children[2].name.should.eql( 'c_1_3_and_2_1' );
					done();
				});
			});
		});

		it('should not be destroyed if another association exists', function( done ){
			testHelper.buildTree122( u1, function( err, root ){
				root.children({name: 'c_1_2'}, function( err, children ){
					var c_1_2 = children[0];
					c_1_2.children( {}, {json: true}, function( err, children ){
						should.not.exist( err );
						children.should.be.lengthOf( 2 );
						var c_1_3_and_2_1_id = children[0]._id;
						var c_2_2_id = children[1]._id;
						c_1_2.remove( function( err ){
							should.not.exist( err );
							CO.findById( c_2_2_id, function( err, res ){
								should.not.exist( err );
								should.not.exist( res );
								CO.findById( c_1_3_and_2_1_id, function( err, res ){
									should.not.exist( err );
									should.exist( res );
									done();
								});
							});
						});
					});
				});
			});
		});

	});

	
	it('should return node ancestors', function( done ){
		testHelper.buildTree122( u1, function( err, root, lastChild ){
			lastChild.ancestors( function( err, ancs ){
				should.not.exist(err);
				ancs.should.be.lengthOf( 2 );
				ancs[0].name.should.equal( root.name );
				done();
			});
		});
	});


});
