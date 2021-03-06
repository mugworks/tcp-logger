const assert = require('assert');
const createLogServer = require('../lib/create-log-server');
const net = require('net');
const fs = require('fs');
const path = require('path');
const parseMessage = require('../lib/parseMessage');

describe('chat app server', () => {
    const port = 15688;
    const logFile = path.join(__dirname, 'log.txt');

    beforeEach(done => {
        fs.unlink(logFile, err => {
            if(err && err.code !== 'ENOENT') done(err);
            done();
        });
    });
    
    let clients = null;
    let server = null;
    beforeEach(done => {
        clients = [];
        server = createLogServer(logFile);
        server.listen(port, done);
    });
    
    afterEach(() => {
        clients.forEach(client => client.destroy());
        server.close();
    });

    function openClient(callback) {
        let client = net.connect(port, () => {
            client.setEncoding('utf8');
            clients.push(client);
            callback(null, client);
        });
    }

    it('runs a test', done => {
        openClient((err, client1) => {
            client1.write('client 1');
            openClient((err, client2) => {
                // do client.write calls
                // on last client.write call, you need to use the
                // write callback to *wait" for the socket to finish before you test the log file
                client2.write('client 2', () => {
                    // read log file and test here!
                    setTimeout(() => {
                        fs.readFile(logFile, 'utf8', (err, data) => {
                            parseMessage(logFile, (err, data2) => {
                                assert.deepEqual (data, data2);
                                done();
                            });
                        });
                    });
                });
                
            });
        });
    });


});
