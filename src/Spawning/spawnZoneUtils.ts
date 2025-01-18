import _config from "../../config/config.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { shuffle } from "./utils";
import mapConfig from "../../config/mapConfig.json"

const getDistance = (x: number, z: number, mX: number, mZ: number) => {
    const pA1 = x - mX;
    const pB2 = z - mZ;

    return Math.sqrt(pA1 * pA1 + pB2 * pB2);
};

export default function getSortedSpawnPointList(
    SpawnPointParams: ISpawnPointParam[],
    mX: number,
    mZ: number
): ISpawnPointParam[] {
    const sortedSpawnPoints = SpawnPointParams
        .sort((a, b) => {
            const a1 = getDistance(a.Position.x, a.Position.z, mX, mZ);
            const b1 = getDistance(b.Position.x, b.Position.z, mX, mZ);

            return a1 - b1;
        })

    return sortedSpawnPoints
}


export function cleanClosest(
    SpawnPointParams: ISpawnPointParam[], map: string
): ISpawnPointParam[] {

    const mapCullingNearPointValue = mapConfig[map as keyof typeof mapConfig].mapCullingNearPointValue
    const randomized = shuffle<ISpawnPointParam[]>(SpawnPointParams)

    const sortedSpawnPoints = SpawnPointParams.filter((point) => {
        // let similar = 0
        return randomized.every((val) => {
            if (val.BotZoneName === point.BotZoneName) return true
            const dist = getDistance(point.Position.x, point.Position.z, val.Position.x, val.Position.z)

            const result = dist > mapCullingNearPointValue
            // if (!result) {
            //     if (similar < 1) {
            //         similar++
            //         return true
            //     }
            //     else similar = 0
            //     return false
            // }

            return result
        })
    })

    _config.debug && console.log(map, "Reduced to " + Math.round(sortedSpawnPoints.length / randomized.length * 100) + "% of original spawns", randomized.length, ">", sortedSpawnPoints.length, "\n",)// high, low

    return sortedSpawnPoints
}

