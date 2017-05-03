/**
 * yjs - A framework for real-time p2p shared editing on any data
 * @version v12.2.1
 * @link http://y-js.org
 * @license MIT
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.yServiceWorker = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
      options.preferUntransformed = true
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
      super.send(uid, message)
    }
    broadcast (message) {
      this.serviceworker.postMessage({
        type: 'message',
        room: this.options.room,
        message: message,
        guid: this.guid
      })
      super.broadcast(message)
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

},{}]},{},[1])(1)
});

