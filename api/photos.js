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
  saveImageFile
} = require('../models/photo');

const router = Router();

// Setting up multyer for file uploads
const upload = multer({'dest': `${__dirname}/uploads`});

/*
 * POST /photos - Route to create a new photo.
 */
router.post('/', upload.single('image'), async (req, res) => {
  meta = JSON.parse(req.body.metadata);
  console.log(`req.body.meta = ` + req.file.mimetype);
  console.log(`req.body.metadata = ` + JSON.stringify(meta));
  console.log(`req.file = ` + JSON.stringify(req.file));
  console.log("\n\n\n\n\n\n")
  console.log(`req.body.metadata.businessId = ` + req.body.metadata['businessId']);
  console.log(`req.body.metadata.caption = ` + req.body.metadata['caption']);
  if (validateAgainstSchema(meta, PhotoSchema)) {
    try {
      const image_id = await saveImageFile(req);

      console.log(`id = ` + image_id);
      console.log(`req.file.filename = ` + req.file.filename);
      console.log(`req.file == ${JSON.stringify(req.file, indent=4)}`)
      removeUploadedFile(req.file);
      res.status(201).send({
        id: image_id,
        links: {
          photo: `/photos/${image_id}`,
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

// /*
//  * GET /photos/{id} - Route to fetch info about a specific photo.
//  */
// router.get('/:id', async (req, res, next) => {
//   console.log("HEERERERERER~!!!!!!!!")
//   try {
//     const photo = await getPhotoById(req.params.id)
//     file_name = req.params.filename;
//     if (photo) {
//       const path = `${__dirname}/uploads/${file_name}`
//       res.setHeader('Content-Type', 'image/jpeg');
//       res.status(200).sendFile(path)
//     } else {
//       next()
//     }
//   } catch (err) {
//     console.error(err)
//     res.status(500).send({
//       error: "Unable to fetch photo.  Please try again later."
//     })
//   }
// })
/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const photo = await getPhotoById(req.params.id)
    if (photo) {
      res.setHeader('Content-Type', photo.metadata.contentType);
      res.status(200).send(photo)
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
