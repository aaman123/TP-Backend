'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const path = require('path');
const { FileSystemWallet, Gateway, User, X509WalletMixin } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');

let gateway;
let configdata;
let network;
let wallet;
let ccp_org;
let ccp_org;
let orgMSPID;
let walletPath;
let contract = null;

const utils = {};


utils.connectGatewayFromConfig = async () => {
    console.log("*********************** connectGatewayFromConfig function: ********************* ");

const configPath =  '../gateway/config.json';
const configJSON = fs.readFileSync(configPath, 'utf8');
configdata = JSON.parse(configJSON);

// connect to the connection file
const PccpPath = '../gateway/ibpConnection_Org1.json';
const PccpJSON = fs.readFileSync(PccpPath, 'utf8');
ccp_org = JSON.parse(PccpJSON);



// A wallet stores a collection of identities for use
walletPath = path.join(process.cwd(), '/wallets/Org1');
wallet = new FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

const peerIdentity = 'admin';

    // A gateway defines the peers used to access Fabric networks
    gateway = new Gateway();

     try {

    let response;
    // Check to see if we've already enrolled the user.
    const userExists = await wallet.exists(peerIdentity);
    if (!userExists) {
      console.log('An identity for the user ' + peerIdentity + ' does not exist in the wallet');
      console.log('Run the registerUser.js application before retrying');
      response.error = 'An identity for the user ' + peerIdentity + ' does not exist in the wallet. Register ' + peerIdentity + ' first';
      return response;
    }
    //connect to Fabric Network, but starting a new gateway
    const gateway = new Gateway();
	let userid = process.env.FABRIC_USER_ID || "admin";
        let pwd = process.env.FABRIC_USER_SECRET || "adminpw";
        let usertype = process.env.FABRIC_USER_TYPE || "admin";
        console.log('user: ' + userid + ", pwd: ", pwd + ", usertype: ", usertype);
      //ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
          // Set up the MSP Id
     orgMSPID = ccp_org.client.organization;
     console.log('MSP ID: ' + orgMSPID);
    //use our config file, our peerIdentity, and our discovery options to connect to Fabric network.
    await gateway.connect(ccp_org, { wallet, identity: peerIdentity, discovery: configdata.gatewayDiscovery });
    //connect to our channel that has been created on IBM yash/Internship_projects Platform
    const network = await gateway.getNetwork('mychannel');
    console.log("here");
    //connect to our insurance contract that has been installed / instantiated on IBM yash/Internship_projects Platform
     contract = await network.getContract('Tensorplace'); 
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
  }finally{
return contract;
}

}




utils.CreateMyAsset = async function(repo_name,dev_rating,repos_rating) {
     
        let id = configdata.AppAdmin;
        let ccp = ccp_org;
        walletPath = path.join(process.cwd(), '/wallets/Org1');
        wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);  
        
      try{ 

        const userGateway = new Gateway();
        await userGateway.connect(ccp, { wallet, identity: id, discovery:configdata.gatewayDiscovery});

        console.log('Use network channel: ' + configdata["channel_name"]);
        network = await userGateway.getNetwork(configdata["channel_name"]);

        // Get addressability to the smart contract as specified in config
        contract = await network.getContract(configdata["smart_contract_name"]);
        console.log('Userid: ' + id + ' connected to smartcontract: ' +
            configdata["smart_contract_name"] + ' in channel: ' + configdata["channel_name"]);

        await contract.submitTransaction('createMyAsset', repo_name,dev_rating,repos_rating);
        console.log('Transaction has been submitted');

        // Disconnect from the gateway.
        await userGateway.disconnect();
        return "Transaction completed";

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        response.error = error.message;
        return response; 
    }
}
utils.Buy = async function(repo_name,buyers_name ,dict) {
     
    let id = configdata.AppAdmin;
    let ccp = ccp_org;
    walletPath = path.join(process.cwd(), '/wallets/Org1');
    wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);  
    
  try{ 

    const userGateway = new Gateway();
    await userGateway.connect(ccp, { wallet, identity: id, discovery:configdata.gatewayDiscovery});

    console.log('Use network channel: ' + configdata["channel_name"]);
    network = await userGateway.getNetwork(configdata["channel_name"]);

    // Get addressability to the smart contract as specified in config
    contract = await network.getContract(configdata["smart_contract_name"]);
    console.log('Userid: ' + id + ' connected to smartcontract: ' +
        configdata["smart_contract_name"] + ' in channel: ' + configdata["channel_name"]);

    await contract.submitTransaction('updateMyAsset', repo_name,buyers_name ,dict);
    console.log('Transaction has been submitted');

    // Disconnect from the gateway.
    await userGateway.disconnect();
    return "Transaction completed";

} catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    response.error = error.message;
    return response; 
}
}

utils.Update_repo_rating = async function( repo_name,new_repo_score) {
     
    let id = configdata.AppAdmin;
    let ccp = ccp_org;
    walletPath = path.join(process.cwd(), '/wallets/Org1');
    wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);  
    
  try{ 

    const userGateway = new Gateway();
    await userGateway.connect(ccp, { wallet, identity: id, discovery:configdata.gatewayDiscovery});

    console.log('Use network channel: ' + configdata["channel_name"]);
    network = await userGateway.getNetwork(configdata["channel_name"]);

    // Get addressability to the smart contract as specified in config
    contract = await network.getContract(configdata["smart_contract_name"]);
    console.log('Userid: ' + id + ' connected to smartcontract: ' +
        configdata["smart_contract_name"] + ' in channel: ' + configdata["channel_name"]);

    await contract.submitTransaction('update_repo_score', repo_name,new_repo_score);
    console.log('Transaction has been submitted');

    // Disconnect from the gateway.
    await userGateway.disconnect();
    return "Transaction completed";

} catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    response.error = error.message;
    return response; 
}
}


utils.ReadMyAsset = async function(repo_name) {

    try {
        let id = configdata.AppAdmin;
        let ccp = ccp_org;
        walletPath = path.join(process.cwd(), '/wallets/Org1');
        wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);  
        
        const userGateway = new Gateway();
        await userGateway.connect(ccp, { wallet, identity: id, discovery:configdata.gatewayDiscovery});

        console.log('Use network channel: ' + configdata["channel_name"]);
        network = await userGateway.getNetwork(configdata["channel_name"]);

        // Get addressability to the smart contract as specified in config
        contract = await network.getContract(configdata["smart_contract_name"]);
        console.log('Userid: ' + id + ' connected to smartcontract: ' +
            configdata["smart_contract_name"] + ' in channel: ' + configdata["channel_name"]);
        
        const result = await contract.evaluateTransaction('readMyAsset',repo_name);

        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        return JSON.parse(result.toString());

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        response.error = error.message;
        return response;
    }
}




module.exports = utils;
