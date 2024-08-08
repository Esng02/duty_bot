import { Collection, MongoClient } from 'mongodb';
import { getDB } from '../connection';

export const usersCollection = () => getDB().collection('users');