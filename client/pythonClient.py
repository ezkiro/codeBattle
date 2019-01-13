#!/usr/bin/env python

import asyncio
import websockets
import json
import sys, random

class Player:
    def __init__(self):
        self.name = 'python'
    
    def register(self):
        msg = {}
        msg['message'] = 'ReqRegister'
        msg['name'] = self.name

        return json.dumps(msg)

    def matchStart(self):
        baseCards = ['AH', 'AH', 'AH', 'AH', 'AH', 'DH','DH','DH','DH','DH']
        random.shuffle(baseCards)
        return baseCards

    def handleMessage(self,incomingMessage):
        print(f"incoming message:{incomingMessage}")
        reqMsg = json.loads(incomingMessage)

        resMsg = {}

        if reqMsg['message'] == 'AnsRegister':
            return None
        elif reqMsg['message'] == 'ReqGameStart':
            resMsg['message'] = 'AnsGameStart'
        elif reqMsg['message'] == 'ReqRoundStart':
            resMsg['message'] = 'AnsRoundStart'
        elif reqMsg['message'] == 'ReqMatchStart':
            myCard = self.matchStart()
            print(f"[handleMessage] myCard:{myCard}")
            resMsg['message'] = 'AnsMatchStart'
            resMsg['cards'] = myCard

        elif reqMsg['message'] == 'ReqMatchEnd':
            resMsg['message'] = 'AnsMatchEnd'

        elif reqMsg['message'] == 'ReqRoundEnd':
            resMsg['message'] = 'AnsRoundEnd'

        elif reqMsg['message'] == 'ReqGameEnd':
            resMsg['message'] = 'AnsGameEnd'
        else :
            return None

        return json.dumps(resMsg)


async def battle():
    async with websockets.connect('ws://localhost:8080/match') as websocket:

        player = Player()
        reqMessage = player.register()

        await websocket.send(reqMessage)
        print(f"> {reqMessage}")

        while True:
            message = await websocket.recv()
            print(f"<< {message}")
            resMsg = player.handleMessage(message)
            if resMsg != None:
                print(f">> {resMsg}")
                await websocket.send(resMsg)

asyncio.get_event_loop().run_until_complete(battle())    