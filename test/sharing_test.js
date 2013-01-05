/**
 * iomapper/test/sharing_test.js
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
  , testHelper = require( __dirname + '/test_helper' )
  , User = iomapper.models.User;

describe('SHARING', function(){
	var CO = testHelper.CO
		, co, u1, u2, u3;

	before( function( done ){
		CO.remove({}, function(){
			testHelper.removeAll( function(){
				u1 = new iomapper.models.User( testHelper.userAttrs );
				var co = new CO( { name: 'cosx', holder: u1 } );
				co.acl = {};
				var u2Attrs = testHelper.userAttrs;
				u2Attrs.email = "u3@localhost.loc";
				u2Attrs.name.nick = "alf3";
				u2 = new iomapper.models.User( u2Attrs );
				var u3Attrs = testHelper.userAttrs;
				u3Attrs.email = "u4@localhost.loc";
				u3Attrs.name.nick = "alf4";
				u3 = new iomapper.models.User( u3Attrs );
				u1.save( function( err ){
					if( err ) console.log( err );
					u2.save( function( err ){
						if( err ) console.log( err );
						u3.save( function( err ){
							if( err ) console.log( err );
							co.save( done );
						} );
					} );
				} );
			});
		});
	});

	beforeEach( function( done ){
		CO.findOne( {name: 'cosx' } ).execWithUser( u1, function( err, tco ){
			co = tco;
			done();
		});
	});

	it('should have only one acl entry', function( done ){
		CO.findOne( {name: 'cosx' } ).execWithUser( u1, function( err, co ){
			Object.keys( co.acl ).should.be.lengthOf( 1 );
			done();
		});
	});

	it('shares a content object', function( done ){
		CO.findOne( {name: 'cosx' } ).execWithUser( u1, function( err, co ){
			should.not.exist( err );
			CO.findOne( {name: 'cosx' } ).execWithUser( u2, function( err, eco ){
				should.not.exist( eco );
				co.share( u2, 'rw' );
				co.save( function( err ){
					should.not.exist( err );
					CO.findOne( {name: 'cosx' } ).execWithUser( u2, function( err, eco ){
						should.not.exist( err );
						eco.name.should.eql( 'cosx' );
						done();
					});
				});
			});
		});	
	});

	it('shares a content object with user anybody', function( done ){
		CO.findOne( {name: 'cosx' } ).execWithUser( User.anybody, function( err, eco ){
			should.not.exist( err );
			should.not.exist( eco );
			co.share( User.anybody, 'r' );
			co.save( function( err ){
				should.not.exist( err );
				CO.findOne( {name: 'cosx' } ).execWithUser( User.anybody, function( err, eco ){
					should.not.exist( err );
					eco.name.should.eql( 'cosx' );
					done();
				});
			});
		});	
	});

	it('unshares a content object for anybody user', function( done ){
		CO.findById( co.id ).execWithUser( u1, function( err, co ){
			Object.keys(co.acl).should.include( User.anybody.id );
			co.unshare( User.anybody );
			Object.keys(co.acl).should.not.include( User.anybody.id );
			co.save( function( err ){
				should.not.exist( err );
				CO.findById( co.id ).execWithUser( u1, function( err, co ){
					Object.keys(co.acl).should.not.include( User.anybody.id );
					CO.findOne( {name: 'cosx' } ).execWithUser( User.anybody, function( err, co ){
						should.not.exist( err );
						should.not.exist( co );
						done();
					});
				});
			});
		});
	})

	it('shares a content object with user everybody', function( done ){
		CO.findOne( {name: 'cosx' } ).execWithUser( User.everybody, function( err, eco ){
			should.not.exist( err );
			should.not.exist( eco );
			co.share( User.everybody, 'rw' );
			co.save( function( err ){
				should.not.exist( err );
				CO.findOne( {name: 'cosx' } ).execWithUser( User.everybody, function( err, eco ){
					should.not.exist( err );
					eco.name.should.eql( 'cosx' );
					done();
				});
			});
		});	
	});

	it('returns if a user has read access to a content object', function( done ){
		CO.findById( co.id ).execWithUser( u1, function( err, co ){
			co.canRead( u2 ).should.be.ok;
			co.canRead( User.everybody ).should.be.ok;
			done();
		});
	})

	it('returns if a given user id (as String) can read the content object', function( done ){
		CO.findById( co.id ).execWithUser( u1, function( err, co ){
			co.canRead( u2.id.toString() ).should.be.ok;
			co.canRead( u3.id.toString() ).should.be.ok;
			done();
		});
	});

	it('returns if a given user id can write the content object', function( done ){
		CO.findById( co.id ).execWithUser( u1, function( err, co ){
			should.not.exist( err );
			co.canWrite( u2 ).should.be.ok;
			co.canWrite( u3 ).should.be.ok;
			done();
		});
	});

	it('returns if a given user id can share the content object', function( done ){
		CO.findById( co.id ).execWithUser( u1, function( err, co ){
			should.not.exist( err );
			co.canShare( u2 ).should.not.be.ok;
			co.canShare( u3 ).should.not.be.ok;
			done();
		});
	});

	it('returns if a given user id can delete the content object', function( done ){
		CO.findById( co.id ).execWithUser( u1, function( err, co ){
			should.not.exist( err );
			co.canDelete( u2 ).should.not.be.ok;
			co.canDelete( u3 ).should.not.be.ok;
			done();
		});
	});

	it('copies acl from parent content if a new content is created', function( done ){
		CO.create( {holder: u1, name: 'co2', acl: {}, parent: co}, function( err, co2 ){
			should.not.exist( err );
			co2.isNew.should.not.be.ok;
			co2.paths.should.be.lengthOf( 1 );
			Object.keys(co2.acl).should.be.lengthOf( 3 );
			Object.keys(co2.acl).should.include(User.everybody.id);
			Object.keys(co2.acl).should.include(u2.id);
			done();
		});
	});

	it('copies acl to child content if parent content gets shared with somebody', function( done ){
		CO.findOne( {name: 'cosx' } ).execWithUser( u1, function( err, co ){
			co.share( u3, 'rws' );
			co.save( function( err ){
				should.not.exist( err );
				CO.findOne( {name: 'co2'} ).execWithUser( u3, function( err, co2 ){
					should.not.exist( err );
					co2.canWrite().should.be.ok;
					co2.canShare().should.be.ok;
					co2.canDelete().should.not.be.ok;
					done();
				});
			});
		});
	});

	it('removes acl entries inherited from parent if parent unshares content', function( done ){
		CO.findOne( {name: 'cosx' } ).execWithUser( u1, function( err, co ){
			co.unshare( u3 );
			co.save( function( err ){
				should.not.exist( err );
				CO.findOne( {name: 'co2'} ).execWithUser( u1, function( err, co2 ){
					should.not.exist( err );
					co2.canWrite(u3).should.be.ok;
					co2.canShare(u3).should.not.be.ok;
					co2.canDelete(u3).should.not.be.ok;
					done();
				});
			});
		});
	});

	it('removes acl entries inherited from parent if parent is disconnected from child path', function( done ){
		CO.findOne( {name: 'cosx' } ).execWithUser( u1, function( err, co ){
			CO.findOne( {name: 'co2'} ).execWithUser( u1, function( err, co2 ){
				co2.removeParent( co );
				co2.save( function( err ){
					should.not.exist( err );
					CO.findOne( {name: 'co2'} ).execWithUser( u1, function( err, co2 ){
						should.not.exist( err );
						co2.canWrite(u3).should.not.be.ok;
						done();
					});
				});
			});
		});
	})

});