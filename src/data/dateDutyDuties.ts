import { dateDutyDutiesCollection } from '../db/collections/DateDutyDuties';

export async function addDutyDuties(date: string, username: string, dict_duties: any) {
    return dateDutyDutiesCollection().insertOne( { 
        date: date,
        duty: username,
        duties: dict_duties
     });
  }