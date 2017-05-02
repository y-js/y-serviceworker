/* global Y, MessageChannel */
'use strict'

function extend (Y) {
  class YServiceWorker extends Y.AbstractConnector {
    constructor (y, options) {
      if (options === undefined) {
        throw new Error('Options must not be undefined!')
      }
      if (options.room == null) {
        throw new Error('You must define a room name!')
      }

      options.role = 'slave'
      super(y, options)
      this.debug = Y.debug('y:service-worker')

      this.y.db.stopGarbageCollector()
      this.options = options
      this.guid = Y.utils.generateGuid() // we send this unique id with every postMessage. Later it becomes the userId
      var self = this
      var setNewServiceWorker = function (sw) {
        self.serviceworker = sw
        var messageChannel = new MessageChannel()
        messageChannel.port1.onmessage = self.messageEventListener
        self.serviceworker.postMessage({
          type: 'join',
          room: options.room,
          auth: options.auth,
          guid: self.guid
        }, [messageChannel.port2])
        self.userJoined('serviceworker', 'master')
      }
      navigator.serviceWorker.ready.then(function (registration) {
        setNewServiceWorker(registration.controller || registration.active)
        self.whenSynced(function () {
          self.setUserId(self.guid)
        })
        navigator.serviceWorker.addEventListener('controllerchange', function () {
          self.debug('controllerchanged')
          var sw = navigator.serviceWorker.controller
          if (self.serviceworker !== sw && sw !== null) {
            self.debug('replace old sw')
            self.userLeft('serviceworker')
            setNewServiceWorker(sw)
          }
        })
      })

      this.messageEventListener = function (event) {
        if (event.data.room === options.room && (event.data.guid == null || event.data.guid === self.guid)) {
          if (event.data.type === 'message') {
            self.receiveMessage('serviceworker', event.data.message)
          }
        }
      }
      navigator.serviceWorker.addEventListener('message', this.messageEventListener)
    }
    destroy () {
      navigator.serviceWorker.removeEventListener('message', this.messageEventListener)
      this.userLeft('serviceworker')
      this.serviceworker.postMessage({
        type: 'leave',
        room: this.options.room,
        guid: this.guid
      })
    }
    disconnect () {
      // do nothing
    }
    reconnect () {
      // do nothing
    }
    send (uid, message) {
      this.broadcast(message)
    }
    broadcast (message) {
      this.serviceworker.postMessage({
        type: 'message',
        room: this.options.room,
        message: message,
        guid: this.guid
      })
    }
    isDisconnected () {
      return false
    }
  }
  Y.extend('serviceworker', YServiceWorker)
}

module.exports = extend
if (typeof Y !== 'undefined') {
  extend(Y)
}
