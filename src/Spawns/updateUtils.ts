import { Ixyz } from "@spt/models/eft/common/Ixyz";

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


    callback(jsonData)

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
  map = map.toLowerCase()
  updateJsonFile<Ixyz>(
    currentDirectory + "/user/mods/DewardianDev-MOAR/src/Spawns/botSpawns.json",
    (jsonData) => {
      if (jsonData[map]) {
        jsonData[map].push(value)
      } else {
        jsonData[map] = [value];
      }
      return jsonData
    },
    "Successfully added one bot spawn to " + map
  )
};

export const updatePlayerSpawn = (map: string, value: Ixyz) => {
  map = map.toLowerCase()
  updateJsonFile<Ixyz>(
    currentDirectory +
    "/user/mods/DewardianDev-MOAR/src/Spawns/playerSpawns.json",
    (jsonData) => {
      if (jsonData[map]) {
        jsonData[map].push(value)
      } else {
        jsonData[map] = [value];
      }
      return jsonData
    },
    "Successfully added one player spawn to " + map
  );
}



export const updateAllBotSpawns = (values: Record<string, Ixyz[]>) =>
  updateJsonFile<Ixyz>(
    currentDirectory + "/user/mods/DewardianDev-MOAR/src/Spawns/botSpawns.json",
    (jsonData) => {
      Object.keys(jsonData).forEach(map =>
        jsonData[map] = values[map])
    },
    "Successfully updated all Spawns"
  )

