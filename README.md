# KONTER
content repository eco-system plugin for mongoosejs

## Installation

npm install konter

## Usage examples

### 1. The Content Repository

Konter implements most of the typical features of a content
repository:

- access control for any content object
- hierarchical structure
- linking content (multiple hierarchical existence)

features not implemented yet:

- version management
- restoring content over a period of predefined time

### 2. Authority Accounts

In order to CRUD content object, you need to provide a user
object. Basically, you can use your own user object. All it
has to provide is an .id property (as usually any mongoose
model provides).

KONTER comes with such a user model. It is adapted for use
in INTER but also used for testing purposes.


### 3. Examples

#### Defining schema and models:

  var MySchema = mongoose.Schema({ myval: Number });
  MySchema.plugin( konter.plugin );
  var MyModel = mongoose.model( 'MyModel', MySchema );

#### Createing content

In order to create content, a user object is required:

  var u = User.create( { name: 'user' }, function(){...});

  MyModel.create( {name: 'my1', hoder: u }, function( err, my ){
    if( err ) // do some error handling
    // do something with my object
  });

As you can see, this still is pure mongoose here. But notice
the holder property. it will set the content's owner and 
not work if not passed.

#### Finding content

  MyModel.find( {name: 'my1' } ).execWithUser( u, function( err, my ){
    // if no error, you get your my object initialized with
    // user u.
  })

If you don't initialzie the model with .execWithUser method, you will
still get your content object, but bypass the content repository
mechanisms. It was my aim to not interfere mongoose, so it changes
it's behaviour.

The content object (once initialized or found by execWithUser method)
has the following additional properties:

- paths. [array] associated content objects, this content belongs to. First one is treated as primary label if transformed into a real hierarchical model (e.g. filesystem)
- acl. [object] with userIds as keys. For details see test cases or lib/access_control.js
- name [string] mandatory field
- _starred [object] with userIds as keys. Every user can have their own favorites
- _updater [User] a user ref
- _creator [User] a user ref
- pos [Number] sorting content for drag/drop/sortable actions
- comments: [array] of comments
- logs: [array] of log entries logging changes
- deletedAt: [Date] marks content deleted
- updatedAt: [Date]
- createdAt: [Date]

##### children([query, ] [ options, ] callback ) [ err, children ]

This method looks up for any content in all collections which has the
paths property including this content's ID.

options are:

- sort: mongoose compatible sort string or object

##### parents([query, ], [options, ] callback ) [ err, parents ]

Returns all parents this content is associated with. This information
is stored in the content's 'paths' array.

### 4. Access Control

Privileges are:

  r...READ
  w...WRITE
  s...SHARE
  d...DELETE

and should always be in this exact order.

##### canRead( [user] )

Returns, if user can read this content. If no user is passed, the current
content holder will be used.

##### canWrite( [user] )

Returns, if user can write this content. If no user is passed, the current
content holder will be used.

##### canShare( [user] )

Returns, if user can share this content. If no user is passed, the current
content holder will be used.

##### canDelete( [user] )

Returns, if user can delete this content. If no user is passed, the current
content holder will be used.

#### special access control objects

There are two special objects for publishing content and sharing with everybody.

##### User.anybody

This special user marks a content to be read publicly and to all users.

##### User.everybody

This special user grants access to any logged in user to the content.

