/* eslint-disable @typescript-eslint/indent */
export const defaultHostility = [
  {
    AlwaysEnemies: [
      "bossTest",
      "followerTest",
      "bossKilla",
      "bossKojaniy",
      "followerKojaniy",
      "cursedAssault",
      "bossGluhar",
      "followerGluharAssault",
      "followerGluharSecurity",
      "followerGluharScout",
      "followerGluharSnipe",
      "followerSanitar",
      "bossSanitar",
      "test",
      "assaultGroup",
      "sectantWarrior",
      "sectantPriest",
      "bossTagilla",
      "followerTagilla",
      "bossKnight",
      "followerBigPipe",
      "followerBirdEye",
      "bossBoar",
      "followerBoar",
      "arenaFighter",
      "arenaFighterEvent",
      "bossBoarSniper",
      "crazyAssaultEvent",
      "sectactPriestEvent",
      "followerBoarClose1",
      "followerBoarClose2",
      "bossKolontay",
      "followerKolontayAssault",
      "followerKolontaySecurity",
      "bossPartisan",
      "spiritWinter",
      "spiritSpring",
      "peacemaker",
      "skier",
      "assault",
      "marksman",
      "pmcUSEC",
      "exUsec",
      "pmcBot",
      "bossBully",
    ],
    AlwaysFriends: [
      "bossZryachiy",
      "followerZryachiy",
      "peacefullZryachiyEvent",
      "ravangeZryachiyEvent",
      "gifter",
    ],
    BearEnemyChance: 100,
    BearPlayerBehaviour: "AlwaysEnemies",
    BotRole: "pmcBEAR",
    ChancedEnemies: [],
    Neutral: ["shooterBTR"],
    SavagePlayerBehaviour: "AlwaysEnemies",
    UsecEnemyChance: 100,
    UsecPlayerBehaviour: "AlwaysEnemies",
    Warn: ["sectactPriestEvent"],
  },
  {
    AlwaysEnemies: [
      "bossTest",
      "followerTest",
      "bossKilla",
      "bossKojaniy",
      "followerKojaniy",
      "cursedAssault",
      "bossGluhar",
      "followerGluharAssault",
      "followerGluharSecurity",
      "followerGluharScout",
      "followerGluharSnipe",
      "followerSanitar",
      "bossSanitar",
      "test",
      "assaultGroup",
      "sectantWarrior",
      "sectantPriest",
      "bossTagilla",
      "followerTagilla",
      "bossKnight",
      "followerBigPipe",
      "followerBirdEye",
      "bossBoar",
      "followerBoar",
      "arenaFighter",
      "arenaFighterEvent",
      "bossBoarSniper",
      "crazyAssaultEvent",
      "sectactPriestEvent",
      "followerBoarClose1",
      "followerBoarClose2",
      "bossKolontay",
      "followerKolontayAssault",
      "followerKolontaySecurity",
      "bossPartisan",
      "spiritWinter",
      "spiritSpring",
      "peacemaker",
      "skier",
      "marksman",
      "pmcBEAR",
      "assault",
      "exUsec",
      "pmcBot",
      "bossBully",
    ],
    AlwaysFriends: [
      "bossZryachiy",
      "followerZryachiy",
      "peacefullZryachiyEvent",
      "ravangeZryachiyEvent",
      "gifter",
    ],
    BearEnemyChance: 100,
    BearPlayerBehaviour: "AlwaysEnemies",
    BotRole: "pmcUSEC",
    ChancedEnemies: [],
    Neutral: ["shooterBTR"],
    SavagePlayerBehaviour: "AlwaysEnemies",
    UsecEnemyChance: 100,
    UsecPlayerBehaviour: "AlwaysEnemies",
    Warn: ["sectactPriestEvent"],
  },
];

export const configLocations = [
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

export const originalMapList = [
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

export const bossesToRemoveFromPool = new Set([
  "assault",
  "pmcBEAR",
  "pmcUSEC",
  "infectedAssault",
  "infectedTagilla",
  "infectedLaborant",
  "infectedCivil",
]);

export const mainBossNameList = [
  "bossKojaniy",
  "bossGluhar",
  "bossSanitar",
  "bossKilla",
  "bossTagilla",
  "bossKnight",
  "bossBoar",
  "bossKolontay",
  "bossPartisan",
  "bossBully",
];

export const defaultEscapeTimes = {
  customs: 40,
  factoryDay: 20,
  factoryNight: 25,
  interchange: 40,
  laboratory: 35,
  lighthouse: 40,
  rezervbase: 40,
  shoreline: 45,
  tarkovstreets: 50,
  woods: 40,
  gzLow: 35,
  gzHigh: 35,
};

export const bossPerformanceHash = {
  bossZryachiy: {
    BossChance: 50,
    BossEscortAmount: "0",
  },
  exUsec: {
    BossEscortAmount: "1",
    BossChance: 40,
  },
  bossBully: {
    BossEscortAmount: "2,2,3,3,4",
  },
  bossBoar: {
    BossEscortAmount: "1,2,2,2,3",
  },
  bossBoarSniper: {
    BossEscortAmount: "1",
  },
  bossKojaniy: {
    BossEscortAmount: "1,1,2,2,3",
  },
  bossPartisan: {
    TriggerId: "",
    TriggerName: "",
    RandomTimeSpawn: false,
    Time:120,
  },
  bossSanitar: {
    BossEscortAmount: "1,1,2,2,3",
  },
};

export interface BossConfig {
  zoneIds?: string;
  chance?: number;
  escortAmount?: string;
  time?: number;
}

export interface BossConfigByZone {
  zoneId: string;
  chance: number;
  triggerId?: string | "none";
  escortAmount?: string;
  time?: number;
}

export interface BossAdditionConfig {
  zoneIds: string;
  type: string;
  chance: number;
  triggerId?: string;
  escortAmount?: string;
  time?: number;
}
