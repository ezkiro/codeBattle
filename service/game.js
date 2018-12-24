const Message = require('./message.js');

const HP_MAX = 10000;
const MATCH_MAX = 1000;
const ROUND_MAX = 5;

// card1 - card2 == 10 : defense
// card1 - card2 == -10 : attack fail
// card1 - card2 == 0 : same card 
const CARD_SCORE = new Map();
CARD_SCORE.set("AH",3);
CARD_SCORE.set("AB",2);
CARD_SCORE.set("AL",1);
CARD_SCORE.set("DH",13);
CARD_SCORE.set("DB",12);
CARD_SCORE.set("DL",11);

const DAMAGE = 10;

class Player {
    constructor(name, ws){
        this.name = name;
        this.ws = ws;
        this.hp = 0;
        this.win = 0;
        this.draw = 0;
        this.lose = 0;
        this.status = 'NONE';    
    }

    damage(point) {
        this.hp -= point;
    }

    resetHp() {
        this.hp = HP_MAX;
    }

    setStatus(message) {
        this.status = message;
    }
}

class Match {
    constructor() {
        //key:player name, value: cards
        this.cards = new Map();
    }

    clear() {
        this.cards.clear();
    }

    setCard(playerName, card) {
        this.cards.set(playerName, card);
    }

    getCard(playerName) {
        return this.cards.get(playerName);
    }

    calDamage(myName, enemyName) {
        var myCards = this.cards.get(myName);
        var enemyCards = this.cards.get(enemyName);

        var damage = 0;
        for (var i = 0; i < 10; i++) {
            var myCardScore = CARD_SCORE.get(myCards[i]);
            var enemyCardScore = CARD_SCORE.get(enemyCards[i]);

            console.log('[calDamage] idx:%d, myCardScore:%d, enemyCardScore:%d', i, myCardScore, enemyCardScore);            
            //myCard is attack
            if (myCardScore < 10) {
                continue;
            }

            //enemyCard is defense
            if (enemyCardScore > 10) {
                continue;
            }
            //my defense success
            if (myCardScore - enemyCardScore == 10) {
                continue;
            }

            // enemy attack success
            damage += enemyCardScore * DAMAGE;
        }
        console.log('[calDamage] damage:%d', damage);
        return damage;
    }
}

class Round {
    constructor() {
        this.winner = "";
        this.loser = "";
        this.draw = "";
        this.matchCnt = 0;
        this.curMatch = new Match();
    }

    start() {
        this.matchCnt = 0;        
    }

    startMatch() {
        this.matchCnt += 1;
        this.curMatch.clear();        
    }

    endMatch(player1 , player2) {
        //cal damage
        var player1Damage = this.curMatch.calDamage(player1.name, player2.name);
        var player2Damage = this.curMatch.calDamage(player2.name, player1.name);

        //update hp
        player1.damage(player1Damage);
        player2.damage(player2Damage);

        console.log('[Round::endMatch] %s hp:%d vs %s hp:%d', player1.name, player1.hp, player2.name, player2.hp);
    }

    isRoundEnd() {
        if (this.matchCnt >= MATCH_MAX) {
            return true;
        }
        return false;
    }

    end(winner, loser, draw) {
        this.winner = winner;
        this.loser = loser;
        this.draw = draw;        
    }
}


class Game {
    constructor() {
        //players
        this.players = new Map();
        this.rounds = [];
        this.messageHandler = new Message();
    }

    addPlayer(name, ws) {
        var player = new Player(name, ws);
        this.players.set(player.ws, player);
    }

    start() {
        for (var player of this.players.values()) {
            this.messageHandler.reqGameStart(player.ws);
        }
    }

    setPlayerStatus(ws, status) {
        var player = this.players.get(ws);
        player.setStatus(status);
    }

    isSamePlyaerStatus() {
        var temp = [];
        for (var player of this.players.values()) {
            temp.push(player);
        }

        if (temp[0].status == temp[1].status) {
            return true;
        }
        return false;
    }

    startRound() {
        console.log('[startRound]');

        this.players.forEach(function(player, key, map){
            player.resetHp();
        });

        var newRound = new Round();
        newRound.start();
        this.rounds.push(newRound);

        for (var player of this.players.values()) {
            this.messageHandler.reqRoundStart(player.ws);
        }
    }

    startMatch() {
        console.log('[startMatch]');        
        var curRound = this.rounds.pop();
        curRound.startMatch();
        this.rounds.push(curRound);

        for (var player of this.players.values()) {
            this.messageHandler.reqMatchStart(player.ws);
        }
    }

    checkMatch(ws, message) {
        if (message.message == 'AnsMatchStart') {
            var player = this.players.get(ws);
            var curRound = this.rounds.pop();
            curRound.curMatch.setCard(player.name, message.cards);
            this.rounds.push(curRound);    
        }
    }

    endMatch() {
        console.log('[endMatch]');
        var curRound = this.rounds.pop();
        var playerArr = [];
        for (var player of this.players.values()) {
            playerArr.push(player);
        }

        curRound.endMatch(playerArr[0], playerArr[1]);

        var player1 = playerArr[0];
        var player2 = playerArr[1];
        var player1Card = curRound.curMatch.getCard(player1.name);
        var player2Card = curRound.curMatch.getCard(player2.name);
        this.rounds.push(curRound);

        this.messageHandler.reqMatchEnd(player1.ws, player1.hp, player2.hp, player2Card);
        this.messageHandler.reqMatchEnd(player2.ws, player2.hp, player1.hp, player1Card);
    }

    isRoundEnd() {
        var curRound = this.rounds.pop();
        this.rounds.push(curRound);
        return curRound.isRoundEnd();
    }

    endRound() {
        console.log('[endRound]');
        //check winner
        var playerArr = [];
        for (var player of this.players.values()) {
            playerArr.push(player);
        }

        var player1 = playerArr[0];
        var player2 = playerArr[1];

        var curRound = this.rounds.pop();        
        if (player1.hp > player2.hp) {
            //player1 is winner
            player1.win += 1;
            player2.lose += 1;

            curRound.end(player1.name, player2.name, "");
            this.messageHandler.reqRoundEnd(player1.ws, 'win');
            this.messageHandler.reqRoundEnd(player2.ws, 'lose');
        } else if (player1.hp < player2.hp) {
            //player2 is winner
            player2.win += 1;
            player1.lose += 1;

            curRound.end(player2.name, player1.name, "");                        
            this.messageHandler.reqRoundEnd(player2.ws, 'win');
            this.messageHandler.reqRoundEnd(player1.ws, 'lose');
        } else {
            //draw!!
            player1.draw += 1;
            player2.draw += 1;

            curRound.end("", "", "draw");
            this.messageHandler.reqRoundEnd(player1.ws, 'draw');
            this.messageHandler.reqRoundEnd(player2.ws, 'draw');
        }
        this.rounds.push(curRound);
    }

    isGameEnd() {
        if (this.rounds.length >= ROUND_MAX) {
            return true;
        }
        return false;
    }

    end() {
        console.log('[endGame]');
        //check winner
        var playerArr = [];
        for (var player of this.players.values()) {
            playerArr.push(player);
        }

        var player1 = playerArr[0];
        var player2 = playerArr[1];

        if (player1.win > player2.win) {
            //player1 is winner!
            this.messageHandler.reqGameEnd(player1.ws, 'win');
            this.messageHandler.reqGameEnd(player2.ws, 'lose');

        } else if (player1.win < player2.win) {
            //player2 is winner!
            this.messageHandler.reqGameEnd(player2.ws, 'win');
            this.messageHandler.reqGameEnd(player1.ws, 'lose');

        } else {
            //draw
            this.messageHandler.reqGameEnd(player2.ws, 'draw');
            this.messageHandler.reqGameEnd(player1.ws, 'draw');
        }

    }

    handleAnsMessage(ws, message) {
        this.setPlayerStatus(ws, message.message);
        this.checkMatch(ws, message);

        if (!this.isSamePlyaerStatus()) return;

        switch (message.message) {
            case "AnsGameStart":
                this.startRound();
                break;
            case "AnsRoundStart":
                this.startMatch();
                break;
            case "AnsMatchStart":
                this.endMatch();
                break;
            case "AnsMatchEnd":
                if (this.isRoundEnd()) {
                    this.endRound();
                } else {
                    this.startMatch();
                }
                break;
            case "AnsRoundEnd":
                if (this.isGameEnd()) {
                    this.end();
                } else {
                    this.startRound();
                }
                break;
            case "AnsGameEnd":
                break;
            default:
                console.log('[handleAnsMessage] message:%s', message.message);
        }
    }
}

module.exports = Game;