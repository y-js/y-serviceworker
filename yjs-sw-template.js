/* eslint-env worker */
// copy and modify this file

// The configuration of the connector that is used to connect to the outside
self.connectorConfig = {
  name: 'websockets-client',
  // url: '..',
  options: {
    jsonp: false
  }
}
self.createYjsInstance = function (room, auth) {
  return Y({
    // yjs-sw-include creates connector-proxy based on connectorConfig
    connector: {
      name: 'connector-proxy',
      room: room,
      auth: auth
    },
    db: {
      name: 'indexeddb'
    }
  })
}

importScripts(
  '/bower_components/yjs/y.js',
  '/bower_components/y-memory/y-memory.js',
  '/bower_components/y-indexeddb/y-indexeddb.js',
  '/bower_components/y-websockets-client/y-websockets-client.js',
  '/bower_components/y-serviceworker/yjs-sw-include.js'
)
