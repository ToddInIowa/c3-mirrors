import { WebSocket } from 'ws';
import mqtt from 'mqtt';

const config = {
  ftcLiveIP: 'localhost',
  ftcLivePort: 18080,
  ftcLiveEvent: 'test3',
  mqttBroker: 'mqtt://localhost:1883',
  mqttTopic: 'test',
}



console.log('Hello World');


async function TestConnection() {
  const response = await fetch(`http://${config.ftcLiveIP}:${config.ftcLivePort}/api/v1/version/`);
  const data = await response.json();
  console.log(`API Version: ${data.version}`);

  const response2 = await fetch(`http://${config.ftcLiveIP}:${config.ftcLivePort}/api/v1/events/${config.ftcLiveEvent}/`);
  const data2 = await response2.json();
  console.log(`Event Name: ${data2.name}`);

  return true;
}

async function connectWebSocket(cloud: mqtt.MqttClient) {
  const ws = new WebSocket(`ws://${config.ftcLiveIP}:${config.ftcLivePort}/api/v2/stream/?code=${config.ftcLiveEvent}`);
  ws.onopen = () => {
    console.log('WebSocket Open');
  };
  ws.onmessage = (event) => {
    if (typeof event.data === 'string' && event.data === 'pong') {
      return;
    }
    console.log('WebSocket Message: ', event.data);
    cloud.publish(config.mqttTopic, JSON.stringify(event.data));
  };
  ws.onclose = () => {
    console.log('WebSocket Close');
  };
  ws.onerror = (err) => {
    console.error('WebSocket Error', err);
  };
}

async function connectMQTT() {
  const client = mqtt.connect(config.mqttBroker);
  client.on('connect', () => {
    console.log('MQTT Connected');
    client.subscribe(config.mqttTopic, (err) => {
      if (err) {
        console.error('MQTT Subscribe Error', err);
      }
    });
  });
  client.on('message', (topic, message) => {
    console.log('MQTT Message', topic, message.toString());
  });
  client.on('error', (err) => {
    console.error('MQTT Error', err);
  });
  return client;
}


async function runSystem() {
  try {
    console.log('Running System');
    await TestConnection();
    const cloud = await connectMQTT();
    await connectWebSocket(cloud);
    console.log('System Running');
  } catch (err: any) {
    console.error(err?.message || 'Unknown Error');
  }
}

runSystem();
