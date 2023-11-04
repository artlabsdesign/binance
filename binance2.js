const { USDMClient } = require('binance');
const WebSocket = require('ws');
const readline = require('readline');
require('dotenv').config();
var _ = require('lodash');


//let orders = new Map();
//let blocked = false

/*const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})*/

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.SECRET_KEY;
const leverage = process.env.LEVERAGE;
const margin = process.env.MARGIN;
const takelong = process.env.TAKELONG;
const takeshort = process.env.TAKESHORT;
const stoplong = process.env.STOPLONG;
const stopshort = process.env.STOPSHORT;
const inverse = process.env.INVERSEMODE;

const side = {
  main: {
    long: 'BUY',
    short: 'SELL'
  },
  bracket: {
    long: 'SELL',
    short: 'BUY'
  }
}

const inv = {
  long: 'short',
  short: 'long'
}

const mult = {
  take: {
    long: takelong,
    short: takeshort
  },
  stop: {
    long: stoplong,
    short: stopshort
  }
}

const wsServer = new WebSocket.Server({port: 9000});
console.log('Сервер запущен на 9000 порту');

wsServer.on('connection', onConnect)

function onConnect(wsClient) {
  console.log('Новый пользователь');
  // отправка приветственного сообщения клиенту
  wsClient.send('Привет');
  wsClient.on('message', async function(message) {
    try {
      // сообщение пришло текстом, нужно конвертировать в JSON-формат
      const jsonMessage = JSON.parse(message);
      const signal = JSON.parse(jsonMessage.data);
      console.log(signal)
      console.log(await placeOrder(signal))
           
      }
      
    catch (error) {
      console.log('Ошибка', error);
    }
  
  })
  wsClient.on('close', function() {
    // отправка уведомления в консоль
    console.log('Пользователь отключился');
  })
}



const client = new USDMClient({
  api_key: API_KEY,
  api_secret: API_SECRET
},
  {},
  false);

//const symbol = 'MTLUSDT';


const makeOrder = (async (s) => {
  try {
    // TODO: check balance and do other validations


    let info = await client.getExchangeInfo()
    const symInfo = _.find(info.symbols, function (o) { return o.symbol == s.symbol });
    //console.log(symInfo);

    const pricePrecision = symInfo.pricePrecision;
    const quantityPrecision = symInfo.quantityPrecision;
    const direction = s.direction;
    if (inverse) {
      direction = inv[direction];
    }
    const stopMult = mult.stop[direction];
    const takeMult = mult.take[direction];
    const mainside = side.main[direction];
    const bracketside = side.bracket[direction];

    const assetPrices = await client.getMarkPrice({
      symbol: s.symbol
    })

    const markPrice = Number(assetPrices.markPrice)
    const qty = (margin * leverage / markPrice).toFixed(quantityPrecision);
    const stopLossPrice = Number(markPrice * stopMult).toFixed(pricePrecision)
    const takeProfitPrice = Number(markPrice * takeMult).toFixed(pricePrecision)
    //console.log(`quantity: ${qty}, stop loss: ${stopLossPrice}, take profit: ${takeProfitPrice}`)
    // create three orders
    // 1. entry order (GTC),
    // 2. take profit order (GTE_GTC),
    // 3. stop loss order (GTE_GTC)

    const entryOrder = {
      positionSide: "BOTH",
      quantity: qty,
      reduceOnly: "false",
      side: mainside,
      symbol: s.symbol,
      type: "MARKET",
    };

    const takeProfitOrder = {
      positionSide: "BOTH",
      priceProtect: "TRUE",
      quantity: qty,
      side: bracketside,
      stopPrice: takeProfitPrice,
      symbol: s.symbol,
      timeInForce: "GTE_GTC",
      type: "TAKE_PROFIT_MARKET",
      workingType: "MARK_PRICE",
      closePosition: "true"
    };

    const stopLossOrder = {
      positionSide: "BOTH",
      priceProtect: "TRUE",
      quantity: qty,
      side: bracketside,
      stopPrice: stopLossPrice,
      symbol: s.symbol,
      timeInForce: "GTE_GTC",
      type: "STOP_MARKET",
      workingType: "MARK_PRICE",
      closePosition: "true"
    };


    /*const tempOrder = {
      orderId: getRandomInt(1000000000,9999999999),
      symbol: s,
     
    }*/

    const leverageParams = {
      symbol: s.symbol,
      leverage: leverage
    }
    await client.setLeverage(leverageParams)
    const mainOrder = await client.submitNewOrder(entryOrder)
      .catch(e => console.log(e?.body || e));
    console.log(mainOrder);

    const backetOrders = await client.submitMultipleOrders([takeProfitOrder, stopLossOrder])
      .catch(e => console.log(e?.body || e));
    console.log(backetOrders);



  } catch (e) {
    console.log(e);
  }
});

/*  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getOpenordersCount (orders) {
  let count = 0
  for (let order of orders) {
    if (order[1].opened){
      console.log(order)
      count ++;
      console.log(count)
    }

  }
  return count;
}*/


const getOpenPos = (async (o) => {
  const allPositions = await client.getPositions();
  const allPMap = new Map(allPositions.map((sym) => [sym.symbol, '']))
  const openPos = allPositions.filter(isOpen);
  const openP = new Map(openPos.map((sym) => [sym.symbol, '']))
  //console.log(openP);
  return [allPMap, openP];
})

function isOpen(pos) {
  if (parseFloat(pos.positionAmt) !== 0) {
    return pos.symbol;
  }
}

//getOpenPos();

/*function inputSignal(question) {
  rl.question(question, async (answer) => {

    rl.write(`Введено значение: ${answer}\n`)
    const order = await placeOrder(answer)
    rl.write(`${order}\n`)
    inputSignal(question)
  })
}*/

async function placeOrder(signal) {
  const openPos = await getOpenPos()
  if (!openPos[0].has(signal.symbol)) {
    return 'Некорректное название пары'
  }
  if (openPos[1].size > 10) {
    return 'Превышен лимит открытых позиций'
  }
  if (openPos[1].has(signal.symbol)) {
    return 'Позиция по этой паре уже открыта'
  }
  await makeOrder(signal);
  return `Разместили ордер на ${signal.symbol}`
}

//inputSignal('Input symbol: ')