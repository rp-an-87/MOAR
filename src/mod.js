"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_json_1 = require("../config/config.json");
const Spawning_1 = require("./Spawning/Spawning");
class Mod {
    postSptLoad(container) {
        config_json_1.enableBotSpawning && (0, Spawning_1.buildWaves)(container);
    }
}
module.exports = { mod: new Mod() };
//# sourceMappingURL=mod.js.map