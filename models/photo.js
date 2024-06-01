/*
 * Photo schema and data accessor methods.
 */
const amqp = require('amqplib');
const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqUrl = `amqp://${rabbitmqHost}`;

const { ObjectId, GridFSBucket } = require('mongodb')
const fs = require('fs');
const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
  businessId: { required: true },
  caption: { required: false }
}
exports.PhotoSchema = PhotoSchema

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {
  photo = extractValidFields(photo, PhotoSchema)
  photo.businessId = ObjectId(photo.businessId)
  const db = getDbReference()
  const collection = db.collection('photos')
  const result = await collection.insertOne(photo)
  return result.insertedId
}
exports.insertNewPhoto = insertNewPhoto

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
  return new Promise( async (resolve, reject) => {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, {bucketName: 'photos'});
    try {
      const results = await bucket.find({_id: new ObjectId(id)}).toArray();
      if (results.length > 0) {
        resolve(results[0]);
      } else {
        resolve(null);
      }
    } catch (err) {
      reject(err);
    }
})}


function createMetadata(req) {
  const meta = JSON.parse(req.body.metadata);
  return {
    contentType: req.file.mimetype,
    userId: req.file.userId,
    businessId: meta.businessId,
    caption: meta.caption,
    originalName: req.file.originalname
  };

}


async function saveImageFile(req) {
  return new Promise((resolve, reject) => {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, {bucketName: 'photos'});
    const metadata = createMetadata(req);
    const uploadStream = bucket.openUploadStream(
      req.file.filename,
      {metadata: metadata}
    );

    fs.createReadStream(req.file.path).pipe(uploadStream)

    .on('error', (err) => {
      reject(err);
    })
    .on('finish', (result) => {
      resolve(result._id);
    });

  });
}
exports.saveImageFile = saveImageFile;
exports.getPhotoById = getPhotoById

// TODO: Move to a different file
function removeUploadedFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(String(file.path), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

exports.removeUploadedFile = removeUploadedFile;


function checkMimetype(file) {
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    return false;
  }
  return true;
}

exports.checkMimetype = checkMimetype;

async function producer(image_id) {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue('photos');
    channel.sendToQueue('photos', Buffer.from(image_id.toString()));
    setTimeout(() => { connection.close(); }, 10000);
  } catch(err) {
    console.error(err);
  }
}

exports.producer = producer;