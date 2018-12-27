const Game = require('./game.js');

// key: userid , value: ws
const Users = new Map();
// key: ws , value: match key
const matchConnMap = new Map();

// key: match key, value: Game
const gameMap = new Map();

function registerUser(name, ws) {
    Users.set(name, ws);
}

function listUsers() {
    var users = [];
    for (var user of Users.keys()) {
        users.push(user);
    }
    return users;
}

function findGameObj(ws) {
    var matchKey = matchConnMap.get(ws);            
    return gameMap.get(matchKey);
}

function startBattle(user1, user2, viewerWs) {
    var user1Ws = Users.get(user1);
    var user2Ws = Users.get(user2);

    if (user1Ws === undefined || user2Ws === undefined) {
        console.log('not found user websocket! user1:%s , user2:%s', user1, user2);
        return 'AnsError';
    }

    var matchKey = user1 + ':' + user2;
    matchConnMap.set(user1Ws, matchKey);
    matchConnMap.set(user2Ws, matchKey);

    var gameObj = new Game();
    gameObj.setViewer(viewerWs);
    gameObj.addPlayer(user1, user1Ws);
    gameObj.addPlayer(user2, user2Ws);    
    gameMap.set(matchKey, gameObj);
    gameObj.start();

    return 'AnsBattle';
}

function handleMessage(message, ws) {
    //{"message":"메세지 type", "필요한 parameters"}
    try {
        var msgObj = JSON.parse(message);

        var response = {};
    
        if (msgObj.message == 'ReqRegister') {
            console.log('register user:' + msgObj.name);
            //register user
            registerUser(msgObj.name, ws);
            response.message = 'AnsRegister';
            response.result = true;
            ws.send(JSON.stringify(response));
            return; 
        }

        if (msgObj.message == 'ReqPlayers') {            
            response.message = 'AnsPlayers';
            response.players = listUsers();
            ws.send(JSON.stringify(response));
            return;
        }

        if (msgObj.message == 'ReqBattle') {
            var user1 = msgObj.user1;
            var user2 = msgObj.user2;

            response.message = startBattle(user1, user2, ws);

            ws.send(JSON.stringify(response));
            return;
        }

        if (msgObj.message == 'AnsGameStart') {
            var gameObj = findGameObj(ws);
            gameObj.handleAnsMessage(ws, msgObj);

            return;
        }

        if (msgObj.message == 'AnsRoundStart') {
            var gameObj = findGameObj(ws);
            gameObj.handleAnsMessage(ws, msgObj);

            return;
        }

        if (msgObj.message == 'AnsMatchStart') {
            var gameObj = findGameObj(ws);
            gameObj.handleAnsMessage(ws, msgObj);

            return;
        }

        if (msgObj.message == 'AnsMatchEnd') {
            var gameObj = findGameObj(ws);
            gameObj.handleAnsMessage(ws, msgObj);

            return;
        }

        if (msgObj.message == 'AnsRoundEnd') {
            var gameObj = findGameObj(ws);
            gameObj.handleAnsMessage(ws, msgObj);

            return;
        }

        if (msgObj.message == 'AnsGameEnd') {
            var gameObj = findGameObj(ws);
            gameObj.handleAnsMessage(ws, msgObj);

            return;
        }

        response.message = 'AnsError';
        response.detail = 'not support message:' +  msgObj.message;
        ws.send(JSON.stringify(response));

    } catch (err) {
        console.log('[handleMessage] exception:' + err.message);
        var response = {}
        response.message = 'AnsError';
        response.detail = err.message;
        ws.send(JSON.stringify(response));    
    }
}

module.exports = handleMessage;