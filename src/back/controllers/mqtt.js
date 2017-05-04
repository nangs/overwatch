const Message = require('../models/message')
const Device = require('../models/device')
const Type = require('../models/type')
const Location = require('../models/location')
const mqtt = require('mqtt')
const mqttClient = mqtt.connect('mqtt://192.168.0.35:1883')
const errorHandler = require('../api/errorHandler')

module.exports = (io, emitter) => {

    mqttClient.subscribe('/#')

    mqttClient.on('message', (topic, message) => {

        if(topic.startsWith('/sensors/')) {

            let data = JSON.parse(message.toString())

            if(data.mac) {
                Device.findOne({ where: { mac: data.mac } }).then((device) => {
                    if (device) {
                        updateDevice(data, device)
                        if(data.online) {
                            io.emit('notify', {
                                message: 'Device connected',
                                type: 'success',
                                time: 15,
                                data: device
                            }) 
                        }
                    } else {
                        addDevice(data)
                    }
                }).catch((err) => { console.error(err) })
            }
        }
    })

    emitter.on('notify', (notify) => {
        io.emit('notify', notify)
    })

    function getDevices() {
        Device.findAll({
            include: [Type, Location, Message]
        }).then((devices) => {
            io.emit('device.getAll.result', devices)
        }).catch((err) => {
            io.emit('device.getAll.error', errorHandler(err))
        }) 
    }

    function getMessages() {
        Message.findAll({
            order: 'message.createdAt DESC',
            include: [Device]
        }).then((messages) => {
            io.emit('message.getAll.result', messages)
        }).catch((err) => {
            io.emit('message.getAll.error', errorHandler(err))
        })
    }

    function addMessage(data, device) {
        Message.create({
            data: JSON.stringify(data)
        }).then((message) => {
            message.setDevice(device.id).then((rst) => {
                io.emit('message.add.result', message)
                
                let d = JSON.parse(JSON.stringify(device))
                message.data = JSON.parse(message.data)                
                d.message = message

                emitter.emit('scenario.event', d)

            })
        }).catch((err) => {
            io.emit('message.add.error', errorHandler(err))
        })
    }

    function addDevice(data) {
        Device.create({
            name: data.name,
            mac: data.mac,
            ip: data.ip,
        }).then((device) => {
            addMessage(data, device)
            io.emit('device.add.result', device)
        }).catch((err) => {
            io.emit('device.add.error', errorHandler(err))
        })
    }

    function updateDevice(data, device) {
        Device.update({ ip: device.ip }, { where: { id: device.id } }).then((count) => {
            addMessage(data, device)
            io.emit('device.update.result', count)
        }).catch((err) => {
            io.emit('device.update.error', errorHandler(err))
        })
    }
}