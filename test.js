let orders = new Map();
orders.set('BTCUSDT', {
    orderid: 123123123,
    opened: false,
    opentime: 123123123
})

for (let order of orders) { 
    console.log(order[1].opened)
}

if (orders.has('BTCUSDT')) {
    //console.log('Exist')
}
let symbol = 'BTCUSDT';
//console.log(orders.get(symbol).orderid)