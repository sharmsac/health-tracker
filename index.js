require('dotenv').config()
const express = require('express')
const app = express()
const upload = require('express-fileupload')
const indexRouter = require('./routes/home')
const loginRouter = require('./routes/login')
const searchRouter = require('./routes/search')
const uploadRouter = require('./routes/upload')

app.set('view engine', 'ejs')
app.use(upload())
app.use(express.static(__dirname + '/views'))
app.use(express.urlencoded({ extended: false }))

app.use('/', indexRouter)

app.use('/login', loginRouter)

app.use('/search', searchRouter)

app.use('/upload', uploadRouter)

app.listen(process.env.PORT, () => {
    console.log("\nWARNING THIS IS A BETA BUILD! ")
    console.log(`Server now listening at http://localhost:${process.env.PORT} \n`)
})