const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src/models');
const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js'));

files.forEach((file) => {
    try {
        const modelPath = path.join(modelsDir, file);
        const m = require(modelPath);
        console.log(file, 'Loaded successfully', m.modelName);
    } catch (err) {
        console.log(file, 'Error:', err.message);
    }
});
