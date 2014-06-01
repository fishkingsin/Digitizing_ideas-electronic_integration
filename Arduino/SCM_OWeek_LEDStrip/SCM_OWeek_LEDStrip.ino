#include "RGBdriver.h"
#define CLK 2//pins definitions for the driver        
#define DIO 3
RGBdriver Driver(CLK,DIO);
char inputBuffer[10];
int r = 0;
int g = 0;
int b = 0;
int index = 0 ;
void setup()  
{ 
  Serial.begin(115200);
}  
void loop()  
{
  if (Serial.available() > 0) {
    Serial.readBytes(inputBuffer, Serial.available());
    
    int head = inputBuffer[0];
    if(head==0)
    {
      r = inputBuffer[1];
      g = inputBuffer[2];
      b = inputBuffer[3];
    }

    //    char inbyte = Serial.read();
    //    if(inbyte == 0)
    //    {
    //      index = 0;
    //    }
    //    switch(index)
    //    {
    //    case 1:
    //      r = inbyte;
    //      index++;
    //      break;
    //    case 2:
    //      g = inbyte;
    //      index++;
    //      break;
    //    case 3:
    //      b = inbyte;
    //      index = 0;
    //      break;
    //    }
    //
    //    Serial.print("index :");
    //    Serial.println(index);
    //    Serial.print("r :");
    //    Serial.println(r);
    //    Serial.print("g :");
    //    Serial.println(g);
    //    Serial.print("b :");
    //    Serial.println(b);

  }

    Driver.begin(); // begin
    Driver.SetColor(r,g,b); //Blue. first node data
    Driver.end();
}





