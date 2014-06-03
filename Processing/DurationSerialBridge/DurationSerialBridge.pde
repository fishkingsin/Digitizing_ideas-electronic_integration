/**
 * oscP5sendreceive by andreas schlegel
 * example shows how to send and receive osc messages.
 * oscP5 website at http://www.sojamo.de/oscP5
 */

import processing.serial.*;
import oscP5.*;
import netP5.*;

Serial myPort;  // Create object from Serial class
OscP5 oscP5;


void setup() {

  for (String p : Serial.list ()) {
    println(p);
    if (p.startsWith("/dev/tty.usb")) {
      myPort = new Serial(this, p, 112500);
    }
  }

  size(50, 50);
  frameRate(25);
  /* start oscP5, listening for incoming messages at port 12000 */
  oscP5 = new OscP5(this, 12345);

  /* myRemoteLocation is a NetAddress. a NetAddress takes 2 parameters,
   * an ip address and a port number. myRemoteLocation is used as parameter in
   * oscP5.send() when sending osc packets to another computer, device, 
   * application. usage see below. for testing purposes the listening port
   * and the port of the remote location address are the same, hence you will
   * send messages back to this sketch.
   */
}


void draw() {
  background(0);
}

/* incoming osc message are forwarded to the oscEvent method. */
void oscEvent(OscMessage theOscMessage) {
  /* print the address pattern and the typetag of the received OscMessage */
  print("### received an osc message\n");
  String addr = theOscMessage.addrPattern();
  println(" addrpattern: "+addr);
  if (addr.equals("/colors"))
  {
    println(" typetag: "+theOscMessage.typetag());
    int i1 = theOscMessage.get(0).intValue()+1;
    int i2 = theOscMessage.get(1).intValue()+1;
    int i3 = theOscMessage.get(2).intValue()+1;
    println("value 0: "+i1);
    println("value 1: "+i2);
    println("value 2: "+i3);
//    byte [] bytes = {
//      0, (byte)(i1 & 0xff), (byte)(i2& 0xff), (byte)(i3& 0xff)
//    };
    myPort.write(0);
    myPort.write(i1);
    myPort.write(i2);
    myPort.write(i3);
    
  }
}

