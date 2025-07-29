import { IBotConfig } from "@spt/models/spt/config/IBotConfig.d";
import { IPmcConfig } from "@spt/models/spt/config/IPmcConfig.d";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import _config from "../../config/config.json";
import _mapConfig from "../../config/mapConfig.json";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { DependencyContainer } from "tsyringe";
import { globalValues } from "../GlobalValues";
import {
  cloneDeep,
  getRandomPresetOrCurrentlySelectedPreset,
  saveToFile,
} from "../utils";
import { ILocationConfig } from "@spt/models/spt/config/ILocationConfig.d";
import { originalMapList } from "./constants";
import { buildBossWaves } from "./buildBossWaves";
import buildZombieWaves from "./buildZombieWaves";
import buildScavMarksmanWaves from "./buildScavMarksmanWaves";
import buildPmcs from "./buildPmcs";
import { enforceSmoothing, setEscapeTimeOverrides } from "./utils";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import updateSpawnLocations from "./updateSpawnLocations";
import marksmanChanges from "./marksmanChanges";
import advancedConfig from "../../config/advancedConfig.json";

export const buildWaves = (container: DependencyContainer) => {
  const configServer = container.resolve<ConfigServer>("ConfigServer");
  const Logger = container.resolve<ILogger>("WinstonLogger");
  const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
  const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);

  const locationConfig = configServer.getConfig<ILocationConfig>(
    ConfigTypes.LOCATION
  );

  locationConfig.rogueLighthouseSpawnTimeSettings.waitTimeSeconds = 60;
  locationConfig.enableBotTypeLimits = false;
  locationConfig.fitLootIntoContainerAttempts = 1; // Move to ALP
  locationConfig.addCustomBotWavesToMaps = false;
  locationConfig.customWaves = { boss: {}, normal: {} };

  const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");

  const { locations, bots } = databaseServer.getTables();

  let config = cloneDeep(globalValues.baseConfig) as typeof _config;

  const preset = getRandomPresetOrCurrentlySelectedPreset();

  Object.keys(globalValues.overrideConfig).forEach((key) => {
    if (config[key] !== globalValues.overrideConfig[key]) {
      config.debug &&
        console.log(
          `[MOAR] overrideConfig ${key} changed from ${config[key]} to ${globalValues.overrideConfig[key]}`
        );
      config[key] = globalValues.overrideConfig[key];
    }
  });

  // Set from preset if preset above is not empty
  Object.keys(preset).forEach((key) => {
    if (config[key] !== preset[key]) {
      config.debug &&
        console.log(
          `[MOAR]  preset ${globalValues.currentPreset}:  ${key} changed from ${config[key]} to ${preset[key]}`
        );
      config[key] = preset[key];
    }
  });

  // config.debug &&
  console.log(
    globalValues.forcedPreset === "custom"
      ? "custom"
      : globalValues.forcedPreset
        ? globalValues.forcedPreset
        : globalValues.currentPreset
  );

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

  let locationList = [
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

  // This resets all locations to original state
  if (!globalValues.locationsBase) {
    globalValues.locationsBase = locationList.map(({ base }) =>
      cloneDeep(base)
    );
  } else {
    locationList = locationList.map((item, key) => ({
      ...item,
      base: cloneDeep(globalValues.locationsBase[key]),
    }));
  }

  pmcConfig.removeExistingPmcWaves = true;

  Object.keys(pmcConfig.customPmcWaves).forEach(key => {
    pmcConfig.customPmcWaves[key] = []
  })


  if (config.startingPmcs && (!config.randomSpawns || config.spawnSmoothing)) {
    Logger.warning(
      `[MOAR] Starting pmcs turned on, turning off cascade system and smoothing.\n`
    );
    config.spawnSmoothing = false;
    config.randomSpawns = true;
  }

  if (advancedConfig.MarksmanDifficultyChanges) {
    marksmanChanges(bots);
  }

  updateSpawnLocations(locationList, config);

  setEscapeTimeOverrides(locationList, _mapConfig, Logger, config);

  // BOSS RELATED STUFF!
  buildBossWaves(config, locationList, Logger);

  //Zombies
  if (config.zombiesEnabled) {
    buildZombieWaves(config, locationList, bots);
  }

  buildPmcs(config, locationList);

  // Make main waves
  buildScavMarksmanWaves(config, locationList, botConfig);

  // enableSmoothing
  if (config.spawnSmoothing) {
    enforceSmoothing(locationList);
  }

  // saveToFile(locations.bigmap.base.SpawnPointParams, "spawns.json");

  originalMapList.forEach((name, index) => {
    if (!locations[name]) {
      console.log("[MOAR] OH CRAP we have a problem!", name);
    } else {
      locations[name] = locationList[index];
    }
  });
};
