import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://test.mosquitto.org');
const topic = 'truthsignal/device/ATOM-1/notify';

client.on('connect', () => {
  console.log('MQTT subscriber connected');
  client.subscribe(topic, (err) => {
    if (err) {
      console.error('Subscribe error:', err);
      process.exit(1);
    }
    console.log(`Subscribed to: ${topic}`);
    console.log('Waiting for messages...\n');
  });
});

client.on('message', (topic, message) => {
  console.log(`\n=== MQTT MESSAGE RECEIVED ===`);
  console.log(`Topic: ${topic}`);
  console.log(`Message: ${message.toString()}`);
  console.log('=============================\n');
  client.end();
  process.exit(0);
});

client.on('error', (err) => {
  console.error('MQTT error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout - no message received');
  client.end();
  process.exit(1);
}, 15000);

