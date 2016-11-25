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

app.use('/', express.static('/var/node-www/rastreaming-pi/public'));
app.use('/jquery', express.static('/var/node-www/rastreaming-pi/node_modules/jquery/dist'));
app.use('/bootstrap', express.static('/var/node-www/rastreaming-pi/node_modules/bootstrap/dist'));

function execute(command, callback){
  exec(command, function(error, stdout, stderr){ callback(stdout); });
}


//Collect variables from the HTML audio_config form

app.get('/save_stream_config', function(request, response, next) {

  fs.readFile('/var/node-www/rastreaming-pi/darkice_variable.cfg', 'utf8', function (error, audioCFG) {

      var audioFormat = request.param('audioFormat')
      var audioChannels =request.param('audioChannels')
      var audioBitRate = request.param('audioBitRate')
      var serverName = request.param('serverName')
      var serverPassword = request.param('serverPassword')
      var mountPoint = request.param('mountPoint')
      var streamName = request.param('streamName')
      var description =request.param('description')
      var genre = request.param('genre')
      var url =request.param('url')

    //Replace string value in the darkice_variable.cfg file

      audioCFG = audioCFG.replace('${audioFormat}', audioFormat);
      audioCFG = audioCFG.replace('${audioChannels}', audioChannels);
      audioCFG = audioCFG.replace('${audioBitRate}', audioBitRate);
      audioCFG = audioCFG.replace('${serverName}', serverName);
      audioCFG = audioCFG.replace('${serverPassword}', serverPassword);
      audioCFG = audioCFG.replace('${mountPoint}', mountPoint);
      audioCFG = audioCFG.replace('${streamName}', streamName);
      audioCFG = audioCFG.replace('${description}', description);
      audioCFG = audioCFG.replace('${genre}',genre);
      audioCFG = audioCFG.replace('${url}', url);

    //Write darkice.cfg file

  fs.writeFile('/etc/darkice.cfg', audioCFG, 'utf8')

  response.redirect('/response_stream_config.html')

  })

})


app.get('/save_audio_config', function(request, response, next) {

  fs.readFile('/var/node-www/rastreaming-pi/public/input_config_base.html', 'utf8', function (error, inputCFG) {

    var audioInput = request.param('audioInput')

    if (audioInput == "analog"){


      inputCFG = inputCFG.replace('${audioInput}', audioInput);

      fs.writeFile('/var/node-www/rastreaming-pi/public/input_config.html', inputCFG, 'utf8');

      execute('/var/node-www/rastreaming-pi/Reset_paths.sh && /var/node-www/rastreaming-pi/Record_from_lineIn.sh', function(callback){
        console.log('changing audio config to analog');
      });

    }else{

      inputCFG = inputCFG.replace('${audioInput}', audioInput);

      fs.writeFile('/var/node-www/rastreaming-pi/public/input_config.html', inputCFG, 'utf8');

      execute('/var/node-www/rastreaming-pi/Reset_paths.sh && /var/node-www/rastreaming-pi/SPDIF_record.sh', function(callback){
        console.log('changing audio config to digital');
      });

    }

  response.redirect('response_audio_config.html')
  });
})


    //Collect variables from the HTML network_config form

app.get('/save_network', function(request, response, next) {

  var networkStatus = request.param('networkStatus')

  if (networkStatus == "static"){

    fs.readFile('/var/node-www/rastreaming-pi/dhcpcd_static.conf', 'utf8', function (error, networkCFG) {

      var ipAddress = request.param('ipAddress')
      var gateway = request.param('gateway')
      var netmask = request.param('netmask')


      //Convert IP subnetmask in cidr

      var cidr = cidrize(netmask)

      //Replace value in dhcp_variable.conf

      networkCFG = networkCFG.replace('${ipAddress}', ipAddress);
      networkCFG = networkCFG.replace('${gateway}', gateway);
      networkCFG = networkCFG.replace('${cidr}', cidr);

      fs.writeFile('/etc/dhcpcd.conf', networkCFG, 'utf8')

      response.redirect('/response_network_config.html')

    });
  } else {

    fs.readFile('/var/node-www/rastreaming-pi/dhcpcd_dhcp.conf', 'utf8', function (error, networkCFG) {


      //Write dhcpcd.conf file

    fs.writeFile('/etc/dhcpcd.conf', networkCFG, 'utf8')

    response.redirect('/response_network_config.html')

  });
  }
})


//Reboot Command from response_network_config after countdown

app.get('/reboot', function(request, response, next) {

  execute('sudo shutdown -r now', function(callback){
      console.log('The system is going down for reboot NOW!');
  });

  response.redirect('/reboot.html')

})


//Darkice launch command

app.get('/streaming_on', function(request, response, next) {

  response.redirect('/response_connect.html')

  execute('sudo darkice', function(callback){
      //console.log(callback);
      console.log('streaming_on');
  });

 })


//Darkice stop command

 app.get('/streaming_off', function(request, response, next) {

  response.redirect('/index.html')

  execute('sudo killall darkice', function(callback){
    //console.log(callback);
    console.log('streaming_off');
  });

})

//reboot launch command

app.get('/device_reboot', function(request, response, next) {


  execute('sudo shutdown -r now', function(callback){
      console.log('The system is going down for reboot NOW!');
  });

  response.redirect('/reboot.html')
 })


//shutdown launch command

app.get('/device_shutdown', function(request, response, next) {

  response.redirect('/response_shutdown.html')

  execute('sleep 2 && sudo shutdown -h now', function(callback){
      //console.log(callback);
      console.log('The system is going down in 2 seconds');
  });

 })



//* On lance a méthode createServer qui prend pour argument une fonction de retour $ */
http.createServer(app).listen(80, function () {

  console.log('rastreaming-pi interface lunched');

});
