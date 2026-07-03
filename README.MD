## Завдання 1. Аналітична платформа для музичного стрімінгового сервісу
### Налаштування оточення
Для запуску потрібно:
1. Зареєструйтеся на mongodb.com/atlas.

2. Створіть кластер — виберіть провайдера AWS та регіон, найближчий до вас.

3. У розділі Database Access створіть користувача з паролем.

4. У розділі Network Access додайте свій IP (або 0.0.0.0/0 для розробки).

5. Натисніть Connect → Drivers, скопіюйте рядок підключення вигляду mongodb+srv://... — він знадобиться у скриптах.

6. Створіть файл .env в папці проекту з 
MONGO_URI="<рядок підключення>"

7. Встановити Mongosh згідно з: https://www.mongodb.com/try/download/shell

8. Завантажте файл https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset?resource=download в корінь проекту з назвою dataset.csv

9. Встановіть Python 13+ та створіть віртуальне оточення з залежностями з requirements.txt з кореня проекту

10. Запустіть у віртуальному оточення 
```console
scripts/01-load-data.py
```

11. Запустіть:
```console
mongosh $MONGO_URI --file scripts/02-transform.js
mongosh $MONGO_URI --file queries/part2_queries.js
mongosh $MONGO_URI --file queries/part3_aggregations.js
mongosh $MONGO_URI --file queries/part4_indexes.js
```

### Схема даних
```json 
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": [
      "_id",
      "album_name",
      "artists",
      "audio_features",
      "duration_ms",
      "duration_sec",
      "explicit",
      "popularity",
      "popularity_tier",
      "track_genre",
      "track_id",
      "track_name"
    ],
    "properties": {
      "_id": {
        "bsonType": "objectId"
      },
      "album_name": {
        "bsonType": "string"
      },
      "artists": {
        "bsonType": "array",
        "items": {
          "bsonType": "string"
        }
      },
      "audio_features": {
        "bsonType": "object",
        "properties": {
          "acousticness": {
            "bsonType": "double"
          },
          "danceability": {
            "bsonType": "double"
          },
          "energy": {
            "bsonType": "double"
          },
          "instrumentalness": {
            "bsonType": "double"
          },
          "key": {
            "bsonType": "int"
          },
          "liveness": {
            "bsonType": "double"
          },
          "loudness": {
            "bsonType": "double"
          },
          "mode": {
            "bsonType": "int"
          },
          "speechiness": {
            "bsonType": "double"
          },
          "tempo": {
            "bsonType": "double"
          },
          "time_signature": {
            "bsonType": "int"
          },
          "valence": {
            "bsonType": "double"
          }
        },
        "required": [
          "acousticness",
          "danceability",
          "energy",
          "instrumentalness",
          "key",
          "liveness",
          "loudness",
          "mode",
          "speechiness",
          "tempo",
          "time_signature",
          "valence"
        ]
      },
      "duration_ms": {
        "bsonType": "int"
      },
      "duration_sec": {
        "bsonType": "double"
      },
      "explicit": {
        "bsonType": "bool"
      },
      "popularity": {
        "bsonType": "int"
      },
      "popularity_tier": {
        "bsonType": "string"
      },
      "track_genre": {
        "bsonType": "string"
      },
      "track_id": {
        "bsonType": "string"
      },
      "track_name": {
        "bsonType": "string"
      }
    }
  }
}
```

### Теоретичні питання:
#### 1.1. Чому аудіо-характеристики винесені в окремий об’єкт audio_features, а не зберігаються плоско? Коли таке вкладення вигідне, а коли створює проблеми? 


Аудіо характеристики ймовірно змінюються разом і описують єдину структуру, а також логічно згруповані, що покращує читабельність та дозволяє відфільтрувати одразу всі поля, для запитів що не потребують аудіо-характеристик. Також простіше буде додати нові поля до цієї схеми в майбутньому.
Такий підхід може стати менш оптимальним, якщо вкладені поля часто змінюються окремо, або до них часто звертаються, що потребує тепер також додавання audio_features. до кожного звернення. Ці недоліки стають більш помітними також для обʼєктів з високим рівнем вкладеності (глибиною)


#### 1.2. Чому виконавці зберігаються як масив, а не як рядок? Які запити стають простішими?

Зберігання масиву виконавців дозволяє ефективно індексувати дане поле та шукати наприклад всі треки одного виконавця, наприклад db.tracks.find({ artists: "ZAYN" }), навіть якщо він виступав співавтором

#### 1.3. Що таке $$out$ і чим він відрізняється від $merge ? Коли використовувати кожен?


Ці оператори використовуються наприкінці агрегації для збереження результату і створюють колекцію та базу даних якщо вони ще не існують.
 $$out$ - повністю заміняє колекцію якщо вона вже існує, працює швидше, але не працює з шардованими колекціями.
 $merge - оновлює дані в існуючій колекції та може виводити 
 дані у ту ж колекцію яка є входом для агрегації, чи у шардовану колекцію. Також дозволяє конфігурувати поведінку при збігу ключів чи при відсутності такого збігу


#### 2.1. Для чого використовується інструкція $unwind?

unwind дозволяє розгорнути масив та обробляти окремо кожен його елемент як окремий документ. Наприклад використовується для агрегації за значеннями що зназодяться всередині масиву, як artists

#### 2.2. Чим $stdDevPop відрізняється від $stdDevSamp?

Ці оператори обраховують стандартне віжхилення, але за різними формулами:
stdDevPop - сума квадратів відхилень ділиться на загальну кількість елементів, використовується коли набір даних представляє всю генеральну сукупність
stdDevSamp - використовується поправка Бесселя, тому сума квадратів відхилень ділиться на $N - 1$, та використовується для наьборів, що представляють вибірку з генеральної сукупності.

#### 3.1. У запиті 1 ми фільтруємо виконавців, у яких менше 5 треків. Як зміниться результат, якщо знизити поріг до 1? А що станеться, якщо вибирати виконавців із більш ніж 50 треками? Поясніть результат.

Якщо знизити поріг до 1го треку то запит буде шукати виконавців що мають хоча б одну пісню з високою популярністю, наприклад автори вірусних пісень. Частину з яких я вперше чую.
З порогом у 50 треків топ 10 складається з більш стабільно відомих виконавців за довший період(не лише останні кілька років), хоча й з меншим рівнем популярності.

#### 3.2. У запиті 3 ми фільтруємо жанри з менше ніж 100 треками. Чи зміниться результат, якщо знизити поріг до 50? Поясніть результат.

Якщо знизити поріг до 50, то в топ потрапляє більше специфічних піджанрів, хоча й топ 10 залишається дуже схожим до порогу в 100. Це пояснюється тим, що деякі вузькоспеціалізовані жанри можуть бути більш танцювальними не маючи при цьому достатньої кількості треків.


#### 4.1. Що змінилося в плані виконання?
Час виконання значно зменшився з 85 мс до 2 мс, а кількість переглянутих документів totalDocsExamined з 113999 до 354(nReturned).

#### 4.2. Як зрозуміти, що індекс використовується? Наведіть скріншот або значення полів із explain(), які це підтверджують. 
Окрім помітного покращення часу виконання, та зменшення кількості переглянутих документів, також в inputStages COLLSCAN замінився на FETCH з вкладеним IXSCAN, а SORT 
було вилучено, що означає що дані вже були відсортовані в правильному порядку в індексі.

Plan before
```json
{
  executionSuccess: true,
  nReturned: 354,
  executionTimeMillis: 85,
  totalKeysExamined: 0,
  totalDocsExamined: 113999,
  executionStages: {
    isCached: false,
    stage: 'SORT',
    nReturned: 354,
    executionTimeMillisEstimate: 78,
    works: 114355,
    advanced: 354,
    needTime: 114000,
    needYield: 0,
    saveState: 6,
    restoreState: 6,
    isEOF: 1,
    sortPattern: {
      popularity: -1
    },
    memLimit: 33554432,
    type: 'simple',
    totalDataSizeSorted: 197854,
    usedDisk: false,
    spills: 0,
    spilledDataStorageSize: 0,
    inputStage: {
      stage: 'COLLSCAN',
      filter: {
        '$and': [
          {
            track_genre: {
              '$eq': 'pop'
            }
          },
          {
            'audio_features.danceability': {
              '$gte': 0.7
            }
          }
        ]
      },
      nReturned: 354,
      executionTimeMillisEstimate: 74,
      works: 114000,
      advanced: 354,
      needTime: 113645,
      needYield: 0,
      saveState: 6,
      restoreState: 6,
      isEOF: 1,
      direction: 'forward',
      docsExamined: 113999
    }
  }
}
```
Plan with index
```json
{
  executionSuccess: true,
  nReturned: 354,
  executionTimeMillis: 2,
  totalKeysExamined: 412,
  totalDocsExamined: 354,
  executionStages: {
    isCached: false,
    stage: 'FETCH',
    nReturned: 354,
    executionTimeMillisEstimate: 3,
    works: 412,
    advanced: 354,
    needTime: 57,
    needYield: 0,
    saveState: 0,
    restoreState: 0,
    isEOF: 1,
    docsExamined: 354,
    alreadyHasObj: 0,
    inputStage: {
      stage: 'IXSCAN',
      nReturned: 354,
      executionTimeMillisEstimate: 3,
      works: 412,
      advanced: 354,
      needTime: 57,
      needYield: 0,
      saveState: 0,
      restoreState: 0,
      isEOF: 1,
      keyPattern: {
        track_genre: 1,
        popularity: -1,
        'audio_features.danceability': 1
      },
      indexName: 'track_genre_1_popularity_-1_audio_features.danceability_1',
      isMultiKey: false,
      multiKeyPaths: {
        track_genre: [],
        popularity: [],
        'audio_features.danceability': []
      },
      isUnique: false,
      isSparse: false,
      isPartial: false,
      indexVersion: 2,
      direction: 'forward',
      indexBounds: {
        track_genre: [
          '["pop", "pop"]'
        ],
        popularity: [
          '[MaxKey, MinKey]'
        ],
        'audio_features.danceability': [
          '[0.7, inf.0]'
        ]
      },
      keysExamined: 412,
      seeks: 58,
      dupsTested: 0,
      dupsDropped: 0
    }
  }
}
```

#### 4.3. Чи є цей запит покривним (covered query)?
Покривний запит означає що всі поля потрібні для виконання є в індексі і їх не треба читати з документів. З плану виконання можна побачити, що totalDocsExamined: 317, тобто документи були прочитані, хоча й відносно невелика кількість. Щоб запит був покривним треба додати проекцію яка включатиме тільки поля присутні в індексі та вилучатиме поле _id. 
У плані виконання зміненого запиту можна побачити totalDocsExamined: 0, а також що stage: 'FETCH' було замінено на stage: 'PROJECTION_COVERED' - отже такий змінений запит буле покривним:

```json
{
  executionSuccess: true,
  nReturned: 317,
  executionTimeMillis: 0,
  totalKeysExamined: 317,
  totalDocsExamined: 0,
  executionStages: {
    isCached: false,
    stage: 'PROJECTION_COVERED',
    nReturned: 317,
    executionTimeMillisEstimate: 1,
    works: 318,
    advanced: 317,
    needTime: 0,
    needYield: 0,
    saveState: 0,
    restoreState: 0,
    isEOF: 1,
    transformBy: {
      _id: 0,
      track_genre: 1,
      popularity: 1
    },
    inputStage: {
      stage: 'IXSCAN',
      nReturned: 317,
      executionTimeMillisEstimate: 1,
      works: 318,
      advanced: 317,
      needTime: 0,
      needYield: 0,
      saveState: 0,
      restoreState: 0,
      isEOF: 1,
      keyPattern: {
        track_genre: 1,
        popularity: -1,
        'audio_features.danceability': 1
      },
      indexName: 'track_genre_1_popularity_-1_audio_features.danceability_1',
      isMultiKey: false,
      multiKeyPaths: {
        track_genre: [],
        popularity: [],
        'audio_features.danceability': []
      },
      isUnique: false,
      isSparse: false,
      isPartial: false,
      indexVersion: 2,
      direction: 'forward',
      indexBounds: {
        track_genre: [
          '["pop", "pop"]'
        ],
        popularity: [
          '[inf.0, 70]'
        ],
        'audio_features.danceability': [
          '[MinKey, MaxKey]'
        ]
      },
      keysExamined: 317,
      seeks: 1,
      dupsTested: 0,
      dupsDropped: 0
    }
  }
}
```