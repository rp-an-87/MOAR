/* eslint-disable @typescript-eslint/indent */
import { ILocation } from "@spt/models/eft/common/ILocation";
import {
  IBossLocationSpawn,
  IWave,
  WildSpawnType,
} from "@spt/models/eft/common/ILocationBase";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import { configLocations, defaultEscapeTimes, mainBossNameList } from "./constants";

export const waveBuilder = (
  totalWaves: number,
  timeLimit: number,
  waveDistribution: number,
  wildSpawnType: "marksman" | "assault",
  difficulty: BotDifficultyType,
  isPlayer: boolean,
  maxSlots: number,
  combinedZones: string[] = [],
  specialZones: string[] = [],
  offset?: number,
  starting?: boolean,
  moreGroups?: boolean
): IWave[] => {
  if (totalWaves === 0) return [];

  const averageTime = timeLimit / totalWaves;
  const firstHalf = Math.round(averageTime * (1 - waveDistribution));
  const secondHalf = Math.round(averageTime * (1 + waveDistribution));
  let timeStart = offset || 0;
  const waves: IWave[] = [];
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
    const max = !offset && waves.length < 1 ? 0 : timeStart + 60;

    if (waves.length >= 1 || offset) timeStart = timeStart + stage;
    const BotPreset = getDifficulty(difficulty);
    // console.log(wildSpawnType, BotPreset);
    // Math.round((1 - waves.length / totalWaves) * maxSlots) || 1;
    let slotMax = Math.round(
      (moreGroups ? Math.random() : Math.random() * Math.random()) * maxSlots
    );

    if (slotMax < 1) slotMax = 1;
    let slotMin = (Math.round(Math.random() * slotMax) || 1) - 1;

    if (wildSpawnType === "marksman" && slotMin < 1) slotMin = 1;
    waves.push({
      BotPreset,
      BotSide: getBotSide(wildSpawnType),
      SpawnPoints: getZone(
        specialZones,
        combinedZones,
        waves.length >= totalWaves
      ),
      isPlayers: isPlayer,
      slots_max: slotMax,
      slots_min: slotMin,
      time_min: min,
      time_max: max,
      WildSpawnType: wildSpawnType as WildSpawnType,
      number: waves.length,
      sptId: wildSpawnType + waves.length,
      SpawnMode: ["regular", "pve"],
    });
    maxSlotsReached -= slotMax;
    // if (wildSpawnType === "assault") console.log(slotMax, maxSlotsReached);
    if (maxSlotsReached <= 0) break;
  }
  // console.log(waves.map(({ slots_min }) => slots_min));
  return waves;
};

const getZone = (specialZones, combinedZones, specialOnly) => {
  if (!specialOnly && combinedZones.length)
    return combinedZones[
      Math.round((combinedZones.length - 1) * Math.random())
    ];
  if (specialZones.length) return specialZones.pop();
  return "";
};

export enum BotDifficultyType {
  SCAV, PMC, BOSS, SNIPER, ROGUE, RAIDER, RANDOM, BOSS_ESCORT
}

export const getDifficultyTypeForBossName = (bossName: string): BotDifficultyType => {

  switch (bossName) {
    case "exUsec": return BotDifficultyType.ROGUE;
    case "pmcBot": return BotDifficultyType.RAIDER;
  }

  if (mainBossNameList.includes(bossName)) {
    return BotDifficultyType.BOSS;
  }

  if (bossName.startsWith("follower")) {
    return BotDifficultyType.BOSS_ESCORT;
  }

  // TODO other types
  return BotDifficultyType.RANDOM;
}

export const getEscortDifficultyType = (botDifficultyType: BotDifficultyType): BotDifficultyType => {
  switch (botDifficultyType) {
    case BotDifficultyType.BOSS: return BotDifficultyType.BOSS_ESCORT;
    case BotDifficultyType.BOSS_ESCORT: return BotDifficultyType.BOSS_ESCORT;
    case BotDifficultyType.ROGUE: return BotDifficultyType.ROGUE;
    case BotDifficultyType.RAIDER: return BotDifficultyType.RAIDER;
    case BotDifficultyType.SCAV: return BotDifficultyType.SCAV;
    case BotDifficultyType.PMC: return BotDifficultyType.PMC;
    case BotDifficultyType.SNIPER: return BotDifficultyType.SNIPER;
    default: return BotDifficultyType.RANDOM;
  }
}

export type Difficulty = "easy" | "normal" | "hard" | "impossible";

// TODO: make this matrix a configurable .json
const botDifficultyWeights: Record<BotDifficultyType, { difficulty: Difficulty; weight: number }[]> = {
  [BotDifficultyType.SCAV]: [
    { difficulty: "easy", weight: 0.20 },
    { difficulty: "normal", weight: 0.50 },
    { difficulty: "hard", weight: 0.20 },
    { difficulty: "impossible", weight: 0.10 }
  ],
  [BotDifficultyType.PMC]: [
    { difficulty: "easy", weight: 0.10 },
    { difficulty: "normal", weight: 0.20 },
    { difficulty: "hard", weight: 0.45 },
    { difficulty: "impossible", weight: 0.25 }
  ],
  [BotDifficultyType.BOSS]: [
    { difficulty: "easy", weight: 0 },
    { difficulty: "normal", weight: 0.20 },
    { difficulty: "hard", weight: 0.40 },
    { difficulty: "impossible", weight: 0.40 }
  ],
  [BotDifficultyType.BOSS_ESCORT]: [
    { difficulty: "easy", weight: 0.05 },
    { difficulty: "normal", weight: 0.20 },
    { difficulty: "hard", weight: 0.50 },
    { difficulty: "impossible", weight: 0.25 }
  ],
  [BotDifficultyType.SNIPER]: [
    { difficulty: "easy", weight: 0.15 },
    { difficulty: "normal", weight: 0.15 },
    { difficulty: "hard", weight: 0.50 },
    { difficulty: "impossible", weight: 0.20 }
  ],
  [BotDifficultyType.ROGUE]: [
    { difficulty: "easy", weight: 0.05 },
    { difficulty: "normal", weight: 0.20 },
    { difficulty: "hard", weight: 0.50 },
    { difficulty: "impossible", weight: 0.25 }
  ],
  [BotDifficultyType.RAIDER]: [
    { difficulty: "easy", weight: 0.05 },
    { difficulty: "normal", weight: 0.20 },
    { difficulty: "hard", weight: 0.50 },
    { difficulty: "impossible", weight: 0.25 }
  ],
  [BotDifficultyType.RANDOM]: [
    { difficulty: "easy", weight: 0.25 },
    { difficulty: "normal", weight: 0.40 },
    { difficulty: "hard", weight: 0.25 },
    { difficulty: "impossible", weight: 0.1 }
  ]
};

const weightedRandomSelect = (weights: { difficulty: Difficulty; weight: number }[]): Difficulty => {
  const rand = Math.random();
  let cumulative = 0;

  for (const item of weights) {
    cumulative += item.weight;
    if (rand < cumulative) {
      return item.difficulty;
    }
  }

  // In case of floating point issues, return last difficulty
  return weights[weights.length - 1].difficulty;
}

export const getDifficulty = (botDifficultyType: BotDifficultyType): Difficulty => {
  const weights = botDifficultyWeights[botDifficultyType];
  const difficulty = weightedRandomSelect(weights);
  // if (_config.debug) {
  //   console.log(`[MOAR DEBUG]: Difficulty: ${difficulty} for type ${BotDifficultyType[botDifficultyType]}`);
  // }
  return difficulty;
};


export const shuffle = <n>(array: any): n => {
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
};

const getBotSide = (
  spawnType: "marksman" | "assault" | "pmcBEAR" | "pmcUSEC"
) => {
  switch (spawnType) {
    case "pmcBEAR":
      return "Bear";
    case "pmcUSEC":
      return "Usec";
    default:
      return "Savage";
  }
};

export const buildBossBasedWave = (
  BossChance: number,
  BossEscortAmount: string,
  BossEscortType: string,
  BossName: string,
  BossZone: string,
  difficultyType: BotDifficultyType,
  raidTime?: number
): IBossLocationSpawn => {

  const difficulty = getDifficulty(difficultyType);
  return {
    BossChance,
    BossDifficult: difficulty,
    BossEscortAmount,
    BossEscortDifficult: difficulty,
    BossEscortType,
    BossName,
    BossPlayer: false,
    BossZone,
    Delay: 0,
    ForceSpawn: false,
    IgnoreMaxBots: true,
    RandomTimeSpawn: false,
    Time: raidTime ? Math.round(Math.random() * (raidTime * 5)) : -1,
    Supports: null,
    TriggerId: "",
    TriggerName: "",
    SpawnMode: ["regular", "pve"],
  };
};

export const zombieTypes = [
  "infectedassault",
  "infectedpmc",
  "infectedlaborant",
  "infectedcivil",
];

export const zombieTypesCaps = [
  "infectedAssault",
  "infectedPmc",
  "infectedLaborant",
  "infectedCivil",
];

export const getRandomDifficulty = () => getDifficulty(BotDifficultyType.RANDOM);
export const getRandomZombieType = () => zombieTypesCaps[Math.round((zombieTypesCaps.length - 1) * Math.random())];


export const buildBotWaves = (
  botTotal: number,
  escapeTimeLimit: number,
  maxGroup: number,
  groupChance: number,
  bossZones: string[],
  difficulty: BotDifficultyType,
  botType: string,
  ForceSpawn: boolean,
  botDistribution: number,
  spawnDelay = 0
): IBossLocationSpawn[] => {
  if (!botTotal) return [];
  const pushToEnd = botDistribution > 1;
  const pullFromEnd = botDistribution < 1;
  const botToZoneTotal = bossZones.length / botTotal;
  const isMarksman = botType === "marksman";
  const isPMC = botType === "pmcUSEC" || botType === "pmcBEAR";

  let startTime = pushToEnd
    ? Math.round((botDistribution - 1) * escapeTimeLimit)
    : spawnDelay;

  escapeTimeLimit = pullFromEnd
    ? Math.round(escapeTimeLimit * botDistribution)
    : Math.round(escapeTimeLimit - startTime);

  const averageTime = Math.round(escapeTimeLimit / botTotal);

  const waves: IBossLocationSpawn[] = [];
  let maxSlotsReached = botTotal;
  if (maxGroup < 1) maxGroup = 1;
  while (botTotal > 0) {
    const allowGroup = groupChance > Math.random();
    let bossEscortAmount = allowGroup
      ? Math.round(maxGroup * Math.random())
      : 0;

    if (
      bossEscortAmount < 0 ||
      (bossEscortAmount > 0 && bossEscortAmount + 1 > maxSlotsReached)
    ) {
      bossEscortAmount = 0;
    }

    const totalCountThisWave = isMarksman ? 1 : bossEscortAmount + 1;
    const totalCountThusFar = botTotal - maxSlotsReached;
    const BossDifficult = getDifficulty(difficulty);

    waves.push({
      BossChance: 100,
      BossDifficult,
      BossEscortAmount: bossEscortAmount.toString(),
      BossEscortDifficult: BossDifficult,
      BossEscortType: botType,
      BossName: botType,
      BossPlayer: false,
      BossZone: bossZones[Math.floor(totalCountThusFar * botToZoneTotal)] || "",
      ForceSpawn,
      IgnoreMaxBots: ForceSpawn,
      RandomTimeSpawn: false,
      Time: startTime,
      Supports: null,
      TriggerId: "",
      TriggerName: "",
      SpawnMode: isPMC ? ["pve"] : ["regular", "pve"],
    });

    startTime += Math.round(totalCountThisWave * averageTime);

    maxSlotsReached -= 1 + (isMarksman ? 0 : bossEscortAmount);
    if (maxSlotsReached <= 0) break;
  }
  // isMarksman &&
  //   console.log(
  //     // bossZones,
  //     botType,
  //     bossZones.length,
  //     waves.map(({ Time, BossZone }) => ({ Time, BossZone }))
  //   );
  return waves;
};

export const buildZombie = (
  botTotal: number,
  escapeTimeLimit: number,
  botDistribution: number,
  BossChance = 100
): IBossLocationSpawn[] => {
  if (!botTotal) return [];
  const pushToEnd = botDistribution > 1;
  const pullFromEnd = botDistribution < 1;

  let startTime = pushToEnd
    ? Math.round((botDistribution - 1) * escapeTimeLimit)
    : 0;

  escapeTimeLimit = pullFromEnd
    ? Math.round(escapeTimeLimit * botDistribution)
    : Math.round(escapeTimeLimit - startTime);

  const averageTime = Math.round(escapeTimeLimit / botTotal);

  const waves: IBossLocationSpawn[] = [];
  let maxSlotsReached = botTotal;

  while (botTotal > 0) {
    const allowGroup = 0.2 > Math.random();
    let bossEscortAmount = allowGroup ? Math.round(4 * Math.random()) : 0;

    if (bossEscortAmount < 0) bossEscortAmount = 0;

    const totalCountThisWave = bossEscortAmount + 1;

    const main = getRandomZombieType();
    waves.push({
      BossChance,
      BossDifficult: "normal",
      BossEscortAmount: "0",
      BossEscortDifficult: "normal",
      BossEscortType: main,
      BossName: main,
      BossPlayer: false,
      BossZone: "",
      Delay: 0,
      IgnoreMaxBots: false,
      RandomTimeSpawn: false,
      Time: startTime,
      Supports: new Array(bossEscortAmount).fill("").map(() => ({
        BossEscortType: getRandomZombieType(),
        BossEscortDifficult: ["normal"],
        BossEscortAmount: "1",
      })),
      TriggerId: "",
      TriggerName: "",
      SpawnMode: ["regular", "pve"],
    });

    startTime += Math.round(totalCountThisWave * averageTime);

    maxSlotsReached -= 1 + bossEscortAmount;
    if (maxSlotsReached <= 0) break;
  }
  // console.log(waves)
  return waves;
};

export interface MapSettings {
  sniperQuantity?: number;
  initialSpawnDelay: number;
  smoothingDistribution: number;
  mapCullingNearPointValuePlayer: number;
  mapCullingNearPointValuePmc: number;
  mapCullingNearPointValueScav: number;
  spawnMinDistance: number;
  EscapeTimeLimit?: number;
  maxBotPerZoneOverride?: number;
  maxBotCapOverride?: number;
  pmcHotZones?: string[];
  scavHotZones?: string[];
  pmcWaveCount: number;
  scavWaveCount: number;
  zombieWaveCount: number;
}

export const getHealthBodyPartsByPercentage = (num: number) => {
  const num35 = Math.round(35 * num);
  const num100 = Math.round(100 * num);
  const num70 = Math.round(70 * num);
  const num80 = Math.round(80 * num);
  return {
    Head: {
      min: num35,
      max: num35,
    },
    Chest: {
      min: num100,
      max: num100,
    },
    Stomach: {
      min: num100,
      max: num100,
    },
    LeftArm: {
      min: num70,
      max: num70,
    },
    RightArm: {
      min: num70,
      max: num70,
    },
    LeftLeg: {
      min: num80,
      max: num80,
    },
    RightLeg: {
      min: num80,
      max: num80,
    },
  };
};

export interface MapConfigType {
  spawnMinDistance: number;
  pmcWaveCount: number;
  scavWaveCount: number;
  zombieWaveCount?: number;
  scavHotZones?: string[];
  pmcHotZones?: string[];
  EscapeTimeLimitOverride?: number;
  mapCullingNearPointValuePlayer: number;
  mapCullingNearPointValuePmc: number;
  mapCullingNearPointValueScav: number;
}

export const setEscapeTimeOverrides = (
  locationList: ILocation[],
  mapConfig: Record<string, MapConfigType>,
  logger: ILogger,
  config: typeof _config
) => {
  for (let index = 0; index < locationList.length; index++) {
    const mapSettingsList = Object.keys(mapConfig) as Array<
      keyof typeof mapConfig
    >;

    const map = mapSettingsList[index];
    const override = mapConfig[map].EscapeTimeLimitOverride;
    const hardcodedEscapeLimitMax = 5;

    if (
      !override &&
      locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map] >
      hardcodedEscapeLimitMax
    ) {
      const maxLimit = defaultEscapeTimes[map] * hardcodedEscapeLimitMax;
      logger.warning(
        `[MOAR] EscapeTimeLimit set too high on ${map}\nEscapeTimeLimit changed from ${locationList[index].base.EscapeTimeLimit} => ${maxLimit}\n`
      );
      locationList[index].base.EscapeTimeLimit = maxLimit;
    }

    if (override && locationList[index].base.EscapeTimeLimit !== override) {
      console.log(
        `[Moar] Set ${map}'s Escape time limit to ${override} from ${locationList[index].base.EscapeTimeLimit}\n`
      );
      locationList[index].base.EscapeTimeLimit = override;
      locationList[index].base.EscapeTimeLimitCoop = override;
      locationList[index].base.EscapeTimeLimitPVE = override;
    }

    if (
      config.startingPmcs &&
      locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map] > 2
    ) {
      logger.warning(
        `[MOAR] Average EscapeTimeLimit is too high (greater than 2x) to enable starting PMCS\nStarting PMCS has been turned off to prevent performance issues.\n`
      );
      config.startingPmcs = false;
    }
  }
};

export const getRandomInArray = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const enforceSmoothing = (locationList: ILocation[]) => {
  for (let index = 0; index < locationList.length; index++) {
    const waves = locationList[index].base.BossLocationSpawn;

    const Bosses: IBossLocationSpawn[] = [];
    let notBosses: IBossLocationSpawn[] = [];

    const notBossesSet = new Set([
      "infectedLaborant",
      "infectedAssault",
      "infectedCivil",
      WildSpawnType.ASSAULT,
      WildSpawnType.MARKSMAN,
      "pmcBEAR",
      "pmcUSEC",
    ]);

    for (const wave of waves) {
      if (notBossesSet.has(wave.BossName)) {
        notBosses.push(wave);
      } else {
        Bosses.push(wave);
      }
    }

    let first = Infinity,
      last = -Infinity;

    notBosses.forEach((notBoss) => {
      first = Math.min(notBoss.Time, first);
      last = Math.max(notBoss.Time, last);
    });

    if (first < 15) first = 15;

    notBosses = notBosses.sort((a, b) => a.Time - b.Time);

    // console.log(notBosses.map(({ Time }) => Time))

    let start = first;
    const smoothingDistribution = (mapConfig[configLocations[index]] as any)
      .smoothingDistribution as number;

    const increment =
      (Math.round((last - first) / notBosses.length) * 2) * smoothingDistribution;

    for (let index = 0; index < notBosses.length; index++) {
      const ratio = (index + 1) / notBosses.length;
      // console.log(ratio);
      notBosses[index].Time = start;
      let inc = Math.round(increment * ratio);
      if (inc < 10) inc = 5;
      start += inc;
    }

    // console.log(
    //   configLocations[index],
    //   last,
    //   notBosses.map(({ Time, BossName }) => ({ BossName, Time }))
    // );

    locationList[index].base.BossLocationSpawn = [...Bosses, ...notBosses];
  }
};

export const looselyShuffle = <T>(arr: T[], shuffleStep = 3): T[] => {
  const n = arr.length;
  const halfN = Math.floor(n / 2);
  for (let i = shuffleStep - 1; i < halfN; i += shuffleStep) {
    // Pick a random index from the second half of the array to swap with the current index
    const randomIndex = halfN + Math.floor(Math.random() * (n - halfN));
    // Swap the elements at the current index and the random index
    const temp = arr[i];
    arr[i] = arr[randomIndex];
    arr[randomIndex] = temp;
  }

  return arr;
};