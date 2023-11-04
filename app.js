#!/usr/bin/env node

const axios = require('axios');
const mysql = require('mysql2');
require('dotenv').config();
const WebSocket  = require('ws');

const myWs = new WebSocket('ws://localhost:9000');

// Функции по работе с WebSocket
    myWs.onopen = function () {
        console.log('подключился');
    };
    // обработчик сообщений от сервера
    myWs.onmessage = function (message) {
        console.log('Message: %s', message.data);
    };
    // функция для отправки echo-сообщений на сервер
    function wsSendEcho(value) {
        myWs.send(JSON.stringify({action: 'ECHO', data: value.toString()}));
    }
    // функция для отправки команды ping на сервер
    function wsSendPing() {
        myWs.send(JSON.stringify({action: 'PING'}));
    }

//---------------------------------------

const connection = mysql.createConnection({
    host: "localhost",
    user: process.env.MYSQL_USER,
    database: "binance",
    password: process.env.MYSQL_PASSWORD
});
connection.connect(function(err){
    if (err) {
        return console.error("Ошибка: " + err.message);
    }
    else{
        console.log("Подключение к серверу MySQL успешно установлено");
    }
})


let timer = setInterval( () => {
axios.get('https://fapi.binance.com/fapi/v1/ticker/price').then(
    function (responce){
        //console.log(responce.data)
       /* responce.data.map((item) => {
            let symbol = [item.symbol];
            const sql1 = 'SELECT * FROM symbols WHERE `symbol` = ?'
            connection.query(sql1, symbol, function(err, results) {
                if(err) console.log(err);
                console.log(results)
            });

            const sql = 'INSERT INTO symbols(symbol,price) VALUES(?,?)';
            connection.query(sql, symbol, function(err, results) {
                if(err) console.log(err);
                else console.log("Данные добавлены");
            });
        });*/

        responce.data.map((item) => {

            let symbol = [item.symbol];
            const sql1 = 'SELECT * FROM symbols WHERE `symbol` = ?'
            connection.query(sql1, symbol, function (err, results) {
                if (err) console.log(err);
                let priceArray = [];
                if (results[0]){
                    priceArray = JSON.parse(results[0].price);
                    if (!Array.isArray(priceArray)){
                        priceArray = [{time: Date.now(),price: results[0].price}]
                    }
                }

                let newpriceObject = {time: Date.now(), price: parseFloat(item.price)};
                //console.log(priceArray);
                priceArray.push(newpriceObject);
                //console.log(priceArray)
                if (priceArray.length > 4) {
                    priceArray.splice(0, priceArray.length-4)
                }
                let interval = priceArray[priceArray.length - 1].time - priceArray[0].time;
                let percent = ((priceArray[priceArray.length - 1].price - priceArray[0].price) / priceArray[0].price) * 100;
                let direction = 'short';
                let smile = '📉';
                if (percent > 0){
                   direction = 'long'
                    smile = '📈'
                }
                if ((interval > 30000) && (interval < 9900000)) {
                    if (Math.abs(percent) > 0.2){
                        //logMessage(`${item.symbol} - ${(interval / 60000).toFixed(1)} мин, ${direction} ${Math.abs(percent.toFixed(3))}%`);
                        //wsSendEcho(`{"symbol": "${item.symbol}", "direction": "${direction}"}`);
                    }

                }
                if (interval < 50000) {
                    if (Math.abs(percent) > 0.7){
                        logMessage(`${item.symbol} - ${(interval / 60000).toFixed(1)} мин, ${direction} ${Math.abs(percent.toFixed(3))}%`);
                        sendAlert(`${smile} <a href = 'https://www.binance.com/ru/futures/${item.symbol}'>${item.symbol}</a> - ${(interval / 60000).toFixed(1)} мин, ${direction} ${Math.abs(percent.toFixed(3))}%`);
                        wsSendEcho(`{"symbol": "${item.symbol}", "direction": "${direction}"}`);
                    }

                }
                let data = [item.symbol];
                const sql2 = `UPDATE symbols SET price = '${JSON.stringify(priceArray)}' WHERE symbol = ?`
                connection.query(sql2, data, function (err, results) {
                    if (err) console.log(err);
                    //сonsole.log(results)
                });
            });

        });

function sendAlert (message) {
    const sql1 = 'SELECT * FROM users'
    connection.query(sql1, function (err, results) {
        if (err) console.log(err);
        console.log(results);
        results.map ((user) => {
            axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,{text:message, chat_id: user.chatid, parse_mode:'HTML', disable_web_page_preview: true});
        })



    });
    
}
function logMessage(message) {
    console.log(message);
}


        })
    }, 12000);


