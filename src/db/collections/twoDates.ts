import { Collection } from 'mongodb';
import { getDB } from '../connection';

export const twoDatesCollection = () => getDB().collection('two_dates');