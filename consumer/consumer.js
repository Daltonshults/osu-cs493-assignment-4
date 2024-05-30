const amqp = require('amqplib');
const { getDbReference } = require('./mongo.js');
const { GridFSBucket } = require('mongodb');
const rabbitmqHost =  'rabbitmq';  //process.env.RABBITMQ_HOST;
const rabbitmqUrl = `amqp://${rabbitmqHost}`;

async function main() {
  try {
    console.log(`TRYING FROM CONSUMER.JS`);
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue('photos');
    channel.consume('photos', (msg) => {
        if (msg) {
          const db = getDbReference();
          const bucket = new GridFSBucket(db, {bucketName: 'photos'});
          const image_id = msg.content.toString();
          console.log(`\n\n\n\n\nIMAGE ID: ${image_id}\n\n\n\n\n`);
          channel.ack(msg);
        }
      });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();