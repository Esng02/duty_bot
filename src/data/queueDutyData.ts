import { queueDutyCollection } from '../db/collections/queueDuty';

export async function findQueueDuty() {
  return queueDutyCollection().findOne();
}


export async function dropUserOfQueueDuty(username: string) {
  const duty = await queueDutyCollection().findOne();
  const list_duty = duty?.queue;
  const new_list = []
  for (let user of list_duty) {
    if (user !== username) {
      new_list.push(user);
    }
  };
  return queueDutyCollection().updateOne({}, { $set: { queue: new_list} });
}


export async function addQueueDuty(username: string) {
  return queueDutyCollection().updateOne({}, { $addToSet: { queue: username } }, { upsert: true });
}

export async function userNotQueueDuty(username: string) {
  const elements = await queueDutyCollection().find().toArray();
  for (let i = 0; i < elements[0].queue.length; i++) {
    if (elements[0].queue[i] === username) {
      return false;
    }
  }
  return true;
}

