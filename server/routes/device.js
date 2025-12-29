import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

/**
 * Device route handler - expects mqttClient and serverBaseUrl to be passed
 * This is a factory function that returns a configured router
 */
export default function createDeviceRouter(mqttClient, serverBaseUrl = 'http://192.168.0.5:4000') {
  const patterns = {
    1: [{ color:'red', duration:200 }, {color:'red',duration:200},{color:'blue',duration:200}],
    2: [{ color:'green', duration:200 },{color:'green',duration:200},{color:'blue',duration:200}],
    3: [{ color:'green', duration:200 },{color:'blue',duration:200},{color:'green',duration:200}],
    4: [{ color:'green', duration:150 },{color:'green',duration:150},{color:'blue',duration:150}]
  };

  router.post('/trigger-seq', express.json(), (req, res) => {
    try {
      const { id } = req.body;
      if (![1,2,3,4].includes(id)) return res.status(400).json({ ok:false, reason:'bad_id' });

              const payload = {
                cid: req.body.cid || 'dev-92a95c6c252a',     // firmware expects a cid and verified=true
                verified: true,
                ts: new Date().toISOString(),
                action: 'seq',
                id,
                pattern: patterns[id],
                repeat: req.body.repeat || 3,
                audioUrl: `${serverBaseUrl}/audio/${id}.wav`,  // Use device-accessible IP, WAV format
              };

      // publish on correct topic EXACT string the firmware subscribes to
      const topic = 'truthsignal/device/ATOM-1/notify';
      
      if (!mqttClient) {
        return res.status(500).json({ ok:false, reason:'mqtt', err:'mqtt client not available' });
      }

      const payloadStr = JSON.stringify(payload);
      console.log('PUBLISHING to topic:', topic);
      console.log('PUBLISHING payload:', payloadStr);
      
      mqttClient.publish(topic, payloadStr, { qos: 0, retain: false }, (err) => {
        if (err) {
          console.error('MQTT publish error', err);
          return res.status(500).json({ ok:false, reason:'mqtt', err:err.message });
        }
        console.log('✅ MQTT PUBLISH SUCCESS - topic:', topic);
        console.log('✅ Payload length:', payloadStr.length);
        return res.json({ ok:true, sent: payload, topic: topic });
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ ok:false, err: e.message });
    }
  });

  // POST /device/publish-test - test endpoint
  router.post('/publish-test', express.json(), (req, res) => {
    if (!mqttClient) {
      return res.status(500).json({ ok:false });
    }
    mqttClient.publish('truthsignal/device/ATOM-1/notify', JSON.stringify({
      cid: 'dev-92a95c6c252a', verified:true, ts:new Date().toISOString(),
      action:'seq', id:99, pattern:[{color:'red',duration:150}], repeat:1, audioUrl:'http://localhost:4000/audio/1.wav'
    }), {}, (err) => { 
      if(err) return res.status(500).json({ok:false}); 
      res.json({ok:true}); 
    });
  });

  return router;
}
