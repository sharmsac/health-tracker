require('dotenv').config()
const express = require('express')
const router = express.Router()
const http = require('http');

router.post('/', async (req, res) => {
    first_name = req.body.first_name.toLowerCase()
    last_name = req.body.last_name.toLowerCase()
    birthday_date = req.body.birthday

    http.get(`http://localhost:8080/getStudent?firstname=${first_name}&lastname=${last_name}&dob=${birthday_date}`, (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {

            if(!data){
                info = {
                    status: "error"
                }
                res.render('search', info) 
            }

            data = JSON.parse(data)
            console.log(data)
            if(data.id == null){
                info = {
                    status: "error"
                }
                res.render('search', info)            
            }
            else{
                info = {
                    status: "ok",
                    submitted: data.isRecordSubmitted,
                    approved: data.isRecordApproved
                }
                res.render('search', info)
            }
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
})

module.exports = router