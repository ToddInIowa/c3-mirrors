import { WebSocket } from 'ws';
import mqtt from 'mqtt';
const config = require('../config/config.js');

console.log(config)

async function TestConnection() {
  console.log('Testing Connection');
  const response = await fetch(`http://${config.ftcLive.IP}:${config.ftcLive.Port}/api/v1/version/`);
  const data = await response.json();
  console.log(`API Version: ${data.version}`);

  console.log('Testing Events Exist:');
  for (const event of config.ftcLive.Event) {
    const response2 = await fetch(`http://${config.ftcLive.IP}:${config.ftcLive.Port}/api/v1/events/${config.ftcLive.Event}/`);
    const data2 = await response2.json();
    console.log(`  Event Name: ${data2.name}`);
  }
  return true;
}

async function connectWebSocket(eventCode: string, cloud: mqtt.MqttClient) {
  const ws = new WebSocket(`ws://${config.ftcLive.IP}:${config.ftcLive.Port}/api/v2/stream/?code=${eventCode}`);
  ws.onopen = () => {
    console.log('WebSocket Open');
  };
  ws.onmessage = async (event) => {
    if (typeof event.data === 'string' && event.data === 'pong') {
      return;
    }
    const message = JSON.parse(event.data.toString());
    console.log('WebSocket Message: ', message);
    const number = message.payload?.number;
    const updateType = message.updateType;
    console.log('Match Number:', number);
    console.log('Update Type:', updateType);
    if (updateType === 'MATCH_POST') {
      console.log('Collecting Match Data');
      const matchInfo = await fetch(`http://${config.ftcLive.IP}:${config.ftcLive.Port}/api/v1/events/${eventCode}/matches/${number}/`);
      console.log('Request Made');
      const matchData = await matchInfo.json();
      //console.log('Request Completed-',matchData);
      //console.log('Match Data:', matchData);
      const teamData = {
        matchNumber: matchData.matchNumber,
        redScore: matchData.redScore,
        blueScore: matchData.blueScore,
        red1: matchData.red?.robot1,
        red2: matchData.red?.robot2,
        red3: matchData.red?.robot3,
        blue1: matchData.blue?.robot1,
        blue2: matchData.blue?.robot2,
        blue3: matchData.blue?.robot3,
      }
      // I assume at this point you would do something like this:
      let redMessage = 'tie' as 'win' | 'loss' | 'tie';
      let blueMessage = 'tie' as 'win' | 'loss' | 'tie';
      if (teamData.redScore > teamData.blueScore) {
        redMessage = 'win';
        blueMessage = 'loss';
      } else if (teamData.blueScore > teamData.redScore) {
        redMessage = 'loss';
        blueMessage = 'win';
      }

      // For each team, publish the message to the MQTT broker if the team won, lost, or tied
      if (teamData.red1) {
        const message = `${teamData.red1},${redMessage}`;
        cloud.publish(`${config.mqttServer.Topic}`, message);
        console.log(`${teamData.red1}`, message);
      }
      if (teamData.red2) {
        const message = `${teamData.red2},${redMessage}`;
        cloud.publish(`${config.mqttServer.Topic}`, message);
        console.log(`${teamData.red2}`, message);
      }
      if (teamData.red3) {
        const message = `${teamData.red3},${redMessage}`;
        cloud.publish(`${config.mqttServer.Topic}`, message);
        console.log(`${teamData.red3}`, message);
      }
      if (teamData.blue1) {
        const message = `${teamData.blue1},${redMessage}`;
        cloud.publish(`${config.mqttServer.Topic}`, message);
        console.log(`${teamData.blue1}`, message);
      }
      if (teamData.blue2) {
        const message = `${teamData.blue2},${redMessage}`;
        cloud.publish(`${config.mqttServer.Topic}`, message);
        console.log(`${teamData.blue2}`, message);
      }
      if (teamData.blue3) {
        const message = `${teamData.blue3},${redMessage}`;
        cloud.publish(`${config.mqttServer.Topic}`, message);
        console.log(`${teamData.blue3}`, message);
      }
    }
  };
  ws.onclose = () => {
    console.log('WebSocket Close');
  };
  ws.onerror = (err) => {
    console.error('WebSocket Error', err);
  };
}

async function connectMQTT() {
  const client = mqtt.connect(config.mqttServer.Broker, config.mqttServer.options);
  client.on('connect', () => {
    console.log('MQTT Connected');
    client.subscribe(config.mqttServer.Topic, (err) => {
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
    for (const event of config.ftcLive.Event) {
      await connectWebSocket(event, cloud);
    }
    console.log('System Running');
  } catch (err: any) {
    console.error('Caught Error:', err?.message || 'Unknown Error');
  }
}

runSystem();
