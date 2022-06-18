const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
let app = require('./app.js');
const port = process.env.PORT || 3000;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    const httpServer = http.createServer(app);

    httpServer.listen(port);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    console.log(`Worker ${process.pid} started`);

    // Workers can share any TCP connection
    // In this case it is an HTTP server
    http.createServer(app);
}