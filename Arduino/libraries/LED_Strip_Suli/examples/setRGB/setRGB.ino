#include <Wire.h>
#include <SoftwareSerial.h>

#include "Suli.h"
#include "LED_Strip_Arduino.h"

const int pin_clk = 2;
const int pin_dta = 3;

led_strip led(pin_clk, pin_dta);

void setup()
{
    
}

void loop()
{
    led.begin();
    led.setColor(255, 0, 0);
    led.end();
    delay(500);
    
    led.begin();
    led.setColor(0, 255, 0);
    led.end();
    delay(500);
    
    led.begin();
    led.setColor(0, 0, 255);
    led.end();
    delay(500);
}