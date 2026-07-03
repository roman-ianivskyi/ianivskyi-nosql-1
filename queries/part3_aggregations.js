db = db.getSiblingDB( "spotify" );
const count = db.tracks.countDocuments();
print("All records: " + count);

// Завдання 1. Топ-10 виконавців за середньою популярністю
// Знайдіть виконавців, у яких є хоча б 5 треків.
// Для кожного виконавця порахуйте середню популярність його треків.
//  Потім відсортуйте за спаданням та виберіть топ-10 виконавців.
// Вивід повинен включати ім’я виконавця та його середню популярність.

const topArtistsPipeline = [
  { $unwind: "$artists" },
  {
    $group: {
      _id: "$artists",
      track_count: { $sum: 1 },
      avg_popularity: { $avg: "$popularity" }
    }
  },
  {
    $match: {
      track_count: { $gte: 5 }
    }
  },
  {
    $sort: { avg_popularity: -1 }
  },
  { $limit: 10 },
  {
    $project: {
      _id: 0,
      artist: "$_id",
      avg_popularity: { $round: ["$avg_popularity", 1] } 
    }
  }
];

print("1. Top 10: ");
printjson(db.tracks.aggregate(topArtistsPipeline).toArray());


// Завдання 2. Розподіл треків за настроєм
// Кожному треку присвойте настрій на основі двох полів: valence (позитивність) та energy:
// високий valence + висока energy → happy
// низький valence + висока energy → angry
// високий valence + низька energy → calm
// низький valence + низька energy → sad Порахуйте, скільки треків потрапило до кожної категорії, та виведіть таблицю з настроєм і кількістю треків.

// !!! МІСЦЕ ДЛЯ ВАШОГО КОДУ !!!

const moodDistributionPipeline = [
  {
    $addFields: {
      mood: {
        $switch: {
          branches: [
            // високий valence + висока energy → happy
            { 
              case: { $and: [ { $gte: ["$audio_features.valence", 0.5] }, { $gte: ["$audio_features.energy", 0.5] } ] },
              then: "happy" 
            },
            // низький valence + висока energy → angry
            { 
              case: { $and: [ { $lt: ["$audio_features.valence", 0.5] }, { $gte: ["$audio_features.energy", 0.5] } ] },
              then: "angry" 
            },
            // високий valence + низька energy → calm
            { 
              case: { $and: [ { $gte: ["$audio_features.valence", 0.5] }, { $lt: ["$audio_features.energy", 0.5] } ] },
              then: "calm" 
            },
            // низький valence + низька energy → sad
            { 
              case: { $and: [ { $lt: ["$audio_features.valence", 0.5] }, { $lt: ["$audio_features.energy", 0.5] } ] },
              then: "sad" 
            }
          ],
          default: "unknown"
        }
      }
    }
  },
  {
    $group: {
      _id: "$mood",
      track_count: { $sum: 1 }
    }
  },
  {
    $sort: { track_count: -1 }
  },
  {
    $project: {
      _id: 0,
      mood: "$_id",
      track_count: 1
    }
  }
];

print("2. Mood Distribution: ");
printjson(db.tracks.aggregate(moodDistributionPipeline).toArray());


// Завдання 3. Найбільш «танцювальний» жанр
// Визначте, який музичний жанр найкраще підходить для танців.
// Для цього згрупуйте треки за жанрами та обчисліть середні значення
//  танцювальності (danceability), енергії (energy) та позитивності (valence).
// Відфільтруйте жанри, в яких налічується менше 100 треків, 
// щоб забезпечити статистичну надійність. У результаті виведіть:
// назву жанру
// середню танцювальність (avg_danceability)
// середню енергію (avg_energy)
// середню позитивність (avg_valence)
// кількість треків у жанрі

const danceableGenrePipeline = [
  {
    $group: {
      _id: "$track_genre",
      track_count: { $sum: 1 },
      avg_danceability: { $avg: "$audio_features.danceability" },
      avg_energy: { $avg: "$audio_features.energy" },
      avg_valence: { $avg: "$audio_features.valence" }
    }
  },
  {
    $match: {
      track_count: { $gte: 100 }
    }
  },
  {
    $sort: { avg_danceability: -1 }
  },
  {
    $project: {
      _id: 0,
      genre: "$_id",
      track_count: 1,
      avg_danceability: { $round: ["$avg_danceability", 3] },
      avg_energy: { $round: ["$avg_energy", 3] },
      avg_valence: { $round: ["$avg_valence", 3] }
    }
  }
];

print("3. Most Danceable Genre: ");
printjson(db.tracks.aggregate(danceableGenrePipeline).toArray());