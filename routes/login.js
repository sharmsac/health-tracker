require('dotenv').config()
const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
    info = {
        status: "ok",
        error: ""
    }
    res.render('login', info)
})

module.exports = router