import { dutyScheduleCollection } from '../db/collections/dutySchedule';

export async function findDutySchedule(date: string) {
  return dutyScheduleCollection().findOne({ date: date });
}

export async function updateDutySchedule(date: string, data: any) {
  return dutyScheduleCollection().updateOne({ date }, { $set: data });
}

export async function findDutyScheduleDate(username: string, date: string) {
  const elements =  await dutyScheduleCollection().find().toArray();

  for (const element of elements) {
    if (element.date === date) {
      console.log(element.date, date);      // /////////////////////////////////////////////////
      console.log("findDutyScheduleDate", element.date, date );       ////////////////////////////////////
      if (element.duty === username) {
        console.log("2 if", element.duty, username);        // /////////////////////////////////////////////////
        return element.date;
      } else {break;}
    }
  }
  return "1";
}
