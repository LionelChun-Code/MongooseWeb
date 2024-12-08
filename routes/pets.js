const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const { createUpload, createThumbnail } = require('../middlewares/uploadImage');
const { deleteOldImage } = require('../middlewares/deleteOldImage');
const Pet = require('../models/pet');

// 定義 petImageUpload
const petImageUpload = createUpload(process.env.PET_ORIGINAL_PATH, 'petImage');

// 獲取用戶的所有寵物
router.get('/', async function(req, res, next) {
  try {
    const pets = await Pet.find();
    res.render('pets', { title: 'All Pets', pets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching pets' });
  }
});

// 獲取用戶的所有寵物 
router.get('/my-pets', ensureAuthenticated, async function(req, res, next) {
  try {
    const pets = await Pet.find({ ownerId: req.session.user.id });
    res.render('myPets', { title: 'Your Pets', pets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching your pets' });
  }
});

router.get('/add-pet', ensureAuthenticated, function(req, res, next) { 
  res.render('addPet', { title: 'Add a New Pet' }); 
});


// 新增寵物
router.post('/addPet', 
  ensureAuthenticated, 
  petImageUpload, (req, res, next) => createThumbnail(req, res, next, process.env.PET_THUMBNAIL_PATH), 
  deleteOldImage(process.env.PET_ORIGINAL_PATH, process.env.PET_THUMBNAIL_PATH),
  async function(req, res, next) {
  const { name, petType, petAge, description } = req.body;

  try {
    const pet = new Pet({
      name,
      petType,
      petAge,
      description,
      ownerId: req.session.user.id,
      image: req.file.filename // 保存圖片文件名
    });

    await pet.save();
    res.json({ success: 'Pet added successfully', pet });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errorMessages });
    }
    res.status(500).json({ error: 'An error occurred while adding pet' });
  }
});

// 更新寵物資料
router.put('/:id', ensureAuthenticated, petImageUpload, (req, res, next) => createThumbnail(req, res, next, process.env.PET_IMAGE_THUMBNAIL_PATH), async function(req, res, next) {
  const { name, petType, petAge, description } = req.body;

  try {
    const pet = await Pet.findById(req.params.id);
    
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    pet.name = name || pet.name;
    pet.petType = petType || pet.petType;
    pet.petAge = petAge || pet.petAge;
    pet.description = description || pet.description;

    if (req.file) {
      pet.image = req.file.filename; // 更新圖片文件名
    }

    await pet.save();
    res.json({ success: 'Pet updated successfully', pet });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errorMessages });
    }
    res.status(500).json({ error: 'An error occurred while updating pet' });
  }
});

router.delete('/:id', ensureAuthenticated, async function(req, res, next) {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    await Pet.deleteOne({ _id: pet._id });
    res.json({ success: 'Pet deleted successfully' });
  } catch (error) {
    console.error('Error occurred while deleting pet:', error);
    res.status(500).json({ error: 'An error occurred while deleting pet. Please try again later.' });
  }
});

module.exports = router;
