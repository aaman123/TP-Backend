'use strict';

// Classes for Node Express
const express = require('express');
const app = express();
const cors = require('cors');
const SUCCESS = 0;
const TRANSACTION_ERROR = 401;
const USER_NOT_ENROLLED = 402;

//  connectionOptions
const utils = require('./ibputils.js');
let contract;
let username;

utils.connectGatewayFromConfig().then((gateway_contract) => {

    console.log('Connected to Network.');
    contract = gateway_contract;

    //  Setup events and monitor for events from HLFabric
   // utils.events();

}).catch((e) => {
    console.log('Connection exception.');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);
});

app.use(express.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
    next();
});

app.use(cors());



app.post('/api/CreateAsset', (req, res) => {

    console.log("\n--------------  api/AdmitAStudent --------------------------");
    let repo_name = req.body.repo_name;
    let dev_rating = req.body.dev_rating;
    let repos_rating = req.body.repos_rating;
    console.log("\n repo_name: " + repo_name);
    console.log("\n dev_rating: " + dev_rating);
    console.log("\n---------------------------------------------------");
    
    utils.CreateMyAsset(repo_name,dev_rating,repos_rating)
    .then(result =>{
        res.json({'errorCode':result})
    }, (error) => {
        //  handle error if transaction failed
        error.errorCode = 404;
        console.log('Error thrown from tx promise: ', error);
        res.json(error);
    })
    //console.log("Username:"+username);
    

});

app.get('/api/GetRepoInfo',(req,res) =>{
let repo_name = req.query.repo_name;
console.log("=================");
console.log(repo_name);
utils.ReadMyAsset(repo_name)
    .then(result =>{
        res.json(result)
    }, (error) => {
        //  handle error if transaction failed
        error.errorCode = 404;
        console.log('Error thrown from tx promise: ', error);
        res.json(error);
    })

});

app.post('/api/AddBuyerInfo',(req,res) =>{
  
let repo_name  = req.body.repo_name;
let buyers_name = req.body.buyers_name;
let Dict = req.body.dict;
console.log("=================");
console.log(Dict);
utils.Buy(repo_name,buyers_name,JSON.stringify(Dict))
    .then(result =>{
        res.json({'errorCode':result})
    }, (error) => {
        //  handle error if transaction failed
        error.errorCode = 404;
        console.log('Error thrown from tx promise: ', error);
        res.json(error);
    })

});
app.post('/api/UpdateRepoScore',(req,res) =>{
  
    let repo_name  = req.body.repo_name;
    let new_repo_score = req.body.new_repo_score;
    console.log("=================");
    utils.Update_repo_rating(repo_name,new_repo_score)
        .then(result =>{
            res.json({'errorCode':result})
        }, (error) => {
            //  handle error if transaction failed
            error.errorCode = 404;
            console.log('Error thrown from tx promise: ', error);
            res.json(error);
        })
    
    });



const port = process.env.PORT || 3000;
app.listen(port, (error) => {
    if (error) {
        return console.log('Error: ' + err);
    }
    console.log(`Server listening on ${port}`)
});

