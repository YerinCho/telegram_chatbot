import TelegramBot from "node-telegram-bot-api";
import * as dotenv from 'dotenv';
import {scheduleJob} from "node-schedule";
import Axios from "axios";

dotenv.config({path: './env/.env'})
const token: string = process.env.TOKEN!;
const bot = new TelegramBot(token, {polling: true});
const chatIdSet = new Set<number>();
const service = async (): Promise<number> => {
  const res = await Axios.get('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=KRW');
  return res.data.KRW;
}
let prePrice: number;
service().then(res => prePrice = res);

const createMessage = (prePrice: number, newPrice: number, differ: number) => {
  let state = "UP";
  if (differ < 0) state = "DOWN";
  if (differ === 0) state = "SAME";
  return `Bitfinex-BTC-KRW: ${Math.round(newPrice * 100) / 100}, ${state} ${Math.round(Math.abs(differ) * 100) / 100}`;
}

const sendBitcoin = () => {
  scheduleJob('0 * * * * *', async () => {
    const newPrice = await service();
    const differ = newPrice - prePrice;
    const message = createMessage(prePrice, newPrice, differ);
    chatIdSet.forEach(chatId => {
      bot.sendMessage(chatId, message).catch(e => console.log(e));
    });
  });
}

const sendWelcome = (chatId: number) => {
  const welcomeMsg = 'Hi~! I\'m bitcoin notice bot! I send you Bitcoin info every minute.\n' +
    'These are commands:\n/start - start notify bitcoin info\n/stop - stop notify bitcoin\n\n\n'
  bot.sendMessage(chatId, welcomeMsg);
}

bot.on('channel_chat_created', (msg) => {
  const chatId = msg.chat.id;
  sendWelcome(chatId);
  chatIdSet.add(chatId);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!chatId) return;
  sendWelcome(chatId);
  chatIdSet.add(chatId);
});

bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "stop receiving messages...😭");
  chatIdSet.delete(chatId);
});

sendBitcoin();
