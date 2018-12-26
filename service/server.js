const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const fs = require('fs');
const path = require('path');

const server = http.createServer(function(request, response){
    console.log('[http server] request.url:%s', request.url);

    if (request.url === '/index') {
        let pathname = path.join(__dirname, '../public/index.html');
        console.log('[http server] pathname:%s', pathname);
        fs.readFile(pathname, function(err, data){
            if(err){
                response.statusCode = 500;
                response.end(`Error getting the file: ${err}.`);
              } else {
                response.statusCode = 200;
                response.setHeader('Content-type','text/html' );
                response.end(data);
              }
        });
    }
});
const wss1 = new WebSocket.Server({ noServer: true });
const wss2 = new WebSocket.Server({ noServer: true });

function start(port, matchHandler, viewHandler) {

    wss1.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            console.log('wss1 received: %s', message);
            //handle mmessage
            if (matchHandler === undefined) {
                ws.send('no wss1 handler!!')
                return;
            }
            matchHandler(message, ws);
          });
        
          ws.on('close', function close(code, reason){
              console.log('closed! code:%d, reason:%s', code, reason);
          });
    });
    
    wss2.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            console.log('wss2 received: %s', message);
            //handle mmessage
            if (matchHandler === undefined) {
                ws.send('no wss2 handler!!')
                return;
            }
            matchHandler(message, ws);
          });
        
          ws.on('close', function close(code, reason){
              console.log('closed! code:%d, reason:%s', code, reason);
          });
    });
    
    server.on('upgrade', function upgrade(request, socket, head) {
        console.log('upgrade requset url:' + request.url);
        const pathname = url.parse(request.url).pathname;
    
        if (pathname === '/match') {
            wss1.handleUpgrade(request, socket, head, function done(ws) {
                wss1.emit('connection', ws, request);
            });
        } else if (pathname === '/view') {
            wss2.handleUpgrade(request, socket, head, function done(ws) {
                wss2.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });
    
    if (port === undefined) {
        port = 8080;
    }
    server.listen(port);
    console.log('start battle server port:' + port);

}

module.exports = start;