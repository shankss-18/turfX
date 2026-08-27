const Ground = require('../models/Ground')

const getGrounds = async(req,res) =>{
    try{
        const grounds = await Ground.find()
        res.status(200).json(grounds)
    }catch(err){
        res.status(500).json({message : "Failed to fetch grounds", error : err.message})
    }
}

const getGroundById = async(req,res) =>{
    try{
        const ground = await Ground.findById(req.params.id)
        if(!ground){
            return res.status(404).json({message : "Ground not found"})
        }
        res.status(200).json(ground)
    }catch(err){
        res.status(500).json({message : "Failed to fetch ground", error : err.message})
    }
}

const createGround = async(req,res) =>{
    try{
        const ground = await Ground.create(req.body)
        res.status(201).json(ground)
    }catch(err){
        res.status(400).json({message : "Failed to create ground", err : err.message})
    }
}

const updateGround = async(req,res) =>{
    try{
        const ground = await Ground.findByIdAndUpdate(req.params.id, req.body, {
            new : true,
            runValidators: true,
        })
        if (!ground) {
        return res.status(404).json({ message: 'Ground not found' });
        }
        res.status(200).json(ground);
    }catch(err){
        res.status(400).json({ message: 'Failed to update ground', error: err.message });
    }
}

const deleteGround = async (req, res) => {
  try {
    const ground = await Ground.findByIdAndDelete(req.params.id);
    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }
    res.status(200).json({ message: 'Ground deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete ground', error: err.message });
  }
};

module.exports = {
  getGrounds,
  getGroundById,
  createGround,
  updateGround,
  deleteGround,
};