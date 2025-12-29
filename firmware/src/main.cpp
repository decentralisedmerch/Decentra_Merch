/*
  TruthSignal - firmware (M5Stack ATOM Echo)
  - WiFi + MQTT (45.119.82.54)
  - Subscribe to truthsignal/device/ATOM-1/notify
  - On message {"verified": true} => blink RGB RED + beep (3x)
  - FastLED SK6812 RGB LED on GPIO 27
  - I2S buzzer (NS4168) on BCK=19, WS=33, DATA=22
*/

#include <FastLED.h>
#include "WiFi.h"
#include <PubSubClient.h>
#include <driver/i2s.h>

// ----- CONFIG -----
const char* WIFI_SSID = "Kashatora";
const char* WIFI_PASS = "1234@4321";

const char* MQTT_SERVER = "54.36.178.49";  // Correct IP for test.mosquitto.org
const uint16_t MQTT_PORT = 1883;

const char* SUB_TOPIC = "truthsignal/device/ATOM-1/notify";

// hardware pins for ATOM Echo
#define LED_PIN 27
#define NUM_LEDS 1
CRGB leds[NUM_LEDS];

// I2S pins for NS4168 amplifier/buzzer
#define I2S_BCK_PIN 19
#define I2S_WS_PIN 33
#define I2S_DATA_PIN 22

WiFiClient wifiClient;
PubSubClient client(wifiClient);

bool testsRun = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 10000;  // 10 seconds

// LED status indicators
unsigned long lastBlueBlink = 0;
const unsigned long BLUE_BLINK_INTERVAL = 500;  // 500ms for slow blink
bool blueBlinkState = false;

// I2S configuration
#define SAMPLE_RATE 44100
#define BITS_PER_SAMPLE I2S_BITS_PER_SAMPLE_16BIT
#define CHANNELS 1

// Initialize I2S for buzzer
void initI2S() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = BITS_PER_SAMPLE,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 64,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_BCK_PIN,
    .ws_io_num = I2S_WS_PIN,
    .data_out_num = I2S_DATA_PIN,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_NUM_0, &pin_config);
  Serial.println("I2S initialized");
}

// Generate sine wave tone via I2S
void playTone(int frequency, int duration_ms) {
  int samples = (SAMPLE_RATE * duration_ms) / 1000;
  int16_t *buffer = (int16_t*)malloc(samples * sizeof(int16_t));
  
  if (buffer == NULL) {
    Serial.println("Failed to allocate tone buffer");
    return;
  }

  for (int i = 0; i < samples; i++) {
    float sample = sin(2 * PI * frequency * i / SAMPLE_RATE);
    buffer[i] = (int16_t)(sample * 16383);  // 50% volume
  }

  size_t bytes_written;
  i2s_write(I2S_NUM_0, buffer, samples * sizeof(int16_t), &bytes_written, portMAX_DELAY);
  
  free(buffer);
  
  // Stop tone
  int16_t silence = 0;
  for (int i = 0; i < 100; i++) {
    i2s_write(I2S_NUM_0, &silence, sizeof(int16_t), &bytes_written, portMAX_DELAY);
  }
}

// LED test function
void runLedTest() {
  Serial.println("LED test: start");
  FastLED.addLeds<SK6812, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(150);
  
  // Red
  FastLED.showColor(CHSV(0, 255, 255));
  delay(300);
  
  // Green
  FastLED.showColor(CHSV(85, 255, 255));
  delay(300);
  
  // Blue
  FastLED.showColor(CHSV(170, 255, 255));
  delay(300);
  
  FastLED.clear();
  FastLED.show();
  Serial.println("LED test: complete");
}

// Tone test function
void runToneTest() {
  Serial.println("Tone test: start");
  for (int i = 0; i < 3; ++i) {
    playTone(400, 200);  // 400Hz for 200ms
    delay(150);
  }
  Serial.println("Tone test: complete");
}

// Alert function: blink RGB RED 3 times + beep
void playAlert() {
  Serial.println("ALERT TRIGGERED");
  Serial.println("Playing alert...");
  
  for (int i = 0; i < 3; ++i) {
    // Turn on RED
    leds[0] = CRGB::Red;
    FastLED.show();
    
    // Beep for 200ms
    playTone(1500, 200);
    
    // Turn off LED
    leds[0] = CRGB::Black;
    FastLED.show();
    
    delay(150);
  }
  
  Serial.println("Alert complete");
}

// MQTT callback
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("MQTT message received: ");
  Serial.println(topic);

  // copy payload into a string for simple parsing
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.println(msg);

  // quick check for "verified": true
  if (msg.indexOf("\"verified\":true") >= 0 || msg.indexOf("\"verified\": true") >= 0) {
    Serial.println("Payload indicates verified:true");
    playAlert();
  } else {
    Serial.println("Payload NOT verified:true (ignoring)");
  }
}

// reconnect to MQTT
void reconnect() {
  int tries = 0;
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "TruthSignal-ATOM-";
    clientId += String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      client.subscribe(SUB_TOPIC);
      Serial.print("Subscribed to: ");
      Serial.println(SUB_TOPIC);
      
      // Set LED to green (connected)
      leds[0] = CRGB::Green;
      FastLED.show();
      
      // Run tests once after MQTT connection
      if (!testsRun) {
        delay(500);
        runLedTest();
        runToneTest();
        testsRun = true;
      }
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 2s");
      delay(2000);
      if (++tries > 10) {
        // avoid locking forever; reset WiFi to try recover
        Serial.println("too many MQTT tries, restarting WiFi");
        WiFi.disconnect();
        WiFi.reconnect();
        tries = 0;
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);

  // Initialize FastLED
  FastLED.addLeds<SK6812, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(150);
  FastLED.clear();
  FastLED.show();
  Serial.println("FastLED initialized");

  // Initialize I2S for buzzer
  initI2S();

  Serial.println("Starting WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  // connect WiFi (block until connected)
  int wtries = 0;
  while (WiFi.status() != WL_CONNECTED && wtries < 30) {
    delay(500);
    Serial.print(".");
    wtries++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected, IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi NOT connected - will still attempt MQTT (may fail)");
  }

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Check connection status and update LED
  if (WiFi.status() == WL_CONNECTED && client.connected()) {
    // Solid green when WiFi + MQTT connected
    leds[0] = CRGB::Green;
    FastLED.show();
  } else if (WiFi.status() == WL_CONNECTED) {
    // Slow blue blink when reconnecting (WiFi OK but MQTT not connected)
    if (currentMillis - lastBlueBlink >= BLUE_BLINK_INTERVAL) {
      blueBlinkState = !blueBlinkState;
      if (blueBlinkState) {
        leds[0] = CRGB::Blue;
      } else {
        leds[0] = CRGB::Black;
      }
      FastLED.show();
      lastBlueBlink = currentMillis;
    }
  }
  
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Heartbeat log every 10 seconds (non-blocking)
  if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    if (client.connected()) {
      Serial.println("Device OK - MQTT connected");
    }
    lastHeartbeat = currentMillis;
  }
}
