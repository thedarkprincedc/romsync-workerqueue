#!/usr/bin/env node
var amqp = require('amqplib/callback_api');
var appConstants = require("./app.constants.js");
var fileDownloader = require("./app.download.js");
var mkdirp = require('mkdirp');

amqp.connect('amqp://192.168.2.27:32782', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = 'hello';

    ch.assertQueue(q, {durable: false});
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
    ch.consume(q, function(msg) {
     
        var message = JSON.parse(msg.content.toString());
        console.log(" [x] Received %s",  JSON.stringify(message, null, 4));
       
        switch(message.type){
            case appConstants.types.download:
                downloadQueueItem(message);
            break;
        }
    }, {noAck: true});
  });
});

function downloadQueueItem(message){
    message.data.forEach(function(value){
        if(value.url){
            value.url = "https://github.com/mamedev/mame/releases/download/mame0198/mame0198b_32bit.exe";
            var filename = value.url.split("/");
            filename = filename[filename.length - 1];
            mkdirp(appConstants.path.DEFAULT_DOWNLOAD, function (err) {
                if (err) {
                    console.error(err);
                } else{
                    fileDownloader.download(value.url, appConstants.path.DEFAULT_DOWNLOAD + filename, function(response){
                        console.log(response);
                    });
                }
            });
        }
    });
}
