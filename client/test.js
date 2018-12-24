const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/match');

const userId = process.argv[2];

const CARDS = ['AH','AH','AH','AH','AH','DH','DH','DH','DH','DH'];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
      response.cards = shuffle(CARDS);
      ws.send(JSON.stringify(response));
    } else if (msgObj.message == 'ReqMatchEnd') {
      response.message = 'AnsMatchEnd';
      ws.send(JSON.stringify(response));
    } else if (msgObj.message == 'ReqRoundEnd') {
      response.message = 'AnsRoundEnd';
      ws.send(JSON.stringify(response));      
    } else if (msgObj.message == 'ReqGameEnd') {
      response.message = 'AnsGameEnd';
      ws.send(JSON.stringify(response));      
    }

  } catch (err) {
    console.log('[onMessage] exception:' + err.message);
  }
});

ws.on('close', function close() {
    console.log('disconnected');
});