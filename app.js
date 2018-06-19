#!/usr/bin/env node
var mkdirp = require('mkdirp');
var program = require('commander');
var amqp = require('amqplib/callback_api');
var fileDownloader = require("./app.download.js");
const path = require('path');

//var default_serviceurl = 'ampq://localhost:5672';
var default_serviceurl = 'amqp://192.168.2.27:32782';
var default_downloadlocation = './roms/'
const oEventMap = {
    download: onDownloadQueue,
    default: onNoEventFound
}
program.
    version('0.1.0');
program
    .command('start')
    .alias('s')
    .description('\n')
    .option('-h, --host [hosturl]', "Host Url", default_serviceurl)
    .option('-d, --dest [destinationPath]', "Destination Path", default_downloadlocation)
    .action((args)=>{
        console.log("\nConnecting to %s\n", args.host);
        connectToServer(args.host, args.dest, (message) => {
            var vfunct = (oEventMap[message.type])?oEventMap[message.type]:oEventMap['default'];
            vfunct(message);
        });
    });
program.parse(process.argv);

function connectToServer(hostnameurl, destinationPath, cb){
    amqp.connect(hostnameurl, function(err, conn) {
        conn.createChannel(function(err, ch) {
            var q = 'hello';
            ch.assertQueue(q, {durable: false});
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
            ch.consume(q, function(msg) {
                var message = JSON.parse(msg.content.toString());
                //console.log(" [x] Received %s",  JSON.stringify(message, null, 4));
                console.log(" [x] Received Type: %s, Files %s", message.type, JSON.stringify(message.data, null, 4));
                cb(message);
            }, {noAck: true});
        });
    });
}
function onNoEventFound(message){
    console.log("");
}
function onDownloadQueue(message){
    message.data.forEach(function(value){
       var pathObj = path.parse(value.url);
       var destPath = default_downloadlocation + pathObj.base;
       mkdirp(default_downloadlocation, function (err) {
            if (err) {
                console.error(err);
                return;
            }
            fileDownloader.download(value.url, destPath, function(response){
                console.log(response);
            });
       });
    });
}