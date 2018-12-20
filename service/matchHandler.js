
const Users = new Map();

function registerUser(name, ws) {
    Users.set(name, ws);
}

function startBattle(user1, user2) {
    var user1Ws = Users.get(user1);
    var user2Ws = Users.get(user2);

    if (user1Ws === undefined || user2Ws === undefined) {
        console.log('not found user websocket! user1:%s , user2:%s', user1, user2);
        return;
    }

    var reqGameStart = {"message":"ReqGameStart"};
    user1Ws.send(JSON.stringify(reqGameStart));
    user2Ws.send(JSON.stringify(reqGameStart));
    
}

function handleMessage(message, ws) {
    //{"message":"메세지 type", "필요한 parameters"}
    try {
        var msgObj = JSON.parse(message);

        var response = {}
    
        if (msgObj.message == 'ReqRegister') {
            console.log('register user:' + msgObj.name);
            //register user
            registerUser(msgObj.name, ws);
            response.message = 'AnsRegister';
            response.result = true;
    
            return JSON.stringify(response);
        }

        if (msgObj.message == 'ReqBattle') {
            var user1 = msgObj.user1;
            var user2 = msgObj.user2;


        }


        response.message = 'AnsError';
        response.detail = 'not support message:' +  msgObj.message;
        return JSON.stringify(response);
    } catch (err) {
        console.log('[handleMessage] exception:' + err.message);
        var response = {}
        response.message = 'AnsError';
        response.detail = err.message;
        return JSON.stringify(response);    
    }
}

module.exports = handleMessage;