db = db.getSiblingDB( "spotify" );

db.tracks.drop()

db.getCollection("tracks_raw").aggregate([
  {
    $project: {
      _id: 1,
      track_id: 1,
      track_name: 1,
      album_name: 1,
      explicit: 1,
      popularity: 1,
      duration_ms: 1,
      track_genre: 1,
      
      artists: {
        $map: {
          input: { $split: ["$artists", ";"] },
          as: "artist",
          in: { $trim: { input: "$$artist" } }
        }
      },
      
      audio_features: {
        danceability: "$danceability",
        energy: "$energy",
        loudness: "$loudness",
        speechiness: "$speechiness",
        acousticness: "$acousticness",
        instrumentalness: "$instrumentalness",
        liveness: "$liveness",
        valence: "$valence",
        tempo: "$tempo",
        key: "$key",
        mode: "$mode",
        time_signature: "$time_signature"
      },
      
      duration_sec: {
        $round: [ { $divide: ["$duration_ms", 1000] }, 1 ]
      },
      
      popularity_tier: {
        $cond: {
          if: { $gte: ["$popularity", 70] },
          then: "high",
          else: {
            $cond: {
              if: { $gte: ["$popularity", 40] },
              then: "medium",
              else: "low"
            }
          }
        }
      }
    }
  },
  {
    $out: "tracks"
  }
]);

const count = db.tracks.countDocuments();
print(count);
const sample = db.tracks.findOne();
printjson(sample);