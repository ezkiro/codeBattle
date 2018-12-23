const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/match');

ws.on('open', function open() {
  var reqMessage = {};
  reqMessage.message = 'ReqBattle';
  reqMessage.user1 = 'user1';
  reqMessage.user2 = 'user2';

  ws.send(JSON.stringify(reqMessage));
});

ws.on('message', function incoming(data) {
  console.log(data);

  try {
    var msgObj = JSON.parse(data);

    var response = {};

    if (msgObj.message == 'AnsBattle') {
      //response.message = 'AnsGameStart';
      //ws.send(JSON.stringify(response));
    }
  } catch (err) {
    console.log('[onMessage] exception:' + err.message);
  }
});

ws.on('close', function close() {
    console.log('disconnected');
});