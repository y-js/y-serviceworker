# Service Worker Connector for [Yjs](https://github.com/y-js/yjs)

It enables communication with a [Service Worker](https://developer.mozilla.org/en/docs/Web/API/Service_Worker_API) thread.
The Shared Worker can handle connections, and save changes using a persistent database (e.g. [y-indexeddb](https://github.com/y-js/y-indexeddb)),
while the clients connect to the service worker leveraging improved performance. You can also set it up to perform background tasks.

* Only the Shared Worker connects to the server / other clients (less connection overhead)
* Works best with y-indexeddb
* Faster start-up when multiple windows are open
* Background tasks

## Use it!
Retrieve this with bower or npm.

##### NPM
```bash
npm install y-serviceworker --save
```

##### Bower
```bash
bower install y-serviceworker --save
```

### Example

```javascript
// register yjs service worker
if('serviceWorker' in navigator){
  // Register service worker
  // it is important to copy yjs-sw-template to the root directory!
  navigator.serviceWorker.register('./yjs-sw-template.js').then(function(reg){
    console.log("Yjs service worker registration succeeded. Scope is " + reg.scope);
  }).catch(function(err){
    console.error("Yjs service worker registration failed with error " + err);
  })
}

// Connect to the service worker
Y({
  db: {
    name: 'memory'
  },
  connector: {
    name: 'serviceworker',
    room: 'my room name'
  },
  share: {
    textarea: 'Text' // y.share.textarea is of type Y.Text
  }
}).then(function (y) {
  // bind the textarea to a shared text element
  y.share.textarea.bind(document.getElementById('textfield'))
}
```

## License
[y-serviceworker](https://github.com/y-js/y-serviceworker) is licensed under the [MIT License](./LICENSE).

<kevin.jahns@rwth-aachen.de>
