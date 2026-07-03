db = db.getSiblingDB( "spotify" );
const count = db.tracks.countDocuments();
print("All records: " + count);

// Завдання 1. Треки для вечірки
// Знайдіть треки, що підходять для вечірки. Такі треки повинні мати високий danceability (вище 0.7) та високу енергію (також вище 0.7), а тривалість — від 3 до 5 хвилин (180000–300000 мс).

const partyTracksQuery = {
  "audio_features.danceability": { $gt: 0.7 },
  "audio_features.energy": { $gt: 0.7 },
  "duration_sec": { $gte: 180, $lte: 300 }
};

const countFiltered = db.tracks.find(partyTracksQuery).count();
print("1. Filtered records: " + countFiltered);

printjson(db.tracks.find(partyTracksQuery).limit(3).toArray());


// Завдання 2. Виконавці, у яких усі треки популярні
// Вважатимемо артиста популярним, якщо у нього є мінімум 3 треки і при цьому мінімальна популярність цих треків становить 60% або вище.
// Знайдіть топ-20 таких артистів і виведіть для кожного ім’я артиста кількість треків, мінімальну та середню популярність з точністю до одного знака після коми.

const popularArtistsPipeline = [
  { $unwind: "$artists" },
  {
    $group: {
      _id: "$artists",
      track_count: { $sum: 1 },
      min_popularity: { $min: "$popularity" },
      avg_popularity: { $avg: "$popularity" }
    }
  },
  {
    // min 3 tracks min popularity 60
    $match: {
      track_count: { $gte: 3 },
      min_popularity: { $gte: 60 }
    }
  },
  { $sort: { avg_popularity: -1 } },
  { $limit: 20 },
  {
    $project: {
      _id: 0,
      artist: "$_id",
      track_count: 1,
     
       // round popularity to 1 decimal place
      min_popularity:  { $round: ["$min_popularity", 1] },
      avg_popularity: { $round: ["$avg_popularity", 1] }
    }
  }
];

print("2. Top 20: ");
printjson(db.tracks.aggregate(popularArtistsPipeline).toArray());


// Завдання 3. Нетипові треки
// Визначте треки з незвично високим темпом для їхнього жанру за наступним алгоритмом: 
// спочатку розрахуйте середнє значення tempo за допомогою функції $avg та стандартне відхилення
//  за допомогою $stdDevPop по кожному жанру, потім виберіть треки, у яких tempo перевищує 
// середнє плюс два стандартні відхилення (tempo треку > mean жанру + 2 * stdDev жанру).
// У результаті для кожного жанру додайте поля: "avg_tempo" — середній темп, 
// "genre" — назва жанру, "outlier_threshold" — значення порогу для нетипових треків, і 
// "outlier_tracks" — масив об’єктів з інформацією про треки

const outlierTracksPipeline = [
  {
    $group: {
      _id: "$track_genre",
      avg_tempo: { $avg: "$audio_features.tempo" },
      std_dev_tempo: { $stdDevPop: "$audio_features.tempo" }
    }
  },
  {
    $addFields: {
      outlier_threshold: {
        $add: ["$avg_tempo", { $multiply: [2, "$std_dev_tempo"] }]
      }
    }
  },
  {
    $lookup: {
      from: "tracks",
      let: { genre_name: "$_id", threshold: "$outlier_threshold" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$track_genre", "$$genre_name"] },
                { $gt: ["$audio_features.tempo", "$$threshold"] }
              ]
            }
          }
        },
        {
          $project: {
            _id: 1,
            track_name: 1,
            popularity: 1,
            artists: 1,
            "audio_features.tempo": 1
          }
        }
      ],
      as: "outlier_tracks"
    }
  },
  {
    $project: {
      _id: 0,
      genre: "$_id",
      avg_tempo: { $round: ["$avg_tempo", 0] },
      outlier_threshold: { $round: ["$outlier_threshold", 1] },
      outlier_tracks: 1
    }
  }
];


print("3. Outliers: ");
// print(db.tracks.aggregate(outlierTracksPipeline).itcount());
const results = db.tracks.aggregate(outlierTracksPipeline).toArray();
print("Total records found: " + results.length);
printjson(results.slice(0, 1));



// Завдання 4: Треки для фонової роботи
// Знайдіть треки, які підходять для фонового прослуховування під час роботи: 
// тихі (loudness < -10),
// з низькою мовленнєвою складовою (speechiness < 0,1),
// переважно інструментальні (instrumentalness > 0,5)
// і не містять explicit-контенту.


const backgroundWorkQuery = {
  "audio_features.loudness": { $lt: -10 },
  "audio_features.speechiness": { $lt: 0.1 },
  "audio_features.instrumentalness": { $gt: 0.5 },
  "explicit": false
};

const backgroundWorkProjection = {
  track_name: 1,
  artists: 1,
  "audio_features.loudness": 1,
  "audio_features.speechiness": 1,
  "audio_features.instrumentalness": 1
};

const countFiltered4 = db.tracks.find(backgroundWorkQuery).count();
print("4. Filtered records: " + countFiltered4);
printjson(db.tracks.find(backgroundWorkQuery, backgroundWorkProjection).limit(5).toArray());