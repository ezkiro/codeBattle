const Game = require('./game.js');

// key: userid , value: ws
const Users = new Map();
// key: ws , value: match key
const matchConnMap = new Map();

// key: match key, value: Game
const gameMap = new Map();

// key: ws, value: userid
const battleUsers = new Map();

function registerUser(name, ws) {
    Users.set(name, ws);
}

function listUsers() {
    var users = [];
    for (var [key, value] of Users.entries()) {
        if (!battleUsers.has(value)) {
            users.push(key);
        }
    }
    return users;
}

function findGameObj(ws) {
    var matchKey = matchConnMap.get(ws);            
    return gameMap.get(matchKey);
}

function isBattleUser(userid) {
    var userWs = Users.get(userid);
    if (userWs == undefined) return false;

    if (battleUsers.has(userWs)) return true;

    return false;
}

function startBattle(user1, user2, viewerWs) {

    var response = {};
    //check battle users
    if (isBattleUser(user1) || isBattleUser(user2))  {
        response.message = 'NotiError';
        response.result = user1 + ' or ' + user2 + ' is alreay battle status!';
        return response;
    }

    var user1Ws = Users.get(user1);
    var user2Ws = Users.get(user2);

    if (user1Ws === undefined || user2Ws === undefined) {
        console.log('not found user websocket! user1:%s , user2:%s', user1, user2);

        response.message = 'NotiError';
        response.result = user1 + ' or ' + user2 + ' is not found!';
        return response;
    }

    var matchKey = user1 + ':' + user2;
    matchConnMap.set(user1Ws, matchKey);
    matchConnMap.set(user2Ws, matchKey);

    //mark on battle users
    battleUsers.set(user1Ws, user1);
    battleUsers.set(user2Ws, user2);

    var gameObj = new Game();
    gameObj.setViewer(viewerWs);
    gameObj.addPlayer(user1, user1Ws);
    gameObj.addPlayer(user2, user2Ws);    
    gameMap.set(matchKey, gameObj);
    gameObj.start();

    response.message = 'AnsBattle';

    return response;
}

function endBattle(ws, isAll) {
    var matchKey = matchConnMap.get(ws);
    //remove matchKey from matchConnMap
    matchConnMap.delete(ws);
    //mark off battle users
    battleUsers.delete(ws);

    //remove GameObj from gameMap
    if (isAll) {
        console.log('[endBattle] remove gameObj:' + matchKey);
        gameMap.delete(matchKey);
    }
}

function cleanUpUser(ws) {
    //remove user from Users
    var userid = undefined;
    for (var [key, value] of Users.entries()) {
        if (ws == value) {
            userid = key;
        }
    }
    
    if (userid != undefined) {
        Users.delete(userid);
    }
    return userid;
}

function cleanUpBattle(ws) {
    var matchKey = matchConnMap.get(ws);
    var battleUsers = [];
    for (var [key, value] of matchConnMap.entries()) {
        if (matchKey == value) {
            battleUsers.push(key);
        }
    }
    //mark off battle users
    if (battleUsers.length == 2) {
        endBattle(battleUsers[0], false);
        endBattle(battleUsers[1], true);                
    } else {
        endBattle(battleUsers[0], true);
    }
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

            response = startBattle(user1, user2, ws);

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
            var isAll = gameObj.handleAnsMessage(ws, msgObj);

            endBattle(ws, isAll);
            return;
        }

        if (msgObj.message == 'ErrClientClose') {
            var gameObj = findGameObj(ws);
            if (gameObj == undefined) {
                cleanUpUser(ws);
                return;
            }

            var userid = cleanUpUser(ws);
            msgObj.result = userid + ' is closed!!';
            gameObj.handleErrMessage(ws, msgObj);
            cleanUpBattle(ws);
        }

        response.message = 'AnsError';
        response.detail = 'not support message:' +  msgObj.message;
        ws.send(JSON.stringify(response));

    } catch (err) {
        console.log('[handleMessage] exception:' + err.message);
    }
}

module.exports = handleMessage;