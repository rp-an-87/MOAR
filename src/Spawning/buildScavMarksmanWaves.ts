import { ILocation } from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import {
  configLocations,
  defaultEscapeTimes,
  defaultHostility,
  originalMapList,
} from "./constants";
import { buildBotWaves, MapSettings, shuffle, waveBuilder } from "./utils";
import { WildSpawnType } from "@spt/models/eft/common/ILocationBase";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig";
import { saveToFile } from "../utils";
import getSortedSpawnPointList from "./spawnZoneUtils";

export default function buildScavMarksmanWaves(
  config: typeof _config,
  locationList: ILocation[],
  botConfig: IBotConfig
) {
  let {
    maxBotCap,
    scavWaveQuantity,
    scavWaveDistribution,
    sniperMaxGroupSize,
    maxBotPerZone,
    scavMaxGroupSize,
    scavDifficulty,
    sniperGroupChance,
    scavGroupChance,
  } = config;

  for (let index = 0; index < locationList.length; index++) {
    const mapSettingsList = Object.keys(mapConfig) as Array<
      keyof typeof mapConfig
    >;
    const map = mapSettingsList[index];

    locationList[index].base.waves = [];
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
      maxBotCapOverride,
      EscapeTimeLimit,
      scavHotZones = [],
    } = (mapConfig?.[map] as MapSettings) || {};

    // Set per map EscapeTimeLimit
    if (EscapeTimeLimit) {
      locationList[index].base.EscapeTimeLimit = EscapeTimeLimit;
      locationList[index].base.exit_access_time = EscapeTimeLimit + 1;
    }

    // Set default or per map maxBotCap
    if (maxBotCapOverride || maxBotCap) {
      const capToSet = maxBotCapOverride || maxBotCap;
      // console.log(map, capToSet, maxBotCapOverride, maxBotCap);
      locationList[index].base.BotMax = capToSet;
      locationList[index].base.BotMaxPvE = capToSet;
      botConfig.maxBotCap[originalMapList[index]] = capToSet;
    }

    // Adjust botZone quantity
    if (maxBotPerZoneOverride || maxBotPerZone) {
      const BotPerZone = maxBotPerZoneOverride || maxBotPerZone;
      // console.log(map, BotPerZone, maxBotPerZoneOverride, maxBotPerZone);
      locationList[index].base.MaxBotPerZone = BotPerZone;
    }

    // const sniperLocations = new Set(
    //   [...locationList[index].base.SpawnPointParams]
    //     .filter(
    //       ({ Categories, DelayToCanSpawnSec, BotZoneName, Sides }) =>
    //         !Categories.includes("Boss") &&
    //         Sides[0] === "Savage" &&
    //         (BotZoneName?.toLowerCase().includes("snipe") ||
    //           DelayToCanSpawnSec > 40)
    //     )
    //     .map(({ BotZoneName }) => BotZoneName || "")
    // );

    const {
      Position: { x, z },
    } =
      locationList[index].base.SpawnPointParams[
        locationList[index].base.SpawnPointParams.length - 1
      ];

    let sniperLocations = getSortedSpawnPointList(
      [...locationList[index].base.SpawnPointParams].filter(
        ({ Categories, DelayToCanSpawnSec, BotZoneName, Sides }) =>
          !Categories.includes("Boss") &&
          Sides[0] === "Savage" &&
          (BotZoneName?.toLowerCase().includes("snipe") ||
            DelayToCanSpawnSec > 40)
      ),
      x,
      z
    ).map(({ BotZoneName }) => BotZoneName);

    if (sniperLocations.length) {
      locationList[index].base.MinMaxBots = [
        {
          WildSpawnType: "marksman",
          max: sniperLocations.length * 5,
          min: sniperLocations.length,
        },
      ];
    }

    const { scavWaveCount } = mapConfig[map];

    let scavZones = getSortedSpawnPointList(
      locationList[index].base.SpawnPointParams.filter(
        ({ Categories, Sides }, index) =>
          index % 3 !== 0 && Categories[0] === "Bot"
      ),
      x,
      z,
      0.1
    ).map(({ BotZoneName }) => BotZoneName);

    const escapeTimeLimitRatio = Math.round(
      locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map]
    );

    // Scavs
    let scavTotalWaveCount = Math.round(
      scavWaveCount * scavWaveQuantity * escapeTimeLimitRatio
    );

    if (scavHotZones.length && scavTotalWaveCount > 0) {
      scavTotalWaveCount = scavTotalWaveCount + scavHotZones.length;
    }

    while (scavTotalWaveCount - scavZones.length > 0) {
      console.log(
        `${map} ran out of appropriate zones for scavs, duplicating zones`
      );
      // const addEmpty = new Array(numberOfZoneless).fill("");
      scavZones = [...scavZones, ...scavZones];
      if (scavZones.length === 0) {
        scavZones = [""];
      }
    }

    config.debug &&
      escapeTimeLimitRatio !== 1 &&
      console.log(
        `${map} Scav wave count changed from ${scavWaveCount} to ${scavTotalWaveCount} due to escapeTimeLimit adjustment`
      );

    const timeLimit = locationList[index].base.EscapeTimeLimit * 60;
    if (config.disableCascadingSpawns)
      sniperLocations = shuffle<string[]>(sniperLocations);
    const snipers = buildBotWaves(
      sniperLocations.length,
      timeLimit,
      sniperMaxGroupSize,
      sniperGroupChance,
      sniperLocations,
      0.7,
      WildSpawnType.MARKSMAN,
      true,
      0.3,
      60
    );

    if (config.disableCascadingSpawns) scavZones = shuffle<string[]>(scavZones);
    const scavWaves = buildBotWaves(
      scavTotalWaveCount,
      timeLimit,
      scavMaxGroupSize,
      scavGroupChance,
      scavZones,
      scavDifficulty,
      WildSpawnType.ASSAULT,
      false,
      scavWaveDistribution,
      11
    );

    // Add hotzones if exist
    if (scavWaves.length) {
      scavHotZones.forEach((hotzone) => {
        const index = Math.floor(scavWaves.length * Math.random());
        scavWaves[index].BossZone = hotzone;
        // console.log(scavWaves[index].BossZone);
      });
    }

    // if (map === "laboratory") console.log(snipers, scavWaves)
    locationList[index].base.BossLocationSpawn = [
      ...snipers,
      ...scavWaves,
      ...locationList[index].base.BossLocationSpawn,
    ];
  }
}
