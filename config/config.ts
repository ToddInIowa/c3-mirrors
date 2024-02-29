export const config = {
  ftcLive: {
    IP: '192.168.111.155',
    Port: 80,
    Event: ['usiadsm01']
  },
    mqttServer: {
        Broker: 'mqtt://aask.services:1883',
        Topic: 'scores',
        options: {
            // Clean session
            clean: true,
            connectTimeout: 4000,
            // Authentication
            clientId: 'scoringServer',
            username: 'toddvolz',
            password: 'AmeliaR0cks42!',
        },
    },
  // mqttServer: {
  //   Broker: 'mqtts://iea5e1ac.ala.us-east-1.emqxsl.com:8883',
  //   Topic: 'scores',
  //   options: {
  //     // Clean session
  //     clean: true,
  //     connectTimeout: 4000,
  //     // Authentication
  //     clientId: 'scoringServerVens',
  //     username: 'toddvolz',
  //     password: 'AmeliaR0cks42!'
  //   }
  // }
}
