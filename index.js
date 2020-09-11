const http = require('http');
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;

const bot = new TelegramBot(token, {
  polling: true
});

const players = [];

const getPlayerIndex = (player) => {
  return players.findIndex(pl => (pl.id === player.id && pl.username === player.username))
};

const formatMessage = (players) => {
  const formatedMsgArray = players.map((player, index) => {
    return `${index + 1}. ${player.username}`
  })
  return formatedMsgArray.length === 0 ? 'Список пуст' : formatedMsgArray.join('\n')
};

const isAdmin = (user) => {
  return user.status == 'creator' || user.status == 'administrator'
}

bot.onText(/\+/, (msg) => {
  const chatId = msg.chat.id;
  const index = getPlayerIndex(msg.from)
  if (index === -1) {
    players.push(msg.from)
    bot.sendMessage(chatId, `${msg.from.username} ты добавлен в список`);
    bot.sendMessage(chatId, formatMessage(players));
  } else {
    bot.sendMessage(chatId, `${msg.from.username} ты уже в списке`);
  }
});

bot.onText(/\-/, (msg) => {
  const chatId = msg.chat.id;
  const index = getPlayerIndex(msg.from)
  if (index !== -1) {
    players.splice(index, 1)
    bot.sendMessage(chatId, `${msg.from.username} ты удален из списка`);
    bot.sendMessage(chatId, formatMessage(players));
  } else {
    bot.sendMessage(chatId, `${msg.from.username} тебя нет в списке`);
  }
});

bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, formatMessage(players));
});

bot.onText(/\/clear/, (msg) => {
  bot.getChatMember(msg.chat.id, msg.from.id).then(user => {
		if (isAdmin(user)) {
			const chatId = msg.chat.id;
      players.splice(0, players.length)
      bot.sendMessage(chatId, 'Список пустой');
		} else{
			bot.sendMessage(msg.id, 'Нет прав очищать список');
		}
	});
});

bot.onText(/\/add/, (msg, match) => {
  const chatId = msg.chat.id;
  const name = match.input.substring(5, match.input.length);
  if (name === undefined) {
    bot.sendMessage(
        chatId,
        'Добавь имя',
    );
    return;
  }
  const player = { ...msg.from };
  player.username = `${name} (от ${player.username})`
  players.push(player)
  bot.sendMessage(chatId, formatMessage(players));
});

bot.onText(/\/remove/, (msg, match) => {
  const chatId = msg.chat.id;
  const index = match.input.split(' ')[1];
  if (index === undefined) {
    bot.sendMessage(
        chatId,
        'Выбери номер в списке',
    );
    return;
  }
  if (!players[+index - 1]) {
    bot.sendMessage(
      chatId,
      'Нет такого номер в списке',
    );
    return;
  }
  const player = players[+index - 1]
  if (player.id !== msg.from.id) {
    bot.sendMessage(
      chatId,
      'У тебя нет право удалять чужого игрока',
    );
    return;
  }
  players.splice(+index - 1, 1);
  bot.sendMessage(chatId, formatMessage(players));
});

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
}).listen(3005, 'localhost');

console.log('Server running at http://localhost:3005/');