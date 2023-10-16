"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spawnConfig_json_1 = require("../config/spawnConfig.json");
const difficultyConfig_json_1 = require("../config/difficultyConfig.json");
const Spawning_1 = require("./Spawning/Spawning");
const BotDifficultyChanges_1 = require("./BotDifficultyChanges/BotDifficultyChanges");
class Mod {
    preAkiLoad(container) {
        difficultyConfig_json_1.enableDifficultyChanges && (0, BotDifficultyChanges_1.BotRoutersAndGen)(container);
    }
    postAkiLoad(container) {
        difficultyConfig_json_1.enableDifficultyChanges && (0, BotDifficultyChanges_1.BotDBChanges)(container);
        spawnConfig_json_1.enableBotSpawning && (0, Spawning_1.buildWaves)(container);
    }
}
module.exports = { mod: new Mod() };
