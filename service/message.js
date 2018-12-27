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

    //for viewer
    notiGameStart(ws, players) {
        if (ws === undefined) return;

        var message = {"message":"NotiResult"};
        message.result = ' Game start!! ' + players[0].name + ' vs ' + players[1].name;
        this.sendMessage(ws, message);
    }

    notiRoundStart(ws, players, round) {
        if (ws === undefined) return;

        var message = {"message":"NotiResult"};
        message.result = ' Round:' + round + ' start!! ' + players[0].name + 'hp:' + players[0].hp + ' vs ' + players[1].name + ' hp:' + players[1].hp;
        this.sendMessage(ws, message);
    }

    notiGameEnd(ws, winner, loser, isDraw) {
        if (ws === undefined) return;

        var message = {"message":"NotiResult"};
        if (isDraw) {
            message.result = 'Game End! draw!! ' + winner.name + ' win:' + winner.win + ' vs ' + loser.name + ' win:' + loser.win;
        } else {
            var winMsg = 'winner: ' + winner.name + ' win:' + winner.win + ' lose:' + winner.lose + ' draw:' + winner.draw;
            var loseMsg = 'loser:  ' + loser.name + ' win:' + loser.win + ' lose:' + loser.lose + ' draw:' + loser.draw;            
            message.result = 'Game End! ' + winMsg + ' vs ' + loseMsg;
        }

        this.sendMessage(ws, message);
    }

    notiRoundEnd(ws, winner, loser, isDraw) {
        if (ws === undefined) return;

        var message = {"message":"NotiResult"};
        if (isDraw) {
            message.result = 'Round end! draw!! ' + winner.name + ' hp:' + winner.hp + ' vs ' + loser.name + ' hp:' + loser.hp;
        } else {
            message.result = 'Round end! winner: ' + winner.name + ' hp:' + winner.hp + ' vs loser: ' + loser.name + ' hp:' + loser.hp;
        }
        this.sendMessage(ws, message);
    }

    notiBattleEnd(ws) {
        if (ws === undefined) return;

        var message = {"message":"NotiBattleEnd"};
        this.sendMessage(ws, message);
    }

    notiError(ws, result) {
        if (ws === undefined) return;

        var message = {"message":"NotiError"};
        message.result = result;
        this.sendMessage(ws, message);
    }
}

module.exports = Message;