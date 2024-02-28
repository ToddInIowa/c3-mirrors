export const config = {
  ftcLive: {
    IP: '172.20.32.1',
    Port: 80,
    Event: ['test']
  },
  // mqttServer: {
  //     Broker: 'mqtt://localhost:1883',
  //     Topic: 'test',
  //     options:  {
  //         // Clean session
  //         //clean: true,
  //         //connectTimeout: 4000,
  //         // Authentication
  //         clientId: 'node',
  //         //username: 'emqx_test',
  //         //password: 'emqx_test',
  //         },
  // },
  mqttServer: {
    Broker: 'mqtts://iea5e1ac.ala.us-east-1.emqxsl.com:8883',
    Topic: 'scores',
    options: {
      // Clean session
      clean: true,
      connectTimeout: 4000,
      // Authentication
      clientId: 'scoringServerVens',
      username: 'toddvolz',
      password: 'AmeliaR0cks42!'
    }
  }
}
