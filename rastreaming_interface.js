   //On inclus la librairie http qui permet la création d'un serveur http basique
    var http = require('http');
    var express = require('express');
    var fs = require('fs');
    var exec = require('child_process').exec;
    var cidrize = require('subnet2cidr').cidrize,
        maskize = require('subnet2cidr').cidr2subnet;

    var app = express();

app.use('/', express.static('public'));


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

  fs.readFile('./dhcpcd_variable.conf', 'utf8', function (error, networkCFG) {

      var ipAddress = request.param('ipAddress')
      var gateway = request.param('gateway')
      var netmask = request.param('netmask')


    //Convert IP subnetmask in cidr

      var cidr = cidrize(netmask)


    //Replace value in dhcp_variable.conf

    networkCFG = networkCFG.replace('${ipAddress}', ipAddress);
    networkCFG = networkCFG.replace('${gateway}', gateway);
    networkCFG = networkCFG.replace('${cidr}', cidr);


    //Write dhcpcd.conf file

  fs.writeFile('/home/charly/git/rastreaming/dhcpcd.conf.test', networkCFG, 'utf8')

  response.redirect('/response_network_config.html')
    function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
}

execute('./reboot_script.sh ', function(callback){
    //console.log(callback);
    console.log('reboot in 5 seconds');
});

  })

})

    //Darkice launch command
app.get('/streaming_on', function(request, response, next) {

  response.redirect('/response_connect.html')
      function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
  }

  execute('darkice ', function(callback){
      //console.log(callback);
      console.log('streaming_on');
  });

 })

 //Darkice stop command

 app.get('/streaming_off', function(request, response, next) {

   response.redirect('/index.html')
   function execute(command, callback){
 exec(command, function(error, stdout, stderr){ callback(stdout); });
 }

 execute('killall darkice ', function(callback){
   //console.log(callback);
   console.log('streaming_off');
 });

})


/* On lance a méthode createServer qui prend pour argument une fonction de retour $ */
http.createServer(app).listen(8080, function () {

  console.log('rastreaming-pi interface lunched');

});