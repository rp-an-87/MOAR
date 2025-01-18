import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { configLocations, originalMapList } from "../Spawning/constants";
import { DependencyContainer } from "tsyringe";
import mapConfig from "../../config/mapConfig.json";
import { ILocationBase, ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";
import { cleanClosest } from "../Spawning/spawnZoneUtils";
import { shuffle } from "../Spawning/utils";

export const setupSpawns = (container: DependencyContainer) => {
    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const { locations } = databaseServer.getTables();


    const indexedMapSpawns: Record<number, ISpawnPointParam[]> = {}

    originalMapList.forEach((map, mapIndex) => {

        const limit = mapConfig[configLocations[mapIndex]].spawnMinDistance

        locations[map].base.SpawnPointParams.forEach(
            (
                {
                    ColliderParams,
                    Categories
                }: ISpawnPointParam,
                innerIndex: number
            ) => {
                if (
                    !Categories.includes("Boss") &&
                    ColliderParams?._props?.Radius !== undefined &&
                    ColliderParams?._props?.Radius < limit
                ) {
                    locations[map].base.SpawnPointParams[
                        innerIndex
                    ].ColliderParams._props.Radius = limit;
                }
            })

        let bossSpawnSpawns: ISpawnPointParam[] = [];
        let nonBossSpawns: ISpawnPointParam[] = [];
        let sniperSpawnSpawnPoints: ISpawnPointParam[] = [];
        let playerSpawns: ISpawnPointParam[] = [];

        locations[map].base.SpawnPointParams.forEach((point) => {
            switch (true) {
                case point.Categories.includes("Boss"):
                    bossSpawnSpawns.push(point);
                    break;
                case point.BotZoneName?.toLowerCase().includes("snipe") ||
                    point.DelayToCanSpawnSec > 40:
                    sniperSpawnSpawnPoints.push(point);
                    break;
                case point.Categories.includes("Coop") &&
                    !!point.Infiltration:
                    playerSpawns.push(point);
                    break;

                default:
                    nonBossSpawns.push(point);
                    break;
            }
        });

        bossSpawnSpawns = bossSpawnSpawns.map((point, index) =>
        ({
            ...point,
            BotZoneName: !point.BotZoneName ?
                "boss_" + index
                : point.BotZoneName
        }))

        playerSpawns = playerSpawns.
            map((point, index) => ({
                ...point,
                BotZoneName: "player_" + index,
                Categories: ['Player', 'Coop', 'Opposite', 'Group'],
                Sides: ["Pmc"],
                DelayToCanSpawnSec: 1
            }))

        nonBossSpawns = cleanClosest(nonBossSpawns.
            map((point, index) =>
            ({
                ...point,
                BotZoneName: point?.BotZoneName ? point.BotZoneName : "open_" + index,
                Categories: ['Bot'],
                Sides: ["Savage"],
                DelayToCanSpawnSec: 1
            })), configLocations[mapIndex])

        sniperSpawnSpawnPoints = sniperSpawnSpawnPoints.map((point, index) =>
            ({ ...point, BotZoneName: "sniper_" + index, DelayToCanSpawnSec: 1 }))

        // console.log(playerSpawns)
        // console.log(map,
        //     bossSpawnSpawns.length,
        //     playerSpawns.length,
        //     nonBossSpawns.length,
        //     sniperSpawnSpawnPoints.length,
        // )

        locations[map].base.OpenZones = ""

        indexedMapSpawns[mapIndex] = shuffle<ISpawnPointParam[]>([
            ...bossSpawnSpawns,
            ...nonBossSpawns,
            ...sniperSpawnSpawnPoints,
            ...playerSpawns
        ])

        locations[map].base.SpawnPointParams = []
    })

    globalValues.indexedMapSpawns = indexedMapSpawns
}