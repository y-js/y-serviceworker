/* eslint-env worker */
/* global Y, connectorConfig */

class ConnectorProxy extends Y[connectorConfig.name] {
  constructor (y, options) {
    var dOptions = Y.utils.copyObject(connectorConfig)
    dOptions.room = options.room
    dOptions.auth = options.auth
    super(y, dOptions)
    this.swOptions = options
  }
  userJoined (uid, role, port) {
    super.userJoined(uid, role)
    if (port != null) {
      this.connections[uid].port = port
    }
  }
  receiveMessage (uid, message, source) {
    if (message.type === 'update') {
      this.broadcast(message, uid)
    }
    super.receiveMessage(uid, message, source)
  }
  send (uid, message) {
    var port = this.connections[uid].port
    if (port != null) {
      port.postMessage({
        type: 'message',
        room: this.swOptions.room,
        message: message,
        guid: uid
      })
    } else {
      super.send(uid, message)
    }
  }
  broadcast (message, exclude) {
    for (var uid in this.connections) {
      if (uid !== exclude) {
        this.send(uid, message)
      }
    }
  }
}
Y.extend('connector-proxy', ConnectorProxy)

var instances = {}

self.addEventListener('message', event => {
  if (event.data.guid != null && event.data.room != null) {
    var instance = instances[event.data.room]
    if (instance == null) {
      instance = instances[event.data.room] = createYjsInstance(event.data.room, event.data.auth)
    }
    instance.then(function (y) {
      if (event.data.type === 'message') {
        y.connector.receiveMessage(event.data.guid, event.data.message, 'serviceworker')
      } else if (event.data.type === 'join') {
        y.connector.userJoined(event.data.guid, 'slave', event.ports[0])
        if (event.data.auth != null) {
          y.connector.resetAuth(event.data.auth)
        }
      } else if (event.data.type === 'leave') {
        y.connector.userLeft(event.data.guid)
      }
    })
  }
})
