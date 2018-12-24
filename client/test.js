const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/match');

const userId = process.argv[2];

ws.on('open', function open() {
  var reqMessage = {};
  reqMessage.message = 'ReqRegister';
  reqMessage.name = userId;

  ws.send(JSON.stringify(reqMessage));
});

ws.on('message', function incoming(message) {
  console.log(message);

  try {
    var msgObj = JSON.parse(message);

    var response = {};

    if (msgObj.message == 'ReqGameStart') {
      response.message = 'AnsGameStart';
      ws.send(JSON.stringify(response));

    } else if (msgObj.message == 'ReqRoundStart') {
      response.message = 'AnsRoundStart';
      ws.send(JSON.stringify(response));
    } else if (msgObj.message == 'ReqMatchStart') {
      response.message = 'AnsMatchStart';
      ws.send(JSON.stringify(response));
    }
  } catch (err) {
    console.log('[onMessage] exception:' + err.message);
  }
});

ws.on('close', function close() {
    console.log('disconnected');
});