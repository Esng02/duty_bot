import { MongoClient } from 'mongodb';
import { format, getDaysInMonth, getDay } from 'date-fns';

// URL и имя базы данных MongoDB
const mongoURI = 'mongodb://localhost:27017';
const dbName = 'telegram_bot';

// Экземпляр клиента MongoDB
let dbClient: MongoClient;

// Подключение к MongoDB
MongoClient.connect(mongoURI)
  .then(client => {
    console.log('Подключено к MongoDB');
    dbClient = client;
  })
  .catch(err => console.error('Ошибка подключения к MongoDB:', err));

async function fillSchedule() {
    const client = new MongoClient(mongoURI);
    const dutyScheduleCollection = client.db(dbName).collection('Duty_Schedule');

    await client.connect();

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();  ///////////////////////////////////////////////////////
    const currentYear = currentDate.getFullYear();  ///////////////////////////////////////////////////////////

    const daysInMonth = getDaysInMonth(new Date(currentYear, currentMonth));
    for (let month = currentMonth; month < 12; month++) {
        const MonthName = getMonthName(month);
        for (let day = 1; day <= daysInMonth; day++) {
            const date = format(new Date(currentYear, month, day), 'yyyy-MM-dd');
            const weekday = getDay(date);

            // Записываем в Duty_schedule
            await dutyScheduleCollection.insertOne({
                month_name: MonthName,
                date: date,
                weekday: weekday,
                employees: [],
                duty: ""
                });
        }
    }
};

function getMonthName(monthIndex: number): string {
    const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
};

fillSchedule();
