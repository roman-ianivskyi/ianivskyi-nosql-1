db = db.getSiblingDB( "spotify" );

// Завдання 1. Аналіз запиту та індексація

const explainBefore = db.tracks.find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");

print("Plan before");
printjson(explainBefore.executionStats);

db.tracks.createIndex({ 
  track_genre: 1, 
  popularity: -1, 
  "audio_features.danceability": 1 
});

const explainAfter = db.tracks.find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");

print("Plan with index");
printjson(explainAfter.executionStats);


// Завдання 2. Індекс для інших полів
db.tracks.createIndex({ 
  explicit: 1, 
  "audio_features.instrumentalness": 1, 
  "audio_features.speechiness": 1 
});

const bgMusicQuery = {
  explicit: false,
  "audio_features.instrumentalness": { $gte: 0.5 },
  "audio_features.speechiness": { $lt: 0.1 }
};

const explainBgMusic = db.tracks.find(bgMusicQuery).explain("executionStats");

print("Plan with second index");
printjson(explainBgMusic.queryPlanner.winningPlan);


// Завдання 3. Покривний запит
const explainCovered = db.tracks.find({
  track_genre: "pop",
  popularity: { $gte: 70 }
}).explain("executionStats");

printjson(explainCovered.executionStats);


const explainFullyCovered = db.tracks.find(
  { track_genre: "pop", popularity: { $gte: 70 } }, 
  { _id: 0, track_genre: 1, popularity: 1 }
).explain("executionStats");

printjson(explainFullyCovered.executionStats);
