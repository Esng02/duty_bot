import { findDutySchedule, updateDutySchedule } from '../data/dutyScheduleData';
import { addFirstDate, addSecondDate, dropTwoDates, addFirstName, addSecondName, findTwoDates } from '../data/twoDatesData';


export async function reverseFirstOnSecond() {
    console.log("reverseFirstOnSecond");
    const twoDates = await findTwoDates();
    const first_date = twoDates?.first_date;
    const second_name = twoDates?.second_username;
    return updateDutySchedule(first_date, { duty: second_name });
}

export async function reverseSecondOnFirst() {
    console.log("reverseSecondOnFirst");
    const twoDates = await findTwoDates();
    const second_date = twoDates?.second_date;
    const first_name = twoDates?.first_username;
    return updateDutySchedule(second_date, { duty: first_name });
}