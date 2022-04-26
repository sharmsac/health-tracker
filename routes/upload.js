require('dotenv').config()
const express = require('express')
const router = express.Router()
const upload = require('express-fileupload')
const csvtojson = require('csvtojson')
const { render } = require('ejs')
const http = require('http');
const request = require('request')
const { JSDOM } = require("jsdom");
const { Console } = require('console')
const { window } = new JSDOM();
const cliProgress = require('cli-progress')
 
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

    var start_ov = window.performance.now();

    let json;
    list_of_students = []
    await csvtojson({ignoreEmpty:true}).fromString(csvData).then(json_format =>{
        json = json_format
    })

    list_of_ids = new Set()
    temparray = []
    batch_counter = 0
    for(x = 0; x <= json.length; x++){

        if(batch_counter == 100 || x == json.length){
            list_of_students.push(temparray)
            temparray = []
            batch_counter = 0

            if(x == json.length){
                break
            }
        }

        student = json[x]

        if(list_of_ids.has(student.id.toString())){
            info = {
                status: "error",
                error: "Duplicate entries in file"
            }
            return info
        }

        try{
            req = {
                "id": Number(student.id),
                "firstname": student.firstname.toLowerCase(),
                "lastname": student.lastname.toLowerCase(),
                "dob": student.dob.toString(),
                "isRecordSubmitted": student.isRecordSubmitted,
                "isRecordApproved": student.isRecordApproved
            }

            list_of_ids.add(student.id.toString())
            temparray.push(req)
            batch_counter++
        }
        catch(error) {
            info = {
                status: "error",
                error: error
            }
            return info
        }
    }

    const bar1 = new cliProgress.SingleBar({}, cliProgress.rect)
    
    //Delete old data
    var start = window.performance.now();
    console.log("Deleting Records...")
    await makeDeleteRequest({
        url: 'http://localhost:8080/deleteAllStudents'
    })
    console.log("Records Deleted!")
    var end = window.performance.now();
    deletion_performance = (end-start).toFixed(2)

    //Insert new data
    var start = window.performance.now();
    console.log("Inserting Records...")
    sum = 0;
    bar1.start(list_of_students.length, 0)
    for(arr in list_of_students){
        sum += list_of_students[arr].length
        await makePostRequest(list_of_students[arr])
        bar1.increment()
    }
    bar1.stop()
    console.log("Records Inserted!")
    var end = window.performance.now();
    insertion_performance = (end-start).toFixed(2)
    
    var end_ov = window.performance.now();

    info = {
        status: "ok",
        entries: sum,
        deletion_performance: `${deletion_performance}ms`,
        insertion_performance: `${insertion_performance}ms`,
        ov_performance: `${(end_ov-start_ov).toFixed(2)}ms`
    }

    return info
}

function makeDeleteRequest(path){
    return new Promise ( function (resolve, reject) {
        request.delete(path, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(body)
            }
            else{
                reject(error)
            }
        });
    }).catch(error=>{
        if(error != null){
            console.log(error)
        }
    })
}

function makePostRequest(list_of_students){
    return new Promise (async function (resolve, reject) {
        await request.post({
            url: 'http://localhost:8080/addStudents',
            body: list_of_students,
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(body)
            }
            else{
                reject(error)
            }
        });
    }).catch(error=>{
        if(error != null){
            console.log(error)
        }
    })
}

router.post('/log', async (req, res) => {
    if(req.files){
        csvData = req.files.csv.data.toString('utf8');
        info = await csvtojsonfunc(csvData)
        res.render('log', info)
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