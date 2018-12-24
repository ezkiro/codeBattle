class Message {
    constructor() {
        console.log('Message constructor called!');
    }

    sendMessage(ws, message) {
        ws.send(JSON.stringify(message));
    }

    ansRegister(ws, result) {
        var message = {"message":"AnsRegister"};
        message.result = result;
        this.sendMessage(ws, message);
    }

    ansBattle(ws) {
        var message = {"message":"AnsBattle"};
        this.sendMessage(ws, message);
    }

    reqGameStart(ws) {
        var message = {"message":"ReqGameStart"};
        this.sendMessage(ws, message);
    }

    reqRoundStart(ws) {
        var message = {"message":"ReqRoundStart"};
        this.sendMessage(ws, message);
    }

    reqMatchStart(ws) {
        var message = {"message":"ReqMatchStart"};
        this.sendMessage(ws, message);
    }

    reqMatchEnd(ws, myHP, enemyHP, enemyCards) {
        var message = {"message":"ReqMatchEnd"};
        message.myHP = myHP;
        message.enemyHP = enemyHP;
        message.enemyCards = enemyCards;
        this.sendMessage(ws, message);
    }

    reqRoundEnd(ws, result) {
        var message = {"message":"ReqRoundEnd"};
        message.result = result;
        this.sendMessage(ws, message);        
    }

    reqGameEnd(ws, result) {
        var message = {"message":"ReqGameEnd"};
        message.result = result;
        this.sendMessage(ws, message);
    }
}

module.exports = Message;