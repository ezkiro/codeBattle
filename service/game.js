const Message = require('message.js');

const HP_MAX = 10000;
const MATCH_MAX = 1000;
const ROUND_MAX = 5;

// card1 - card2 == 10 : defense
// card1 - card2 == -10 : attack fail
// card1 - card2 == 0 : same card 
const CARD_SCORE = {
    "AH":3,
    "AB":2,
    "AL":1,
    "DH":13,
    "DB":12,
    "DL":11
};
const DAMAGE = 10;

class Player {
    constructor(name, ws){
        this.name = name;
        this.ws = ws;
        this.hp = HP_MAX;
        this.win = 0;
        this.draw = 0;
        this.lose = 0;    
    }

    damage(point) {
        this.hp -= point;
    }

    resetHp() {
        this.hp = HP_MAX;
    }

    lastMessage(message) {
        this.lastMessage = message;
    }
}

class Match {
    constructor() {
        //key:player name, value: cards
        this.cards = new Map();
        this.status = 'START'; //START -> WAIT -> END
    }

    setCard(playerName, card) {
        this.cards.set(playerName, card);
        if (this.cards.size == 2) {
            this.status = 'END';
        }
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

    isMatchEnd() {
        if (this.status == 'END') {
            return true;
        }
        return false;
    }
}

class Round {
    constructor() {
        this.winner = {};
        this.matchCnt = 0;
        this.status = 'NONE';
    }

    start() {
        this.status = 'START';
    }

    startMatch() {
        this.matchCnt += 1;
        this.curMatch = new Match();
    }

    endMatch(player1 , player2) {
        if (this.curMatch.isMatchEnd()) {
            //cal damage
            var player1Damage = this.curMatch.calDamage(player1.name, player2.name);
            var player2Damage = this.curMatch.calDamage(player2.name, player1.name);

            //update hp
            player1.damage(player1Damage);
            player2.damage(player2Damage);            

            //send ReqMatchEnd to all players
        }
    }

    isRoundEnd() {
        if (this.matchCnt >= MATCH_MAX) {
            return true;
        }
        return false;
    }

    end() {
        
    }
}


class Game {
    constructor(player1, player2) {
        //players
        this.players = new Map();
        this.players.set(player1.ws, player1);
        this.players.set(player2.ws, player2);
        this.rounds = [];

    }

    start() {
        this.players.forEach(function(player, key, map){
            Message.reqGameStart(player.ws);
        });
    }

    startRound() {
        this.players.forEach(function(player, key, map){
            player.resetHP();
        });

        var newRound = new Round();
        newRound.start();
        this.rounds.push(newRound);

        this.players.forEach(function(player, key, map){
            Message.reqRoundStart(player.ws);
        });
    }

    startMatch() {
        var curRound = this.rounds.pop();
        curRound.startMatch();
        this.rounds.push(curRound);

        this.players.forEach(function(player, key, map){
            Message.reqMatchStart(player.ws);
        });        
    }

    endRound() {
        //check winner

    }
}

module.exports = Game;