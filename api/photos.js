/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { validateAgainstSchema } = require('../lib/validation')
const {
  PhotoSchema,
  removeUploadedFile,
  getPhotoById,
  saveImageFile,
  checkMimetype,
  producer,
} = require('../models/photo');

const router = Router();

// Setting up multyer for file uploads
const upload = multer({'dest': `${__dirname}/uploads`});

/*
 * POST /photos - Route to create a new photo.
 */
router.post('/', upload.single('image'), async (req, res) => {
  meta = JSON.parse(req.body.metadata);

  if (validateAgainstSchema(meta, PhotoSchema) && checkMimetype(req.file)) {
    try {
      const image_id = await saveImageFile(req);
      removeUploadedFile(req.file);
      await producer(image_id);
      res.status(201).send({
        id: image_id,
        links: {
          photo: `/photos/${image_id}`,
          thumb: `/media/thumbs/${image_id}`,
          business: `/businesses/${meta.businessId}`,
          filename: `${req.file.filename}`,
          originalFileName: `${req.file.originalname}`
        }
      })
      
    } catch (err) {
      console.error(err)
      res.status(500).send({
        error: "Error inserting photo into DB.  Please try again later."
      })
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid photo object"
    })
  }
})


/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const photo = await getPhotoById(req.params.id)
    if (photo) {
      res.setHeader('Content-Type', photo.metadata.contentType);
      const photoResponse = {
        photo: photo,
        thumbnailLink: `/media/thumbs/${req.params.id}.jpg`
      }
      res.status(200).send(photoResponse)
    } else {
      next()
    }
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch photo.  Please try again later."
    })
  }
})

router.get('/something/:str', (req, res) => {
  str = req.params.str;
  const path = `${__dirname}/uploads/${str}`
  res.setHeader('Content-Type', 'image/png').sendFile(path);
});
module.exports = router
