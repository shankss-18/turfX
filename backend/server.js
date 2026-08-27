require('dotenv').config()
const express = require("express")
const cors = require('cors')
const connectDB = require('./config/db')
const groundRoutes = require('./routes/groundRoutes')
const slotRoutes = require('./routes/slotRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const authRoutes = require('./routes/authRoutes')

const app = express()

connectDB()

app.use(cors()) 
app.use(express.json()) 

app.get("/", (req,res) =>{
    res.send('Box cricket booking server is running')
})

app.use('/api/grounds', groundRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/slots', slotRoutes)
app.use('/api/auth', authRoutes)


const PORT = process.env.PORT || 5000
app.listen(PORT, ()=>{
    console.log('server started')
})