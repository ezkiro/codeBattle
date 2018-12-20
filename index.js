const BattleServer = require('./service/server');
const MatchHandler = require('./service/matchHandler');

BattleServer(8080, MatchHandler, undefined);