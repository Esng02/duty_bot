import { Collection } from 'mongodb';
import { getDB } from '../connection';

export const dutyScheduleCollection = () => getDB().collection('Duty_Schedule');