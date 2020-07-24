var fs = require('fs');
var util = require('util');

var debug = require('debug');
var request = require('request');

var DSN = require('./dsn').DSN;
var Projects = require('./projects');
var Organizations = require('./organizations');
var Releases = require('./releases');
var Teams = require('./teams');
var Events = require('./events');

/**
 * Client for the Sentry API.
 *
 * @example
 *   var Client = require('sentry-api').Client;
 *
 *   var sentry = new Client('https://abc123:@app.getsentry.com/1234', {
 *     logging: true
 *   });
 *
 *   sentry.projects.get('my-organization-slug', 'my-project-slug').then(function(error, project) {
 *     console.log(project.name);
 *   });
 *
 * @class Client
 * @constructor
 * @param {String}  dsn    Sentry DSN.
 * @param {Options} config Config
 * @param {Number}  config.version Sentry API version number.
 */
var Client = function(dsn, config) {
  // If no DSN is provided, use the default.
  if (typeof dsn === 'object') {
    config = dsn;
    dsn = 'https://app.getsentry.com';
  }

  this.dsn = new DSN(dsn);

  this.config = {
    version: 0,
    logging: false,
    token: null,
    ...(config || {}),
  };

  this.debug = debug('SentryAPI');

  this.projects = new Projects(this);
  this.organizations = new Organizations(this);
  this.releases = new Releases(this);
  this.teams = new Teams(this);
  this.events = new Events(this);
};

/**
 * Contains methods related to Sentry Projects.
 *
 * @property {Projects} projects
 */
Client.prototype.projects = null;

/**
 * Contains methods related to Sentry Organizations.
 *
 * @property {Organizations} organizations
 */
Client.prototype.organizations = null;

/**
 * Contains methods related to Sentry Releases.
 *
 * @property {Releases} releases
 */
Client.prototype.releases = null;

/**
 * Contains methods related to Sentry Teams.
 *
 * @property {Teams} teams
 */
Client.prototype.teams = null;

/**
 * Contains methods related to Sentry Events.
 *
 * @property {Events} events
 */
Client.prototype.events = null;

/**
 * Make a request to the Sentry API.
 *
 * @method request
 * @param  {String}   path     The request path.
 * @param  {Object}   options  Request options. These are the same as the request module's options.
 * @param  {Function} callback Function to execute when the request completes.
 * @return {Promise}
 */
Client.prototype.request = function(path, options, callback) {
  var uri = util.format('%s/api/%d/%s', this.dsn.uri, this.config.version, path);

  this.debug(options.method, uri);

  var p = new Promise(function (resolve, reject) {
    var requestOptions = {
      uri: uri,
      json: true,
      ...options,
    };

    if (this.config.token) {
      requestOptions.auth = {
        bearer: this.config.token,
      };
    }
    else {
      requestOptions.auth = {
        user: this.dsn.publicKey,
      };
    }

    request(requestOptions, function(error, response, body) {
      if (error) {
        this.debug(error);
        reject(error);
      }
      else if (response.statusCode >= 200 && response.statusCode < 300) {
        this.debug(response.statusCode, response.statusMessage);
        resolve(body);
      }
      else {
        this.debug(response.statusCode, response.statusMessage);
        if (body && body.detail) {
          error = new Error(body.detail);
        }
        else if (response.statusMessage) {
          error = new Error(util.format('%d: %s', response.statusCode, response.statusMessage));
        }
        else {
          error = new Error(response.statusCode);
        }
        reject(error)
      }
    }.bind(this));
  }.bind(this));

  if (callback) {
    p.then(body => callback(null, body), err => callback(err));
  } else {
    return p;
  }
};

/**
 * Convenience method for making GET requests.
 *
 * @method get
 * @param  {String}   path     Request path.
 * @param  {Object}   params   Request query string parameters.
 * @param  {Function} callback Request callback.
 * @return {Promise}
 */
Client.prototype.get = function(path, params, callback) {
  return this.request(path, {method: 'GET', qs: params}, callback);
};

/**
 * Convenience method for making POST requests.
 *
 * @method post
 * @param  {String}   path     Request path.
 * @param  {Object}   body     Request body.
 * @param  {Function} callback Request callback.
 * @return {Promise}
 */
Client.prototype.post = function(path, body, callback) {
  return this.request(path, {method: 'POST', body: body}, callback);
};

/**
 * Convenience method for making DELETE requests.
 *
 * @method delete
 * @param  {String}   path     Request path.
 * @param  {Function} callback Request callback.
 * @return {Promise}
 */
Client.prototype.delete = function(path, callback) {
  return this.request(path, {method: 'DELETE'}, callback);
};

/**
 * Convenience method for making PUT requests.
 *
 * @method put
 * @param  {String}   path     Request path.
 * @param  {Object}   body     Request body.
 * @param  {Function} callback Request callback.
 * @return {Promise}
 */
Client.prototype.put = function(path, body, callback) {
  return this.request(path, {method: 'PUT', body: body}, callback);
};

exports.Client = Client;
