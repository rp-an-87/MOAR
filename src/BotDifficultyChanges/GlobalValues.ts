import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { IBotBase } from "@spt-aki/models/eft/common/tables/IBotBase";
import { BotGenerationCacheService } from "@spt-aki/services/BotGenerationCacheService"
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import config from "../../config/difficultyConfig.json"
import difficultyConfig from "./difficulty.json"

export type Role = {
    Role: string;
    BotDifficulty: "easy" | "normal" | "hard" | "impossible"
}
export class globalValues {
    public static Logger: ILogger;
    public static database: IDatabaseTables;
    public static baseAI: IBotBase;
    public static config = config
    public static difficultyConfig = difficultyConfig
    public static botGenerationCacheService: BotGenerationCacheService;
    public static RaidStartTime: number
    public static RaidMap: "bigmap" | "develop" | "factory4_day" | "factory4_night" | "hideout" | "interchange" | "laboratory" | "lighthouse" | "privatearea" | "rezervbase" | "shoreline" | "suburbs" | "tarkovstreets" | "terminal" | "town" | "woods"

    public static scavAlternates = [...difficultyConfig.bots.midLevelAIs, ...difficultyConfig.bots.highLevelAIs]
    public static pmcAlternates = [...difficultyConfig.bots.highLevelAIs, ...difficultyConfig.bots.bossLevelAIs]
    public static marksmanAlternates = ["followergluharsnipe", "followerbirdeye", "bosskojaniy"]
    public static assaultRoleList: Role[] = [
        {
            Role: "assault",
            BotDifficulty: "easy"
        },
        {
            Role: "assault",
            BotDifficulty: "normal"
        },
        {
            Role: "assault",
            BotDifficulty: "hard"
        },
        {
            Role: "cursedAssault",
            BotDifficulty: "easy"
        },
        {
            Role: "assault",
            BotDifficulty: "impossible"
        },
        {
            Role: "cursedAssault",
            BotDifficulty: "normal"
        },
        {
            Role: "cursedAssault",
            BotDifficulty: "hard"
        },
        {
            Role: "cursedAssault",
            BotDifficulty: "impossible"
        }
    ]

    public static bearRoleList: Role[] = [
        {
            Role: "pmcBot",
            BotDifficulty: "easy"
        },
        {
            Role: "pmcBot",
            BotDifficulty: "normal"
        },
        {
            Role: "pmcBot",
            BotDifficulty: "hard"
        },
        {
            Role: "sptbear",
            BotDifficulty: "easy"
        },
        {
            Role: "pmcBot",
            BotDifficulty: "impossible"
        },
        {
            Role: "sptbear",
            BotDifficulty: "normal"
        },
        {
            Role: "sptbear",
            BotDifficulty: "hard"
        },
        {
            Role: "sptbear",
            BotDifficulty: "impossible"
        }
    ]

    public static usecRoleList: Role[] = [
        {
            Role: "pmcBot",
            BotDifficulty: "easy"
        },
        {
            Role: "pmcBot",
            BotDifficulty: "normal"
        },
        {
            Role: "pmcBot",
            BotDifficulty: "hard"
        },
        {
            Role: "sptusec",
            BotDifficulty: "easy"
        },
        {
            Role: "pmcBot",
            BotDifficulty: "impossible"
        },
        {
            Role: "sptusec",
            BotDifficulty: "normal"
        },
        {
            Role: "sptusec",
            BotDifficulty: "hard"
        },
        {
            Role: "sptusec",
            BotDifficulty: "impossible"
        }
    ]

    public static roleCase: object = {
        "arenafighterevent": "arenaFighterEvent",
        "assault": "assault",
        "exusec": "exUsec",
        "marksman": "marksman",
        "pmcbot": "pmcBot",
        "sectantpriest": "sectantPriest",
        "sectantwarrior": "sectantWarrior",
        "assaultgroup": "assaultGroup",
        "bossbully": "bossBully",
        "bosstagilla": "bossTagilla",
        "bossgluhar": "bossGluhar",
        "bosskilla": "bossKilla",
        "bosskojaniy": "bossKojaniy",
        "bosssanitar": "bossSanitar",
        "followerbully": "followerBully",
        "followergluharassault": "followerGluharAssault",
        "followergluharscout": "followerGluharScout",
        "followergluharsecurity": "followerGluharSecurity",
        "followergluharsnipe": "followerGluharSnipe",
        "followerkojaniy": "followerKojaniy",
        "followersanitar": "followerSanitar",
        "followertagilla": "followerTagilla",
        "cursedassault": "cursedAssault",
        "usec": "sptusec",
        "bear": "sptbear",
        "bosstest": "bossTest",
        "followertest": "followerTest",
        "gifter": "gifter",
        "bossknight": "bossKnight",
        "followerbigpipe": "followerBigPipe",
        "followerbirdeye": "followerBirdEye",
        "test": "test",
        "bosszryachiy": "bossZryachiy",
        "followerzryachiy": "followerZryachiy"
    }
}