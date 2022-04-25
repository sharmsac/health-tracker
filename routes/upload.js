require('dotenv').config()
const express = require('express')
const router = express.Router()
const upload = require('express-fileupload')
const csvtojson = require('csvtojson')
const { render } = require('ejs')
const http = require('http');

router.post('/', async (req, res) => {
    http.get(`http://localhost:8080/getUser?username=${req.body.username.toLowerCase()}&password=${req.body.password}`, (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {

            if(!data){
                info = {
                    status: "error",
                    error: "Username or Password is incorrect!"
                }
                return res.render('login', info)
            }

            data = JSON.parse(data)
            if(data.username == null){
                info = {
                    status: "error",
                    error: "Username or Password is incorrect!"
                }
                return res.render('login', info)           
            }
            else{
                res.render('upload')
            }
        });
    });
})

async function csvtojsonfunc(csvData){
    let json = {}
    let existing_data_counter = 1
    let data_entered_counter = 1
    await csvtojson().fromString(csvData).then(async function(json_format){
        json = json_format
        for await (var student of json){
            let tempstudentdata = student
            const query = studentsSchema.where({ student_id: Number(tempstudentdata["Student ID Number"])})
            await query.findOne(async function(err, result) {
                if(result){                        
                    date_split = tempstudentdata.DOB.split('/')

                    const filter = {
                        student_id: Number(tempstudentdata["Student ID Number"])
                    }
                    const options = {
                        upsert: true
                    }
                    const updateRecord = {
                        $set: {
                            first_name: tempstudentdata["First Name"].toLowerCase(),
                            last_name: tempstudentdata["Last Name"].toLowerCase(),
                            student_id: Number(tempstudentdata["Student ID Number"]),
                            dob: {
                                month: Number(date_split[0]),
                                day: Number(date_split[1]),
                                year: Number(date_split[2])
                            },
                            vaccinated: (tempstudentdata.Vaccinated.toLowerCase() == "yes"),
                            approved: (tempstudentdata["Verified By Health Services"].toLowerCase() == "yes")
                        }
                    }

                    const result = await studentsSchema.updateOne(filter, updateRecord, options).catch(error => {
                        console.log(error)
                    })

                    existing_data_counter++;
                }
                else{
                    date_split = tempstudentdata.DOB.split('/')

                    tempstudentsschema = new studentsSchema({
                        first_name: tempstudentdata["First Name"].toLowerCase(),
                        last_name: tempstudentdata["Last Name"].toLowerCase(),
                        student_id: Number(tempstudentdata["Student ID Number"]),
                        dob: {
                            month: Number(date_split[0]),
                            day: Number(date_split[1]),
                            year: Number(date_split[2])
                        },
                        vaccinated: (tempstudentdata.Vaccinated.toLowerCase() == "yes"),
                        approved: (tempstudentdata["Verified By Health Services"].toLowerCase() == "yes")
                    }).save(function(error){
                        data_entered_counter++;
                    })
                }
            })
        }
    })
    return [existing_data_counter, data_entered_counter]
    // setTimeout(function(){
    //     console.log("done")
    // }, 5000)
}

router.post('/log', async (req, res) => {
    if(req.files){
        csvData = req.files.csv.data.toString('utf8');
        await csvtojsonfunc(csvData).then(array => {
            if(array != undefined){
                info = {
                    status: "ok",
                    updated_entries: array[0]-1,
                    new_entries: array[1]-1
                }
                res.render('log', info)
                bool = false
            }
        })
    }
    else{
        info = {
            status: "error",
            error: "File was not Uploaded! Contact OCIS"
        }
        res.render('log', info)
    }
})

module.exports = router