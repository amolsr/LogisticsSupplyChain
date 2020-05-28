var fs = require('fs');
var crypto = require('crypto');

module.exports.getHashOfFile = (fileName) => {
    var fileData;
    try {
        fileData = fs.readFileSync('./asset/' + fileName)
    } catch (err) {
        if (err.code === 'ENOENT')
            return console.error('File does not exist. Error: ', err);
        return console.error('Error: ', err);
    }
    return crypto.createHash('sha256').update(fileData, 'utf8').digest('base64');
}