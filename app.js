#!/usr/bin/env node

const axios = require('axios');
const mysql = require('mysql2');


const connection = mysql.createConnection({
    host: "localhost",
    user: "binance_mysql",
    database: "binance",
    password: "Anton31337"
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
                if (priceArray.length > 6) {
                    priceArray.splice(0, priceArray.length-6)
                }
                let interval = priceArray[priceArray.length - 1].time - priceArray[0].time;
                let percent = ((priceArray[priceArray.length - 1].price - priceArray[0].price) / priceArray[0].price) * 100;
                let direction = 'short';
                if (percent > 0){
                   direction = 'long'
                }
                if ((interval > 30000) && (interval < 9900000)) {
                    if (Math.abs(percent) > 0.2){
                        logMessage(`${item.symbol} - ${(interval / 60000).toFixed(1)} мин, ${direction} ${Math.abs(percent.toFixed(3))}%`);
                    }

                }
                if ((interval > 50000) && (interval < 75000)) {
                    if (Math.abs(percent) > 0.99){
                        sendAlert(`${item.symbol} - ${(interval / 60000).toFixed(1)} мин, ${percent.toFixed(3)}%`);
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
    axios.post('https://n8n.kostyukovich-dev.com/webhook/7310760b-15bc-41d4-94e6-60599d28c387', {message: message})

}
function logMessage(message) {
    console.log(message);
}


        })
    }, 12000);


/*const user = ["Tom", 29];
const sql = "INSERT INTO users(name, age) VALUES(?, ?)";

connection.query(sql, user, function(err, results) {
    if(err) console.log(err);
    else console.log("Данные добавлены");
});*/


