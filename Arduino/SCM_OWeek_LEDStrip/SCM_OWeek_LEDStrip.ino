#include "RGBdriver.h"
#define CLK 2//pins definitions for the driver        
#define DIO 3
RGBdriver Driver(CLK,DIO);
#define NUM_BYTES   4
char inputBuffer[NUM_BYTES];
unsigned char r = 0;
unsigned char g = 0;
unsigned char b = 0;
void setup()  
{ 
  Serial.begin(112500);
}  
void loop()  
{
  while (Serial.available() ==0 ) {
    Serial.readBytes(inputBuffer, NUM_BYTES);

    int head = inputBuffer[0];

    if(head==0)
    {
      r = (unsigned char)(inputBuffer[1]);
      g = (unsigned char)(inputBuffer[2]);
      b = (unsigned char)(inputBuffer[3]);
    }


    Driver.begin(); // begin
    Driver.SetColor(r,g,b); //Blue. first node data
    Driver.end();
  }


}







