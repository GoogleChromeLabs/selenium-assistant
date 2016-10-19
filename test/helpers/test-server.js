/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

'use strict';

/* eslint-env node */

const express = require('express');

/**
 * <p>A super simple class that will start and stop an
 * express server with a few nice defaults and just removes boilerplate
 * to server up static files.</p>
 *
 * <p><strong>NOTE: </strong>This should never be used as a production
 * web server.</p>
 *
 * @example
 * const TestServer = require('sw-testing-helpers').TestServer;
 *
 * let testServer = new TestServer();
 * testServer.startServer(path.join(__dirname, '..'), 8888)
 * .then(portNumber => {
 *   console.log('http://localhost:' + portNumber);
 * });
 *
 * // To kill at a later stage...
 * testServer.killServer();
 */
class TestServer {
  /**
   * Create a new TestServer instace
   * @param  {Boolean} addDefaultRoutes Passing in true will create a redirect
   * for '/' -> '/test/browser-tests/' and add a 'Service-Worker-Allowed' header
   * with a value of '/'.
   */
  constructor(addDefaultRoutes) {
    if (
      typeof addDefaultRoutes !== 'undefined' &&
      typeof addDefaultRoutes !== 'boolean'
    ) {
      throw new Error('addDefaultRoutes must be a boolean value');
    }

    this._server = null;
    this._app = express();
    this._useDefaults = false;

    if (typeof addDefaultRoutes === 'undefined' || addDefaultRoutes) {
      this._addDefaultRoutes();
    }
  }

  _addDefaultRoutes() {
    this._useDefaults = true;

    // If the user tries to go to the root of the server, redirect them
    // to the browser test path
    this._app.get('/', function(req, res) {
      res.redirect('/test/browser-tests/');
    });
  }

  /**
   * If you need to extend the routes on the test server, you can access
   * the express app with this method.
   * @return {ExpressApp} The express app used to respond to requests.
   */
  getExpressApp() {
    return this._app;
  }

  /**
   * This will start the express server with the provided port and host.
   *
   * @param  {String} path                  Path to start the server on (i.e. './')
   * @param  {Number} [portNumber=0] portNumber        Optional parameter, by default will pick
   * a random available port.
   * @param  {String} [host='localhost'] host    Optional parameter, a host to bind
   * the express server to, by default this is localhost.
   * @return {Promise<Number>}                      Promise that resolves when the
   * server is started resolving with the port used.
   */
  startServer(path, portNumber, host) {
    if (this._server) {
      this._server.close();
    }

    // 0 will pick a random port number
    if (typeof portNumber === 'undefined') {
      portNumber = 0;
    }

    if (typeof host === 'undefined') {
      host = 'localhost';
    }

    this._app.use('/', express.static(path, {
      setHeaders: function(res) {
        res.setHeader('Service-Worker-Allowed', '/');
      },
    }));

    return new Promise((resolve) => {
      // Start service on desired port
      this._server = this._app.listen(portNumber, host, () => {
        resolve(this._server.address().port);
      });
    });
  }

  /**
   * This method can be used to stop the express server
   */
  killServer() {
    if (this._server) {
      this._server.close();
      this._server = null;
    }
  }
}

module.exports = TestServer;
