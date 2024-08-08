import { format, getDaysInMonth, getDay, addDays } from 'date-fns';
import { dutyScheduleCollection } from './db/collections/dutySchedule';
import { queueDutyCollection } from './db/collections/queueDuty';
import { usersCollection } from './db/collections/users';
import { findUserById, createUser, updateUserWorkSchedule, updateUserStartDate, getAtherUserId } from './data/usersData';
import { findDutySchedule, updateDutySchedule } from './data/dutyScheduleData';
import { findQueueDuty, addQueueDuty, userNotQueueDuty } from './data/queueDutyData';
import { addFirstDate, addSecondDate, dropTwoDates, addFirstName, addSecondName } from './data/twoDatesData';
import { reverseFirstOnSecond, reverseSecondOnFirst } from './data/reverseTwoDatesDutySchedule';

export async function fillWorkSchedule(startWorkMonth: number, startWorkDay: number, startWorkDate: string) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const dutyScheduleColl = dutyScheduleCollection();
  const usersColl = usersCollection();

  // Получаем всех пользователей из users
  const users = await usersColl.find().toArray();

  // Заполняем коллекцию текущим и следующим месяцем
  for (let month = currentMonth; month <= currentMonth + 1; month++) {
    const daysInMonth = getDaysInMonth(new Date(currentYear, month));
    
    if (month === startWorkMonth) {
      for (let day = startWorkDay; day <= daysInMonth; day++) {
        const date = format(new Date(currentYear, month, day), 'yyyy-MM-dd');
        const weekday = getDay(new Date(currentYear, month, day));

        const employees = users.filter(user => isWorkingOnDay(user.workSchedule, user.startDate, currentYear, month, day))
                               .map(user => user.username);

        await dutyScheduleColl.updateOne({ date }, { $set: { date, weekday, employees } }, { upsert: true });
      }
    } else {
      for (let day = 1; day <= daysInMonth; day++) {
        const date = format(new Date(currentYear, month, day), 'yyyy-MM-dd');
        const weekday = getDay(new Date(currentYear, month, day));

        const employees = users.filter(user => isWorkingOnDay(user.workSchedule, user.startDate, currentYear, month, day))
                               .map(user => user.username);

        await dutyScheduleColl.updateOne({ date }, { $set: { date, weekday, employees } }, { upsert: true });
      }
    }
  }
}

// export async function fillDutySchedule() {
//   const currentDate = new Date();
//   const nextMonth = currentDate.getMonth() + 1;
//   const currentYear = currentDate.getFullYear();

//   const dutyScheduleColl = dutyScheduleCollection();
//   const queueDutyColl = queueDutyCollection();

//   const dutySchedule = await dutyScheduleColl.find().toArray();
//   const queueList = await queueDutyColl.find().toArray();


//   let indexQueue = 0;

//   for (const element of dutySchedule) {
//     if (element.month_name == getMonthName(nextMonth)) {
//       if (element.weekday != 0) {
//         await dutyScheduleColl.updateOne(
//           { date: element.date },
//           { $set: { duty: queueList[0].queue[indexQueue] || '' } }
//         );
//         // indexQueue = (indexQueue + 1) % queueList[0].queue.length;
//         indexQueue++;

//         if (indexQueue === queueList[0].queue.length) {
//           indexQueue = 0;
//         }
//       }
//     }
//   }
// }



// export async function fillDutySchedule() {
//   const currentDate = new Date();
//   const nextMonth = currentDate.getMonth();  // Месяц
//   const currentYear = currentDate.getFullYear();
//   const totalDays = getDaysInMonth(nextMonth);  // Получаем количество дней в следующем месяце

//   const queueDuty = await findQueueDuty();  // Получаем очередь дежурств

//   let indexQueue = 0;  // Индекс текущего дежурного
//   const indexListNoEmploy: number[] = [];  // Список индексов сотрудников, которые не работают

//   for (let day = 1; day <= totalDays; day++) {
//     const date = format(new Date(currentYear, nextMonth, day), 'yyyy-MM-dd');  // Форматируем текущую дату
//     const dutySchedule = await findDutySchedule(date);  
//     const dutyScheduleEmployees = dutySchedule?.employees;  // Получаем список сотрудников, работающих в этот день

//     console.log("list noEmploy:", indexListNoEmploy);

//     if (indexListNoEmploy.length > 0) {  // Если есть сотрудники, которые не работают

//       for (const indexInList of indexListNoEmploy) {
//         console.log("indexInList:", indexInList);
//         console.log("queueDuty?.queue[indexInList]:", queueDuty?.queue[indexInList]);
//         console.log("dutyScheduleEmployees:", dutyScheduleEmployees);
//         console.log("queueDuty?.queue[indexInList] in dutyScheduleEmployees:", queueDuty?.queue[indexInList] in dutyScheduleEmployees);
//         if (queueDuty?.queue[indexInList] in dutyScheduleEmployees) {  // Если текущий дежурный в списке работающих
//           await updateDutySchedule(date, { duty: queueDuty?.queue[indexQueue] });  // Обновляем расписание
//           indexListNoEmploy.shift();  // Удаляем первый элемент из списка
//           break;
//         }
//       }

//       if (indexListNoEmploy.length === 0) {
//         indexQueue = 0;  // Обновляем индекс очереди
//         continue;  // Переходим к следующему дню
//       }
//     }

//     // Если список сотрудников, которые не работают, пуст или не удалось назначить сотрудника
//     if (queueDuty?.queue[indexQueue] in dutyScheduleEmployees) {
//       await updateDutySchedule(date, { duty: queueDuty?.queue[indexQueue] });  // Обновляем расписание
//     } else {
//       indexListNoEmploy.push(indexQueue);  // Добавляем индекс дежурного в список
//     }

//     indexQueue = (indexQueue + 1) % queueDuty?.queue.length;  // Обновляем индекс очереди
//   }
// }



export async function fillDutySchedule(input_day: number = 1) {
  const currentDate = new Date();
  const nextMonth = currentDate.getMonth();  // Месяц
  const currentYear = currentDate.getFullYear();
  const totalDays = getDaysInMonth(nextMonth);  // Получаем количество дней в следующем месяце

  const queueDuty = await findQueueDuty();  // Получаем очередь дежурств

  let indexQueue = 0;  // Индекс текущего дежурного
  const indexListNoEmploy: number[] = [];  // Список индексов сотрудников, которые не работают
  let day_global_for = input_day || 1;

  for (day_global_for; day_global_for <= totalDays; day_global_for++) {
    const date = format(new Date(currentYear, nextMonth, day_global_for), 'yyyy-MM-dd');  // Форматируем текущую дату
    console.log();
    console.log("date:", date); // ////////////////////////////////////////////////////////////////////////

    const dutySchedule = await findDutySchedule(date);

    if (dutySchedule?.weekday === 0) {  // Пропускаем воскресенье
      console.log("Воскресенье");
      continue;
    }

    const dutyScheduleEmployees = dutySchedule?.employees;  // Получаем список сотрудников, работающих в этот день
    console.log("dutyScheduleEmployees:", dutyScheduleEmployees);
    console.log("queueDuty?.queue:", queueDuty?.queue);

    let bool_flag = false;

    // Проверяем тех, кто не мог выйти на дежурство раньше
    if (indexListNoEmploy.length > 0) {
      for (const indexInList of indexListNoEmploy) {
        if (dutyScheduleEmployees.includes(queueDuty?.queue[indexInList])) {  // Если текущий дежурный в списке работающих
          console.log("updateDutySchedule(date, { duty: queueDuty?.queue[indexInList] })");
          await updateDutySchedule(date, { duty: queueDuty?.queue[indexInList] });  // Обновляем расписание
          bool_flag = true;
          indexListNoEmploy.splice(indexListNoEmploy.indexOf(indexInList), 1);  // Удаляем индекс из списка не работающих
          break;
        }
      }
    }

    if (!bool_flag) {
      // Проверяем текущий индекс очереди
      if (dutyScheduleEmployees.includes(queueDuty?.queue[indexQueue])) {
        console.log("updateDutySchedule(date, { duty: queueDuty?.queue[indexQueue] })");
        await updateDutySchedule(date, { duty: queueDuty?.queue[indexQueue] });  // Обновляем расписание
        bool_flag = true;
        indexQueue = (indexQueue + 1) % queueDuty?.queue.length;  // Обновляем индекс очереди
      } else {
        indexListNoEmploy.push(indexQueue);  // Добавляем индекс дежурного в список не работающих
        indexQueue = (indexQueue + 1) % queueDuty?.queue.length;  // Обновляем индекс очереди
      }
    }

    if (!bool_flag) {
      // Проверяем оставшуюся очередь
      for (let i = 0; i < queueDuty?.queue.length; i++) {
        if (dutyScheduleEmployees.includes(queueDuty?.queue[i])) {
          console.log("updateDutySchedule(date, { duty: queueDuty?.queue[i] })");
          await updateDutySchedule(date, { duty: queueDuty?.queue[i] });  // Обновляем расписание
          bool_flag = true;
          indexQueue = (i + 1) % queueDuty?.queue.length;  // Обновляем индекс очереди
          break;
        }
      }

      // Если не нашли дежурного, проверяем начало очереди
      if (!bool_flag) {
        for (let j = 0; j < queueDuty?.queue.length; j++) {
          if (dutyScheduleEmployees.includes(queueDuty?.queue[j])) {
            console.log("updateDutySchedule(date, { duty: queueDuty?.queue[j] })");
            await updateDutySchedule(date, { duty: queueDuty?.queue[j] });  // Обновляем расписание
            bool_flag = true;
            indexQueue = (j + 1) % queueDuty?.queue.length;  // Обновляем индекс очереди
            break;
          }
        }
      }
    }

    if (!bool_flag) {
      console.log("updateDutySchedule(date, { duty: 'Пусто' })");
      await updateDutySchedule(date, { duty: 'Пусто' });  // Обновляем расписание
    }
  }
}



export async function fillDutySchedule1(input_day: number = 1) {
  const currentDate = new Date();
  const nextMonth = currentDate.getMonth();  // Месяц
  const currentYear = currentDate.getFullYear();
  const totalDays = getDaysInMonth(nextMonth);  // Получаем количество дней в следующем месяце

  const queueDuty = await findQueueDuty();  // Получаем очередь дежурств

  let indexQueue = 0;  // Индекс текущего дежурного
  const indexListNoEmploy: number[] = [];  // Список индексов сотрудников, которые не работают
  let day_global_for = input_day || 1;

  for (day_global_for; day_global_for <= totalDays; day_global_for++) {
    const date = format(new Date(currentYear, nextMonth, day_global_for), 'yyyy-MM-dd');  // Форматируем текущую дату
    console.log();
    console.log("date:", date); // ////////////////////////////////////////////////////////////////////////

    const dutySchedule = await findDutySchedule(date);

    if (dutySchedule?.weekday === 0) {  // Пропускаем воскресенье
      console.log("Воскресенье");
      continue;
    }

    const dutyScheduleEmployees = dutySchedule?.employees;  // Получаем список сотрудников, работающих в этот день
    console.log("dutyScheduleEmployees:", dutyScheduleEmployees);
    console.log("queueDuty?.queue:", queueDuty?.queue);

    let bool_flag = false;

    // Проверяем тех, кто не мог выйти на дежурство раньше
    if (indexListNoEmploy.length > 0) {
      for (const indexInList of indexListNoEmploy) {
        if (dutyScheduleEmployees.includes(queueDuty?.queue[indexInList])) {  // Если текущий дежурный в списке работающих
          console.log("updateDutySchedule(date, { duty: queueDuty?.queue[indexInList] })");
          await updateDutySchedule(date, { duty: queueDuty?.queue[indexInList] });  // Обновляем расписание
          bool_flag = true;
          indexListNoEmploy.splice(indexListNoEmploy.indexOf(indexInList), 1);  // Удаляем индекс из списка не работающих
          break;
        }
      }
    }

    if (!bool_flag) {
      // Проверяем текущий индекс очереди
      if (dutyScheduleEmployees.includes(queueDuty?.queue[indexQueue])) {
        console.log("updateDutySchedule(date, { duty: queueDuty?.queue[indexQueue] })");
        await updateDutySchedule(date, { duty: queueDuty?.queue[indexQueue] });  // Обновляем расписание
        bool_flag = true;
        indexQueue++;
      } else {
        indexListNoEmploy.push(indexQueue);  // Добавляем индекс дежурного в список не работающих
      }
    }

    if (!bool_flag) {
      // Проверяем оставшуюся очередь
      for (let i = indexQueue; i < queueDuty?.queue.length; i++) {
        if (dutyScheduleEmployees.includes(queueDuty?.queue[i])) {
          console.log("updateDutySchedule(date, { duty: queueDuty?.queue[i] })");
          await updateDutySchedule(date, { duty: queueDuty?.queue[i] });  // Обновляем расписание
          bool_flag = true;
          indexQueue = i + 1;
          break;
        } else {
          indexListNoEmploy.push(i);
        }
      }

      // Если не нашли дежурного, проверяем начало очереди
      if (!bool_flag) {
        for (let j = 0; j < indexQueue; j++) {
          if (dutyScheduleEmployees.includes(queueDuty?.queue[j])) {
            console.log("updateDutySchedule(date, { duty: queueDuty?.queue[j] })");
            await updateDutySchedule(date, { duty: queueDuty?.queue[j] });  // Обновляем расписание
            bool_flag = true;
            indexQueue = j + 1;
            break;
          } else {
            indexListNoEmploy.push(j);
          }
        }
      }
    }

    if (!bool_flag) {
      console.log("updateDutySchedule(date, { duty: 'Пусто' })");
      await updateDutySchedule(date, { duty: 'Пусто' });  // Обновляем расписание
    }

    if (indexQueue >= queueDuty?.queue.length) {
      indexQueue = 0;  // Обновляем индекс очереди
    }
  }
}



export function getMonthName(monthIndex: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
}

// export function isWorkingOnDay(workSchedule: number[], startWorkDate: string, year: number, month: number, day: number): boolean {
//   const workDayOfWeek = new Date(year, month, day).getDay();
//   const index = workDayOfWeek === 0 ? 6 : workDayOfWeek - 1;
//   return workSchedule[index] === 1;
// }

export function isWorkingOnDay(workSchedule: number[], startWorkDate: string, year: number, month: number, day: number): boolean {
  if (workSchedule.length === 4) {
    const date = new Date(year, month, day);
    const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / (24 * 60 * 60 * 1000));

    // Определяем день в цикле 4-дневного графика
    const dayInCycle = dayOfYear % 4;

    return workSchedule[dayInCycle] === 1;
  }

  const workDayOfWeek = new Date(year, month, day).getDay();
  const index = workDayOfWeek === 0 ? 6 : workDayOfWeek - 1;
  return workSchedule[index] === 1;
}

