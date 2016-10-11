/**
 * This script grabs the code directory on FIRSTwiki, clones all the code, and indexes it on the Mongo database
 */
require('dotenv').config();
const openDb = require('./db');
const mongoose = require("mongoose");
const CodeFile = require('./CodeFile');
const axios = require('axios');
const isbinaryfile = require('isbinaryfile');
const execSync = require('child_process').execSync;
const fs = require('fs');
const deasync = require('deasync');

var walk = function(dir) {
    var results = []
    try {
    var list = fs.readdirSync(dir)
        list.forEach(function(file) {
            file = dir + '/' + file
            try {
                var stat = fs.statSync(file)
                if (stat && stat.isDirectory()) results = results.concat(walk(file))
                else results.push(file)
            } catch(e) {
                // ignore yay
            }
        })
    } catch(e) {
        // ignore yay
    }
    return results
}

const tmp_dir = '/var/tmp';
const numTeamGroups = 7;
let numProcessed = 0;

// drop the collection since we usually need to start over and reindex everything
openDb(function(){ mongoose.connection.collections['codefiles'].drop( function(err) {
    console.log('collection dropped');

    for(let i = 0; i < numTeamGroups; i++) {
        axios.get(`https://firstwiki.github.io/frc${i}000/robotcode.json`).then(function(res) {
            // find all the github repos to clone and scan for code
            for(let team of res.data) {
                let teamNumber = team.team;
                for(let year in team.code) {
                    let projects = team.code[year];
                    if(!Array.isArray(projects)) projects = [projects]; // if the json files would be consistent, that would be great
                    for(let projectGroup of projects) {
                        for(let projectPurpose in projectGroup) {
                            try {
                                let github = projectGroup[projectPurpose][0];
                                let lang = projectGroup[projectPurpose][1];
                                // ignore labview
                                if(!lang || lang.toLowerCase() == 'labview') continue;
                                // make sure there's a git repo of course
                                if(!github || github.toLowerCase().indexOf("github.com") < 0) continue;
                                // get the top level git repo
                                while(github.match(/\//g).length > 4) {
                                    github = github.slice(0, github.lastIndexOf('/'));
                                }
                                console.log(teamNumber, year, projectPurpose);
                                // clone into somewhere in tmp
                                let id = 'grep'+require('crypto').randomBytes(4).readUInt32LE(0)+'frc';
                                // pipe some newlines to get past auth if it's presented. We ignore repos that require authentication
                                execSync(`printf "\n\n\n\n\n\n\n" | git clone --depth 1 "${github}" ${tmp_dir}/${id}/`);
                                // scan all the files for non-binary files to index
                                let fileList = walk(`${tmp_dir}/${id}`);
                                for(let file of fileList) {
                                    if(file.startsWith(`${tmp_dir}/${id}/.git`)) continue;
                                    else if(isbinaryfile.sync(file)) continue;
                                    
                                    let path = file.replace(`${tmp_dir}/${id}`, '');
                                    let lines = fs.readFileSync(file).toString().split(/[\r\n]+/g);
                                    // save the file in mongodb
                                    let dbObj = new CodeFile({
                                        team: teamNumber,
                                        year: year,
                                        purpose: projectPurpose,
                                        ghUrl: github,
                                        path: path,
                                        lines: lines
                                    });
                                    // because I'm a really lazy person
                                    // terrible, terrible code. Don't try this at home please :)
                                    (deasync(dbObj.save.bind(dbObj)))();
                                }
                                execSync(`rm -rf ${tmp_dir}/${id}/`);
                            } catch(e) {console.error(e);}
                            console.log(numProcessed++);
                        }
                    }
                }
            }
        });
    }
}); });