import processing.core.*; 
import processing.data.*; 
import processing.event.*; 
import processing.opengl.*; 

import processing.serial.*; 
import oscP5.*; 
import netP5.*; 

import java.util.HashMap; 
import java.util.ArrayList; 
import java.io.File; 
import java.io.BufferedReader; 
import java.io.PrintWriter; 
import java.io.InputStream; 
import java.io.OutputStream; 
import java.io.IOException; 

public class DurationSerialBridge extends PApplet {

/**
 * oscP5sendreceive by andreas schlegel
 * example shows how to send and receive osc messages.
 * oscP5 website at http://www.sojamo.de/oscP5
 */





Serial myPort;  // Create object from Serial class
OscP5 oscP5;

byte kProtocolHeaderFirstByte = (byte)0xBA;
byte kProtocolHeaderSecondByte = (byte)0xBE;
int kNumChannel = 4;
int kChannelBytes = 3;
int [][]channels;
public void setup() {
  size(400,400);
  frameRate(25);
  channels = new int[kNumChannel][kChannelBytes];
  for(int i = 0 ; i < kNumChannel ; i++)
  {
    channels[i] = new int[kChannelBytes];
  }
  for (String p : Serial.list ()) {
    println(p);
    if (p.startsWith("/dev/tty.usb")) {
      myPort = new Serial(this, p, 57600);
    }
  }

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


public void draw() {
  background(0);
    if ( myPort.available() > 0) {  // If data is available,
   char val = (char)myPort.read();         // read it and store it in val
    print(val);
  }
  for(int i = 0 ; i < kNumChannel ; i++)
  {
    fill((int)channels[i][0],(int)channels[i][1],(int)channels[i][2]);
    rect(0,i*(height/kNumChannel),width,(i+1)*(height/kNumChannel));
  }
}

/* incoming osc message are forwarded to the oscEvent method. */
public void oscEvent(OscMessage theOscMessage) {
  for(int i = 0 ;i < kNumChannel ; i++)
  {
  if(theOscMessage.checkAddrPattern("/channel"+i)==true) {
    /* check if the typetag is the right one. */
    if(theOscMessage.checkTypetag("iii")) {
      /* parse theOscMessage and extract the values from the osc message arguments. */
      channels[i][0] = theOscMessage.get(0).intValue();  // get the first osc argument
      channels[i][1] = theOscMessage.get(1).intValue(); // get the second osc argument
      channels[i][2]= theOscMessage.get(2).intValue(); // get the third osc argument
      print("### received an osc message "+theOscMessage.addrPattern() +" with typetag iii.");
      println(" red: "+channels[i][0]+", green: "+channels[i][1]+", blue : "+channels[i][2]);
    }
  }
  }
  
  
  byte []b  = new byte[15];
  b[0] = kProtocolHeaderFirstByte;
  b[1] = kProtocolHeaderSecondByte;
  int index = 2;
  for(int i = 0 ; i < kNumChannel ; i++)
  {
    for(int j = 0 ; j < kChannelBytes ; j++)
    {
      b[index] = (byte)channels[i][j];
      index++;
    }
  }
  b[14] = 0;
  //checksum lazy way
  for (int i = 2; i < 14; i++)
      b[14] ^= b[i];
  myPort.write(b );
  /* print the address pattern and the typetag of the received OscMessage */
//  print("### received an osc message.");
//  print(" addrpattern: "+theOscMessage.addrPattern());
//  println(" typetag: "+theOscMessage.typetag());
}

  static public void main(String[] passedArgs) {
    String[] appletArgs = new String[] { "DurationSerialBridge" };
    if (passedArgs != null) {
      PApplet.main(concat(appletArgs, passedArgs));
    } else {
      PApplet.main(appletArgs);
    }
  }
}
