import { ILocationConfig } from "./../types/models/spt/config/ILocationConfig.d";
import { IPostAkiLoadMod } from "./../types/models/external/IPostAkiLoadMod.d";
import { Wave, BossLocationSpawn } from "./../types/models/eft/common/ILocationBase.d";
import { IBotConfig } from "./../types/models/spt/config/IBotConfig.d";
import { IPmcConfig } from './../types/models/spt/config/IPmcConfig.d';
import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import {
    pmcsHaveEOD, randomRaiderGroup, randomRaiderGroupChance, randomRogueGroup, randomRogueGroupChance, mainBossChanceBuff, sniperDifficulty, scavDifficulty, pmcDifficulty, enableMod, mapSettings, debug, allOpenZones, defaultMaxBotCap, smarterPmcs,
    defaultScavWaveMultiplier, defaultScavStartWaveRatio, sniperBuddies, noZoneDelay,
    bossInvasion, bossInvasionSpawnOverride, disableBosses, reducedZoneDelay, pmcsAlwaysHostile, preventPMCChatter, bossOpenZones,
    gradualBossInvasion, defaultMaxBotPerZone, defaultPmcStartWaveRatio, defaultPmcWaveMultiplier, defaultGroupMaxPMC, defaultGroupMaxScav
} from "../config/config.json";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";

class Mod implements IPostAkiLoadMod {
    public postAkiLoad(container: DependencyContainer): void {
        if (enableMod) {
            // Get Logger
            const logger = container.resolve<ILogger>("WinstonLogger");
            logger.info("MOAR: Successfully enabled, may the bots ever be in your favour!\n");

            const configServer = container.resolve<ConfigServer>("ConfigServer");
            const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
            const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);
            const locationConfig = configServer.getConfig<ILocationConfig>(ConfigTypes.LOCATION);

            const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");

            // Get all the in-memory json found in /assets/database
            const { bots, locations } = databaseServer.getTables();

            const { bigmap: customs,
                factory4_day: factoryDay,
                factory4_night: factoryNight,
                interchange,
                laboratory,
                lighthouse,
                rezervbase,
                shoreline,
                tarkovstreets,
                woods } = locations

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
                "woods"
            ]

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
                woods
            ]


            const pmcCountList: number[] = [
                8,     // customs
                5,      // factoryDay
                5,      // factoryNight
                8,     // interchange
                8,     // laboratory
                8,     // lighthouse
                8,     // rezervbase
                8,     // shoreline
                10,     // tarkovstreets
                8      // woods
            ]

            const scavWaveCountList: number[] = [
                20,     // customs
                9,      // factoryDay
                9,      // factoryNight
                24,     // interchange
                0,      // laboratory
                16,     // lighthouse
                18,     // rezervbase
                25,     // shoreline
                30,     // tarkovstreets
                24      // woods
            ]


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
                "woods"
            ]

            const pmcTypeChance = {
                "bossKilla": 4,
                "bossKnight": 3,
                "bossGluhar": 1,
                "bossSanitar": 5,
                "bossTagilla": 1,
                "followerGluharAssault": 1,
                "followerBully": 1,
                "followerBigPipe": 4,
                "followerSanitar": 1,
                "assault": 1,
                "cursedAssault": 2,
                "exUsec": 0,
                "pmcBot": 5
            }

            interface MapSettings {
                EscapeTimeLimit?: number,
                maxBotCap?: number,
                scavWaveStartRatio?: number,
                scavWaveMultiplier?: number,
                scavWaveCount?: number,
                additionalScavsPerWave?: number,
                pmcWaveStartRatio?: number,
                pmcWaveMultiplier?: number,
                pmcCount?: number,
                maxBotPerZone?: number,
                pmcSpecialZones?: string[],
                scavSpecialZones?: string[],
            }

            const bossStringList = [
                "bossBully",
                "bossTagilla",
                "bossGluhar",
                "bossKilla",
                "bossKojaniy",
                "bossSanitar"
            ]
            locationConfig.customWaves = { boss: {}, normal: {} }

            if (pmcsAlwaysHostile) pmcConfig.chanceSameSideIsHostilePercent = 100

            if (preventPMCChatter) {
                // The below is a code snippet pulled almost straight from the wicked modder PreyToLive
                const botDifficulty = [
                    "easy",
                    "normal",
                    "hard",
                    "impossible"
                ];


                botDifficulty.forEach(difficulty => {
                    bots.types.bear.difficulty[difficulty].Mind.CAN_TALK = false;
                    bots.types.bear.difficulty[difficulty].Mind.CAN_THROW_REQUESTS = false;
                    bots.types.bear.difficulty[difficulty].Mind.TALK_WITH_QUERY = false;
                    bots.types.usec.difficulty[difficulty].Mind.CAN_TALK = false;
                    bots.types.usec.difficulty[difficulty].Mind.CAN_THROW_REQUESTS = false;
                    bots.types.usec.difficulty[difficulty].Mind.TALK_WITH_QUERY = false;
                });
            }

            if (pmcsHaveEOD) {
                bots.base.Info.MemberCategory = 2
            }


            // ============================================================
            // experimental
            // const distNotToGroup = 5
            // bots.core.DIST_NOT_TO_GROUP = distNotToGroup
            // bots.core.DIST_NOT_TO_GROUP_SQR = distNotToGroup * distNotToGroup
            // ============================================================

            // Disable all scav conversion
            pmcConfig.convertIntoPmcChance = {
                assault: { min: 0, max: 0 },
                cursedassault: { min: 0, max: 0 },
                pmcbot: { min: 0, max: 0 },
                exusec: { min: 0, max: 0 },
                arenafighter: { min: 0, max: 0 },
                arenafighterevent: { min: 0, max: 0 },
                crazyassaultevent: { min: 0, max: 0 }
            }

            botConfig.presetBatch["sptbear"] = defaultMaxBotCap;
            botConfig.presetBatch["sptusec"] = defaultMaxBotCap;
            botConfig["botGenerationBatchSizePerType"] = defaultMaxBotCap;

            for (let index = 0; index < locationList.length; index++) {
                const mapSettingsList = Object.keys(mapSettings) as Array<keyof typeof mapSettings>
                const map = mapSettingsList[index];

                // Disable Bosses
                if (disableBosses && !!locationList[index].base?.BossLocationSpawn) locationList[index].base.BossLocationSpawn = []

                locationList[index].base = {
                    ...locationList[index].base, ...{
                        "NewSpawn": false,
                        "OcculsionCullingEnabled": true,
                        "OfflineNewSpawn": false,
                        "OfflineOldSpawn": true,
                        "OldSpawn": true,
                    }
                }

                locationList[index].base.BotStart = 0
                if (locationList[index].base.BotStop < (locationList[index].base.EscapeTimeLimit * 60)) {
                    locationList[index].base.BotStop = locationList[index].base.EscapeTimeLimit * 60
                }



                // No Zone Delay
                if (noZoneDelay) {
                    const zonesWithoutDelay = locationList[index].base.SpawnPointParams.map((spawn) => ({ ...spawn, DelayToCanSpawnSec: 4 }))
                    locationList[index].base.SpawnPointParams = zonesWithoutDelay
                }

                // Reduced Zone Delay
                if (!noZoneDelay && reducedZoneDelay) {
                    const zonesWithLessDelay = locationList[index].base.SpawnPointParams.map((spawn) =>
                        ({ ...spawn, DelayToCanSpawnSec: spawn.DelayToCanSpawnSec > 20 ? Math.round(spawn.DelayToCanSpawnSec / 10) : spawn.DelayToCanSpawnSec }))
                    locationList[index].base.SpawnPointParams = zonesWithLessDelay
                }

                // Snipers
                const snipers = shuffle<Wave[]>(locationList[index].base.waves.filter(({ WildSpawnType: type }) => type === "marksman")
                    .map((wave) => ({
                        ...wave,
                        slots_min: 0,
                        ...(sniperBuddies && wave.slots_max < 2) ? { slots_max: 2 } : {}
                    })))

                if (snipers.length) {
                    locationList[index].base.MinMaxBots = [{ WildSpawnType: "marksman" as any, max: snipers.length * 5, min: snipers.length }]
                }

                const scavZones = [...new Set([...locationList[index].base.SpawnPointParams]
                    .filter(({ Categories, Sides, BotZoneName }) => !!BotZoneName && Sides.includes("Savage") && Categories.includes("Bot") && !Categories.includes("Boss"))
                    .map(({ BotZoneName }) => BotZoneName))]

                const pmcZones = [...new Set([...locationList[index].base.SpawnPointParams]
                    .filter(({ Categories, BotZoneName }) => !!BotZoneName && Categories.includes("Player"))
                    .map(({ BotZoneName }) => BotZoneName))]

                const mapPulledLocations = [...locationList[index].base.waves]
                    .filter(({ WildSpawnType, SpawnPoints }) => WildSpawnType === "assault" && !!SpawnPoints)
                    .map(({ SpawnPoints }) => SpawnPoints)

                const sniperLocations = [...new Set(snipers.map(({ SpawnPoints }) => SpawnPoints))]

                const combinedPmcScavOpenZones =
                    shuffle<string[]>([...new Set([...scavZones, ...pmcZones, ...mapPulledLocations])])
                        .filter((location) => !sniperLocations.includes(location))

                // SmarterPMCS
                if (smarterPmcs) {
                    pmcConfig.pmcType["sptbear"][map] = pmcTypeChance;
                    pmcConfig.pmcType["sptusec"][map] = pmcTypeChance;
                }

                const {
                    EscapeTimeLimit,
                    maxBotCap,
                    scavWaveStartRatio,
                    scavWaveMultiplier,
                    scavWaveCount,
                    // additionalScavsPerWave ,
                    pmcWaveStartRatio,
                    pmcWaveMultiplier,
                    pmcCount,
                    maxBotPerZone,
                    pmcSpecialZones = [],
                    scavSpecialZones
                } = mapSettings?.[map] as MapSettings || {}


                // Set per map EscapeTimeLimit
                if (EscapeTimeLimit) {
                    locationList[index].base.EscapeTimeLimit = EscapeTimeLimit
                    locationList[index].base.exit_access_time = EscapeTimeLimit + 1
                }

                // Set default or per map maxBotCap
                if (defaultMaxBotCap || maxBotCap) {
                    const capToSet = maxBotCap || defaultMaxBotCap

                    locationList[index].base.BotMax = capToSet
                    botConfig.maxBotCap[originalMapList[index]] = capToSet
                }

                // Make all zones open for scav/pmc spawns
                if (allOpenZones) {
                    if (combinedPmcScavOpenZones.length > 0) {
                        locationConfig.openZones[`${originalMapList[index]}`] = combinedPmcScavOpenZones
                        locationList[index].base.OpenZones = combinedPmcScavOpenZones.join(",")
                    }
                }

                // Adjust botZone quantity
                if ((maxBotPerZone || defaultMaxBotPerZone) && locationList[index].base.MaxBotPerZone < (maxBotPerZone || defaultMaxBotPerZone)) {
                    locationList[index].base.MaxBotPerZone = maxBotPerZone || defaultMaxBotPerZone
                }


                const timeLimit = locationList[index].base.EscapeTimeLimit * 60

                // Pmcs
                const pmcWaveStart = pmcWaveStartRatio || defaultPmcStartWaveRatio
                const pmcWaveMulti = pmcWaveMultiplier || defaultPmcWaveMultiplier
                const pmcCountPerSide = Math.round(((pmcCount || pmcCountList[index]) * pmcWaveMulti) / 2)
                const middleIndex = Math.ceil(pmcSpecialZones.length / 2);
                const firstHalf = pmcSpecialZones.splice(0, middleIndex);
                const secondHalf = pmcSpecialZones.splice(-middleIndex);
                const randomBoolean = Math.random() > 0.5

                const bearWaves = waveBuilder(
                    pmcCountPerSide,
                    timeLimit,
                    pmcWaveStart,
                    "sptbear",
                    pmcDifficulty,
                    true,
                    defaultGroupMaxPMC,
                    combinedPmcScavOpenZones,
                    randomBoolean ? firstHalf : secondHalf,
                    15,
                    true
                )

                const usecWaves = waveBuilder(
                    pmcCountPerSide,
                    timeLimit,
                    pmcWaveStart,
                    "sptusec",
                    pmcDifficulty,
                    true,
                    defaultGroupMaxPMC,
                    combinedPmcScavOpenZones,
                    randomBoolean ? secondHalf : firstHalf,
                    5,
                    true
                )

                // Scavs
                const scavWaveStart = scavWaveStartRatio || defaultScavStartWaveRatio
                const scavWaveMulti = scavWaveMultiplier || defaultScavWaveMultiplier
                const scavTotalWaveCount = Math.round((scavWaveCount || scavWaveCountList[index]) * scavWaveMulti)

                const scavWaves = waveBuilder(
                    scavTotalWaveCount,
                    timeLimit,
                    scavWaveStart,
                    "assault",
                    scavDifficulty,
                    false,
                    defaultGroupMaxScav,
                    combinedPmcScavOpenZones,
                    scavSpecialZones
                )

                if (debug) {
                    let total = 0
                    let totalscav = 0
                    bearWaves.forEach(({ slots_max }) => total += slots_max)
                    usecWaves.forEach(({ slots_max }) => total += slots_max)
                    scavWaves.forEach(({ slots_max }) => totalscav += slots_max)
                    console.log(configLocations[index])
                    console.log("Pmcs:", total)
                    console.log("Scavs:", totalscav, "\n")
                }

                const finalSniperWaves = snipers?.map(({ ...rest }, snipKey) => ({
                    ...rest,
                    BotPreset: getDifficulty(sniperDifficulty),
                    number: snipKey,
                    time_min: snipKey * 120,
                    time_max: (snipKey * 120) + 120
                }))

                locationList[index].base.waves = [...finalSniperWaves, ...scavWaves, ...bearWaves, ...usecWaves].sort(({ number: a }, { number: b }) => a - b)
            }

            // CreateBossList
            const bosses: object = {}
            for (let indx = 0; indx < locationList.length; indx++) {
                const location = locationList[indx];

                const defaultBossSettings = mapSettings?.[configLocations[indx]]?.defaultBossSettings


                // Sets bosses spawn chance from settings
                if (location?.base?.BossLocationSpawn && !disableBosses && defaultBossSettings && Object.keys(defaultBossSettings)?.length) {
                    const filteredBossList = Object.keys(defaultBossSettings).filter(name => defaultBossSettings[name]?.BossChance !== undefined)
                    if (filteredBossList?.length) {
                        filteredBossList.forEach(bossName => {
                            location.base.BossLocationSpawn = location.base.BossLocationSpawn.map(boss => ({
                                ...boss, ...boss.BossName === bossName ? { BossChance: defaultBossSettings[bossName].BossChance } : {}
                            }))
                        })
                    }
                }

                const filteredBosses = location.base.BossLocationSpawn?.filter(({ BossName }) => bossStringList.includes(BossName))

                if (!disableBosses && (bossOpenZones || mainBossChanceBuff)) {
                    location.base?.BossLocationSpawn?.forEach((boss, key) => {
                        if (locationList[indx].base.OpenZones && bossStringList.includes(boss.BossName)) {
                            location.base.BossLocationSpawn[key] =
                            {
                                ...boss,
                                ...bossOpenZones ? { BossZone: locationList[indx].base.OpenZones } : {},
                                ...boss.BossChance !== 0 ? { BossChance: Math.round(boss.BossChance + mainBossChanceBuff) } : {}
                            }
                        }
                    })
                }

                //Add each boss from each map to bosses object
                if (!disableBosses && filteredBosses?.length) {
                    for (let index = 0; index < filteredBosses.length; index++) {
                        const boss = filteredBosses[index]
                        if (!bosses[boss.BossName] || (bosses[boss.BossName] && bosses[boss.BossName].BossChance < boss.BossChance)) {
                            bosses[boss.BossName] = { ...boss }
                        }
                    }
                }


                if (randomRaiderGroup) {
                    const raiderWave = buildBossBasedWave(randomRaiderGroupChance, "1,2,2,2,3", "pmcBot", "pmcBot", locationList[indx].base.OpenZones, locationList[indx].base.EscapeTimeLimit)
                    location.base.BossLocationSpawn.push(raiderWave)
                }

                if (randomRogueGroup) {
                    const rogueWave = buildBossBasedWave(randomRogueGroupChance, "1,2,2,2,3", "exUsec", "exUsec", locationList[indx].base.OpenZones, locationList[indx].base.EscapeTimeLimit)
                    location.base.BossLocationSpawn.push(rogueWave)
                }
            }

            if (bossInvasion && !disableBosses) {
                if (bossInvasionSpawnOverride) {
                    bossStringList.forEach((bossName) => {
                        bosses[bossName].BossChance = bossInvasionSpawnOverride
                    })
                }

                for (let key = 0; key < locationList.length; key++) {
                    //Gather bosses to avoid duplicating.
                    const duplicateBosses = locationList[key].base.BossLocationSpawn
                        .filter(({ BossName }) => bossStringList.includes(BossName))
                        .map(({ BossName }) => BossName)

                    //Build bosses to add
                    const bossesToAdd = shuffle<BossLocationSpawn[]>(Object.values(bosses)).filter(({ BossName }) => !duplicateBosses.includes(BossName)).map((boss, j) =>
                        ({ ...boss, BossZone: locationList[key].base.OpenZones, ...gradualBossInvasion ? { Time: (j * 20) + 1 } : {} }))

                    // UpdateBosses
                    locationList[key].base.BossLocationSpawn = [...locationList[key].base.BossLocationSpawn, ...bossesToAdd]
                }
            }

            // for (let key = 0; key < locationList.length; key++) {
            //     if (locationList[key].base?.BossLocationSpawn) {
            //         locationList[key].base?.BossLocationSpawn.sort(({ Time: a }, { Time: b }) => a - b)
            //     }
            // }

            if (debug) {
                sniperBuddies && logger.logWithColor("sniperBuddies: Enabled", LogTextColor.WHITE)
                noZoneDelay && logger.logWithColor("noZoneDelay: Enabled", LogTextColor.WHITE)
                reducedZoneDelay && logger.logWithColor("reducedZoneDelay: Enabled", LogTextColor.WHITE)
                allOpenZones && logger.logWithColor("allOpenZones: Enabled", LogTextColor.WHITE)
                smarterPmcs && logger.logWithColor("smarterPmcs: Enabled", LogTextColor.WHITE)
                preventPMCChatter && logger.logWithColor("preventPMCChatter: Enabled", LogTextColor.WHITE)
                pmcsAlwaysHostile && logger.logWithColor("pmcsAlwaysHostile: Enabled", LogTextColor.WHITE)
                pmcsHaveEOD && logger.logWithColor("pmcsHaveEOD: Enabled", LogTextColor.WHITE)
                randomRaiderGroup && logger.logWithColor("randomRaiderGroup: Enabled", LogTextColor.WHITE)
                randomRogueGroup && logger.logWithColor("randomRogueGroup: Enabled", LogTextColor.WHITE)
                if (disableBosses) { logger.logWithColor("disableBosses: Enabled", LogTextColor.WHITE) } else {
                    bossOpenZones && logger.logWithColor("bossOpenZones: Enabled", LogTextColor.WHITE)
                    bossInvasion && logger.logWithColor("bossInvasion: Enabled", LogTextColor.WHITE)
                    gradualBossInvasion && logger.logWithColor("gradualBossInvasion: Enabled", LogTextColor.WHITE)
                }
            }
        }
    }
}

function waveBuilder(
    totalWaves: number,
    timeLimit: number,
    waveStart: number,
    wildSpawnType: string,
    difficulty: number,
    isPlayer: boolean,
    maxSlots: number,
    combinedZones: string[] = [],
    specialZones: string[] = [],
    offset?: number,
    moreGroups?: boolean
): Wave[] {
    const averageTime = timeLimit / totalWaves
    const firstHalf = Math.round(averageTime * (1 - waveStart))
    const secondHalf = Math.round(averageTime * (1 + waveStart))
    let timeStart = offset || 0
    const waves = []
    while (waves.length < totalWaves || specialZones.length > 0) {
        const stage = waves.length < Math.round(totalWaves * 0.5) ? firstHalf : secondHalf
        const min = !offset && waves.length < 1 ? 0 : timeStart
        const max = !offset && waves.length < 1 ? 0 : timeStart + 10
        if (waves.length >= 1 || offset) timeStart = timeStart + stage
        const BotPreset = getDifficulty(difficulty)
        const slotMax = Math.round((moreGroups ? Math.random() : Math.random() * Math.random()) * maxSlots) || 1
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
            number: waves.length
        })
    }

    return waves
}

const getZone = (specialZones, combinedZones, specialOnly) => {
    if (!specialOnly && combinedZones.length) return combinedZones[Math.round((combinedZones.length - 1) * Math.random())]
    if (specialZones.length) return specialZones.pop()
    return ""
}

function getDifficulty(diff: number) {
    const randomNumb = Math.random() + diff
    switch (true) {
        case randomNumb < 0.55:
            return "easy"
        case randomNumb < 1.40:
            return "normal"
        case randomNumb < 1.85:
            return "hard"
        default:
            return "impossible"
    }
}

function shuffle<n>(array: any): n {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

function buildBossBasedWave(
    BossChance: number,
    BossEscortAmount: string,
    BossEscortType: string,
    BossName: string,
    BossZone: string,
    raidTime: number): BossLocationSpawn {
    return ({
        BossChance,
        BossDifficult: "normal",
        BossEscortAmount,
        BossEscortDifficult: "normal",
        BossEscortType,
        BossName,
        BossPlayer: false,
        BossZone,
        RandomTimeSpawn: false,
        Supports: null,
        Time: Math.round(Math.random() * (raidTime * 5)),
        TriggerId: "",
        TriggerName: ""
    })
}

module.exports = { mod: new Mod() }