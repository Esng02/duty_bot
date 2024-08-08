import { Collection } from 'mongodb';
import { getDB } from '../connection';

export const queueDutyCollection = () => getDB().collection('queue_duty');