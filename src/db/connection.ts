import { MongoClient } from 'mongodb';

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'telegram_bot';

let dbClient: MongoClient;

export async function connectDB(): Promise<MongoClient> {
  if (!dbClient) {
    dbClient = new MongoClient(mongoURI);
    await dbClient.connect();
    console.log('Подключено к MongoDB');
  }
  return dbClient;
}

export function getDB() {
  if (!dbClient) throw new Error('Не подключен к базе данных');
  return dbClient.db(dbName);
}
