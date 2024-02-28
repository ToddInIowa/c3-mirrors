import { WebSocket, type MessageEvent } from 'ws'
import mqtt from 'mqtt'
import { config } from '../config/config'

/**
 * Test the connection to the FTC Live API
 */
async function TestConnection (): Promise<boolean> {
  console.log('Testing Connection')
  const response = await fetch(`http://${config.ftcLive.IP}:${config.ftcLive.Port}/api/v1/version/`)
  const data = await response.json()
  console.log(`API Version: ${data.version}`)

  console.log('Testing Events Exist:')
  for (const event of config.ftcLive.Event) {
    const response2 = await fetch(`http://${config.ftcLive.IP}:${config.ftcLive.Port}/api/v1/events/${event}/`)
    const data2 = await response2.json()
    console.log(`  Event Name: ${data2.name}`)
  }
  return true
}

/**
 * Handle the WebSocket messages from the FTC Live API
 * @param event The websocket event
 * @param eventCode The FTC Live event code
 * @param cloud The MQTT client
 */
async function onWebSocketMessage (event: MessageEvent, eventCode: string, cloud: mqtt.MqttClient): Promise<void> {
  if (typeof event.data === 'string' && event.data === 'pong') {
    return
  }
  if (typeof event.data !== 'string') {
    console.error('WebSocket Message Not String:', event.data, typeof event.data)
    return
  }
  const message = JSON.parse(event.data.toString())
  console.log('WebSocket Message: ', message)
  const number = message.payload?.number
  const updateType = message.updateType
  console.log('Match Number:', number)
  console.log('Update Type:', updateType)
  if (updateType === 'MATCH_POST') {
    console.log('Collecting Match Data')
    const matchInfo = await fetch(`http://${config.ftcLive.IP}:${config.ftcLive.Port}/api/v1/events/${eventCode}/matches/${number}/`)
    console.log('Request Made')
    const matchData = await matchInfo.json()
    // console.log('Match Data:', matchData)
    const teamData = {
      matchNumber: matchData.matchNumber as number,
      redScore: matchData.redScore as number,
      blueScore: matchData.blueScore as number,
      red1: matchData.red?.robot1 as number | undefined,
      red2: matchData.red?.robot2 as number | undefined,
      red3: matchData.red?.robot3 as number | undefined,
      blue1: matchData.blue?.robot1 as number | undefined,
      blue2: matchData.blue?.robot2 as number | undefined,
      blue3: matchData.blue?.robot3 as number | undefined
    }
    // I assume at this point you would do something like this:
    let redMessage = 'tie' as 'win' | 'loss' | 'tie'
    let blueMessage = 'tie' as 'win' | 'loss' | 'tie'
    if (teamData.redScore > teamData.blueScore) {
      redMessage = 'win'
      blueMessage = 'loss'
    } else if (teamData.blueScore > teamData.redScore) {
      redMessage = 'loss'
      blueMessage = 'win'
    }

    // For each team, publish the message to the MQTT broker if the team won, lost, or tied
    const messages: string[] = []
    if (teamData.red1 !== undefined) {
      messages.push(`${teamData.red1},${redMessage}`)
    }
    if (teamData.red2 !== undefined) {
      messages.push(`${teamData.red2},${redMessage}`)
    }
    if (teamData.red3 !== undefined) {
      messages.push(`${teamData.red3},${redMessage}`)
    }
    if (teamData.blue1 !== undefined) {
      messages.push(`${teamData.blue1},${blueMessage}`)
    }
    if (teamData.blue2 !== undefined) {
      messages.push(`${teamData.blue2},${blueMessage}`)
    }
    if (teamData.blue3 !== undefined) {
      messages.push(`${teamData.blue3},${blueMessage}`)
    }

    // Publish the messages to the MQTT broker
    messages.forEach((message) => {
      console.log(`Send Message: '${message}' to '${config.mqttServer.Topic}'`)
      cloud.publish(`${config.mqttServer.Topic}`, message)
    })
  }
}

/**
 * Connect to the FTC Live API WebSocket
 * @param eventCode The FTC Live event code
 * @param cloud The MQTT client
 */
async function connectWebSocket (eventCode: string, cloud: mqtt.MqttClient): Promise<void> {
  const ws = new WebSocket(`ws://${config.ftcLive.IP}:${config.ftcLive.Port}/api/v2/stream/?code=${eventCode}`)
  ws.onopen = () => {
    console.log('WebSocket Open')
  }
  ws.onmessage = (event: MessageEvent) => {
    onWebSocketMessage(event, eventCode, cloud).catch((err) => {
      console.error('Error in onWebSocketMessage', err)
    })
  }
  ws.onclose = () => {
    console.log('WebSocket Close')
  }
  ws.onerror = (err) => {
    console.error('WebSocket Error', err)
  }
}

/**
 * Connect to the MQTT broker
 * @returns The MQTT client connection
 */
async function connectMQTT (): Promise<mqtt.MqttClient> {
  const client = mqtt.connect(config.mqttServer.Broker, config.mqttServer.options)
  client.on('connect', () => {
    console.log('MQTT Connected')
    client.subscribe(config.mqttServer.Topic, (err) => {
      if (err !== null) {
        console.error('MQTT Subscribe Error', err)
      }
    })
  })
  client.on('message', (topic, message) => {
    console.log('MQTT Message', topic, message.toString())
  })
  client.on('error', (err) => {
    console.error('MQTT Error', err)
  })
  return client
}

/**
 * Run the system
 */
async function runSystem (): Promise<void> {
  try {
    console.log('Running System')
    // Test the connection to the FTC Live API
    await TestConnection()
    // Connect to the MQTT broker
    const cloud = await connectMQTT()
    // for each event, connect to the FTC Live API WebSocket
    for (const event of config.ftcLive.Event) {
      await connectWebSocket(event, cloud)
    }
    console.log('System Running')
  } catch (err: any) {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    console.error('Caught Error:', err?.message || 'Unknown Error')
  }
}

// Run the system
void runSystem()
