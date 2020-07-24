var request = require('request');
var nock = require('nock');

var Client = require('../lib/client').Client;

exports.testConstructor = function(test) {
  test.expect(6);

  var client = new Client('https://PUBLIC:SECRET@host.com/123');
  test.equal(client.config.version, 0, 'Should default version to 0.');
  test.equal(client.config.logging, false, 'Should default logging to false.');

  client = new Client({token: 'TOKEN'});
  test.equal(client.config.version, 0, 'Should default version to 0.');
  test.equal(client.config.logging, false, 'Should default logging to false.');
  test.equal(client.config.token, 'TOKEN', 'Should set the token.');
  test.equal(client.dsn.uri, 'https://app.getsentry.com', 'Should use default URI.');

  test.done();
};

exports.testBasicAuth = function(test) {
  test.expect(2);

  var request = nock('https://host.com', {
      reqheaders: {
        'authorization': 'Basic ' + Buffer.from('PUBLIC:').toString('base64'),
        'accept': 'application/json'
      }
    })
    .get('/api/0/path')
    .reply(200, {foo: 'bar'});

  var client = new Client('https://PUBLIC:SECRET@host.com/123');

  client.request('path', {}, function(error, response) {
    test.ok(request.isDone(), 'Should make the correct request.');
    test.equal(response.foo, 'bar', 'Should return the response as an object.');
    test.done();
  });
};

exports.testBearerAuth = function(test) {
  test.expect(2);
  var token = Buffer.from('PUBLIC:').toString('base64');

  var request = nock('https://host.com', {
      reqheaders: {
        'authorization': 'Bearer ' + token,
        'accept': 'application/json'
      }
    })
    .get('/api/0/path')
    .reply(200, {foo: 'bar'});

  var client = new Client('https://PUBLIC:SECRET@host.com/123', {
    token: token
  });

  client.request('path', {}, function(error, response) {
    test.ok(request.isDone(), 'Should make the correct request.');
    test.equal(response.foo, 'bar', 'Should return the response as an object.');
    test.done();
  });
};

exports.testError = function(test) {
  test.expect(2);

  var request = nock('https://host.com')
    .get('/api/0/path')
    .reply(400);

  var client = new Client('https://PUBLIC:SECRET@host.com/123');

  client.request('path', {}, function(error, response) {
    test.ok(request.isDone(), 'Should make the correct request.');
    test.equal(error.message, '400', 'Should return the error.');
    test.done();
  });
};

exports.testJsonError = function(test) {
  test.expect(2);

  var request = nock('https://host.com')
    .get('/api/0/path')
    .reply(400, {detail: 'bar'});

  var client = new Client('https://PUBLIC:SECRET@host.com/123');

  client.request('path', {}, function(error, response) {
    test.ok(request.isDone(), 'Should make the correct request.');
    test.equal(error.message, 'bar', 'Should parse the error json.');
    test.done();
  });
};

exports.testGet = function(test) {
  test.expect(2);

  var request = nock('https://host.com')
    .get('/api/0/path')
    .query({foo: 'bar'})
    .reply(200, {foo: 'bar'});

  var client = new Client('https://PUBLIC:SECRET@host.com/123');

  client.get('path', {foo: 'bar'}, function(error, response) {
    test.ok(request.isDone(), 'Should make the correct request.');
    test.equal(response.foo, 'bar', 'Should return the response as an object.');
    test.done();
  });
};

exports.testPost = function(test) {
  test.expect(2);

  var request = nock('https://host.com')
    .post('/api/0/path', {foo: 'bar'})
    .reply(200, {foo: 'bar'});

  var client = new Client('https://PUBLIC:SECRET@host.com/123');

  client.post('path', {foo: 'bar'}, function(error, response) {
    test.ok(request.isDone(), 'Should make the correct request.');
    test.equal(response.foo, 'bar', 'Should return the response as an object.');
    test.done();
  });
};

exports.testPut = function(test) {
  test.expect(2);

  var request = nock('https://host.com')
    .put('/api/0/path', {foo: 'bar'})
    .reply(200, {foo: 'bar'});

  var client = new Client('https://PUBLIC:SECRET@host.com/123');

  client.put('path', {foo: 'bar'}, function(error, response) {
    test.ok(request.isDone(), 'Should make the correct request.');
    test.equal(response.foo, 'bar', 'Should return the response as an object.');
    test.done();
  });
};

exports.testDelete = function(test) {
  test.expect(2);

  var request = nock('https://host.com')
    .delete('/api/0/path')
    .reply(200, {foo: 'bar'});

  var client = new Client('https://PUBLIC:SECRET@host.com/123');

  client.delete('path', function(error, response) {
    test.ok(request.isDone(), 'Should make the correct request.');
    test.equal(response.foo, 'bar', 'Should return the response as an object.');
    test.done();
  });
};
