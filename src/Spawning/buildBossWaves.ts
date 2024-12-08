import { ILocation } from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import { configLocations } from "./constants";
import { buildBossBasedWave, shuffle } from "./utils";
import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig";

export function buildBossWaves(
  config: typeof _config,
  locationList: ILocation[],
  botConfig: IBotConfig
) {
  let {
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

  const bossList = [...botConfig.bosses].filter(
    (bossName) =>
      !["bossZryachiy", "bossKnight", "bossBoarSniper"].includes(bossName)
  );

  const bossesToRemoveFromPool = new Set([
    "assault",
    "pmcBEAR",
    "pmcUSEC",
    "infectedAssault",
    "infectedTagilla",
    "infectedLaborant",
    "infectedCivil",
  ]);

  // CreateBossList
  const bosses: object = {};
  for (let indx = 0; indx < locationList.length; indx++) {
    // Disable Bosses
    if (disableBosses && !!locationList[indx].base?.BossLocationSpawn) {
      locationList[indx].base.BossLocationSpawn = [];
    } else {
      locationList[indx].base.BossLocationSpawn = locationList[
        indx
      ].base.BossLocationSpawn.filter(
        (boss) => !bossesToRemoveFromPool.has(boss.BossName)
      );

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

      const filteredBosses = location.base.BossLocationSpawn?.filter(
        ({ BossName }) => bossList.includes(BossName)
      );

      if (bossOpenZones || mainBossChanceBuff) {
        location.base?.BossLocationSpawn?.forEach((boss, key) => {
          if (bossList.includes(boss.BossName)) {
            if (bossOpenZones) {
              location.base.BossLocationSpawn[key] = {
                ...location.base.BossLocationSpawn[key],
                BossZone: "",
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
      if (filteredBosses?.length) {
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
          "",
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
          "",
          locationList[indx].base.EscapeTimeLimit
        );
        location.base.BossLocationSpawn.push(rogueWave);
      }
    }
  }

  // Make boss Invasion
  if (!disableBosses && bossInvasion) {
    if (bossInvasionSpawnChance) {
      bossList.forEach((bossName) => {
        if (bosses[bossName])
          bosses[bossName].BossChance = bossInvasionSpawnChance;
      });
    }

    for (let key = 0; key < locationList.length; key++) {
      //Gather bosses to avoid duplicating.
      let bossLocations = "";
      const duplicateBosses = locationList[key].base.BossLocationSpawn.filter(
        ({ BossName, BossZone }) => {
          bossLocations += BossZone + ",";
          return bossList.includes(BossName);
        }
      ).map(({ BossName }) => BossName);
      const uniqueBossZones = bossOpenZones
        ? ""
        : [
            ...new Set(
              bossLocations
                .split(",")
                .filter(
                  (zone) => !!zone && !zone.toLowerCase().includes("snipe")
                )
            ),
          ].join(",");
      //Build bosses to add
      const bossesToAdd = shuffle<IBossLocationSpawn[]>(Object.values(bosses))
        .filter(({ BossName }) => !duplicateBosses.includes(BossName))
        .map((boss, j) => ({
          ...boss,
          BossZone: uniqueBossZones,
          BossEscortAmount:
            boss.BossEscortAmount === "0" ? boss.BossEscortAmount : "1",
          ...(gradualBossInvasion ? { Time: j * 20 + 1 } : {}),
        }));

      // UpdateBosses
      locationList[key].base.BossLocationSpawn = [
        ...locationList[key].base.BossLocationSpawn,
        ...bossesToAdd,
      ];
    }
  }
}
