import mqtt from 'mqtt';

// MQTT connection - will be reused across invocations if possible
let mqttClient = null;

function getMqttClient() {
  if (!mqttClient) {
    const MQTT_URL = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883';
    try {
      mqttClient = mqtt.connect(MQTT_URL);
      mqttClient.on('connect', () => console.log('MQTT connected:', MQTT_URL));
      mqttClient.on('error', (e) => console.error('MQTT error', e));
    } catch (e) {
      console.error('MQTT connection failed:', e);
    }
  }
  return mqttClient;
}

const patterns = {
  1: [{ color:'red', duration:200 }, {color:'red',duration:200},{color:'blue',duration:200}],
  2: [{ color:'green', duration:200 },{color:'green',duration:200},{color:'blue',duration:200}],
  3: [{ color:'green', duration:200 },{color:'blue',duration:200},{color:'green',duration:200}],
  4: [{ color:'green', duration:150 },{color:'green',duration:150},{color:'blue',duration:150}]
};

export default async function handler(req, res) {
  // Vercel serverless function handler
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;
    if (![1,2,3,4].includes(id)) {
      return res.status(400).json({ ok:false, reason:'bad_id' });
    }

    const serverBaseUrl = process.env.SERVER_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://192.168.0.5:4000';

    const payload = {
      cid: req.body.cid || 'dev-92a95c6c252a',
      verified: true,
      ts: new Date().toISOString(),
      action: 'seq',
      id,
      pattern: patterns[id],
      repeat: req.body.repeat || 3,
      audioUrl: `${serverBaseUrl}/api/audio/${id}.wav`,
    };

    const topic = 'truthsignal/device/ATOM-1/notify';
    const mqttClient = getMqttClient();
    
    if (!mqttClient) {
      return res.status(500).json({ ok:false, reason:'mqtt', err:'mqtt client not available' });
    }

    const payloadStr = JSON.stringify(payload);
    console.log('PUBLISHING to topic:', topic);
    console.log('PUBLISHING payload:', payloadStr);
    
    return new Promise((resolve) => {
      mqttClient.publish(topic, payloadStr, { qos: 0, retain: false }, (err) => {
        if (err) {
          console.error('MQTT publish error', err);
          res.status(500).json({ ok:false, reason:'mqtt', err:err.message });
          return resolve();
        }
        console.log('✅ MQTT PUBLISH SUCCESS - topic:', topic);
        res.json({ ok:true, sent: payload, topic: topic });
        resolve();
      });
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, err: e.message });
  }
}

