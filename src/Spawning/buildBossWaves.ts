/* eslint-disable @typescript-eslint/indent */
import { ILocation } from "@spt/models/eft/common/ILocation";
import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import advancedConfig from "../../config/advancedConfig.json";
import bossConfigJson from "../../config/bossConfig.json";
import bossAdditionsConfigJson from "../../config/bossAdditionsConfig.json"
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import { cloneDeep } from "../utils";
import {
  BossAdditionConfig,
  BossConfig,
  BossConfigByZone,
  bossesToRemoveFromPool,
  bossPerformanceHash,
  configLocations,
  mainBossNameList,
  originalMapList,
} from "./constants";
import { BotDifficultyType, buildBossBasedWave, getDifficulty, getDifficultyTypeForBossName, getEscortDifficultyType, shuffle } from "./utils";

export function buildBossWaves(
  config: typeof _config,
  locationList: ILocation[],
  Logger: ILogger
) {
  const {
    randomRaiderGroup,
    randomRaiderGroupChance,
    randomRogueGroup,
    randomRogueGroupChance,
    mainBossChanceBuff,
    bossInvasion,
    bossInvasionSpawnChance,
    disableBosses,
    bossOpenZones,
    gradualBossInvasion,
  } = config;

  const bossList = mainBossNameList.filter(
    (bossName) => !["bossKnight"].includes(bossName)
  );

  const allBosses: Record<string, IBossLocationSpawn> = {};
  for (const key in locationList) {
    locationList[key].base.BossLocationSpawn.forEach((boss) => {
      if (!allBosses[boss.BossName]) {
        allBosses[boss.BossName] = boss;
      }
    });
  }

  // CreateBossList
  const bosses: Record<string, IBossLocationSpawn> = {};
  for (let indx = 0; indx < locationList.length; indx++) {
    // Disable Bosses
    if (disableBosses && !!locationList[indx].base?.BossLocationSpawn) {
      locationList[indx].base.BossLocationSpawn = [];
    } else {
      //Remove all other spawns from pool now that we have the spawns zone list
      locationList[indx].base.BossLocationSpawn = locationList[
        indx
      ].base.BossLocationSpawn.filter(
        (boss) => !bossesToRemoveFromPool.has(boss.BossName)
      );

      // Performance changes
      if (advancedConfig.EnableBossPerformanceImprovements) {
        locationList[indx].base.BossLocationSpawn.forEach((Boss, bIndex) => {
          if (Boss.BossChance < 1) return;
          if (!!bossPerformanceHash[Boss.BossName || ""]) {

            const varsToUpdate: Record<string, any> =
              bossPerformanceHash[Boss.BossName];
            // make it so bossPartisan has a random spawn time
            if (Boss.BossName === "bossPartisan") {
              const max = locationList[
                indx
              ].base.EscapeTimeLimit

              varsToUpdate.Time = Math.floor(Math.random() * 50 * max)
              // console.log(varsToUpdate, max * 60)
            }

            locationList[indx].base.BossLocationSpawn[bIndex] = {
              ...Boss,
              ...varsToUpdate,
            };
          }
        });
      }

      const location = locationList[indx];

      const defaultBossSettings =
        mapConfig?.[configLocations[indx]]?.defaultBossSettings;

      // Sets bosses spawn chance from settings
      if (
        location?.base?.BossLocationSpawn &&
        defaultBossSettings &&
        Object.keys(defaultBossSettings)?.length
      ) {
        const filteredBossList = Object.keys(defaultBossSettings).filter(
          (name) => defaultBossSettings[name]?.BossChance !== undefined
        );
        if (filteredBossList?.length) {
          filteredBossList.forEach((bossName) => {
            location.base.BossLocationSpawn =
              location.base.BossLocationSpawn.map((boss) => ({
                ...boss,
                ...(boss.BossName === bossName
                  ? { BossChance: defaultBossSettings[bossName].BossChance }
                  : {}),
              }));
          });
        }
      }

      if (randomRaiderGroup) {
        const raiderWave = buildBossBasedWave(
          randomRaiderGroupChance,
          "1,1,2,2,2,3",
          "pmcBot",
          "pmcBot",
          "",
          BotDifficultyType.RAIDER,
          locationList[indx].base.EscapeTimeLimit
        );
        location.base.BossLocationSpawn.push(raiderWave);
      }

      if (randomRogueGroup) {
        const rogueWave = buildBossBasedWave(
          randomRogueGroupChance,
          "1,1,2,2,2,3",
          "exUsec",
          "exUsec",
          "",
          BotDifficultyType.ROGUE,
          locationList[indx].base.EscapeTimeLimit
        );
        location.base.BossLocationSpawn.push(rogueWave);
      }

      //Add each boss from each map to bosses object
      const filteredBosses = location.base.BossLocationSpawn?.filter(
        ({ BossName }) => mainBossNameList.includes(BossName)
      );

      if (filteredBosses.length) {
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
    }
  }

  if (!disableBosses) {

    // Make boss Invasion
    if (bossInvasion) {
      if (bossInvasionSpawnChance) {
        bossList.forEach((bossName) => {
          if (bosses[bossName])
            bosses[bossName].BossChance = bossInvasionSpawnChance;
        });
      }

      for (let key = 0; key < locationList.length; key++) {
        //Gather bosses to avoid duplicating.

        const duplicateBosses = [
          ...locationList[key].base.BossLocationSpawn.filter(
            ({ BossName, BossZone }) => bossList.includes(BossName)
          ).map(({ BossName }) => BossName),
          "bossKnight", // So knight doesn't invade
        ];

        //Build bosses to add
        const bossesToAdd = shuffle<IBossLocationSpawn[]>(Object.values(bosses))
          .filter(({ BossName }) => !duplicateBosses.includes(BossName))
          .map((boss, j) => ({
            ...boss,
            BossZone: "",
            BossEscortAmount:
              boss.BossEscortAmount === "0" ? boss.BossEscortAmount : "1",
            ...(gradualBossInvasion ? { Time: j * 20 + 1 } : {}),
            BossDifficult: getDifficulty(BotDifficultyType.BOSS),
            BossEscortDifficult: getDifficulty(BotDifficultyType.BOSS_ESCORT)
          }));

        // UpdateBosses
        locationList[key].base.BossLocationSpawn = [
          ...locationList[key].base.BossLocationSpawn,
          ...bossesToAdd,
        ];
      }
    }

    let hasChangedBossSpawns = false;

    // iterate over all provided config locations
    configLocations.forEach((mapName, index) => {

      // All Boss Spawns for current map
      const currMapBossConfigs = locationList[index].base.BossLocationSpawn;

      // Config .json for current map
      const bossConfigs: Record<string, BossConfig | BossConfigByZone[]> = cloneDeep(
        bossConfigJson[mapName] || {}
      );

      // Trigger Ids Sanity Check -----------
      Logger.debug(`[MOAR]: Beginning sanity checks for unknown triggers on location ${mapName}`);
      const currMapTriggers = new Set(
        currMapBossConfigs
          .map(b => b.TriggerId)
          .filter(id => id && id.length > 0)
      );

      // Check mapBossConfig for any unknown triggerIds
      for (const bossKey in bossConfigs) {
        const bossConfig = bossConfigs[bossKey];

        // Skip non-array configs (we only care about arrays like pmcBot, exUsec, etc.)
        if (!Array.isArray(bossConfig)) {
          continue;
        }

        for (const obj of bossConfig) {
          if (obj.triggerId && !currMapTriggers.has(obj.triggerId)) {
            Logger.warning(`[MOAR]: Trigger "${obj.triggerId}" not found in default configuration for map "${mapName}". Possible misconfiguration.`);
          }
        }
      }
      Logger.debug(`[MOAR]: Finishing sanity checks for unknown triggers on location ${mapName}`);

      // Iterate over the map Actual Boss Spawns in order to adjust already existing spawns with the provided config
      currMapBossConfigs.forEach(({ BossName, BossChance, BossZone, TriggerId }, bossIndex) => {

        const checkBossConfig = bossConfigs[BossName];
        // No special config provided in bossConfig.json for this Boss
        if (!checkBossConfig || (Array.isArray(checkBossConfig) && !checkBossConfig.length)) {
          Logger.debug(`[MOAR]: No special config for ${BossName} in ${mapName}`);
          return;
        }

        if (!hasChangedBossSpawns) {
          Logger.info(
            `\n[MOAR]: --- Adjusting default boss spawn rates from bossConfig.json --- `
          );
          hasChangedBossSpawns = true;
        }


        const actualBossConfig = locationList[index].base.BossLocationSpawn[bossIndex];
        if (Array.isArray(bossConfigs[BossName])) {
          // Is the provided config for current boss and map an array? If so, treat it like as a BossConfigByZone

          // cast to array of BossConfigByZone
          const config = bossConfigs[BossName] as BossConfigByZone[];

          // Sort the array so the least specific ones (the ones without triggerId) come first
          // This is done like this because there is a possiblity of repeated ZoneIds spawns, and some have triggers, and some dont
          // So first edit everything by zoneId
          // Then afterwards edit everything by zoneId+triggerId
          const sortByTriggerSpecific = (a: BossConfigByZone, b: BossConfigByZone) => {
            const hasTriggerA = !!a.triggerId;
            const hasTriggerB = !!b.triggerId;

            // Entries *without* triggerId should come first
            if (hasTriggerA === hasTriggerB) return 0;
            return hasTriggerA ? 1 : -1;
          };

          config
            .sort(sortByTriggerSpecific)
            .forEach((zoneFilter: BossConfigByZone) => {

              // we need to split zones as "ZoneSmuglers,ZoneSanatarium01" should match a boss with "ZoneSanatarium01"
              const zones = zoneFilter.zoneId.split(",");
              const zoneMatches = zones.some(zone => BossZone.includes(zone));

              const bossHasTriggers = TriggerId?.length;
              const triggers = zoneFilter.triggerId?.split(",") ?? [];

              /**  
               * To match, either of the following things have to happen:
               * - Boss has no triggers AND Provided config has no triggers
               * - Any of the provided config triggers matches the boss trigger
               **/
              const triggerMatches = (!bossHasTriggers && !triggers.length) /*|| !triggers.length*/ || triggers.some(trigger => TriggerId == trigger);


              /**
               * To change actual boss spawn all have to match:
               * - Boss and Provided Config zoneId are equal (intersection, boss zone "ZoneSanatarium01" matches to provided "ZoneSmugles,ZoneSanatarium01")
               * - TriggerId has to match (see previus match explaination)
               * - The desired chance must be different to the one the boss already has
               */
              const desiredChance = zoneFilter.chance;
              if (zoneMatches && triggerMatches && (desiredChance != BossChance)) {
                Logger.info(
                  `[MOAR]: ${mapName} ${BossName} ${BossZone} ${TriggerId}: Chance of spawn [${BossChance}] => [${desiredChance}]`
                );
                actualBossConfig.BossChance = desiredChance;
              }

              const desiredEscortAmount = zoneFilter.escortAmount;
              if (zoneMatches && triggerMatches && actualBossConfig.BossEscortAmount != desiredEscortAmount && (typeof desiredEscortAmount === "string")) {
                Logger.info(
                  `[MOAR]: ${mapName} ${BossName} ${BossZone} ${TriggerId}: Escort amount [${actualBossConfig.BossEscortAmount}] => [${desiredEscortAmount}]`
                );
                actualBossConfig.BossEscortAmount = desiredEscortAmount;
              }
                
              const desiredTime = zoneFilter.time;
              if (zoneMatches && triggerMatches && actualBossConfig.Time != desiredTime && (typeof desiredTime === "number")) {
                Logger.info(
                  `[MOAR]: ${mapName} ${BossName} ${BossZone} ${TriggerId}: Time [${actualBossConfig.Time}] => [${desiredTime}]`
                );
                actualBossConfig.Time = desiredTime;
              }


            });

        } else {
          // If the provided config for the current map and boss is not an array, proceed normally

          // cast to normal BossConfig
          const config = bossConfigs[BossName] as BossConfig;
          const desiredChance = config.chance;
          const desiredZones = config.zoneIds;
          const desiredEscortAmount = config.escortAmount;
          const desiredTime = config.time;

          // If provided config chance is not the same as the current boss one, change it
          if (desiredChance != BossChance && (typeof desiredChance === "number")) {
            Logger.info(
              `[MOAR]: ${mapName} ${BossName}: Chance of spawn [${BossChance}] => [${desiredChance}]`
            );
            actualBossConfig.BossChance = desiredChance;
          }

          // Zones can also change, as long as the provided zoneId is different to the existing one
          if (desiredZones != BossZone && (typeof desiredZones === "string")) {
            Logger.info(
              `[MOAR]: ${mapName} ${BossName}: Zone of spawn [${BossZone}] => [${desiredZones}]`
            );
            actualBossConfig.BossZone = desiredZones;
          } 
          
          // Escorts can also change, as long as the provided escort amount is different to the existing one
          if (desiredEscortAmount != actualBossConfig.BossEscortAmount && (typeof desiredEscortAmount === "string")) {
            Logger.info(
              `[MOAR]: ${mapName} ${BossName}: Escort amount [${actualBossConfig.BossEscortAmount}] => [${desiredEscortAmount}]`
            );
            actualBossConfig.BossEscortAmount = desiredEscortAmount;
          }
          
          // Time of spawn can also change, as long as the provided time is different to the existing one
          if (desiredTime != actualBossConfig.Time && (typeof desiredTime === "number")) {
            Logger.info(
              `[MOAR]: ${mapName} ${BossName}: Time [${actualBossConfig.Time}] => [${desiredTime}]`
            );
            actualBossConfig.Time = desiredTime;
          }
        }

      });

      // bossAdditionsConfig.json for current map
      const configToAddBosses: BossAdditionConfig[] = cloneDeep(bossAdditionsConfigJson[mapName]);
      const bossWavesToAdd = [];

      configToAddBosses.forEach((config) => {
        Logger.info(`[MOAR]: Adding non-default boss [${config.type}] to [${mapName}] => Chance [${config.chance}] Zones [${config.zoneIds}]`);
        const newBossConfig: IBossLocationSpawn = cloneDeep(allBosses[config.type]);
    
        // assign chance and zones
        newBossConfig.BossChance = config.chance;
        newBossConfig.BossZone = config.zoneIds;

        // assign time if provided
        if (config.time != undefined) {
          newBossConfig.Time = config.time;
        }

        // assign escort amount if provided
        if (config.escortAmount?.length) {
          newBossConfig.BossEscortAmount = config.escortAmount;
        }

        // assign trigger id if provided
        if (config.triggerId?.length) {
          newBossConfig.TriggerId = config.triggerId;
          newBossConfig.TriggerName = "interactObject"; // Hardcoded, all triggers have this.
        }

        bossWavesToAdd.push(newBossConfig);
      });


      if (bossOpenZones || mainBossChanceBuff) {
        locationList[index].base?.BossLocationSpawn?.forEach((boss, key) => {
          if (bossList.includes(boss.BossName)) {
            if (bossOpenZones) {
              locationList[index].base.BossLocationSpawn[key] = {
                ...locationList[index].base.BossLocationSpawn[key],
                BossZone: "",
              };
            }

            if (!!boss.BossChance && mainBossChanceBuff > 0) {
              locationList[index].base.BossLocationSpawn[key] = {
                ...locationList[index].base.BossLocationSpawn[key],
                BossChance: Math.max(Math.min( Math.round(boss.BossChance + mainBossChanceBuff), 100 ), 0) // allow negative numbers in the mainBossChanceBuff, with a min of 0 and max of 100 ;)
              };
            }
          }
        });
      }

      Logger.debug(`[MOAR]: Boss waves to add to map [${mapName}]: [${JSON.stringify(bossWavesToAdd) || "None"}]`);

      locationList[index].base.BossLocationSpawn = [
        ...locationList[index].base.BossLocationSpawn,
        ...bossWavesToAdd
      ];

      bossWavesToAdd.length &&
        Logger.info(
          `[MOAR] Adding the following bosses to map ${configLocations[index]
          }: ${bossWavesToAdd.map(({ BossName }) => BossName)}`
        );
      // console.log(locationList[index].base.BossLocationSpawn.length);

      const bossesToSkip = new Set(["sectantPriest", "pmcBot"]);
      // Apply the percentages on all bosses, cull those that won't spawn, make all bosses 100 chance that remain.
      locationList[index].base.BossLocationSpawn = locationList[
        index
      ].base.BossLocationSpawn.map(
        ({ BossChance, BossName, TriggerId }, bossIndex) => {

          // apply dynamic difficulties
          const difficultyType = getDifficultyTypeForBossName(BossName);
          const escortDifficultyType = getEscortDifficultyType(difficultyType);
          const bossDifficulty = getDifficulty(difficultyType);
          const escortDifficulty = getDifficulty(escortDifficultyType);

          locationList[index].base.BossLocationSpawn[bossIndex].BossDifficult = bossDifficulty;
          locationList[index].base.BossLocationSpawn[bossIndex].BossEscortDifficult = escortDifficulty;
          Logger.debug(`[MOAR]: Changed difficulty of boss [${BossName}] on map [${mapName}] to [${bossDifficulty}], with escorts as [${escortDifficulty}]`);

          if (BossChance < 1) {
            return locationList[index].base.BossLocationSpawn[bossIndex];
          }
          if (
            !TriggerId &&
            !bossesToSkip.has(BossName) &&
            BossChance < 100
          ) {
            if (
              BossChance / 100 < Math.random()) {
              locationList[index].base.BossLocationSpawn[
                bossIndex
              ].BossChance = 0;

              locationList[index].base.BossLocationSpawn[bossIndex].ForceSpawn =
                false;

              locationList[index].base.BossLocationSpawn[
                bossIndex
              ].IgnoreMaxBots = false;
            } else {
              locationList[index].base.BossLocationSpawn[
                bossIndex
              ].BossChance = 100;
            }
          }
          return locationList[index].base.BossLocationSpawn[bossIndex];
        }
      ).filter(({ BossChance, BossName, ...rest }) => {
        if (BossChance < 1) {
          return false;
        }
        return true
      });

      // if (mapName === "lighthouse") {
      //   console.log(
      //     locationList[index].base.BossLocationSpawn.map(
      //       ({ BossName, BossChance }) => ({ BossName, BossChance })
      //     )
      //   );
      // }

    });

    if (hasChangedBossSpawns) {
      console.log(
        `[MOAR]: --- Adjusting default boss spawn rates complete --- \n`
      );
    }
  }
}
