"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotRoutersAndGen = exports.BotDBChanges = void 0;
const utils_1 = require("./utils");
const BotGen_1 = __importDefault(require("./BotGen"));
const GlobalValues_1 = require("./GlobalValues");
const difficultyUtils_1 = require("./difficultyUtils");
const BotDBChanges = (container) => {
    const database = container.resolve("DatabaseServer").getTables();
    GlobalValues_1.globalValues.database = database;
    GlobalValues_1.globalValues.baseAI = (0, utils_1.cloneDeep)(database.bots.types.pmcbot.difficulty.hard);
    (0, difficultyUtils_1.makeDifficultyChanges)();
    GlobalValues_1.globalValues.config.debug && console.log("Algorthimic Difficulty:  DB changes completed");
};
exports.BotDBChanges = BotDBChanges;
const BotRoutersAndGen = (container) => {
    const staticRouterModService = container.resolve("StaticRouterModService");
    GlobalValues_1.globalValues.Logger = container.resolve("WinstonLogger");
    GlobalValues_1.globalValues.botGenerationCacheService = container.resolve("BotGenerationCacheService");
    // container.resolve<TimeAndWeatherSettings>("WeatherController")
    container.afterResolution("BotGenerationCacheService", (_t, result) => {
        // globalValues.Logger.info(`POOP: BotGenerationCacheService calling LegendaryPlayer.getBot`);
        result.getBot = BotGen_1.default.getBot;
    }, { frequency: "Always" });
    GlobalValues_1.globalValues.config.debug && console.log("Algorthimic Difficulty:  BotGenerationCacheService Registered");
    //Raid start
    staticRouterModService.registerStaticRouter(`StaticAkiGameStartAlgorithmicDifficulty`, [{
            url: "/client/raid/configuration",
            action: (url, info, sessionId, output) => {
                GlobalValues_1.globalValues.RaidStartTime = Date.now();
                GlobalValues_1.globalValues.RaidMap = info.location.toLowerCase();
                GlobalValues_1.globalValues.config.debug && GlobalValues_1.globalValues.Logger.info(`Algorthimic Difficulty: RaidStartTime updated to: ${GlobalValues_1.globalValues.RaidStartTime} ${GlobalValues_1.globalValues.RaidMap}`);
                return output;
            }
        }], "aki");
    GlobalValues_1.globalValues.config.debug && console.log("Algorthimic Difficulty:  StaticAkiGameStartUpdater Registered");
};
exports.BotRoutersAndGen = BotRoutersAndGen;
// keyId: '',
// side: 'Pmc',
// location: 'factory4_day',
// timeVariant: 'CURR',
// raidMode: 'Local',
// metabolismDisabled: false,
// playersSpawnPlace: 'SamePlace',
// timeAndWeatherSettings: {
//   isRandomTime: false,
//   isRandomWeather: false,
//   cloudinessType: 'Clear',
//   rainType: 'NoRain',
//   windType: 'Light',
//   fogType: 'NoFog',
//   timeFlowType: 'x1',
//   hourOfDay: -1
// },
// botSettings: { isScavWars: false, botAmount: 'AsOnline' },
// wavesSettings: {
//   botAmount: 'AsOnline',
//   botDifficulty: 'AsOnline',
//   isBosses: true,
//   isTaggedAndCursed: false
// }
