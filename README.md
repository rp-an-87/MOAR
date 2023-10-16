# **Dushaoan's MOAR - TheLastSpawnMod**

HUGE thanks to PreyToLive for his contributions to the modding community.

=== INSTALL STEPS ===

IF YOU ARE ON "akiVersion": "3.5.0" Update this package.json to the correct version!

1. Drag and drop this folder into the user/mods folder.
2. Update your mods/order.json so that MOAR is last on the list.
3. Optionally change your configuration (see below configuration options).

4. ???????

5. Profit!!!!

Example order.json with recommended mods:
{
"order": [
"ServerValueModifier",
"SPT-Realism-Mod",
"zPOOP",
"Lua-CustomSpawnPoints",
"Dushaoan-MOAR-1.0.0"
]
}

==== Configuration Options ====

> BotSpawnControl

// Enable or Disables the mod
enableMod: true,

// How difficult you want scav AI, values 0 - 1.5, recommended 0.5.
"scavDifficulty": 0.3,

// How difficult you want pmc AI, values 0 - 1.5, recommended 0.5.
"pmcDifficulty": 0.3,

// How difficult you want sniper AI, values 0 - 1.5, recommended 1.
"sniperDifficulty": 1,

// Default 0.5 for scav, 0.9 for PMC, valid numbers 0 to 1
// 0.7 would be 70% of all waves in the first half of the game, 30% in the last half.
// 0.1 would be 10% of all waves in the first half of the game, 90% in the last half.
"defaultScavStartWaveRatio": 0.5,
"defaultPmcStartWaveRatio": 0.9,

//This multiplies the number of waves, I'd suggest playing with this for balance
"defaultScavWaveMultiplier": 0.7,
"defaultPmcWaveMultiplier": 0.5,

// To turn off, change this to false, 25 is recommended. Vanilla ranges per map.
// This is the max spawned bots allowed at one time
defaultMaxBotCap: 25,

// The max groupsize for PMC or Scav waves.
"defaultGroupMaxPMC":4,
"defaultGroupMaxScav":3,

// Increase this to increase bot spawns, use this with BotWaveMultiplier for balance.
defaultAdditionalBotsPerWave: 0,

// Set to false to turn off, recommended 5 for most maps.
defaultMaxBotPerZone: 5,

// This gives snipers a chance to spawn with a buddy
sniperBuddies: false,

> Zone Changes

// This makes it so that certain spawn zones can be used by scavs at the beginning of the game, instead of having to wait for them to unlock. Think SniperZones.
noZoneDelay: false,

// Recommended to have this set to true.
// Similar to the above, but allows for a bit more gradual release of certain zones.
reducedZoneDelay: true,

// This just adds a few more zones for scavs to spawn (all of the named ones in fact, including added ones via mods)
allOpenZones: true,

> Pmc Spawn Control

// Just SHUT UP (Feels much more like vanilla)
preventPMCChatter: true,

// Yup, again going for that vanilla feel.
pmcsAlwaysHostile: true,

//AI Pmcs have the Edge of Darkness edition badging
"pmcsHaveEOD":true,

// Gives a chance to spawn a single group of raiders somewhere on the map
"randomRaiderGroup": false,

//Controls the above chance
"randomRaiderGroupChance": 10,

// Gives a chance to spawn a single group of rogues somewhere on the map
"randomRogueGroup": false,

//Controls the above chance
"randomRogueGroupChance": 10,

> Boss settings

// Disables all bosses, ALL OF THEM.
disableBosses: false,

// Makes it so that the Main boss of a map can spawn anywhere (not Knight, or Zyrachi)
bossOpenZones: true,

// Gives the main boss, which may be effected by bossOpenZones, an additional chance added to their default spawn amount.
// This works whether bossOpenZones is on or not.
"mainBossChanceBuff": 15,

> Invasion

//All bosses ("bossBully", "bossTagilla", "bossGluhar", "bossKilla", "bossKojaniy", "bossSanitar") can spawn anywhere, on any map.
bossInvasion: false,

// This overrides the above bosses spawn chances if set. (false to disable)
// Otherwise bosses will have their default spawn chances. Recommended setting 5
bossInvasionSpawnOverride: 5,

// This spaces out bossInvasion spawning a bit, so that not all bosses will spawn at the beginning of the raid. Recommended: enabled
gradualBossInvasion: true,

The "mapSettings" are basically just overrides, and allow for map specific settings.

This is for places like factory or labs for example.

To turn them on, one needs to remove add the reference from the mapSettingsExample.json!

"mapSettings": {
"customs": {  
​ // The following are optional per map.
"EscapeTimeLimit": 40,

      "scavWaveMultiplier": 1,

      "scavWaveStartRatio": 0.5,

      "scavWaveCount": 20,

      "pmcWaveStartRatio": 0.9,

      "pmcWaveMultiplier": 1,

      "pmcCount": 12,

      "maxBotCap": 13,

      "maxBotPerZone": 4,

      // This defineds zones that should generally have more action for SCAVS (POI)
      //  Note: repeated values continue to add more bots to said zone (within zone allowable limits, see maxBotPerZone)
       "scavSpecialZones": [
        "ZoneDormitory"
      ],

      // This defineds zones that should generally have more action for PMC's (POI)
      //  Note: repeated values continue to add more bots to said zone (within zone allowable limits, see maxBotPerZone)
      "pmcSpecialZones": [
        "ZoneDormitory"
      ],

      "defaultBossSettings": {
        // Boss values are only applied to default/existing bosses, look at the default config to know which you can change!​
        "bossKnight": {
          "BossChance": 18
        },

        "bossBully": {
          "BossChance": 15
        },

        "sectantPriest": {
          "BossChance": 6
        }
      }
    },
