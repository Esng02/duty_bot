import { Telegraf, Context, Markup } from 'telegraf';
import { connectDB } from './db/connection';
import { findUserById, createUser, updateUserWorkSchedule, updateUserStartDate, getAtherUserId, dropDataAboutUser } from './data/usersData';
import { findDutySchedule, updateDutySchedule, findDutyScheduleDate } from './data/dutyScheduleData';
import { findQueueDuty, addQueueDuty, userNotQueueDuty, dropUserOfQueueDuty } from './data/queueDutyData';
import { addFirstDate, addSecondDate, dropTwoDates, addFirstName, addSecondName } from './data/twoDatesData';
import { reverseFirstOnSecond, reverseSecondOnFirst } from './data/reverseTwoDatesDutySchedule';
import { addDutyDuties } from './data/dateDutyDuties';
import { format, getDaysInMonth, getDay, getDate } from 'date-fns';
import cron from 'node-cron';
import { getMonthName, isWorkingOnDay, fillDutySchedule, fillWorkSchedule } from './utils';
import { callback } from 'telegraf/typings/button';

const bot = new Telegraf('7421143987:AAEs8YZ59BGaKV4B99S4vkyO3pV5dj7LQXo');

const userSelections: { [key: string]: Set<string> } = {};

// Подключение к базе данных
connectDB();

// Команда /start
bot.start(async (ctx: Context) => {
  const id = ctx.from?.id || 0;
  const username = ctx.from?.username || "";

  const existingUser = await findUserById(id);

  if (!existingUser) {
    await createUser(id, username);
    ctx.reply('Выберите график работы:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Разработчик', callback_data: '6/1' }],
          [{ text: 'ОП', callback_data: '5/2' }],
          [{ text: 'СЗП', callback_data: '2/2' }]
        ]
      }
    });
  } else {
    ctx.reply('Вы уже зарегистрированы.');
    ctx.reply('Введите /menu, чтобы увидеть доступные команды.');
  }
});


cron.schedule('30 17 * * *', async () => {
  // Задача запускается каждый день в 17:30: присылает сообщение с напоминаем дежурному
  const now = new Date();
  const currentDateStr = format(now, 'yyyy-MM-dd');
  const dutySchedule = await findDutySchedule(currentDateStr);
  const dutyUsers = dutySchedule?.duty;
  
  if (dutyUsers) {
    const message = 'Сегодня вы дежурный. Пожалуйста, выполните все необходимые задачи.';
    const users = await getAtherUserId(dutyUsers);
    const duty_id = users?.id;
    bot.telegram.sendMessage(duty_id, message);
  }
});


cron.schedule('30 19 * * *', async () => {
  // Задача запускается каждый день в 19:30: добавляет в коллекцию Date_duty_duties документ с датой, именем дежурного и статусом задач дежурных
  const now = new Date();
  const currentDateStr = format(now, 'yyyy-MM-dd');
  const dutySchedule = await findDutySchedule(currentDateStr);
  const dutyUsers = dutySchedule?.duty;
  
  if (dutyUsers) {
    const message = 'Обновляем данные за сегодняшнее дежурство.';
    const users = await getAtherUserId(dutyUsers);
    const duty_id = users?.id;
    bot.telegram.sendMessage(duty_id, message);
    
    const dict_duties = {
      "Молоко в холодильнике": userSelections[duty_id]?.has('option_1'),
      "Вынести мусор": userSelections[duty_id]?.has('option_2'),
      "Стаканы": userSelections[duty_id]?.has('option_3'),
      "Занести стол и стулья(пуфики)": userSelections[duty_id]?.has('option_4'),
      "Протереть столешницу": userSelections[duty_id]?.has('option_5'),
      "Помыть кофемашинку": userSelections[duty_id]?.has('option_6'),
      "Вылить воду из чайника": userSelections[duty_id]?.has('option_7')
    };

    addDutyDuties(currentDateStr, dutyUsers, dict_duties);  // Создает новый док в коллекции на сегодняшний день со статусом задач
    delete userSelections[duty_id];  // Очищает статус задач за сегодняшний день
  }
});

// Обработка выбора графика работы
bot.action('6/1', async (ctx: Context) => {
  const id = ctx.from?.id || 0;
  await updateUserWorkSchedule(id, [1, 1, 1, 1, 1, 1, 0]);
  ctx.reply('Введите дату начала графика работы в формате ГГГГ-ММ-ДД:');
});

bot.action('5/2', async (ctx: Context) => {
  // Обработка выбора графика работы 5/2
  const id = ctx.from?.id || 0;
  await updateUserWorkSchedule(id, [1, 1, 1, 1, 1, 0, 0]);

  // Запрашиваем дату начала графика работы
  ctx.reply('Введите дату начала графика работы в формате ГГГГ-ММ-ДД:');
});

bot.action('2/2', async (ctx: Context) => {
  // Обработка выбора графика работы 2/2
  const id = ctx.from?.id || 0;
  await updateUserWorkSchedule(id, [1, 1, 0, 0]);
  ctx.reply('Введите дату начала графика работы в формате ГГГГ-ММ-ДД:');
  });

bot.action('Меняем даты', async (ctx: Context) => {
  ctx.reply("Меняем даты дежурств");
  await reverseFirstOnSecond();
  await reverseSecondOnFirst();
  await dropTwoDates();
});

bot.action('Не меняем', async (ctx: Context) => {
  ctx.reply("Не меняем даты дежурств");
  await dropTwoDates();
});

// Обработчик нажатий на инлайн-кнопки
bot.action(/option_\d/, (ctx) => {
  const userId = ctx.from?.id.toString();
  const data = ctx.match[0];

  if (!userId) return;

  // Инициализируем выбор для пользователя, если его нет
  if (!userSelections[userId]) {
    userSelections[userId] = new Set();
  }

  // Управляем выбором
  if (userSelections[userId].has(data)) {
    userSelections[userId].delete(data);
    ctx.answerCbQuery('Выбор отменен');
  } else {
    userSelections[userId].add(data);
    ctx.answerCbQuery('Выбор добавлен');
  }

  // Обновляем сообщение с новыми кнопками
  const keyboard = [
    [{ text: userSelections[userId].has('option_1') ? '✓ Молоко в холодильнике' : 'Молоко в холодильнике', callback_data: 'option_1' }],
    [{ text: userSelections[userId].has('option_2') ? '✓ Вынести мусор' : 'Вынести мусор', callback_data: 'option_2' }],
    [{ text: userSelections[userId].has('option_3') ? '✓ Стаканы' : 'Стаканы', callback_data: 'option_3' }],
    [{ text: userSelections[userId].has('option_4') ? '✓ Занести стол и стулья(пуфики)' : 'Занести стол и стулья(пуфики)', callback_data: 'option_4' }],
    [{ text: userSelections[userId].has('option_5') ? '✓ Протереть столешницу' : 'Протереть столешницу', callback_data: 'option_5' }],
    [{ text: userSelections[userId].has('option_6') ? '✓ Помыть кофемашинку' : 'Помыть кофемашинку', callback_data: 'option_6' }],
    [{ text: userSelections[userId].has('option_7') ? '✓ Вылить воду из чайника' : 'Вылить воду из чайника', callback_data: 'option_7' }]
  ];

  ctx.editMessageText('Нажмите на кнопку, если выполнили задачу. (При повторном нажатии галочка исчезнет):', {
    reply_markup: { inline_keyboard: keyboard }
  });
});

// Обработка нажатий на кнопки
bot.action(/date_(.+)/, async (ctx) => {
  const date = ctx.match[1];
  const username = ctx.from?.username || "";
  ctx.reply(`Вы нажали на кнопку с датой: ${date}`);
  const today = new Date();
  const inputDate = new Date(date);

  const dutySchedule = await findDutySchedule(date);
  const atherName = dutySchedule?.duty;


  await addSecondDate(date);  // добавляет вторую дату
  await addSecondName(username);

  // Отправка сообщения дежурному
  const users = await getAtherUserId(atherName);
  const userId = users?.id;
  bot.telegram.sendMessage(userId, 'Внимание! Кто-то хочет поменяться с вами датами дежурств.\nВыберите действие: ', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Да, меняем', callback_data: 'Меняем даты'}],
        [{ text: 'Нет, не меняем', callback_data: 'Не меняем'}]
      ],
      resize_keyboard: true
    }
  })
});


// Команда /menu
bot.command('menu', async (ctx: Context) => {
    await ctx.reply('Выберите действие: ', {
      reply_markup: {
        keyboard: [
          ['Расписание дежурств на этот месяц'],
          ['Поменять дату дежурства', 'Дежурный сегодня'],
          ['Расписание дежурств на неделю'],
          ['Начать дежурство'],
          ['Удалить себя из базы данных (при смене графика или увольнения)']
        ],
        resize_keyboard: true
      }
    });
  });

bot.command('action', async (ctx: Context) => {
  await ctx.reply('Выберите действие: ', {
    reply_markup: {
      keyboard: [
        ['Да, меняем', 'Нет, не меняем'],
      ],
      resize_keyboard: true
    }
  });
});

  
// Обработка текстовых сообщений
bot.on('text', async(ctx: Context) => {
  const text = ctx.text;
  const id = ctx.from?.id || 0;
  const username = ctx.from?.username || "";
  const now = new Date();
  const currentDateStr = format(now, 'yyyy-MM-dd');

  if (text?.length === 10) {
    
    if (await userNotQueueDuty(username)) {

      await updateUserStartDate(id, text);
      await addQueueDuty(username);
      ctx.reply('Вы добавлены в очередь на дежурство.');
      ctx.reply('Введите /menu, чтобы увидеть доступные команды.');
      await fillWorkSchedule(Number(text.slice(5, 7)) - 1, Number(text.slice(8, 10)), text);
      await fillDutySchedule();
    }
     else {
      const newDate = ctx.text || "";
      const today = new Date();
      const inputDate = new Date(newDate);

      const dutySchedule = await findDutySchedule(newDate);
      const atherName = dutySchedule?.duty;


      await addSecondDate(newDate);  // добавляет вторую дату
      await addSecondName(username);

      // Отправка сообщения дежурному
      const users = await getAtherUserId(atherName);
      const userId = users?.id;
      bot.telegram.sendMessage(userId, 'Внимание! Кто-то хочет поменяться с вами датами дежурств.\nВыберите действие: ', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Да, меняем', callback_data: 'Меняем даты'}],
            [{ text: 'Нет, не меняем', callback_data: 'Не меняем'}]
          ],
          resize_keyboard: true
        }
      })
    }
  }

  if (text === 'Расписание дежурств на этот месяц') {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const totalDays = getDaysInMonth(now);
      const monthName = getMonthName(month);
      const nowDay = now.getDate();

      const messages = [];

      for (let day = nowDay; day <= totalDays; day++) {
          const date = format(new Date(year, month, day), 'yyyy-MM-dd');
          const dutySchedule = await findDutySchedule(date);
          const duty = dutySchedule?.duty || 'Дежурных нет';
          messages.push(`Дежурные на ${date}: ${duty}`);
      }

      for (const mess of messages) {
        await ctx.reply(mess);
      }

  } else if (text === 'Поменять дату дежурства') {
    ctx.reply('Поменять дату дежурства');

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = getMonthName(month);
    const nowDay = now.getDate();
    const daysInMonth = getDaysInMonth(new Date(year, month));
    let first_date: any;

    for (let i_day = nowDay; i_day < nowDay + 14; i_day++) {
      const i_date = format(new Date(year, month, i_day), 'yyyy-MM-dd');
      const dutySchedule = await findDutySchedule(i_date);
      const dutyNameThisDate = dutySchedule?.duty;
      console.log(dutyNameThisDate)
      if (dutyNameThisDate === username) {
        first_date = dutySchedule?.date;
        console.log(first_date, "break")
        break;
      } else {
        continue;
      }
    }
    await addFirstDate(first_date);
    await addFirstName(username);
    //  /////////////////////////////////////////////////////////////////////////// переделать под кнопки
    const messages = [];
    const keyboard = [];

    for (let day = nowDay; day < nowDay + 14; day++) {
      const date = format(new Date(year, month, day), 'yyyy-MM-dd');
      const dutySchedule = await findDutySchedule(date);
      const duty = dutySchedule?.duty || 'Дежурных нет';
      
      messages.push(`Дежурный на ${date}: ${duty}`);
      
      // Добавляем кнопку для каждой даты
      keyboard.push([Markup.button.callback(date, `date_${date}`)]);
    }

    // Отправляем сообщения с клавиатурой
    for (let i = 0; i < messages.length; i++) {
      await ctx.reply(messages[i], Markup.inlineKeyboard(keyboard[i]));
    }
    //  ///////////////////////////////////////////////////////////////////////

    ctx.reply('Напишите дату, на которую вы нацелены. Мы отправим сотруднику, который в этот день дежурить сообщение. Если он согласится, то вы будете дежурным в эту дату. Если нет, попробуйте договорится с сотрудником сами, и нажмите кнопку заново.');

  } else if (text === "Расписание дежурств на неделю") {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = getMonthName(month);
    const nowDay = now.getDate();
    const daysInMonth = getDaysInMonth(new Date(year, month));

    const messages = [];

    for (let day = nowDay; day <= nowDay + 6; day++) {
      const date = format(new Date(year, month, day), 'yyyy-MM-dd');
      const dutySchedule = await findDutySchedule(date);
      const duty = dutySchedule?.duty || 'Дежурных нет';
      messages.push(`Дежурный на ${date}: ${duty}`);
    }

    for (const mess of messages) {
      await ctx.reply(mess);
    }

  } else if (text === "Дежурный сегодня") {  // Кнопка -Дежурный сегодня-

    ctx.reply("Кнопка -Дежурный сегодня-");
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = getMonthName(month);
    const nowDay = now.getDate();

    const date = format(new Date(year, month, nowDay), 'yyyy-MM-dd');
    const dutySchedule = await findDutySchedule(date);
    const duty = dutySchedule?.duty || 'Дежурных нет';
    ctx.reply(`Сегодня ${date}, и сегодня дежурный:  ${duty}`);

} else if (text === 'Начать дежурство') {
  ctx.reply('Нажмите на кнопку, если выполнили задачу. (При повторном нажатии галочка исчезнет):', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Молоко в холодильнике', callback_data: 'option_1' }],
        [{ text: 'Вынести мусор', callback_data: 'option_2' }],
        [{ text: 'Стаканы', callback_data: 'option_3' }],
        [{ text: 'Занести стол и стулья(пуфики)', callback_data: 'option_4' }],
        [{  text: 'Протереть столешницу', callback_data: 'option_5' }],
        [{  text: 'Помыть кофемашинку', callback_data: 'option_6' }],
        [{ text: 'Вылить воду из чайника', callback_data: 'option_7' }]
      ]
    }
  });
} else if (text === 'Удалить себя из базы данных (при смене графика или увольнения)') {
  const nowDay = now.getDate();
  const dutyname = username;
  dropDataAboutUser(dutyname);
  dropUserOfQueueDuty(dutyname)
  .then(() => {
    fillDutySchedule(nowDay);
  });
  ctx.reply('Вы удалены из базы данных');
}

});


// Запускаем бота
bot.launch();