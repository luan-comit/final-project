

console.log(graphLabel);
console.log(prices);
console.log(dates);

var ctx = document.getElementById('myGraph');
var myGraph = new Chart(ctx, {
    type: 'line',
    data: {
        labels: dates,
        datasets: [{
            label: 'item price',
            data: prices,
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                //'rgba(54, 162, 235, 0.2)',
                //'rgba(255, 206, 86, 0.2)',
                //'rgba(75, 192, 192, 0.2)',
                //'rgba(153, 102, 255, 0.2)',
                //'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                //'rgba(54, 162, 235, 1)',
                //'rgba(255, 206, 86, 1)',
                //'rgba(75, 192, 192, 1)',
                //'rgba(153, 102, 255, 1)',
                //'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 6
        }]
    },
    options: {
        plugins: {
            title: {
                text: graphLabel,
                color: 'blue',
                position: 'bottom',
                align: 'center',
                display: true
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
