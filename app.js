require('./topics');
require('./Services/RFIDServices');
const express = require('express');
const bodyParser = require('body-parser');
const { initializeApp } = require('firebase/app');
const { getDatabase, set, ref, onValue, get, child } = require('firebase/database');
const mqtt = require('mqtt');
const { topics } = require('./topics');
const { compareMemberId } = require('./Services/RFIDServices');
const { DatabaseInteraction } = require("./Services/DatabaseInteraction");
const cors = require('cors')

const firebaseConfig = {
    apiKey: "AIzaSyAv6-CuQaO4la-G_UtpbknO8hl4oN5AewM",
    authDomain: "iot-smart-house-8101b.firebaseapp.com",
    databaseURL: "https://iot-smart-house-8101b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "iot-smart-house-8101b",
    storageBucket: "iot-smart-house-8101b.appspot.com",
    messagingSenderId: "559112984199",
    appId: "1:559112984199:web:360d9bd2f372008c14ca22"
  };

const mqttConfig = {
    clientId: "node-backend-client",
    username: "ivanov",
    password: "ivanivanov",
    port: "8883",
    host: "31d830ed6f1642a2a73ae993e116f1bf.s2.eu.hivemq.cloud",
    protocol: "mqtts"
};

const mqttConfigHttp = {
    clientId: "node-backend-client",
    username: "ivanov",
    password: "ivanivanov",
    port: "1883"
}

const firebaseApp = initializeApp(firebaseConfig);

const mqttClient = mqtt.connect(mqttConfig);
const mqttClientHttp = mqtt.connect("mqtt://vfc64260-internet-facing-376ebf692d75cbe3.elb.us-east-1.amazonaws.com", mqttConfigHttp);

mqttClient.on('connect', () => {
    console.log("connected");
});

mqttClientHttp.on('connect', () => {
    console.log("http mqtt connected");
})

mqttClientHttp.on('message', async (topic, payload) => {
    switch(topic) {
        case topics.RFID_Check:
            await RFIDHandleCheck(payload);
            break;
        case topics.DHT_Send:
        case topics.DoorStateTopic:
            mqttClient.publish(topic, payload);
            break;
        
    }
})

mqttClient.on('message', (topic, payload) => {
    switch(topic) {
        case topics.LedStateTopic:
        case topics.LockStateTopic:
            mqttClientHttp.publish(topic, payload);
            break;
    }
})

mqttClientHttp.subscribe(topics.RFID_Check, () => {
    console.log("subscribed to", topics.RFID_Check);
})

mqttClientHttp.subscribe(topics.DHT_Send, () => {
    console.log("subscribed to", topics.DHT_Send);
})

mqttClientHttp.subscribe(topics.DoorStateTopic, () => {
    console.log("subscribed to", topics.DoorStateTopic);
})

mqttClient.subscribe(topics.LockStateTopic, () => {
    console.log("subscribed to", topics.LockStateTopic);
})

mqttClient.subscribe(topics.LedStateTopic, () => {
    console.log("subscribed to", topics.LedStateTopic);
})

var dbContext = new DatabaseInteraction(firebaseApp);


const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.get('/', async (req, res) => {
    console.log(GetDateNow());
})

app.get('/enterhistory', async (req, res) => {
    var result = await dbContext.GetDatabaseValue('EnterHistory');
    res.send(JSON.stringify(result));
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})


async function RFIDHandleCheck(payload) {
    var id = payload.toString();
    var compareResult = await compareMemberId(id, firebaseApp);

    if (compareResult) {
        var newHistoryRecord = {
            "Member": compareResult.Member ? compareResult.Member : "Unknown",
            "Id": compareResult.NUID ? compareResult.NUID : "Unknown",
            "Time": GetDateNow()
        };

        dbContext.SetChildArrayNewItem("EnterHistory", newHistoryRecord);
    }

    mqttClientHttp.publish(topics.RFID_Check_Result,
        compareResult ? "1" : "0");

    mqttClient.publish(topics.RFID_Check_Result,
        compareResult ? "1" : "0");
};

function GetDateNow() {
    var date = new Date();
    var currentDate = date.toLocaleDateString() + " " + date.toLocaleTimeString();

    return currentDate;
};