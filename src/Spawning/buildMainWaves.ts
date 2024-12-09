import { ILocation } from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import {
  configLocations,
  defaultHostility,
  originalMapList,
} from "./constants";
import { MapSettings, shuffle, waveBuilder } from "./utils";
import { IWave } from "@spt/models/eft/common/ILocationBase";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig";

export default function buildMainWaves(
  config: typeof _config,
  locationList: ILocation[],
  botConfig: IBotConfig
) {
  let {
    debug,
    maxBotCap,
    scavWaveQuantity,
    scavWaveDistribution,
    snipersHaveFriends,
    noZoneDelay,
    reducedZoneDelay,
    maxBotPerZone,
    pmcWaveDistribution,
    pmcWaveQuantity,
    pmcMaxGroupSize,
    scavMaxGroupSize,
    pmcDifficulty,
    scavDifficulty,
    startingPmcs,
    moreScavGroups,
    morePmcGroups,
  } = config;

  for (let index = 0; index < locationList.length; index++) {
    const mapSettingsList = Object.keys(mapConfig) as Array<
      keyof typeof mapConfig
    >;
    const map = mapSettingsList[index];
    // if (locationList[index].base.Events?.Halloween2024) {
    //   delete locationList[index].base.Events.Halloween2024;
    // }
    // console.log(locationList[index].base.Events);
    locationList[index].base.BotLocationModifier.AdditionalHostilitySettings =
      defaultHostility;

    locationList[index].base = {
      ...locationList[index].base,
      ...{
        NewSpawn: false,
        OcculsionCullingEnabled: true,
        OfflineNewSpawn: false,
        OfflineOldSpawn: true,
        OldSpawn: true,
        BotSpawnCountStep: 0,
      },
    };

    locationList[index].base.NonWaveGroupScenario.Enabled = false;
    locationList[index].base["BotStartPlayer"] = 0;
    if (
      locationList[index].base.BotStop <
      locationList[index].base.EscapeTimeLimit * 60
    ) {
      locationList[index].base.BotStop =
        locationList[index].base.EscapeTimeLimit * 60;
    }

    const {
      maxBotPerZoneOverride,
      EscapeTimeLimit,
      pmcHotZones = [],
      scavHotZones,
    } = (mapConfig?.[map] as MapSettings) || {};

    // Set per map EscapeTimeLimit
    if (EscapeTimeLimit) {
      locationList[index].base.EscapeTimeLimit = EscapeTimeLimit;
      locationList[index].base.exit_access_time = EscapeTimeLimit + 1;
    }

    // Set default or per map maxBotCap
    if (maxBotPerZoneOverride || maxBotCap) {
      const capToSet = maxBotPerZoneOverride || maxBotCap;

      locationList[index].base.BotMax = capToSet;
      locationList[index].base.BotMaxPvE = capToSet;
      // console.log(botConfig.maxBotCap[originalMapList[index]], capToSet);
      botConfig.maxBotCap[originalMapList[index]] = capToSet;
    }

    // Adjust botZone quantity
    if (
      (maxBotPerZone || maxBotPerZone) &&
      locationList[index].base.MaxBotPerZone < (maxBotPerZone || maxBotPerZone)
    ) {
      locationList[index].base.MaxBotPerZone = maxBotPerZone || maxBotPerZone;
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
    let snipers = shuffle<IWave[]>(
      locationList[index].base.waves
        .filter(({ WildSpawnType: type }) => type === "marksman")
        .map((wave) => ({
          ...wave,
          slots_min: 0,
          ...(snipersHaveFriends && wave.slots_max < 2 ? { slots_max: 2 } : {}),
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

    // if (map === "customs") {
    //   combinedPmcScavOpenZones = globalValues.addedMapZones["bigmap"];

    //   console.log(combinedPmcScavOpenZones);
    // }

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
        false,
        true
      );
    }

    const timeLimit = locationList[index].base.EscapeTimeLimit * 60;
    const { pmcWaveCount, scavWaveCount } = mapConfig[map];

    // Pmcs
    const pmcCountPerSide = Math.round((pmcWaveCount * pmcWaveQuantity) / 2);
    const middleIndex = Math.ceil(pmcHotZones.length / 2);
    const firstHalf = pmcHotZones.splice(0, middleIndex);
    const secondHalf = pmcHotZones.splice(-middleIndex);
    const randomBoolean = Math.random() > 0.5;

    if (map === "laboratory") {
      combinedPmcZones = combinedPmcZones.filter(
        (zone) => zone !== "BotZoneGate1"
      );
    }

    const bearWaves = waveBuilder(
      pmcCountPerSide,
      timeLimit,
      pmcWaveDistribution,
      "pmcBEAR",
      pmcDifficulty,
      true,
      pmcMaxGroupSize,
      map === "gzHigh" ? [] : combinedPmcZones,
      randomBoolean ? firstHalf : secondHalf,
      1,
      !!startingPmcs,
      !!morePmcGroups
    );

    const usecWaves = waveBuilder(
      pmcCountPerSide,
      timeLimit,
      pmcWaveDistribution,
      "pmcUSEC",
      pmcDifficulty,
      true,
      pmcMaxGroupSize,
      map === "gzHigh" ? [] : combinedPmcZones,
      randomBoolean ? secondHalf : firstHalf,
      5,
      !!startingPmcs,
      !!morePmcGroups
    );

    // Scavs
    const scavTotalWaveCount = Math.round(scavWaveCount * scavWaveQuantity);

    const scavWaves = waveBuilder(
      scavTotalWaveCount,
      timeLimit,
      scavWaveDistribution,
      "assault",
      scavDifficulty,
      false,
      scavMaxGroupSize,
      map === "gzHigh" ? [] : combinedPmcScavOpenZones,
      scavHotZones,
      0,
      false,
      !!moreScavGroups
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
    // if (map === "customs") saveToFile({ scavWaves }, "scavWaves.json");
    locationList[index].base.waves = [
      ...finalSniperWaves,
      ...scavWaves,
      ...bearWaves,
      ...usecWaves,
    ]
      .sort(({ time_min: a }, { time_min: b }) => a - b)
      .map((wave, i) => ({ ...wave, number: i + 1 }));
  }
}
