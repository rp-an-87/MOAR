import { IPreAkiLoadMod } from './../../AlgorithmicQuestRandomizer/types/models/external/IPreAkiLoadMod.d';
import { IPostAkiLoadMod } from "./../types/models/external/IPostAkiLoadMod.d";
import { DependencyContainer } from "tsyringe";
import { enableBotSpawning } from "../config/spawnConfig.json";
import { enableDifficultyChanges } from "../config/difficultyConfig.json";
import { buildWaves } from "./Spawning/Spawning";
import { BotDBChanges, BotRoutersAndGen } from './BotDifficultyChanges/BotDifficultyChanges';

class Mod implements IPreAkiLoadMod, IPostAkiLoadMod {
    preAkiLoad(container: DependencyContainer): void {
        enableDifficultyChanges && BotRoutersAndGen(container)
    }

    postAkiLoad(container: DependencyContainer): void {
        enableDifficultyChanges && BotDBChanges(container)
        enableBotSpawning && buildWaves(container)
    }
}

module.exports = { mod: new Mod() }