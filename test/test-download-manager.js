'use strict';

require('chai').should();

describe('Test Download Manager', function() {
  const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');

  const downloadManager = require('../src/download-manager.js');

  afterEach(function() {
    Object.defineProperty(process, 'platform', originalPlatform);
  });

  const environments = [
    'linux',
    'darwin',
    'windows'
  ];

  environments.forEach(environmentName => {
    it('should be able to get firefox driver url', function() {
      Object.defineProperty(process, 'platform', {
        value: environmentName
      });

      return downloadManager._getFirefoxDriverDownloadURL()
      .then(result => {
        result.url.indexOf(
          'https://github.com/mozilla/geckodriver/releases/download/'
        ).should.not.equal(-1);

        switch (environmentName) {
          case 'linux':
            result.url.indexOf('linux').should.not.equal(-1);
            break;
          case 'darwin':
            result.url.indexOf('mac').should.not.equal(-1);
            break;
          case 'windows':
            result.url.indexOf('win64').should.not.equal(-1);
            break;
          default:
            throw new Error('Unsupported environment: ' + environmentName);
        }

        (typeof result.name).should.not.equal('undefined');
        (result.name === null).should.equal(false);
        (result.name.length > 0).should.equal(true);
      });
    });
  });
});
