"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GlobalValues_1 = require("./GlobalValues");
class BotGen {
    static assaultTypes = [
        "assaulteasy",
        "assaultnormal",
        "assaulthard",
        "cursedassaulteasy",
        "assaultimpossible",
        "cursedassaultnormal",
        "cursedassaulthard",
        "cursedassaultimpossible",
    ];
    static bearTypes = [
        "sptbeareasy",
        "sptbearnormal",
        "sptbearhard",
        "sptbearimpossible"
    ];
    static usecTypes = [
        "sptuseceasy",
        "sptusecnormal",
        "sptusechard",
        "sptusecimpossible"
    ];
    static marksmanTypes = [
        "marksmaneasy",
        "marksmannormal",
        "marksmanhard",
        "marksmanimpossible"
    ];
    // Should produce a number from 0.75 to 1.25
    static multipleWithRandomInt(int) {
        return int * (0.75 + (Math.random() * Math.random()));
    }
    static getRandom(arr, progressedValue, maxValue) {
        const progressLevels = maxValue / arr.length;
        let index = Math.round(BotGen.multipleWithRandomInt(progressedValue) / progressLevels);
        if (index > (arr.length - 1))
            index = arr.length - 1;
        return arr[index];
    }
    static getBot(key) {
        // globalValues.Logger.warning(`requested bot type ${key} from cache`);
        if (GlobalValues_1.globalValues.botGenerationCacheService.storedBots.has(key)) {
            const cachedOfType = GlobalValues_1.globalValues.botGenerationCacheService.storedBots.get(key);
            if (cachedOfType.length > 0) {
                const cachedBot = cachedOfType[cachedOfType.length - 1];
                const level = cachedBot.Info.Level;
                switch (true) {
                    // Scav
                    case BotGen.assaultTypes.includes(key.toLowerCase()):
                        const randomScav = GlobalValues_1.globalValues.config.randomScavBrainChance > Math.random();
                        if (randomScav) {
                            const botsForRandom = GlobalValues_1.globalValues.scavAlternates;
                            const randomChoice = botsForRandom[Math.floor(Math.random() * botsForRandom.length)];
                            cachedBot.Info.Settings.Role = GlobalValues_1.globalValues.roleCase[randomChoice];
                            cachedBot.Info.Side = "Savage";
                            GlobalValues_1.globalValues.config.debug && GlobalValues_1.globalValues.Logger.warning(`\nRANDOM: Creating Scav from ${key} with ${randomChoice} ${cachedBot.Info.Side}`);
                            break;
                        }
                        const selectedMap = GlobalValues_1.globalValues.database.locations[GlobalValues_1.globalValues.RaidMap]?.base;
                        const raidEndTime = GlobalValues_1.globalValues.RaidStartTime + (selectedMap.EscapeTimeLimit * 60000);
                        const timeProgressed = Date.now() - GlobalValues_1.globalValues.RaidStartTime;
                        const raidTotalDuration = raidEndTime - GlobalValues_1.globalValues.RaidStartTime;
                        const currentlyProgressedPercentage = ((timeProgressed) / (raidTotalDuration)) * 100;
                        const chosenAssault = BotGen.getRandom(GlobalValues_1.globalValues.assaultRoleList, timeProgressed, raidTotalDuration);
                        if (chosenAssault) {
                            cachedBot.Info.Settings.BotDifficulty = chosenAssault.BotDifficulty;
                            cachedBot.Info.Settings.Role = chosenAssault.Role;
                            GlobalValues_1.globalValues.config.debug && GlobalValues_1.globalValues.Logger.warning(`\nCreating Scav from ${key}:${currentlyProgressedPercentage}% ${chosenAssault.Role} ${chosenAssault.BotDifficulty} ${cachedBot.Info.Side}`);
                        }
                        break;
                    case BotGen.bearTypes.includes(key.toLowerCase()):
                        const chosenBear = BotGen.getRandom(GlobalValues_1.globalValues.bearRoleList, level, GlobalValues_1.globalValues.difficultyConfig.pmcDifficultyMaxLevel);
                        const randomBear = GlobalValues_1.globalValues.config.randomPmcBrainChance > Math.random();
                        if (randomBear && chosenBear) {
                            const botsForRandom = GlobalValues_1.globalValues.pmcAlternates;
                            const randomChoice = botsForRandom[Math.floor(Math.random() * botsForRandom.length)];
                            cachedBot.Info.Settings.BotDifficulty = chosenBear.BotDifficulty;
                            cachedBot.Info.Settings.Role = GlobalValues_1.globalValues.roleCase[randomChoice];
                            GlobalValues_1.globalValues.config.debug && GlobalValues_1.globalValues.Logger.warning(`\nRANDOM: Creating bear from ${key}: ${level} with ${randomChoice} ${cachedBot.Info.Side}`);
                            break;
                        }
                        if (chosenBear) {
                            cachedBot.Info.Settings.BotDifficulty = chosenBear.BotDifficulty;
                            cachedBot.Info.Settings.Role = chosenBear.Role;
                            GlobalValues_1.globalValues.config.debug && GlobalValues_1.globalValues.Logger.warning(`\nCreating bear from ${key}: ${level} ${chosenBear.Role} ${chosenBear.BotDifficulty} ${cachedBot.Info.Side}`);
                        }
                        break;
                    case BotGen.usecTypes.includes(key.toLowerCase()):
                        const chosenUsec = BotGen.getRandom(GlobalValues_1.globalValues.usecRoleList, level, GlobalValues_1.globalValues.difficultyConfig.pmcDifficultyMaxLevel);
                        const randomUsec = GlobalValues_1.globalValues.config.randomPmcBrainChance > Math.random();
                        if (randomUsec && chosenUsec) {
                            const botsForRandom = GlobalValues_1.globalValues.pmcAlternates;
                            const randomChoice = botsForRandom[Math.floor(Math.random() * botsForRandom.length)];
                            cachedBot.Info.Settings.BotDifficulty = chosenUsec.BotDifficulty;
                            cachedBot.Info.Settings.Role = GlobalValues_1.globalValues.roleCase[randomChoice];
                            GlobalValues_1.globalValues.config.debug && GlobalValues_1.globalValues.Logger.warning(`\nRANDOM: Creating usec from ${key}: ${level} with ${randomChoice} ${cachedBot.Info.Side}`);
                            break;
                        }
                        if (chosenUsec) {
                            cachedBot.Info.Settings.BotDifficulty = chosenUsec.BotDifficulty;
                            cachedBot.Info.Settings.Role = chosenUsec.Role;
                            GlobalValues_1.globalValues.config.debug && GlobalValues_1.globalValues.Logger.warning(`\nCreating usec from ${key}: ${level} ${chosenUsec.Role} ${chosenUsec.BotDifficulty} ${cachedBot.Info.Side}`);
                        }
                        break;
                    case BotGen.marksmanTypes.includes(key.toLowerCase()):
                        const randomMarksman = GlobalValues_1.globalValues.config.randomMarksmanBrainChance > Math.random();
                        if (randomMarksman) {
                            const botsForRandom = GlobalValues_1.globalValues.marksmanAlternates;
                            const randomChoice = botsForRandom[Math.floor(Math.random() * botsForRandom.length)];
                            cachedBot.Info.Settings.BotDifficulty = "hard";
                            cachedBot.Info.Settings.Role = GlobalValues_1.globalValues.roleCase[randomChoice];
                            GlobalValues_1.globalValues.config.debug && GlobalValues_1.globalValues.Logger.warning(`\nRANDOM: Creating marksman from ${key} with ${randomChoice} ${cachedBot.Info.Side}`);
                            break;
                        }
                        break;
                    default:
                        GlobalValues_1.globalValues.config.debug && GlobalValues_1.globalValues.Logger.warning(`\nDefault spawn: ${key} ${cachedBot.Info.Settings.Role} ${cachedBot.Info.Side}`);
                        break;
                }
                return cachedOfType.pop();
            }
            GlobalValues_1.globalValues.Logger.error(GlobalValues_1.globalValues.botGenerationCacheService.localisationService.getText("bot-cache_has_zero_bots_of_requested_type", key));
        }
        GlobalValues_1.globalValues.Logger.error(GlobalValues_1.globalValues.botGenerationCacheService.localisationService.getText("bot-no_bot_type_in_cache", key));
        return undefined;
    }
}
exports.default = BotGen;
