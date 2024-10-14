"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWaves = void 0;
const config_json_1 = require("../../config/config.json");
const advancedMapSettings_json_1 = __importDefault(require("../../config/advancedMapSettings.json"));
const waveConfig_json_1 = __importDefault(require("../../config/waveConfig.json"));
const LogTextColor_1 = require("C:/snapshot/project/obj/models/spt/logging/LogTextColor");
const ConfigTypes_1 = require("C:/snapshot/project/obj/models/enums/ConfigTypes");
const buildWaves = (container) => {
    // Get Logger
    const logger = container.resolve("WinstonLogger");
    logger.info("MOAR: Successfully enabled, may the bots ever be in your favour!");
    const configServer = container.resolve("ConfigServer");
    const pmcConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.PMC);
    const botConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.BOT);
    const locationConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.LOCATION);
    const databaseServer = container.resolve("DatabaseServer");
    // Get all the in-memory json found in /assets/database
    const { bots, locations } = databaseServer.getTables();
    const { bigmap: customs, factory4_day: factoryDay, factory4_night: factoryNight, interchange, laboratory, lighthouse, rezervbase, shoreline, tarkovstreets, woods, sandbox: gzLow, sandbox_high: gzHigh, } = locations;
    const originalMapList = [
        "bigmap",
        "factory4_day",
        "factory4_night",
        "interchange",
        "laboratory",
        "lighthouse",
        "rezervbase",
        "shoreline",
        "tarkovstreets",
        "woods",
        "sandbox",
        "sandbox_high",
    ];
    const locationList = [
        customs,
        factoryDay,
        factoryNight,
        interchange,
        laboratory,
        lighthouse,
        rezervbase,
        shoreline,
        tarkovstreets,
        woods,
        gzLow,
        gzHigh,
    ];
    const configLocations = [
        "customs",
        "factoryDay",
        "factoryNight",
        "interchange",
        "laboratory",
        "lighthouse",
        "rezervbase",
        "shoreline",
        "tarkovstreets",
        "woods",
        "gzLow",
        "gzHigh",
    ];
    // console.log(botConfig.botRolesWithDogTags);
    pmcConfig.convertIntoPmcChance = {
        assault: { min: 0, max: 1 },
        cursedassault: { min: 0, max: 0 },
        pmcbot: { min: 0, max: 0 },
        exusec: { min: 0, max: 0 },
        arenafighter: { min: 0, max: 0 },
        arenafighterevent: { min: 0, max: 0 },
        crazyassaultevent: { min: 0, max: 0 },
    };
    botConfig.presetBatch["pmcBEAR"] = config_json_1.defaultMaxBotCap;
    botConfig.presetBatch["pmcUSEC"] = config_json_1.defaultMaxBotCap;
    for (let index = 0; index < locationList.length; index++) {
        const mapSettingsList = Object.keys(advancedMapSettings_json_1.default);
        const map = mapSettingsList[index];
        // Disable Bosses
        if (config_json_1.disableBosses && !!locationList[index].base?.BossLocationSpawn) {
            locationList[index].base.BossLocationSpawn = [];
        }
        locationList[index].base = {
            ...locationList[index].base,
            ...{
                NewSpawn: false,
                OcculsionCullingEnabled: true,
                OfflineNewSpawn: false,
                OfflineOldSpawn: true,
                OldSpawn: true,
                BotSpawnCountStep: 0,
                // BotSpawnPeriodCheck: 15,
                // BotSpawnTimeOffMax: 0,
                // BotSpawnTimeOffMin: 0,
                // BotSpawnTimeOnMax: 0,
                // BotSpawnTimeOnMin: 0,
            },
        };
        // saveToFile(locationList[index].base, "refDBS/" + map + ".json");
        locationList[index].base.NonWaveGroupScenario.Enabled = false;
        locationList[index].base.NonWaveGroupScenario.Chance = 0;
        locationList[index].base["BotStartPlayer"] = 0;
        if (locationList[index].base.BotStop <
            locationList[index].base.EscapeTimeLimit * 60) {
            locationList[index].base.BotStop =
                locationList[index].base.EscapeTimeLimit * 60;
        }
        // No Zone Delay
        if (config_json_1.noZoneDelay) {
            locationList[index].base.SpawnPointParams = locationList[index].base.SpawnPointParams.map((spawn) => ({
                ...spawn,
                DelayToCanSpawnSec: 4,
            }));
        }
        // Reduced Zone Delay
        if (!config_json_1.noZoneDelay && config_json_1.reducedZoneDelay) {
            locationList[index].base.SpawnPointParams = locationList[index].base.SpawnPointParams.map((spawn) => ({
                ...spawn,
                DelayToCanSpawnSec: spawn.DelayToCanSpawnSec > 20
                    ? Math.round(spawn.DelayToCanSpawnSec / 10)
                    : spawn.DelayToCanSpawnSec,
            }));
        }
        // Snipers
        const snipers = shuffle(locationList[index].base.waves
            .filter(({ WildSpawnType: type }) => type === "marksman")
            .map((wave) => ({
            ...wave,
            slots_min: 0,
            ...(config_json_1.sniperBuddies && wave.slots_max < 2 ? { slots_max: 2 } : {}),
        })));
        if (snipers.length) {
            locationList[index].base.MinMaxBots = [
                {
                    WildSpawnType: "marksman",
                    max: snipers.length * 5,
                    min: snipers.length,
                },
            ];
        }
        const scavZones = [
            ...new Set([...locationList[index].base.SpawnPointParams]
                .filter(({ Categories, Sides, BotZoneName }) => !!BotZoneName &&
                Sides.includes("Savage") &&
                Categories.includes("Bot") &&
                !Categories.includes("Boss"))
                .map(({ BotZoneName }) => BotZoneName)),
        ];
        const pmcZones = [
            ...new Set([...locationList[index].base.SpawnPointParams]
                .filter(({ Categories, BotZoneName }) => !!BotZoneName && Categories.includes("Player"))
                .map(({ BotZoneName }) => BotZoneName)),
        ];
        const mapPulledLocations = [...locationList[index].base.waves]
            .filter(({ WildSpawnType, SpawnPoints }) => WildSpawnType === "assault" && !!SpawnPoints)
            .map(({ SpawnPoints }) => SpawnPoints);
        const sniperLocations = [
            ...new Set(snipers.map(({ SpawnPoints }) => SpawnPoints)),
        ];
        const combinedPmcScavOpenZones = shuffle([
            ...new Set([...scavZones, ...pmcZones, ...mapPulledLocations]),
        ]).filter((location) => !sniperLocations.includes(location));
        const combinedPmcZones = combinedPmcScavOpenZones.filter((zone) => !zone.toLowerCase().includes("snipe"));
        const { EscapeTimeLimit, maxBotCap, scavWaveStartRatio, scavWaveMultiplier, 
        // additionalScavsPerWave ,
        pmcWaveStartRatio, pmcWaveMultiplier, maxBotPerZone, pmcHotZones = [], scavHotZones, } = advancedMapSettings_json_1.default?.[map] || {};
        // Set per map EscapeTimeLimit
        if (EscapeTimeLimit) {
            locationList[index].base.EscapeTimeLimit = EscapeTimeLimit;
            locationList[index].base.exit_access_time = EscapeTimeLimit + 1;
        }
        // Set default or per map maxBotCap
        if (config_json_1.defaultMaxBotCap || maxBotCap) {
            const capToSet = maxBotCap || config_json_1.defaultMaxBotCap;
            locationList[index].base.BotMax = capToSet;
            locationList[index].base.BotMaxPvE = capToSet;
            // console.log(botConfig.maxBotCap[originalMapList[index]], capToSet);
            botConfig.maxBotCap[originalMapList[index]] = capToSet;
        }
        // Make all zones open for scav/pmc spawns
        if (config_json_1.allOpenZones) {
            if (combinedPmcZones.length > 0) {
                locationConfig.openZones[`${originalMapList[index]}`] =
                    combinedPmcZones;
                locationList[index].base.OpenZones = combinedPmcZones.join(",");
            }
        }
        // Adjust botZone quantity
        if ((maxBotPerZone || config_json_1.defaultMaxBotPerZone) &&
            locationList[index].base.MaxBotPerZone <
                (maxBotPerZone || config_json_1.defaultMaxBotPerZone)) {
            locationList[index].base.MaxBotPerZone =
                maxBotPerZone || config_json_1.defaultMaxBotPerZone;
        }
        const timeLimit = locationList[index].base.EscapeTimeLimit * 60;
        const { pmcWaveCount, scavWaveCount } = waveConfig_json_1.default[map];
        // Pmcs
        const pmcWaveStart = pmcWaveStartRatio || config_json_1.defaultPmcStartWaveRatio;
        const pmcWaveMulti = pmcWaveMultiplier || config_json_1.defaultPmcWaveMultiplier;
        const pmcCountPerSide = Math.round((pmcWaveCount * pmcWaveMulti) / 2);
        const middleIndex = Math.ceil(pmcHotZones.length / 2);
        const firstHalf = pmcHotZones.splice(0, middleIndex);
        const secondHalf = pmcHotZones.splice(-middleIndex);
        const randomBoolean = Math.random() > 0.5;
        const bearWaves = waveBuilder(pmcCountPerSide, timeLimit, pmcWaveStart, "pmcBEAR", config_json_1.pmcDifficulty, true, config_json_1.defaultGroupMaxPMC, combinedPmcZones, randomBoolean ? firstHalf : secondHalf, 15);
        const usecWaves = waveBuilder(pmcCountPerSide, timeLimit, pmcWaveStart, "pmcUSEC", config_json_1.pmcDifficulty, true, config_json_1.defaultGroupMaxPMC, combinedPmcZones, randomBoolean ? secondHalf : firstHalf, 5);
        // Scavs
        const scavWaveStart = scavWaveStartRatio || config_json_1.defaultScavStartWaveRatio;
        const scavWaveMulti = scavWaveMultiplier || config_json_1.defaultScavWaveMultiplier;
        const scavTotalWaveCount = Math.round(scavWaveCount * scavWaveMulti);
        const scavWaves = waveBuilder(scavTotalWaveCount, timeLimit, scavWaveStart, "assault", config_json_1.scavDifficulty, false, config_json_1.defaultGroupMaxScav, combinedPmcScavOpenZones, scavHotZones);
        if (config_json_1.debug) {
            let total = 0;
            let totalscav = 0;
            bearWaves.forEach(({ slots_max }) => (total += slots_max));
            usecWaves.forEach(({ slots_max }) => (total += slots_max));
            scavWaves.forEach(({ slots_max }) => (totalscav += slots_max));
            console.log(configLocations[index]);
            console.log("Pmcs:", total, "configVal", Math.round((total / pmcWaveCount) * 100) / 100, "configWaveCount", pmcWaveCount, "waveCount", bearWaves.length + usecWaves.length);
            console.log("Scavs:", totalscav, "configVal", Math.round((totalscav / scavWaveCount) * 100) / 100, "configWaveCount", scavWaveCount, "waveCount", scavWaves.length, "\n");
        }
        const finalSniperWaves = snipers?.map(({ ...rest }, snipKey) => ({
            ...rest,
            number: snipKey,
            time_min: snipKey * 120,
            time_max: snipKey * 120 + 120,
        }));
        locationList[index].base.waves = [
            ...finalSniperWaves,
            ...scavWaves,
            ...bearWaves,
            ...usecWaves,
        ]
            .sort(({ time_min: a }, { time_min: b }) => a - b)
            .map((wave, i) => ({ ...wave, number: i + 1 }));
    }
    const bossList = [...botConfig.bosses].filter((bossName) => !["bossZryachiy", "bossKnight"].includes(bossName));
    // CreateBossList
    const bosses = {};
    for (let indx = 0; indx < locationList.length; indx++) {
        const location = locationList[indx];
        const defaultBossSettings = advancedMapSettings_json_1.default?.[configLocations[indx]]?.defaultBossSettings;
        // Sets bosses spawn chance from settings
        if (location?.base?.BossLocationSpawn &&
            !config_json_1.disableBosses &&
            defaultBossSettings &&
            Object.keys(defaultBossSettings)?.length) {
            const filteredBossList = Object.keys(defaultBossSettings).filter((name) => defaultBossSettings[name]?.BossChance !== undefined);
            if (filteredBossList?.length) {
                filteredBossList.forEach((bossName) => {
                    location.base.BossLocationSpawn = location.base.BossLocationSpawn.map((boss) => ({
                        ...boss,
                        ...(boss.BossName === bossName
                            ? { BossChance: defaultBossSettings[bossName].BossChance }
                            : {}),
                    }));
                });
            }
        }
        const filteredBosses = location.base.BossLocationSpawn?.filter(({ BossName }) => bossList.includes(BossName));
        if (!config_json_1.disableBosses && (config_json_1.bossOpenZones || config_json_1.mainBossChanceBuff)) {
            location.base?.BossLocationSpawn?.forEach((boss, key) => {
                if (locationList[indx].base.OpenZones &&
                    bossList.includes(boss.BossName)) {
                    location.base.BossLocationSpawn[key] = {
                        ...boss,
                        ...(config_json_1.bossOpenZones
                            ? { BossZone: locationList[indx].base.OpenZones }
                            : {}),
                        ...(boss.BossChance !== 0
                            ? { BossChance: Math.round(boss.BossChance + config_json_1.mainBossChanceBuff) }
                            : {}),
                    };
                }
            });
        }
        //Add each boss from each map to bosses object
        if (!config_json_1.disableBosses && filteredBosses?.length) {
            for (let index = 0; index < filteredBosses.length; index++) {
                const boss = filteredBosses[index];
                if (!bosses[boss.BossName] ||
                    (bosses[boss.BossName] &&
                        bosses[boss.BossName].BossChance < boss.BossChance)) {
                    bosses[boss.BossName] = { ...boss };
                }
            }
        }
        if (config_json_1.randomRaiderGroup) {
            const raiderWave = buildBossBasedWave(config_json_1.randomRaiderGroupChance, "1,2,2,2,3", "pmcBot", "pmcBot", locationList[indx].base.OpenZones, locationList[indx].base.EscapeTimeLimit);
            location.base.BossLocationSpawn.push(raiderWave);
        }
        if (config_json_1.randomRogueGroup) {
            const rogueWave = buildBossBasedWave(config_json_1.randomRogueGroupChance, "1,2,2,2,3", "exUsec", "exUsec", locationList[indx].base.OpenZones, locationList[indx].base.EscapeTimeLimit);
            location.base.BossLocationSpawn.push(rogueWave);
        }
    }
    if (config_json_1.bossInvasion && !config_json_1.disableBosses) {
        if (config_json_1.bossInvasionSpawnChance) {
            bossList.forEach((bossName) => {
                bosses[bossName].IgnoreMaxBots = true;
                bosses[bossName].BossChance = config_json_1.bossInvasionSpawnChance;
            });
        }
        for (let key = 0; key < locationList.length; key++) {
            //Gather bosses to avoid duplicating.
            const duplicateBosses = locationList[key].base.BossLocationSpawn.filter(({ BossName }) => bossList.includes(BossName)).map(({ BossName }) => BossName);
            //Build bosses to add
            const bossesToAdd = shuffle(Object.values(bosses))
                .filter(({ BossName }) => !duplicateBosses.includes(BossName))
                .map((boss, j) => ({
                ...boss,
                BossZone: locationList[key].base.OpenZones,
                ...(config_json_1.gradualBossInvasion ? { Time: j * 20 + 1 } : {}),
            }));
            // UpdateBosses
            locationList[key].base.BossLocationSpawn = [
                ...locationList[key].base.BossLocationSpawn,
                ...bossesToAdd,
            ];
        }
    }
    if (config_json_1.debug) {
        config_json_1.sniperBuddies &&
            logger.logWithColor("sniperBuddies: Enabled", LogTextColor_1.LogTextColor.WHITE);
        config_json_1.noZoneDelay &&
            logger.logWithColor("noZoneDelay: Enabled", LogTextColor_1.LogTextColor.WHITE);
        config_json_1.reducedZoneDelay &&
            logger.logWithColor("reducedZoneDelay: Enabled", LogTextColor_1.LogTextColor.WHITE);
        config_json_1.allOpenZones &&
            logger.logWithColor("allOpenZones: Enabled", LogTextColor_1.LogTextColor.WHITE);
        config_json_1.randomRaiderGroup &&
            logger.logWithColor("randomRaiderGroup: Enabled", LogTextColor_1.LogTextColor.WHITE);
        config_json_1.randomRogueGroup &&
            logger.logWithColor("randomRogueGroup: Enabled", LogTextColor_1.LogTextColor.WHITE);
        if (config_json_1.disableBosses) {
            logger.logWithColor("disableBosses: Enabled", LogTextColor_1.LogTextColor.WHITE);
        }
        else {
            config_json_1.bossOpenZones &&
                logger.logWithColor("bossOpenZones: Enabled", LogTextColor_1.LogTextColor.WHITE);
            config_json_1.bossInvasion &&
                logger.logWithColor("bossInvasion: Enabled", LogTextColor_1.LogTextColor.WHITE);
            config_json_1.gradualBossInvasion &&
                logger.logWithColor("gradualBossInvasion: Enabled", LogTextColor_1.LogTextColor.WHITE);
        }
    }
};
exports.buildWaves = buildWaves;
function waveBuilder(totalWaves, timeLimit, waveStart, wildSpawnType, difficulty, isPlayer, maxSlots, combinedZones = [], specialZones = [], offset, moreGroups) {
    const averageTime = timeLimit / totalWaves;
    const firstHalf = Math.round(averageTime * (1 - waveStart));
    const secondHalf = Math.round(averageTime * (1 + waveStart));
    let timeStart = offset || 0;
    const waves = [];
    let maxSlotsReached = Math.round(1.3 * totalWaves);
    while (totalWaves > 0 &&
        (waves.length < totalWaves || specialZones.length > 0)) {
        const accelerate = totalWaves > 5 && waves.length < totalWaves / 3;
        const stage = Math.round(waves.length < Math.round(totalWaves * 0.5)
            ? accelerate
                ? firstHalf / 3
                : firstHalf
            : secondHalf);
        const min = !offset && waves.length < 1 ? 0 : timeStart;
        const max = !offset && waves.length < 1 ? 0 : timeStart + 10;
        if (waves.length >= 1 || offset)
            timeStart = timeStart + stage;
        const BotPreset = getDifficulty(difficulty);
        // console.log(wildSpawnType, BotPreset);
        // Math.round((1 - waves.length / totalWaves) * maxSlots) || 1;
        const slotMax = Math.round((moreGroups ? Math.random() : Math.random() * Math.random()) * maxSlots) || 1;
        waves.push({
            BotPreset,
            BotSide: "Savage",
            SpawnPoints: getZone(specialZones, combinedZones, waves.length >= totalWaves),
            isPlayers: isPlayer,
            slots_max: slotMax,
            slots_min: 0,
            time_min: min,
            time_max: max,
            WildSpawnType: wildSpawnType,
            number: waves.length,
        });
        maxSlotsReached -= slotMax;
        // if (wildSpawnType === "assault") console.log(slotMax, maxSlotsReached);
        if (maxSlotsReached <= 0)
            break;
    }
    return waves;
}
const getZone = (specialZones, combinedZones, specialOnly) => {
    if (!specialOnly && combinedZones.length)
        return combinedZones[Math.round((combinedZones.length - 1) * Math.random())];
    if (specialZones.length)
        return specialZones.pop();
    return "";
};
function getDifficulty(diff) {
    const randomNumb = Math.random() + diff;
    switch (true) {
        case randomNumb < 0.55:
            return "easy";
        case randomNumb < 1.4:
            return "normal";
        case randomNumb < 1.85:
            return "hard";
        default:
            return "impossible";
    }
}
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }
    return array;
}
function buildBossBasedWave(BossChance, BossEscortAmount, BossEscortType, BossName, BossZone, raidTime) {
    return {
        BossChance,
        BossDifficult: "normal",
        BossEscortAmount,
        BossEscortDifficult: "normal",
        BossEscortType,
        BossName,
        BossPlayer: false,
        BossZone,
        RandomTimeSpawn: false,
        Time: Math.round(Math.random() * (raidTime * 5)),
        Supports: null,
        TriggerId: "",
        TriggerName: "",
        IgnoreMaxBots: true,
        spawnMode: [],
    };
    //   BossChance: number;
    //   BossDifficult: string;
    //   BossEscortAmount: string;
    //   BossEscortDifficult: string;
    //   BossEscortType: string;
    //   BossName: string;
    //   BossPlayer: boolean;
    //   BossZone: string;
    //   RandomTimeSpawn: boolean;
    //   Time: number;
    //   TriggerId: string;
    //   TriggerName: string;
    //   Delay?: number;
    //   ForceSpawn?: boolean;
    //   IgnoreMaxBots?: boolean;
    //   Supports?: BossSupport[];
    //   sptId?: string;
    //   spawnMode: string[];
}
//# sourceMappingURL=Spawning.js.map