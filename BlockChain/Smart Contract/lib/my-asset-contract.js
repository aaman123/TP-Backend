/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class MyAssetContract extends Contract {

    async myAssetExists(ctx, repo_name) {
        const buffer = await ctx.stub.getState(repo_name);
        return (!!buffer && buffer.length > 0);
    }

    async createMyAsset(ctx, repo_name, dev_rating, repos_rating) {
        const exists = await this.myAssetExists(ctx, repo_name);
        if (exists) {
            throw new Error(`The my asset ${repo_name} already exists`);
        }
        const asset = { repo_name, dev_rating, repos_rating };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(repo_name, buffer);
    }

    async readMyAsset(ctx, repo_name) {
        const exists = await this.myAssetExists(ctx, repo_name);
        if (!exists) {
            throw new Error(`The my asset ${repo_name} does not exist`);
        }
        const buffer = await ctx.stub.getState(repo_name);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async updateMyAsset(ctx, repo_name,buyers_name ,dict) {
        const exists = await this.myAssetExists(ctx, repo_name);
        if (!exists) {
            throw new Error(`The my asset ${repo_name} does not exist`);
        }
        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let hours = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        let seconds = date_ob.getSeconds();
        let  timestamp = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
        let data = await ctx.stub.getState(repo_name);
        data = JSON.parse(data.toString());
        let updateddata={};
        for(let key in data){
            if(key == "repo_name"){
                continue;
            }
            updateddata[key] = data[key];
        }

        dict = JSON.parse(dict);
        dict['timestamp']=timestamp;
        updateddata[buyers_name]=dict;
        const buffer = Buffer.from(JSON.stringify(updateddata));
        await ctx.stub.putState(repo_name, buffer);
    }
    async update_repo_score(ctx, repo_name,new_repo_score) {
        const exists = await this.myAssetExists(ctx, repo_name);
        if (!exists) {
            throw new Error(`The my asset ${repo_name} does not exist`);
        }
        let data = await ctx.stub.getState(repo_name);
        data = JSON.parse(data.toString());
        let updateddata={};
        for(let key in data){
            if(key == "repo_name"){
                continue;
            }
            if(key == "repos_rating"){
                updateddata[key] = new_repo_score;
                continue;
            }
            updateddata[key] = data[key];
        }
        const buffer = Buffer.from(JSON.stringify(updateddata));
        await ctx.stub.putState(repo_name, buffer);
    }
    async deleteMyAsset(ctx, repo_name) {
        const exists = await this.myAssetExists(ctx, repo_name);
        if (!exists) {
            throw new Error(`The my asset ${repo_name} does not exist`);
        }
        await ctx.stub.deleteState(repo_name);
    }

}

module.exports = MyAssetContract;
