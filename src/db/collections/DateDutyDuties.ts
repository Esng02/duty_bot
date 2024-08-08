import { Collection } from 'mongodb';
import { getDB } from '../connection';

export const dateDutyDutiesCollection = () => getDB().collection('Date_duty_duties');