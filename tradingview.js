const axios = require('axios');
const mysql = require('mysql2')
const {get} = require("axios");
const {response} = require("express");

require('dotenv').config();

const url = process.env.TRADINGVIEW_URL

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

/*
const sql1 = 'SELECT symbol FROM symbols';
connection.query(sql1,(err, results) => {
    if (err) console.log(err);
    let symbols = results.map(item => item.symbol);
     console.log(symbols);
});*/

connection.promise().query('SELECT symbol FROM symbols')
    .then((results) => {
        let symbols = results[0].map(item => `BINANCE:${item.symbol}`)
        return symbols
    })
    .catch(console.log)
    .then(async (symbols)=> {
        await setInitialData(symbols)
        return symbols
    })
    .then((symbols) => {
        console.log('Запускаем мониторинг...')
        let monitoring  =  setInterval(async()=>{
            let data = await getRecommendations(symbols);
            //console.log(data)
            data.map((item)=>{
                connection.promise().query(`SELECT symbol, rec FROM symbols WHERE symbol = '${item.s.slice(8)}'`)
                    .then((symbol)=>{
                        if(Math.abs(item.d[0]) > 0.6) {
                            //console.log (`${item.s} - Новое занчение: ${getRec(item.d[0])}`)
                            if (getRec(item.d[0]) !== symbol[0][0].rec) {
                                let smile = '🍏';
                                if (item.d[0] < 0) {
                                    smile = '🍎';
                                }
                                //console.log(`${item.s.slice(8)} - ${getRec(item.d[0])}/${item.d[0]} (OLD - ${symbol[0][0].rec})`)
                                sendMessage(`${smile} <a href='https://www.binance.com/ru/futures/${item.s.slice(8)}'>${item.s.slice(8)}</a> - ${getRec(item.d[0])}/${item.d[0]} (prev - ${symbol[0][0].rec})`)
                            }
                        }
                        connection.query(`UPDATE symbols SET rec = '${getRec(item.d[0])}' WHERE symbol = '${item.s.slice(8)}'`)
                    })

            })
        }, 5000)

    })


async function setInitialData(symbols){
    console.log('Setting initial data...')
   let data = await getRecommendations(symbols);
   await data.map(item=>{
       //console.log(item.d[0]);
       //console.log(item.s.slice(8))
       let Recomend = getRec(item.d[0])
       //console.log(Recomend)
       connection.query(`UPDATE symbols SET rec = '${Recomend}' WHERE symbol = '${item.s.slice(8)}'`);
   })
    console.log('Ready!')
}

async function getRecommendations(symbols) {
    return await axios.post(url, {"symbols": {"tickers": symbols, "query": {
                "types": []}}, "columns": ["Recommend.All|120"]})
        .then((response) => {
            //console.log(response.data.data)
            return response.data.data
        });
}

function getRec(value) {
    let Rec = '';
    if ((value >= -1) && (value < -0.5)) {Rec = 'STRONG SELL'}
    if ((value >= -0.5) && (value < -0.1)) {Rec = 'SELL'}
    if ((value >= -0.1) && (value <= 0.1)) {Rec = 'NEUTRAL'}
    if ((value > 0.1) && (value <= 0.5)) {Rec = 'BUY'}
    if ((value > 0.5) && (value <= 1)) {Rec = 'STRONG BUY'}
    //console.log(Rec);
    return Rec
}

async function sendMessage(message) {
    await connection.promise().query('SELECT * FROM users')
        .then((results) => {
            //console.log(results)
            results[0].map(user => {
                console.log(user.chatid)
                axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,{text:message, chat_id: user.chatid, parse_mode:'HTML', disable_web_page_preview: true});
                console.log(`Message sent to user ${user.chatid}`)
            })

        })

}

