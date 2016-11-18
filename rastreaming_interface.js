//On inclus la librairie http qui permet la création d'un serveur http basique
var http = require('http');
var express = require('express');
var fs = require('fs');
var exec = require('child_process').exec;
var cidrize = require('subnet2cidr').cidrize;
var maskize = require('subnet2cidr').cidr2subnet;
var mdns = require('mdns-js');

var browser = mdns.createBrowser();

browser.on('ready', function () {
    browser.discover();
});

var app = express();

app.use('/', express.static('public'));
app.use('/jquery', express.static('node_modules/jquery/dist'));
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'));

function execute(command, callback){
  exec(command, function(error, stdout, stderr){ callback(stdout); });
}


//Collect variables from the HTML audio_config form

app.get('/save_audio_config', function(request, response, next) {

  fs.readFile('./darkice_variable.cfg', 'utf8', function (error, audioCFG) {

      var audioSource = request.param('audioSource')
      var audioFormat = request.param('audioFormat')
      var audioBitRate = request.param('audioBitRate')
      var serverName = request.param('serverName')
      var serverPassword = request.param('serverPassword')
      var mountPoint = request.param('mountPoint')
      var streamName = request.param('streamName')

    //Replace string value in the darkice_variable.cfg file

      audioCFG = audioCFG.replace('${audioSource}', audioSource);
      audioCFG = audioCFG.replace('${audioFormat}', audioFormat);
      audioCFG = audioCFG.replace('${audioBitRate}', audioBitRate);
      audioCFG = audioCFG.replace('${serverName}', serverName);
      audioCFG = audioCFG.replace('${serverPassword}', serverPassword);
      audioCFG = audioCFG.replace('${mountPoint}', mountPoint);
      audioCFG = audioCFG.replace('${streamName}', streamName);


    //Write darkice.cfg file

  fs.writeFile('/etc/darkice.cfg', audioCFG, 'utf8')

  response.redirect('/response_audio_config.html')

  })

})


    //Collect variables from the HTML network_config form

app.get('/save_network', function(request, response, next) {

  var networkStatus = request.param('networkStatus')

  if (networkStatus == "static"){

    fs.readFile('./dhcpcd_static.conf', 'utf8', function (error, networkCFG) {

      var ipAddress = request.param('ipAddress')
      var gateway = request.param('gateway')
      var netmask = request.param('netmask')


      //Convert IP subnetmask in cidr

      var cidr = cidrize(netmask)

      //Replace value in dhcp_variable.conf

      networkCFG = networkCFG.replace('${ipAddress}', ipAddress);
      networkCFG = networkCFG.replace('${gateway}', gateway);
      networkCFG = networkCFG.replace('${cidr}', cidr);

      fs.writeFile('./dhcpcd.conf.test', networkCFG, 'utf8')

      response.redirect('/response_network_config.html')

    });
  } else {

    fs.readFile('./dhcpcd_dhcp.conf', 'utf8', function (error, networkCFG) {


      //Write dhcpcd.conf file

    fs.writeFile('./dhcpcd.conf.test', networkCFG, 'utf8')

    response.redirect('/response_network_config.html')

  });
  }
})


//Reboot Command from response_network_config after countdown

app.get('/reboot', function(request, response, next) {

  execute('./reboot_script.sh ', function(callback){
      console.log('reboot now');
  });

  response.redirect('/reboot.html')

})


//Darkice launch command

app.get('/streaming_on', function(request, response, next) {

  response.redirect('/response_connect.html')

  execute('darkice ', function(callback){
      //console.log(callback);
      console.log('streaming_on');
  });

 })


//Darkice stop command

 app.get('/streaming_off', function(request, response, next) {

  response.redirect('/index.html')

  execute('killall darkice ', function(callback){
    //console.log(callback);
    console.log('streaming_off');
  });

})

//* On lance a méthode createServer qui prend pour argument une fonction de retour $ */
http.createServer(app).listen(8080, function () {

  console.log('rastreaming-pi interface lunched');

});
