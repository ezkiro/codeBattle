class Message {
    constructor() {

    }

    sendMessage(ws, message) {
        ws.send(JSON.stringify(message));
    }

    reqGameStart(ws) {
        var message = {"message":"ReqGameStart"};
        sendMessage(ws, message);
    }

    reqRoundStart(ws) {
        var message = {"message":"ReqRoundStart"};
        sendMessage(ws, message);
    }

    reqMatchStart(ws) {
        var message = {"message":"ReqMatchStart"};
        sendMessage(ws, message);
    }
}

module.exports = Message;