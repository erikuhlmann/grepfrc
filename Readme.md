# grepfrc #

Putting all the FRC code into a Mongo database for fun and profit.

## Prerequisites ##
 - MongoDB

## Setup ##
```bash
git clone https://github.com/erikuhlmann/grepfrc
npm install
```
Then create a `.env` file with the entries:
```
db_user=me
db_pass=p@ssw0rd
db_name=grepfrc
db_host=localhost

hostname=localhost
port=3000
```
Then
```bash
# load the data into your database 
node process
# start the server
node index
```