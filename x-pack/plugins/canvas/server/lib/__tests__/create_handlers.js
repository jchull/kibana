/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from 'expect.js';
import { createHandlers } from '../create_handlers';

let securityMode = 'pass';
const authError = new Error('auth error');

const mockRequest = {
  headers: 'i can haz headers',
};

const mockServer = {
  plugins: {
    security: {
      authenticate: () => ({
        succeeded: () => (securityMode === 'pass' ? true : false),
        error: securityMode === 'pass' ? null : authError,
      }),
    },
    elasticsearch: {
      getCluster: () => ({
        callWithRequest: (...args) => Promise.resolve(args),
      }),
    },
  },
  config: () => ({
    has: () => false,
    get: val => val,
  }),
  info: {
    uri: 'serveruri',
  },
};

describe('server createHandlers', () => {
  let handlers;

  beforeEach(() => {
    securityMode = 'pass';
    handlers = createHandlers(mockRequest, mockServer);
  });

  it('provides helper methods and properties', () => {
    expect(handlers).to.have.property('environment', 'server');
    expect(handlers).to.have.property('serverUri');
    expect(handlers).to.have.property('httpHeaders', mockRequest.headers);
    expect(handlers).to.have.property('elasticsearchClient');
  });

  describe('elasticsearchClient', () => {
    it('executes callWithRequest', async () => {
      const [request, endpoint, payload] = await handlers.elasticsearchClient(
        'endpoint',
        'payload'
      );
      expect(request).to.equal(mockRequest);
      expect(endpoint).to.equal('endpoint');
      expect(payload).to.equal('payload');
    });

    it('rejects when authentication check fails', () => {
      securityMode = 'fail';
      return handlers
        .elasticsearchClient('endpoint', 'payload')
        .then(() => {
          throw new Error('elasticsearchClient should fail when authentication fails');
        })
        .catch(err => {
          expect(err.message).to.be.equal(authError.message);
        });
    });

    it('works without security', async () => {
      // create server without security plugin
      const mockServerClone = {
        ...mockServer,
        plugins: { ...mockServer.plugins },
      };
      delete mockServerClone.plugins.security;
      expect(mockServer.plugins).to.have.property('security'); // confirm original server object
      expect(mockServerClone.plugins).to.not.have.property('security');

      // this shouldn't do anything
      securityMode = 'fail';

      // make sure the method still works
      handlers = createHandlers(mockRequest, mockServerClone);
      const [request, endpoint, payload] = await handlers.elasticsearchClient(
        'endpoint',
        'payload'
      );
      expect(request).to.equal(mockRequest);
      expect(endpoint).to.equal('endpoint');
      expect(payload).to.equal('payload');
    });
  });
});
