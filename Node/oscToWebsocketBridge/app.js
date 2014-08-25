// OSC Bridge by Javi Agenjo @tamat

var WebSocket = require('./node_modules/faye-websocket/lib/faye/websocket');

var fs        = require('fs'),
http      = require('http'),
https     = require('https'),
qs		  = require('querystring'),
url		  = require('url'),
jQuery		= require('jquery');

var debug="development";
//input parameters
var pos = process.argv.indexOf("-port")
var port   = (pos != -1 && (process.argv.length > pos + 1) ? process.argv[pos+1] : 12344);
secure = process.argv.indexOf("-ssl") != -1;
var verbose = (process.argv.indexOf("-v") != -1 ? true : false);
log("verbose mode ON");

var OSC_PORT = port + 1;
//serial
var kProtocolHeaderFirstByte = 0xBA;
var kProtocolHeaderSecondByte = 0xBE;
var kProtocolHeaderLength = 2;
var kProtocolBodyLength = 12;
var kProtocolChecksumLength = 1;
var kNumChannel = 4;
var kChannelBytes = 3;
var byteDataLength = kProtocolHeaderLength+kProtocolBodyLength+kProtocolChecksumLength;
var channels=new Array(kNumChannel);
for(var i = 0 ; i < kNumChannel ; i++)
{
	channels[i] = new Array(kChannelBytes);
	memset(channels[i],0);
}

//Server 
var BroadcastServer = {
	clients: [],
	last_id: 1, //0 is reserved for server messages

	init: function()
	{
	},

	//NEW CLIENT
	onConnection: function(ws)
	{
		//initialize
		ws.user_id = this.last_id;
		this.last_id++;
		var path_info = url.parse(ws.url);
		var params = qs.parse(path_info.query);

		this.clients.push(ws);

		//ON MESSAGE CALLBACK
		ws.onmessage = function(event) {
			log(ws.ip + ' = ' + typeof(event.data) + "["+event.data.length+"]:" + event.data );
			dir(event.data); //like var_dump

			//this.send(...);
		};

		//ON CLOSE CALLBACK
		ws.onclose = function(event) {
			log('close', event.code, event.reason);
			BroadcastServer.clients.splice( BroadcastServer.clients.indexOf(ws), 1);
			ws = null;
		};
	},

	sendToAll: function(data, skip_id )
	{
		//broadcast
		for(var i in BroadcastServer.clients)
			if (BroadcastServer.clients[i].user_id != skip_id)
				BroadcastServer.clients[i].send(data);
		}
	};

// OSC SERVER **********************************************
var inport, osc, sock, udp;

osc = require('osc-min');

udp = require("dgram");
sock = udp.createSocket("udp4", function(msg, rinfo) {
	var error;
	try {
  	//send to all socket
  	var jsonVal = osc.fromBuffer(msg);
  	var channelIndex = 0;
  	for(var i = 0 ; i < jsonVal['elements'].length ; i++)
  	{
  		var element = jsonVal['elements'][i];
  		// log(element);
  		if(element['address']=='/channel'+channelIndex)
  		{
  			
  			var args = element['args'];
  			for(var j = 0 ; j < kChannelBytes ; j++)
  			{
  				channels[channelIndex][j] = args[j]['value'];
  			}
  			channelIndex++;
  			
  		}
  	}
	writeSerial(channels);
  	BroadcastServer.sendToAll( JSON.stringify(jsonVal) );
  	// return console.log(jsonVal);
  } catch (_error) {
  	error = _error;
  	return console.log("invalid OSC packet"+_error);
  }
});
// so let's start to listen on OSC_PORT
log("OSC Server in port: " + OSC_PORT );
sock.bind(OSC_PORT);



//create packet server
var connectionHandler = function(request, socket, head) {
	var ws = new WebSocket(request, socket, head, ['irc', 'xmpp'], {ping: 5});
	log('open', ws.url, ws.version, ws.protocol);
	BroadcastServer.onConnection(ws);
};

// HTTP SERVER  (used for administration) **********************
var staticHandler = function(request, response)
{
	var path = request.url;
	log("http request: " + path);

	function sendResponse(response,status_code,data)
	{
		// response.writeHead(status_code, {'Content-Type': 'text/plain', "Access-Control-Allow-Origin":"*"});
		// if( typeof(data) == "object")
		// 	response.write( JSON.stringify(data) );
		// else
		// 	response.write( data );
		// response.end();
		response.writeHeader(200, {"Content-Type": "text/html"});  
		response.write(data);  
		response.end();  

	}
	if(path=="/")
	{
		if(debug=="development")
		{
			path = "/index_development.html"
		}
		else if(debug=="production")
		{
			path = "/index_production.html"
		}
	}
	fs.readFile(__dirname + path, function(err, content) {
		var status = err ? 404 : 200;

		sendResponse(response, status, content || "file not found");
	});
};

//Prepare server
BroadcastServer.init();

//create the server (if it is SSL then add the cripto keys)
var server = secure
? https.createServer({
	key:  fs.readFileSync(__dirname + '/../spec/server.key'),
	cert: fs.readFileSync(__dirname + '/../spec/server.crt')
})
: http.createServer();
server.addListener('request', staticHandler); //incoming http connections
server.addListener('upgrade', connectionHandler); //incomming websocket connections

//launch the server
log('WebSocket Server in port...', port);
server.listen(port);


//Serial

var SerialPort = require("serialport").SerialPort



var serialPort = require("serialport");

try{
	serialPort.list(function (err, ports) {
		log(err);
		ports.forEach(function(port) {

			if(port.comName.indexOf("/dev/cu.wchusbserial") > -1 || port.comName.indexOf("/dev/cu.usbserial") > -1 || port.comName.indexOf("COM") > -1)
			{
				serialPort = new SerialPort(port.comName, {baudrate: 57600},false);

				serialPort.open(function (error) {
					if ( error ) {
						log('failed to open: '+error);
					} else {
						log('open');
						writeSerial([kProtocolHeaderFirstByte,kProtocolHeaderSecondByte ,0,0,0,0,0,0,0,0,0,0,0]);
					}
				});
				return;
			}
		});
	});
}
catch(err)
{
	log(err);
}
function readSerial ()
{
	if(serialPort!=null)
	{
	serialPort.on('data', function(data) {
		log('data received: ' + data);
		writeSerial ();
	});
	}
}
function writeSerial (_channels)
{
	if(serialPort!=null)
	{
		var data = new Buffer(byteDataLength);
		// var daraArray = new Array(byteDataLength);
		// memset(daraArray,0);

		// byteDataLength = kProtocolHeaderLength+kProtocolBodyLength+kProtocolChecksumLength;
		var index = kProtocolHeaderLength;
		for(var i = 0 ; i < kNumChannel ; i++)
		{
			for(var j = 0 ; j < kChannelBytes ; j++)
			{
				data[index] = _channels[i][j];
				index++;
			}
		}
		data[0] = kProtocolHeaderFirstByte;
		data[1] = kProtocolHeaderSecondByte;
		// var data = new Buffer([kProtocolHeaderFirstByte,kProtocolHeaderSecondByte,
		// 	0xFF,0xFF,0xFF, //first color
		// 	0xFF,0xFF,0xFF, // second color
		// 	0xFF,0xFF,0xFF, // third color
		// 	0xFF,0xFF,0xFF, // fourth color
		// 	0x00]);
		var calculatedChecksum = 0;
		for (var i = kProtocolHeaderLength; i < kProtocolBodyLength; i++) {
			calculatedChecksum ^= data[i];
		}
		data[byteDataLength-1]=calculatedChecksum;
		dir(data);

		
		serialPort.write(data, function(err, results) {
			if(err)
			{
				log('err ' + err);
				log('results ' + results);
			}
	    	// readSerial ();
	    	// writeSerial ()
	    });
	}
}
function memset( object, value )
{
   	for ( var i in object ) object[Number(i)]=value;
}
//helper function

function rgb2hsb(r,g,b)
{
	var hue, saturation, brightness;
 // if (hsbvals == null) {
 //   hsbvals = new float[3];
 // }
 var cmax = (r > g) ? r : g;
 if (b > cmax) cmax = b;
 var cmin = (r < g) ? r : g;
 if (b < cmin) cmin = b;

 brightness = ( cmax) / 255;
 if (cmax != 0)
 	saturation = ( (cmax - cmin)) / ( cmax);
 else
 	saturation = 0;
 if (saturation == 0)
 	hue = 0;
 else {
 	var redc = ( (cmax - r)) / ( (cmax - cmin));
 	var greenc = ( (cmax - g)) / ( (cmax - cmin));
 	var bluec = ( (cmax - b)) / ( (cmax - cmin));
 	if (r == cmax)
 		hue = bluec - greenc;
 	else if (g == cmax)
 		hue = 2 + redc - bluec;
 	else
 		hue = 4 + greenc - redc;
 	hue = hue / 6;
 	if (hue < 0)
 		hue = hue + 1;
 }
 var hsbvals = new Array(0,0,0);
 hsbvals[0] = float2int(hue*360);
 hsbvals[1] = float2int(saturation*100);
 hsbvals[2] = float2int(brightness*100);
 return hsbvals;

}
function float2int (value) {
	return value | 0;
}

function log(msg)
{
	if(verbose)console.log(msg);
}
function dir(msg)
{
	if(verbose)console.dir(msg);
}