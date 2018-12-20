const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/match');

ws.on('open', function open() {

  var reqMessage = {};
  reqMessage.message = 'ReqRegister';
  reqMessage.name = 'ezkiro';

  ws.send(JSON.stringify(reqMessage));

});

ws.on('message', function incoming(data) {
  console.log(data);
});

ws.on('close', function close() {
    console.log('disconnected');
});