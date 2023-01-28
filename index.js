const TelegramApi = require('node-telegram-bot-api')
const {gameOptions, againOptions} = require('./options')
const sequelize = require('./db')
const UserModel = require('./models')

const token = '5693665980:AAHBxSm7oT3TDkoJQP2tal6rnLizFSF1GsY'

const bot = new TelegramApi(token, {polling: true})

const chats = {}

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, 'Се3йчас я загадаю цифру от 0 до 9, а ты должен её угадать!')
    const randomNumber = Math.floor(Math.random() * 10)
    chats[chatId] = randomNumber
    await bot.sendMessage(chatId, 'Отгадывай', gameOptions)
}

const start = async () => {

    try {
        await sequelize.authenticate()
        await sequelize.sync()
    } catch (e) {
        console.log('Подключение к бд сломалось: ', e)
    }

    bot.setMyCommands([
        {command: '/start', description: 'Начальное приветствие'},
        {command: '/info', description: 'Получить информацию о пользователе'},
        {command: '/game', description: 'Игра угадай число'}
    ])

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;

        try {
            if (text === '/start') {
                await UserModel.create({chatId})
                await bot.sendSticker(chatId, 'https://d16u9y6cg00afk.cloudfront.net/HackerBoyStickers/1602525.160.webp')
                return bot.sendMessage(chatId, `Добро пожаловать в телеграм бот Satourn`);
            }
            if (text === '/info') {
                const user = await UserModel.findOne({chatId})
                return bot.sendMessage(chatId, `Тебя зовут ${msg.from.first_name} ${msg.from.last_name}, в игре у тебя правильных ответов ${user.right}, неправильных ${user.wrong}`)
            }
            if (text === '/game') {
                return startGame(chatId);
            }

            return bot.sendMessage(chatId, 'Я тебя не понимаю, попробуй ещё раз!)')
        } catch (e) {
            console.log(e)
            return bot.sendMessage(chatId, 'Произошла какая-то ошибка!');
        }

    })

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;
        if (data === '/again') {
            return startGame(chatId)
        }

        const user = await UserModel.findOne({chatId})

        if (chats[chatId] == (data)) {
            user.right += 1;
            await bot.sendMessage(chatId, `Поздравляю! Ты отгадал цифру ${chats[chatId]}`, againOptions)
        } else {
            user.wrong += 1;
            await bot.sendMessage(chatId, `К сожалению ты не угадал, бот загадал цифру ${chats[chatId]}`, againOptions)
        }
        await user.save();
    })
}

start()