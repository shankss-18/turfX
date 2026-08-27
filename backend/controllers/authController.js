const jwt = require('jsonwebtoken')

const login = (req,res) =>{
    const {email, password} = req.body
    if(email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD){
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(200).json({ token });
};

module.exports = { login };