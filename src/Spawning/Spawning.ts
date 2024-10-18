import { ILocationConfig } from "@spt/models/spt/config/ILocationConfig.d";
import {
  Wave,
  BossLocationSpawn,
} from "@spt/models/eft/common/ILocationBase.d";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig.d";
import { IPmcConfig } from "@spt/models/spt/config/IPmcConfig.d";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import {
  randomRaiderGroup,
  randomRaiderGroupChance,
  randomRogueGroup,
  randomRogueGroupChance,
  mainBossChanceBuff,
  debug,
  allOpenZones,
  defaultMaxBotCap,
  defaultScavWaveMultiplier,
  defaultScavStartWaveRatio,
  sniperBuddies,
  noZoneDelay,
  bossInvasion,
  bossInvasionSpawnChance,
  disableBosses,
  reducedZoneDelay,
  bossOpenZones,
  gradualBossInvasion,
  defaultMaxBotPerZone,
  defaultPmcStartWaveRatio,
  defaultPmcWaveMultiplier,
  defaultGroupMaxPMC,
  defaultGroupMaxScav,
  pmcDifficulty,
  scavDifficulty,
} from "../../config/config.json";
import mapSettings from "../../config/advancedMapSettings.json";
import waveConfig from "../../config/waveConfig.json";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { DependencyContainer } from "tsyringe";
import { saveToFile } from "../utils";

export const buildWaves = (container: DependencyContainer) => {
  // Get Logger
  const logger = container.resolve<ILogger>("WinstonLogger");
  logger.info(
    "MOAR: Successfully enabled, may the bots ever be in your favour!"
  );

  const configServer = container.resolve<ConfigServer>("ConfigServer");
  const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
  const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);
  const locationConfig = configServer.getConfig<ILocationConfig>(
    ConfigTypes.LOCATION
  );

  const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");

  // Get all the in-memory json found in /assets/database
  const { bots, locations } = databaseServer.getTables();

  const {
    bigmap: customs,
    factory4_day: factoryDay,
    factory4_night: factoryNight,
    interchange,
    laboratory,
    lighthouse,
    rezervbase,
    shoreline,
    tarkovstreets,
    woods,
    sandbox: gzLow,
    sandbox_high: gzHigh,
  } = locations;

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

  interface MapSettings {
    EscapeTimeLimit?: number;
    maxBotCap?: number;
    scavWaveStartRatio?: number;
    scavWaveMultiplier?: number;
    scavWaveCount?: number;
    additionalScavsPerWave?: number;
    pmcWaveStartRatio?: number;
    pmcWaveMultiplier?: number;
    pmcCount?: number;
    maxBotPerZone?: number;
    pmcHotZones?: string[];
    scavHotZones?: string[];
  }
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

  botConfig.presetBatch["pmcBEAR"] = defaultMaxBotCap;
  botConfig.presetBatch["pmcUSEC"] = defaultMaxBotCap;

  for (let index = 0; index < locationList.length; index++) {
    const mapSettingsList = Object.keys(mapSettings) as Array<
      keyof typeof mapSettings
    >;
    const map = mapSettingsList[index];

    // Disable Bosses
    if (disableBosses && !!locationList[index].base?.BossLocationSpawn) {
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
    if (
      locationList[index].base.BotStop <
      locationList[index].base.EscapeTimeLimit * 60
    ) {
      locationList[index].base.BotStop =
        locationList[index].base.EscapeTimeLimit * 60;
    }

    // No Zone Delay
    if (noZoneDelay) {
      locationList[index].base.SpawnPointParams = locationList[
        index
      ].base.SpawnPointParams.map((spawn) => ({
        ...spawn,
        DelayToCanSpawnSec: 4,
      }));
    }

    // Reduced Zone Delay
    if (!noZoneDelay && reducedZoneDelay) {
      locationList[index].base.SpawnPointParams = locationList[
        index
      ].base.SpawnPointParams.map((spawn) => ({
        ...spawn,
        DelayToCanSpawnSec:
          spawn.DelayToCanSpawnSec > 20
            ? Math.round(spawn.DelayToCanSpawnSec / 10)
            : spawn.DelayToCanSpawnSec,
      }));
    }

    // Snipers
    let snipers = shuffle<Wave[]>(
      locationList[index].base.waves
        .filter(({ WildSpawnType: type }) => type === "marksman")
        .map((wave) => ({
          ...wave,
          slots_min: 0,
          ...(sniperBuddies && wave.slots_max < 2 ? { slots_max: 2 } : {}),
        }))
    );

    if (snipers.length) {
      locationList[index].base.MinMaxBots = [
        {
          WildSpawnType: "marksman" as any,
          max: snipers.length * 5,
          min: snipers.length,
        },
      ];
    }

    const scavZones = [
      ...new Set(
        [...locationList[index].base.SpawnPointParams]
          .filter(
            ({ Categories, Sides, BotZoneName }) =>
              !!BotZoneName &&
              Sides.includes("Savage") &&
              Categories.includes("Bot") &&
              !Categories.includes("Boss")
          )
          .map(({ BotZoneName }) => BotZoneName)
      ),
    ];

    const pmcZones = [
      ...new Set(
        [...locationList[index].base.SpawnPointParams]
          .filter(
            ({ Categories, BotZoneName }) =>
              !!BotZoneName && Categories.includes("Player")
          )
          .map(({ BotZoneName }) => BotZoneName)
      ),
    ];

    const mapPulledLocations = [...locationList[index].base.waves]
      .filter(
        ({ WildSpawnType, SpawnPoints }) =>
          WildSpawnType === "assault" && !!SpawnPoints
      )
      .map(({ SpawnPoints }) => SpawnPoints);

    const sniperLocations = [
      ...new Set(snipers.map(({ SpawnPoints }) => SpawnPoints)),
    ];

    let combinedPmcScavOpenZones = shuffle<string[]>([
      ...new Set([...scavZones, ...pmcZones, ...mapPulledLocations]),
    ]).filter((location) => !sniperLocations.includes(location));

    let combinedPmcZones = combinedPmcScavOpenZones.filter(
      (zone) => !zone.toLowerCase().includes("snipe")
    );

    if (map === "tarkovstreets") {
      const sniperZones = shuffle(
        combinedPmcScavOpenZones.filter((zone) =>
          zone.toLowerCase().includes("snipe")
        )
      ) as string[];
      combinedPmcScavOpenZones = [];
      combinedPmcZones = [];

      snipers = waveBuilder(
        sniperZones.length,
        locationList[index].base.EscapeTimeLimit * 10,
        1,
        "marksman",
        0.8,
        false,
        2,
        [],
        sniperZones,
        0,
        true
      );
    }

    const {
      EscapeTimeLimit,
      maxBotCap,
      scavWaveStartRatio,
      scavWaveMultiplier,
      // additionalScavsPerWave ,
      pmcWaveStartRatio,
      pmcWaveMultiplier,
      maxBotPerZone,
      pmcHotZones = [],
      scavHotZones,
    } = (mapSettings?.[map] as MapSettings) || {};

    // Set per map EscapeTimeLimit
    if (EscapeTimeLimit) {
      locationList[index].base.EscapeTimeLimit = EscapeTimeLimit;
      locationList[index].base.exit_access_time = EscapeTimeLimit + 1;
    }

    // Set default or per map maxBotCap
    if (defaultMaxBotCap || maxBotCap) {
      const capToSet = maxBotCap || defaultMaxBotCap;

      locationList[index].base.BotMax = capToSet;
      locationList[index].base.BotMaxPvE = capToSet;
      // console.log(botConfig.maxBotCap[originalMapList[index]], capToSet);
      botConfig.maxBotCap[originalMapList[index]] = capToSet;
    }

    // Make all zones open for scav/pmc spawns
    if (allOpenZones) {
      if (combinedPmcZones.length > 0) {
        locationConfig.openZones[`${originalMapList[index]}`] =
          combinedPmcZones;
        locationList[index].base.OpenZones = combinedPmcZones.join(",");
      }
    }

    // Adjust botZone quantity
    if (
      (maxBotPerZone || defaultMaxBotPerZone) &&
      locationList[index].base.MaxBotPerZone <
        (maxBotPerZone || defaultMaxBotPerZone)
    ) {
      locationList[index].base.MaxBotPerZone =
        maxBotPerZone || defaultMaxBotPerZone;
    }

    const timeLimit = locationList[index].base.EscapeTimeLimit * 60;
    const { pmcWaveCount, scavWaveCount } = waveConfig[map];
    // Pmcs
    const pmcWaveStart = pmcWaveStartRatio || defaultPmcStartWaveRatio;
    const pmcWaveMulti = pmcWaveMultiplier || defaultPmcWaveMultiplier;
    const pmcCountPerSide = Math.round((pmcWaveCount * pmcWaveMulti) / 2);

    const middleIndex = Math.ceil(pmcHotZones.length / 2);
    const firstHalf = pmcHotZones.splice(0, middleIndex);
    const secondHalf = pmcHotZones.splice(-middleIndex);
    const randomBoolean = Math.random() > 0.5;

    const bearWaves = waveBuilder(
      pmcCountPerSide,
      timeLimit,
      pmcWaveStart,
      "pmcBEAR",
      pmcDifficulty,
      true,
      defaultGroupMaxPMC,
      combinedPmcZones,
      randomBoolean ? firstHalf : secondHalf,
      15
    );

    const usecWaves = waveBuilder(
      pmcCountPerSide,
      timeLimit,
      pmcWaveStart,
      "pmcUSEC",
      pmcDifficulty,
      true,
      defaultGroupMaxPMC,
      combinedPmcZones,
      randomBoolean ? secondHalf : firstHalf,
      5
    );

    // Scavs
    const scavWaveStart = scavWaveStartRatio || defaultScavStartWaveRatio;
    const scavWaveMulti = scavWaveMultiplier || defaultScavWaveMultiplier;
    const scavTotalWaveCount = Math.round(scavWaveCount * scavWaveMulti);

    const scavWaves = waveBuilder(
      scavTotalWaveCount,
      timeLimit,
      scavWaveStart,
      "assault",
      scavDifficulty,
      false,
      defaultGroupMaxScav,
      map === "gzHigh" ? [] : combinedPmcScavOpenZones,
      scavHotZones
    );

    if (debug) {
      let total = 0;
      let totalscav = 0;
      bearWaves.forEach(({ slots_max }) => (total += slots_max));
      usecWaves.forEach(({ slots_max }) => (total += slots_max));
      scavWaves.forEach(({ slots_max }) => (totalscav += slots_max));

      console.log(configLocations[index]);
      console.log(
        "Pmcs:",
        total,
        "configVal",
        Math.round((total / pmcWaveCount) * 100) / 100,
        "configWaveCount",
        pmcWaveCount,
        "waveCount",
        bearWaves.length + usecWaves.length
      );
      console.log(
        "Scavs:",
        totalscav,
        "configVal",
        Math.round((totalscav / scavWaveCount) * 100) / 100,
        "configWaveCount",
        scavWaveCount,
        "waveCount",
        scavWaves.length,
        "\n"
      );
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

  const bossList = [...botConfig.bosses].filter(
    (bossName) => !["bossZryachiy", "bossKnight"].includes(bossName)
  );

  // CreateBossList
  const bosses: object = {};
  for (let indx = 0; indx < locationList.length; indx++) {
    const location = locationList[indx];

    // cull weird boss names
    if (location?.base?.BossLocationSpawn) {
      const cullList = ["skier", "peacemaker"];
      location.base.BossLocationSpawn = location.base.BossLocationSpawn.filter(
        (boss) => !cullList.includes(boss.BossName)
      );
    }

    const defaultBossSettings =
      mapSettings?.[configLocations[indx]]?.defaultBossSettings;

    // Sets bosses spawn chance from settings
    if (
      location?.base?.BossLocationSpawn &&
      !disableBosses &&
      defaultBossSettings &&
      Object.keys(defaultBossSettings)?.length
    ) {
      const filteredBossList = Object.keys(defaultBossSettings).filter(
        (name) => defaultBossSettings[name]?.BossChance !== undefined
      );
      if (filteredBossList?.length) {
        filteredBossList.forEach((bossName) => {
          location.base.BossLocationSpawn = location.base.BossLocationSpawn.map(
            (boss) => ({
              ...boss,
              ...(boss.BossName === bossName
                ? { BossChance: defaultBossSettings[bossName].BossChance }
                : {}),
            })
          );
        });
      }
    }

    const filteredBosses = location.base.BossLocationSpawn?.filter(
      ({ BossName }) => bossList.includes(BossName)
    );

    if (!disableBosses && (bossOpenZones || mainBossChanceBuff)) {
      location.base?.BossLocationSpawn?.forEach((boss, key) => {
        if (bossList.includes(boss.BossName)) {
          if (bossOpenZones && locationList[indx].base.OpenZones) {
            location.base.BossLocationSpawn[key] = {
              ...location.base.BossLocationSpawn[key],
              BossZone: locationList[indx].base.OpenZones,
            };
          }

          if (!!boss.BossChance && mainBossChanceBuff > 0) {
            location.base.BossLocationSpawn[key] = {
              ...location.base.BossLocationSpawn[key],
              BossChance:
                boss.BossChance + mainBossChanceBuff > 100
                  ? 100
                  : Math.round(boss.BossChance + mainBossChanceBuff),
            };
          }
        }
      });
    }

    //Add each boss from each map to bosses object
    if (!disableBosses && filteredBosses?.length) {
      for (let index = 0; index < filteredBosses.length; index++) {
        const boss = filteredBosses[index];
        if (
          !bosses[boss.BossName] ||
          (bosses[boss.BossName] &&
            bosses[boss.BossName].BossChance < boss.BossChance)
        ) {
          bosses[boss.BossName] = { ...boss };
        }
      }
    }

    if (randomRaiderGroup) {
      const raiderWave = buildBossBasedWave(
        randomRaiderGroupChance,
        "1,2,2,2,3",
        "pmcBot",
        "pmcBot",
        locationList[indx].base.OpenZones,
        locationList[indx].base.EscapeTimeLimit
      );
      location.base.BossLocationSpawn.push(raiderWave);
    }

    if (randomRogueGroup) {
      const rogueWave = buildBossBasedWave(
        randomRogueGroupChance,
        "1,2,2,2,3",
        "exUsec",
        "exUsec",
        locationList[indx].base.OpenZones,
        locationList[indx].base.EscapeTimeLimit
      );
      location.base.BossLocationSpawn.push(rogueWave);
    }
  }

  if (bossInvasion && !disableBosses) {
    if (bossInvasionSpawnChance) {
      bossList.forEach((bossName) => {
        bosses[bossName].IgnoreMaxBots = true;
        bosses[bossName].BossChance = bossInvasionSpawnChance;
      });
    }

    for (let key = 0; key < locationList.length; key++) {
      //Gather bosses to avoid duplicating.
      const duplicateBosses = locationList[key].base.BossLocationSpawn.filter(
        ({ BossName }) => bossList.includes(BossName)
      ).map(({ BossName }) => BossName);

      //Build bosses to add
      const bossesToAdd = shuffle<BossLocationSpawn[]>(Object.values(bosses))
        .filter(({ BossName }) => !duplicateBosses.includes(BossName))
        .map((boss, j) => ({
          ...boss,
          BossZone: locationList[key].base.OpenZones,
          ...(gradualBossInvasion ? { Time: j * 20 + 1 } : {}),
        }));

      // UpdateBosses
      locationList[key].base.BossLocationSpawn = [
        ...locationList[key].base.BossLocationSpawn,
        ...bossesToAdd,
      ];
    }
  }

  if (debug) {
    sniperBuddies &&
      logger.logWithColor("sniperBuddies: Enabled", LogTextColor.WHITE);
    noZoneDelay &&
      logger.logWithColor("noZoneDelay: Enabled", LogTextColor.WHITE);
    reducedZoneDelay &&
      logger.logWithColor("reducedZoneDelay: Enabled", LogTextColor.WHITE);
    allOpenZones &&
      logger.logWithColor("allOpenZones: Enabled", LogTextColor.WHITE);
    randomRaiderGroup &&
      logger.logWithColor("randomRaiderGroup: Enabled", LogTextColor.WHITE);
    randomRogueGroup &&
      logger.logWithColor("randomRogueGroup: Enabled", LogTextColor.WHITE);
    if (disableBosses) {
      logger.logWithColor("disableBosses: Enabled", LogTextColor.WHITE);
    } else {
      bossOpenZones &&
        logger.logWithColor("bossOpenZones: Enabled", LogTextColor.WHITE);
      bossInvasion &&
        logger.logWithColor("bossInvasion: Enabled", LogTextColor.WHITE);
      gradualBossInvasion &&
        logger.logWithColor("gradualBossInvasion: Enabled", LogTextColor.WHITE);
    }
  }
};

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
  const averageTime = timeLimit / totalWaves;
  const firstHalf = Math.round(averageTime * (1 - waveStart));
  const secondHalf = Math.round(averageTime * (1 + waveStart));
  let timeStart = offset || 0;
  const waves = [];
  let maxSlotsReached = Math.round(1.3 * totalWaves);
  while (
    totalWaves > 0 &&
    (waves.length < totalWaves || specialZones.length > 0)
  ) {
    const accelerate = totalWaves > 5 && waves.length < totalWaves / 3;
    const stage = Math.round(
      waves.length < Math.round(totalWaves * 0.5)
        ? accelerate
          ? firstHalf / 3
          : firstHalf
        : secondHalf
    );

    const min = !offset && waves.length < 1 ? 0 : timeStart;
    const max = !offset && waves.length < 1 ? 0 : timeStart + 10;

    if (waves.length >= 1 || offset) timeStart = timeStart + stage;
    const BotPreset = getDifficulty(difficulty);
    // console.log(wildSpawnType, BotPreset);
    // Math.round((1 - waves.length / totalWaves) * maxSlots) || 1;
    const slotMax =
      Math.round(
        (moreGroups ? Math.random() : Math.random() * Math.random()) * maxSlots
      ) || 1;

    waves.push({
      BotPreset,
      BotSide: "Savage",
      SpawnPoints: getZone(
        specialZones,
        combinedZones,
        waves.length >= totalWaves
      ),
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
    if (maxSlotsReached <= 0) break;
  }

  return waves;
}

const getZone = (specialZones, combinedZones, specialOnly) => {
  if (!specialOnly && combinedZones.length)
    return combinedZones[
      Math.round((combinedZones.length - 1) * Math.random())
    ];
  if (specialZones.length) return specialZones.pop();
  return "";
};

function getDifficulty(diff: number) {
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

function shuffle<n>(array: any): n {
  let currentIndex = array.length,
    randomIndex;

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

function buildBossBasedWave(
  BossChance: number,
  BossEscortAmount: string,
  BossEscortType: string,
  BossName: string,
  BossZone: string,
  raidTime: number
): BossLocationSpawn {
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
