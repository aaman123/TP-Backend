# Tensorplace
[![forthebadge made-with-javascript](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://nodejs.org/en/) 
## Prerequisites
- Docker
- Nodejs
- Python
- Openssl
- IBM Blockchain Extension vscode
# Setup
```bash
# Get repository
$ git clone https://github.com/Tensorplace-io/tensorplace-backend.git 
```
### Creating Fabric Enviroment 
- In vscode first you need to create a Faric Environment of 1 Orgs and 2 CA and 1 channel.
- Reference (https://www.youtube.com/watch?v=Ko45lwONvEU).
- After that you need to import Tensorpalce@0.0.4 file in packaged smart contract.
- Now you can connect to Fabric Enviroment and install the smart contract on both the peers.
- To interact with the smart contract you need to instantiate the smart contract.

### Getting Gateway config file And exporting wallet for API.
- From Fabric Gateway panel of ibm  blockchain extenstion you can export the config file of Org1.
- Replace this file with API\gateway\ibpConnection_Org1.json.
- Similarly you can also export wallet from Wallet panel replace the directory with API\api\wallets\Org1.

# Starting API
```bash
$ cd API\api\
$ node api.js
```

| Parameter | Example 
| - | - 
| `environment` | `localhost:3200`
| `Production` | `blockchain.tensorplace.io`
## API Endpoints
```bash
$ # Create a Token (This will return a jwt Token which will last 1 min which can be used to make post requests)
$ curl -X POST -H "Content-Type: application/json" -d '{"password":"##OnlyAdm1nC4nKn0wThisTh1ng#"}' http://{environment}/api/login
$ # Example
$ curl -X POST -H "Content-Type: application/json" -d '{"password":"##OnlyAdm1nC4nKn0wThisTh1ng#"}' http://{environment}/api/login
```


```bash
$ # Create a Asset (It should be done will seller adds new repo for sell)
$ curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer {Token}" -d '{"repo_name":"{name}","dev_rating":"{dev_rating}","repos_rating":"{repos_rating}"}' http://{environment}/api/CreateAsset
$ # Example
$ curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImUwOGI0NzM0YjYxNmE0MWFhZmE5MmNlZTVjYzg3Yjc2MmRmNjRmYTIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGVuc29ycGxhY2UtZWQiOiJ0ZW5zb3JwbGFjZS1lYWIzYyIsImF1dGhfdGltZSI6MTYxMDAxMTU3NiwidXNlcl9pZCI6ImxqN3J6OVZOR1pOS0ZFVmRMWGNialRvWmpERTIiLCJzdWIiOiJsajdyejlWTkdaTktGRVZkTFhjYmpUb1pqREUyIiwiaWF0IjoxNjEwMDExNTc3LCJleHAiOjE2MTAwMTUxNzcsImVtYWlsIjoiYWRtaW5AdGVuc29ycGxhY2UuaW8iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiYWRtaW5AdGVuc29ycGxhY2UuaW8iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQw9koQNvc3GM0iGfvAekTUcHwZHfNL-7_zuePier58QiX3cD_4jcWta3y1r9CjsZVg2gVxUe7ne0nNg5YPoFNnsciGbZxhRM-alLlcgAdxmctVEt5OKEyGVjrsCoBRN2ckF1IR5j-aElp21iaU6ilAsaFWzraM9k9GfsjOIuYh0AeunT6Cs" -d '{"repo_name":"1stRepo","dev_rating":"3.0","repos_rating":"4.0"}' http://{environment}/api/CreateAsset
```
```bash
$ # Get Repo Details
$ curl  http://{environment}/api/GetRepoInfo?repo_name={repo_name} | jq
$ # Example
$ curl  http://{environment}/api/GetRepoInfo?repo_name=1stRepo | jq
```
```bash
$ # Add Buyers Details(It should be done will buyer buys repo and also when he wants to give feedback last paramert dict as no limit)
$ curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer {Token}" -d '{"repo_name":"{name}","buyers_name":"{buyers_name}","dict":{dictionary where key=review and value=feedback}"}' http://{environment}/api/AddBuyerInfo
$ # Example
$ curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImUwOGI0NzM0YjYxNmE0MWFhZmE5MmNlZTVjYzg3Yjc2MmRmNjRmYTIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGVuc29ycGxhY2UtZWQiOiJ0ZW5zb3JwbGFjZS1lYWIzYyIsImF1dGhfdGltZSI6MTYxMDAxMTU3NiwidXNlcl9pZCI6ImxqN3J6OVZOR1pOS0ZFVmRMWGNialRvWmpERTIiLCJzdWIiOiJsajdyejlWTkdaTktGRVZkTFhjYmpUb1pqREUyIiwiaWF0IjoxNjEwMDExNTc3LCJleHAiOjE2MTAwMTUxNzcsImVtYWlsIjoiYWRtaW5AdGVuc29ycGxhY2UuaW8iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiYWRtaW5AdGVuc29ycGxhY2UuaW8iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQw9koQNvc3GM0iGfvAekTUcHwZHfNL-7_zuePier58QiX3cD_4jcWta3y1r9CjsZVg2gVxUe7ne0nNg5YPoFNnsciGbZxhRM-alLlcgAdxmctVEt5OKEyGVjrsCoBRN2ckF1IR5j-aElp21iaU6ilAsaFWzraM9k9GfsjOIuYh0AeunT6Cs" -d '{"repo_name":"1stRepo","buyers_name":"Yash","dict":{"review":"good","code_review":"Not good"}}' http://{environment}/api/AddBuyerInfo
```
```bash
$ # Update Repo Score (It should be done when we want to update only its repo score)
$ curl -X POST -H "Content-Type: application/json"  -H "Authorization: Bearer {Token}" -d '{"repo_name":"{name}","new_repo_score":"{repos_rating}"}' http://{environment}/api/UpdateRepoScore
$ # Example
$ curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImUwOGI0NzM0YjYxNmE0MWFhZmE5MmNlZTVjYzg3Yjc2MmRmNjRmYTIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGVuc29ycGxhY2UtZWQiOiJ0ZW5zb3JwbGFjZS1lYWIzYyIsImF1dGhfdGltZSI6MTYxMDAxMTU3NiwidXNlcl9pZCI6ImxqN3J6OVZOR1pOS0ZFVmRMWGNialRvWmpERTIiLCJzdWIiOiJsajdyejlWTkdaTktGRVZkTFhjYmpUb1pqREUyIiwiaWF0IjoxNjEwMDExNTc3LCJleHAiOjE2MTAwMTUxNzcsImVtYWlsIjoiYWRtaW5AdGVuc29ycGxhY2UuaW8iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiYWRtaW5AdGVuc29ycGxhY2UuaW8iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQw9koQNvc3GM0iGfvAekTUcHwZHfNL-7_zuePier58QiX3cD_4jcWta3y1r9CjsZVg2gVxUe7ne0nNg5YPoFNnsciGbZxhRM-alLlcgAdxmctVEt5OKEyGVjrsCoBRN2ckF1IR5j-aElp21iaU6ilAsaFWzraM9k9GfsjOIuYh0AeunT6Cs" -d '{"repo_name":"1stRepo","new_repo_score":"3.0"}' http://{environment}/api/UpdateRepoScore
```
```bash
$ # Get Block Details by using blocknumber
$ curl  http://{environment}/api/block?num={Block_number} | jq
$ # Example
$ curl  http://{environment}/api/block?num=4 | jq
```
```bash
$ # Get Block Details by using blotransactionId which we get during post requests.
$ curl  http://{environment}/api/Getblockbytx?txid={TransactionId} | jq
$ # Example
$ curl  http://{environment}/api/Getblockbytx?txid=VZOR1pOS0ZFVmRMWGNialRvWmpERTIiLCJzdWIiOiJsajdyejlWTkdaTktG | jq
```
