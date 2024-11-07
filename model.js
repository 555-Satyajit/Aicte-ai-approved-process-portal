const { exec } = require('child_process');

function runPythonScript(filePath, callback) {
    const command = `python3 "D:/tracking system/ai-models/ocr_script.py" "${filePath}"`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            callback({ error: `Error executing Python script: ${error.message}` });
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            callback({ error: `Python script error: ${stderr}` });
            return;
        }
        try {
            const result = JSON.parse(stdout);
            callback(result);
        } catch (err) {
            callback({ error: `Failed to parse Python script output: ${err.message}` });
        }
    });
}
