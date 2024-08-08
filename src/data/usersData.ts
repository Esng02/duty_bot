import { usersCollection } from '../db/collections/users';

export async function findUserById(id: number) {
  return usersCollection().findOne({ id });
}

export async function createUser(id: number, username: string) {
  return usersCollection().insertOne({ id, username, workSchedule: [], startDate: null, debt_duty: [] });
}

export async function updateUserWorkSchedule(id: number, schedule: number[]) {
  return usersCollection().updateOne({ id }, { $set: { workSchedule: schedule } });
}

export async function updateUserStartDate(id: number, startDate: string) {
  return usersCollection().updateOne({ id }, { $set: { startDate } });
}

// export async function getAtherUserId(username: string) {
//   const elements = await usersCollection().find().toArray();
//   for (const element of elements) {
//     if (element.username === username) {
//       return element.id;
//     }
//   }
// }

export async function getAtherUserId(username: string) {
  return usersCollection().findOne({ username: username });

}

// export async function dropDataAboutUser(username: string) {
//   return usersCollection().deleteOne({ username: username });
// }

export async function dropDataAboutUser(username: string) {
    return usersCollection().deleteOne({ username });
}