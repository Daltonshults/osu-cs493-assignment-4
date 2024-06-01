const amqp = require('amqplib');
/* 
* Path does not work in this context, but works in docker container 
* This is because I use COPY ./lib/mongo.js . in the Dockerfile.consumer
*/
const { getDbReference, connectToDb } = require('./mongo.js');
const { GridFSBucket, ObjectId, Collection } = require('mongodb');
const rabbitmqHost =  'rabbitmq';  //process.env.RABBITMQ_HOST;
const rabbitmqUrl = `amqp://${rabbitmqHost}`;
const sharp = require('sharp');
const fs = require('fs');
const { connect } = require('http2');
async function main() {
  
  try {
    connectToDb(async function () {
      console.log(`== Consumer connected to db`);
      const connection = await amqp.connect(rabbitmqUrl);
      const channel = await connection.createChannel();
      const db = await getDbReference();
      await channel.assertQueue('photos');
      channel.consume('photos', async (msg) => {
          if (msg) {
            const filesCollection = new Collection(db, 'photos.files');
            const bucket = new GridFSBucket(db, {bucketName: 'photos'});
            const image_id = ObjectId(msg.content.toString());
            const downloadStream = bucket.openDownloadStream(image_id);
            const thumbnailStream = sharp().resize(100, 100).png();
            const thumbnailBucket = new GridFSBucket(db, {bucketName: 'thumbnails'});
            const thumbId = new ObjectId();
            const thumbnailMeta = {
              imageId: image_id,
              contentType: 'image/jpeg'
            };
            const uploadStream = thumbnailBucket.openUploadStreamWithId(
              thumbId,
              `${image_id}.jpg`,
              { metadata: thumbnailMeta });

            downloadStream.pipe(thumbnailStream).pipe(uploadStream);

            uploadStream.on('finish', async function() {
              await filesCollection.updateOne(
                { _id: image_id },
                { $set: { 'metadata.thumbId' : thumbId } }
              );

            });

            channel.ack(msg);
          }});
      });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();