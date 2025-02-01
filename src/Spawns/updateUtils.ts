import { Ixyz } from "@spt/models/eft/common/Ixyz";
import getSortedSpawnPointList, {
  getDistance,
} from "../Spawning/spawnZoneUtils";

const fs = require("fs");
const path = require("path");
const currentDirectory = process.cwd();
// Function to update JSON file
export const updateJsonFile = <T>(
  filePath: string,
  callback: (jsonData) => void,
  successMessage: string
) => {
  // Read the JSON file
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    // Parse the JSON data
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (parseError) {
      console.error("Error parsing JSON data:", parseError);
      return;
    }

    callback(jsonData);

    // Update the JSON object

    // Write the updated JSON object back to the file
    fs.writeFile(
      filePath,
      JSON.stringify(jsonData, null, 2),
      "utf8",
      (writeError) => {
        if (writeError) {
          console.error("Error writing the file:", writeError);
          return;
        }

        console.log(successMessage);
      }
    );
  });
};

export const updateBotSpawn = (map: string, value: Ixyz) => {
  map = map.toLowerCase();
  updateJsonFile<Ixyz>(
    currentDirectory + "/user/mods/DewardianDev-MOAR/src/Spawns/botSpawns.json",
    (jsonData) => {
      value.y = value.y + 0.5;
      if (jsonData[map]) {
        jsonData[map].push(value);
      } else {
        jsonData[map] = [value];
      }
    },
    "Successfully added one bot spawn to " + map
  );
};

export const deleteBotSpawn = (map: string, value: Ixyz) => {
  map = map.toLowerCase();
  updateJsonFile<Ixyz>(
    currentDirectory + "/user/mods/DewardianDev-MOAR/src/Spawns/botSpawns.json",
    (jsonData) => {
      if (jsonData[map]) {
        const { x: X, y: Y, z: Z } = value;
        let nearest = undefined;
        let nearDist = Infinity;
        jsonData[map].forEach(({ x, y, z }, index) => {
          const dist = getDistance(x, y, z, X, Y, Z);
          if (dist < nearDist) {
            nearest = index;
            nearDist = dist;
          }
        });

        if (nearest) {
          (jsonData[map] as Ixyz[]).splice(nearest, 1);
        } else {
          console.log("No nearest spawn on " + map);
        }
      }
    },
    "Successfully removed one bot spawn from "
  );
};

export const updatePlayerSpawn = (map: string, value: Ixyz) => {
  map = map.toLowerCase();
  updateJsonFile<Ixyz>(
    currentDirectory +
      "/user/mods/DewardianDev-MOAR/src/Spawns/playerSpawns.json",
    (jsonData) => {
      value.y = value.y + 0.5;
      if (jsonData[map]) {
        jsonData[map].push(value);
      } else {
        jsonData[map] = [value];
      }
    },
    "Successfully added one player spawn to " + map
  );
};

export const updateAllBotSpawns = (values: Record<string, Ixyz[]>) =>
  updateJsonFile<Ixyz>(
    currentDirectory + "/user/mods/DewardianDev-MOAR/src/Spawns/botSpawns.json",
    (jsonData) => {
      Object.keys(jsonData).forEach((map) => (jsonData[map] = values[map]));
    },
    "Successfully updated all Spawns"
  );
