const { USDMClient } = require('binance');
const WebSocket  = require('ws');
require('dotenv').config();
var _ = require('lodash');


let orders = new Map();
let blocked = false



const API_KEY = process.env.TST_API_KEY;
const API_SECRET = process.env.TST_SECRET_KEY;

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
      
      //console.log(signal);
      if (blocked) {
        console.log('Приложение заблокировано')
        return;
      }
      if (getOpenordersCount(orders) >= 5) {
        console.log(`Превышен лимит открытых позиций`)
        return;
      }
      
      if(orders.has(signal.symbol)) {
        console.log(`${signal.symbol} есть в списке, проверяем открыта ли позиция...`)
        if(orders.get(signal.symbol).opened){
          console.log(`Позиция по ${signal.symbol} открыта`);
          return;
        }
        console.log(`Размещаем ордер на ${signal.symbol}`)
        let newOrder = await makeOrder(signal.symbol);
        orders.set(signal.symbol, {
          orderid: newOrder.orderId,
          opened: true,
          opentime: Date.now()
        })
      }
      else {
        console.log(`${signal.symbol} еще нет в списке, добавляем...`)
        console.log(`Размещаем ордер на ${signal.symbol}`)
        let newOrder = await makeOrder(signal.symbol);
        orders.set(signal.symbol, {
          orderid: newOrder.orderId,
          opened: true,
          opentime: Date.now()
        })
      }
      
        
           
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
true);

//const symbol = 'MTLUSDT';


const makeOrder = (async (s) => {
    try {
      // TODO: check balance and do other validations
  
     
      /*let info = await client.getExchangeInfo()
      const symInfo = _.find(info.symbols, function(o) {return o.symbol == s});
      //console.log(symInfo);
     
      const pricePrecision = symInfo.pricePrecision;
      const quantityPrecision = symInfo.quantityPrecision;
      

      const assetPrices = await client.getMarkPrice({
        symbol: s
      })

      const markPrice = Number(assetPrices.markPrice)
      const qty = (40/markPrice).toFixed(quantityPrecision);
      const stopLossPrice = Number(markPrice * 0.99).toFixed(pricePrecision)
      const takeProfitPrice = Number(markPrice * 1.02).toFixed(pricePrecision)
      //console.log(`quantity: ${qty}, stop loss: ${stopLossPrice}, take profit: ${takeProfitPrice}`)
      // create three orders
      // 1. entry order (GTC),
      // 2. take profit order (GTE_GTC),
      // 3. stop loss order (GTE_GTC)
  
      const entryOrder = {
        positionSide: "BOTH",
        quantity: qty,
        reduceOnly: "false",
        side: "BUY",
        symbol: s,
        type: "MARKET",
      };
  
      const takeProfitOrder = {
        positionSide: "BOTH",
        priceProtect: "TRUE",
        quantity: qty,
        side: "SELL",
        stopPrice: takeProfitPrice,
        symbol: s,
        timeInForce: "GTE_GTC",
        type: "TAKE_PROFIT_MARKET",
        workingType: "MARK_PRICE",
        closePosition: "true"
      };
  
      const stopLossOrder = {
        positionSide: "BOTH",
        priceProtect: "TRUE",
        quantity: qty,
        side: "SELL",
        stopPrice: stopLossPrice,
        symbol: s,
        timeInForce: "GTE_GTC",
        type: "STOP_MARKET",
        workingType: "MARK_PRICE",
        closePosition: "true"
      };

      */
      const tempOrder = {
        orderId: getRandomInt(1000000000,9999999999),
        symbol: s,
       
      }
      /*const mainOrder = await client.submitNewOrder(entryOrder)
        .catch(e => console.log(e?.body || e));
      console.log(mainOrder);

      const backetOrders = await client.submitMultipleOrders([takeProfitOrder, stopLossOrder])
        .catch(e => console.log(e?.body || e));
      console.log(backetOrders);*/


      return tempOrder;
    } catch (e) {
      console.log(e);
    }
  });

  function getRandomInt(min, max) {
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
}