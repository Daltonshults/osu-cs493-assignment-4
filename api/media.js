const { Router } = require('express');
const { getDbReference } = require('../lib/mongo')
const { ObjectId, GridFSBucket } = require('mongodb')
const router = Router();

router.get('/', (req, res) => {
    res.status(200).send({"message": "Hello, media!"});
});


router.get('/photos/:id.png', async (req, res) => {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, {bucketName: 'photos'});

    try {
        const results = await bucket.find({_id: new ObjectId(req.params.id)}).toArray();
        if (results.length > 0) {
            const photo = results[0];
            res.setHeader('Content-Type', photo.metadata.contentType);
            bucket.openDownloadStream(photo._id).pipe(res);
        } else {
            res.status(404).send({
                error: "Specified photo does not exist"
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({
            error: "Error fetching photo.  Please try again later."
        });
        }
    }
);


router.get('/photos/:id.jpg', async (req, res) => {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, {bucketName: 'photos'});

    try {
        const results = await bucket.find({_id: new ObjectId(req.params.id)}).toArray();
        if (results.length > 0) {
            const photo = results[0];
            res.setHeader('Content-Type', photo.metadata.contentType);
            bucket.openDownloadStream(photo._id).pipe(res);
        } else {
            res.status(404).send({
                error: "Specified photo does not exist"
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({
            error: "Error fetching photo.  Please try again later."
        });
        }
    }
);

module.exports = router