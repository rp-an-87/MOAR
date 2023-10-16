import { cloneDeep } from './utils';
import { BotGenerationCacheService } from '@spt-aki/services/BotGenerationCacheService';
import { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import { DependencyContainer } from 'tsyringe';
import BotGen from './BotGen';
import { globalValues } from './GlobalValues';
import { DatabaseServer } from '@spt-aki/servers/DatabaseServer';
import { makeDifficultyChanges } from './difficultyUtils';

export const BotDBChanges = (
    container: DependencyContainer
): undefined => {
    const database = container.resolve<DatabaseServer>("DatabaseServer").getTables();
    globalValues.database = database
    globalValues.baseAI = cloneDeep(database.bots.types.pmcbot.difficulty.hard);

    makeDifficultyChanges()
    globalValues.config.debug && console.log("Algorthimic Difficulty:  DB changes completed")
}

export const BotRoutersAndGen = (
    container: DependencyContainer
): undefined => {
    const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
    globalValues.Logger = container.resolve("WinstonLogger")
    globalValues.botGenerationCacheService = container.resolve<BotGenerationCacheService>("BotGenerationCacheService")
    // container.resolve<TimeAndWeatherSettings>("WeatherController")

    container.afterResolution("BotGenerationCacheService", (_t, result: BotGenerationCacheService) => {
        // globalValues.Logger.info(`POOP: BotGenerationCacheService calling LegendaryPlayer.getBot`);
        result.getBot = BotGen.getBot;
    }, { frequency: "Always" });

    globalValues.config.debug && console.log("Algorthimic Difficulty:  BotGenerationCacheService Registered")

    //Raid start
    staticRouterModService.registerStaticRouter(`StaticAkiGameStartAlgorithmicDifficulty`, [{
        url: "/client/raid/configuration",
        action: (url, info, sessionId, output) => {
            globalValues.RaidStartTime = Date.now()
            globalValues.RaidMap = info.location.toLowerCase()
            globalValues.config.debug && globalValues.Logger.info(`Algorthimic Difficulty: RaidStartTime updated to: ${globalValues.RaidStartTime} ${globalValues.RaidMap}`)
            return output
        }
    }], "aki");

    globalValues.config.debug && console.log("Algorthimic Difficulty:  StaticAkiGameStartUpdater Registered")
}

// keyId: '',
// side: 'Pmc',
// location: 'factory4_day',
// timeVariant: 'CURR',
// raidMode: 'Local',
// metabolismDisabled: false,
// playersSpawnPlace: 'SamePlace',
// timeAndWeatherSettings: {
//   isRandomTime: false,
//   isRandomWeather: false,
//   cloudinessType: 'Clear',
//   rainType: 'NoRain',
//   windType: 'Light',
//   fogType: 'NoFog',
//   timeFlowType: 'x1',
//   hourOfDay: -1
// },
// botSettings: { isScavWars: false, botAmount: 'AsOnline' },
// wavesSettings: {
//   botAmount: 'AsOnline',
//   botDifficulty: 'AsOnline',
//   isBosses: true,
//   isTaggedAndCursed: false
// }