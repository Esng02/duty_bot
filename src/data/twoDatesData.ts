import { twoDatesCollection } from '../db/collections/twoDates';


export async function addFirstDate(date: string) {
    return twoDatesCollection().updateOne({}, { $set: { first_date: date } });
}

export async function addSecondDate(date: string) {
    return twoDatesCollection().updateOne({}, { $set: { second_date: date } });
}

export async function addFirstName(username: string) {
    return twoDatesCollection().updateOne({}, { $set: { first_username: username } });
}

export async function addSecondName(username: string) {
    return twoDatesCollection().updateOne({}, { $set: { second_username: username } });
}

export async function findTwoDates() {
    return twoDatesCollection().findOne({});
}

export async function dropTwoDates() {
    console.log("dropTwoDates");
    return twoDatesCollection().updateOne({}, { $set: {
        first_username: "",
        second_username: "",
        first_date: "",
        second_date: ""
    }});
}