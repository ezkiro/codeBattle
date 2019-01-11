#!/usr/bin/env python

import asyncio
import websockets
import json

class Player:
    def __init__(self):
        self.name = 'python'
    
    def register(self):
        msg = {}
        msg['message'] = 'ReqRegister'
        msg['name'] = self.name

        return json.dumps(msg)

    def handleMessage(self,incomingMessage):
        msg = json.loads(incomingMessage)
        print('incoming message:', msg['message'])

async def battle():
    async with websockets.connect('ws://localhost:8080/match') as websocket:

        player = Player()
        reqMessage = player.register()

        await websocket.send(reqMessage)
        print(f"> {reqMessage}")

        while True:
            message = await websocket.recv()
            print(f"< {message}")
            player.handleMessage(message)

asyncio.get_event_loop().run_until_complete(battle())    