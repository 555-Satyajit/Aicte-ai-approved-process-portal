const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { spawn } = require('child_process');
const { PassThrough } = require('stream');
const Tesseract = require('tesseract.js');
const os = require('os')
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const PersonInfo = require('./models/PersonInfo');



const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Adjust the limit as needed
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Adjust the limit as needed




app.use(cors({
  origin: 'http://localhost:3000', // Adjust to your frontend URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Connect to MongoDB (Replace 'your-database-name' with your actual database name)
mongoose.connect('mongodb://localhost:27017/track', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, required: true },
});
const Counter = mongoose.model('Counter', counterSchema, 'counters');  // Ensure Counter is correctly defined


const userSchema = new mongoose.Schema({
  docID: String,  // Document ID
  status: String,
  clientName: String,  // Client Name
  files: [
    {
      filename: String,       // Original filename
      contentType: String,    // MIME type of the file (e.g., 'image/jpeg', 'application/pdf')
      data: String,           // Base64-encoded file data
    }
  ],
  lastModified: { type: Date, default: Date.now },
  lastModifiedBy: String,
  title: String
}, { timestamps: true });


// Create the User Model (Replace 'your-collection-name' with your actual collection name)
const User = mongoose.model('User', userSchema, 'document');

async function getNextDocID() {
  const counter = await Counter.findOneAndUpdate(
    { name: 'documentID' },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return `doc${counter.value}`;
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, uploadDir);
    });
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit
});

// Get all documents (Admin Dashboard)
app.get('/documents', async (req, res) => {
  try {
    const documents = await User.find()
      
    res.json(documents);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Endpoint to get document status by ID
app.get('/status/:docID', async (req, res) => {
  try {
    const user = await User.findOne({ docID: req.params.docID });
    if (user) {
      res.json({ status: user.status });
    } else {
      res.json({ status: 'Document not found' });
    }
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update document statuses (Admin Dashboard)
app.post('/status/update', async (req, res) => {
  try {
    const updates = req.body.documents;
    for (let doc of updates) {
      await User.updateOne({ docID: doc.docID }, { status: doc.status });
    }
    res.send('Documents updated successfully');
  } catch (error) {
    res.status(500).send('Server error');
  }
});
app.post('/upload', upload.array('documents', 10), async (req, res) => {
  try {
    const { clientName, status, title, lastModifiedBy } = req.body;
    const docID = await getNextDocID();

    const files = await Promise.all(req.files.map(async file => {
      const data = await fsp.readFile(file.path, { encoding: 'base64' });
      await fsp.unlink(file.path);
      return {
        filename: file.originalname,
        contentType: file.mimetype,
        data: data,
      };
    }));

    const newDocument = new User({
      docID,
      clientName,
      status: status || 'Pending',
      files,
      title,
      lastModifiedBy
    });

    await newDocument.save();

    res.status(201).json({ message: 'Documents uploaded successfully', docID: newDocument.docID });
  } catch (error) {
    console.error('Error occurred during upload:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/document/:docID', async (req, res) => {
  try {
    const document = await User.findOne({ docID: req.params.docID });
    if (document) {
      res.json(document.files);  // Send the files array with base64-encoded data
    } else {
      res.status(404).send('Document not found');
    }
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Endpoint to fetch and serve a file by document ID and filename
app.get('/file/:docID/:filename', async (req, res) => {
  try {
    const { docID, filename } = req.params;

    // Find the document by docID
    const document = await User.findOne({ docID });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Find the file within the document's files array
    const file = document.files.find(f => f.filename === filename);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Convert the base64 string back to binary data
    const fileData = Buffer.from(file.data, 'base64');

    // Set the appropriate content type and headers
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `attachment; filename="${file.filename}"`);

    // Send the file data as a response
    res.send(fileData);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/api/activity-log/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const summary = await User.aggregate([
      {
        $facet: {
          total: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          today: [
            { $match: { lastModified: { $gte: startOfDay } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          week: [
            { $match: { lastModified: { $gte: startOfWeek } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          month: [
            { $match: { lastModified: { $gte: startOfMonth } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          year: [
            { $match: { lastModified: { $gte: startOfYear } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const formatResults = (results) => {
      const formatted = { pending: 0, approved: 0, rejected: 0 };
      results.forEach(item => {
        formatted[item._id.toLowerCase()] = item.count;
      });
      return formatted;
    };

    res.json({
      documents: {
        total: formatResults(summary[0].total),
        today: formatResults(summary[0].today),
        week: formatResults(summary[0].week),
        month: formatResults(summary[0].month),
        year: formatResults(summary[0].year)
      }
    });
  } catch (error) {
    console.error('Error fetching activity log summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/activity-log/recent', async (req, res) => {
  try {
    const recentActivities = await User.find()
      .sort({ lastModified: -1 })
      .limit(10)
      .select('docID lastModifiedBy status title lastModified');

    const activities = recentActivities.map(doc => ({
      id: doc.docID,
      user: doc.lastModifiedBy,
      action: `${doc.status} document`,
      target: doc.title,
      timestamp: doc.lastModified
    }));

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Server error' });
  }
});





app.get('/extract-text/:docID', async (req, res) => {
  try {
    const { docID } = req.params;
    const document = await User.findOne({ docID });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    let allExtractedText = '';
    let documentTypes = [];
    let allKeyInformation = {};
    let fileTypes = {};

    for (const file of document.files) {
      try {
        const tempFilePath = path.join(__dirname, 'temp', `${file.filename}`);
        
        console.log('Processing file:', file.filename);
        console.log('File content type:', file.contentType);
        console.log('File data length:', file.data.length);

        const fileBuffer = Buffer.from(file.data, 'base64');
        
        await fsp.writeFile(tempFilePath, fileBuffer);
        console.log('File written successfully:', tempFilePath);

        const fileType = file.contentType.startsWith('image/') ? 'image' : 'pdf';

        const pythonProcess = spawn('python', ['ocr_script.py', tempFilePath, fileType]);

        const output = await new Promise((resolve, reject) => {
          let stdout = '';
          let stderr = '';
          pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString('utf-8');
          });
          pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString('utf-8');
          });
          pythonProcess.on('close', (code) => {
            if (code !== 0) {
              reject(new Error(`Python process exited with code ${code}. Error: ${stderr}`));
            } else {
              resolve(stdout);
            }
          });
        });

        await fsp.unlink(tempFilePath);

        console.log('Raw output from Python script:', output);

        try {
          const extractedData = JSON.parse(output);
          if (extractedData.error) {
            console.error(`Error extracting text from ${file.filename}:`, extractedData.error);
            allExtractedText += `Error extracting text from ${file.filename}: ${extractedData.error}\n\n`;
          } else {
            allExtractedText += `File: ${file.filename}\n${extractedData.extractedText}\n\n`;
            documentTypes.push({ filename: file.filename, type: extractedData.documentType });
            allKeyInformation[file.filename] = extractedData.keyInformation;
            fileTypes[file.filename] = file.contentType;
          }
        } catch (parseError) {
          console.error('Error parsing Python script output:', parseError);
          console.error('Raw output:', output);
          allExtractedText += `Error extracting text from ${file.filename}: ${parseError.message}\n\n`;
        }

      } catch (fileError) {
        console.error(`Error processing file ${file.filename}:`, fileError);
        allExtractedText += `Error processing file ${file.filename}: ${fileError.message}\n\n`;
      }
    }

    res.json({ 
      extractedText: allExtractedText,
      documentTypes: documentTypes,
      keyInformation: allKeyInformation,
      fileTypes: fileTypes
    });
  } catch (error) {
    console.error('Error extracting text:', error);
    res.status(500).json({ error: 'Server error during text extraction', details: error.message });
  }
});
app.get('/generate-report/:docID', async (req, res) => {
  try {
    const { docID } = req.params;
    const document = await User.findOne({ docID });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Extract text and key information for all files
    const extractionResults = await Promise.all(document.files.map(async (file) => {
      const tempFilePath = path.join(__dirname, 'temp', `${file.filename}`);
      await fsp.writeFile(tempFilePath, Buffer.from(file.data, 'base64'));

      const fileType = file.contentType.startsWith('image/') ? 'image' : 'pdf';
      const pythonProcess = spawn('python', ['ocr_script.py', tempFilePath, fileType]);

      const output = await new Promise((resolve, reject) => {
        let stdout = '';
        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString('utf-8');
        });
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Python process exited with code ${code}`));
          } else {
            resolve(stdout);
          }
        });
      });

      await fsp.unlink(tempFilePath);

      const result = JSON.parse(output);
      return { ...result, filename: file.filename };
    }));

    // Compare key information across documents
    const comparisonResults = compareDocuments(extractionResults);

    // Generate PDF report
    const pdfBytes = await generatePDFReport(docID, extractionResults, comparisonResults);

    res.contentType('application/pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Server error during report generation' });
  }
});

function compareDocuments(extractionResults) {
  const comparisonResults = {
    mismatches: {},
    missingInfo: {}
  };

  const keyInfoFields = ['Name', 'Age', 'IDNumber'];
  const addressFields = ['District', 'City', 'State', 'PinCode'];

  extractionResults.forEach((result, index) => {
    const docInfo = result.keyInformation;

    // Check for missing information
    [...keyInfoFields, ...addressFields].forEach(field => {
      if (!docInfo[field]) {
        if (!comparisonResults.missingInfo[field]) {
          comparisonResults.missingInfo[field] = [];
        }
        comparisonResults.missingInfo[field].push(result.filename);
      }
    });

    // Compare with other documents
    extractionResults.slice(index + 1).forEach((otherResult, otherIndex) => {
      const otherDocInfo = otherResult.keyInformation;

      keyInfoFields.forEach(field => {
        if (docInfo[field] && otherDocInfo[field] && docInfo[field] !== otherDocInfo[field]) {
          if (!comparisonResults.mismatches[field]) {
            comparisonResults.mismatches[field] = [];
          }
          comparisonResults.mismatches[field].push({
            doc1: { filename: result.filename, value: docInfo[field] },
            doc2: { filename: otherResult.filename, value: otherDocInfo[field] }
          });
        }
      });

      // Compare address fields
      const address1 = addressFields.map(field => docInfo[field]).filter(Boolean).join(', ');
      const address2 = addressFields.map(field => otherDocInfo[field]).filter(Boolean).join(', ');

      if (address1 && address2 && address1 !== address2) {
        if (!comparisonResults.mismatches['Address']) {
          comparisonResults.mismatches['Address'] = [];
        }
        comparisonResults.mismatches['Address'].push({
          doc1: { filename: result.filename, value: address1 },
          doc2: { filename: otherResult.filename, value: address2 }
        });
      }
    });
  });

  return comparisonResults;
}



async function generatePDFReport(docID, extractionResults, comparisonResults) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text, x, y, options = {}) => {
    page.drawText(text, { 
      x, 
      y, 
      size: options.size || 10, 
      font: options.bold ? boldFont : font,
      color: options.color || rgb(0, 0, 0)
    });
  };

  const drawLine = (x1, y1, x2, y2) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7)
    });
  };

  const checkYPosition = (yOffset, requiredSpace) => {
    if (yOffset - requiredSpace < 50) {
      page = pdfDoc.addPage();
      yOffset = height - 50;
    }
    return yOffset;
  };

  // Header
  drawText('Document Comparison Report', 50, height - 50, { size: 18, bold: true });
  drawText(`Report ID: ${docID}`, 50, height - 70, { size: 12 });
  drawText(`Generated on: ${new Date().toLocaleString()}`, 50, height - 90, { size: 12 });
  drawLine(50, height - 100, width - 50, height - 100);

  let yOffset = height - 120;

  // Document Summaries
  drawText('Document Summaries', 50, yOffset, { size: 14, bold: true });
  yOffset -= 20;

  extractionResults.forEach((result, index) => {
    yOffset = checkYPosition(yOffset, 40);
    yOffset -= 15;
    drawText(`Document ${index + 1}: ${result.filename}`, 50, yOffset, { bold: true });
    yOffset -= 15;
    drawText(`Type: ${result.documentType}`, 70, yOffset);
    
    Object.entries(result.keyInformation).forEach(([key, value]) => {
      yOffset = checkYPosition(yOffset, 20);
      yOffset -= 15;
      drawText(`${key}: ${value}`, 70, yOffset);
    });
    
    yOffset = checkYPosition(yOffset, 20);
    yOffset -= 10;
    drawLine(50, yOffset, width - 50, yOffset);
  });

  // Comparison Results
  yOffset = checkYPosition(yOffset, 60);
  yOffset -= 30;
  drawText('Comparison Results', 50, yOffset, { size: 14, bold: true });
  yOffset -= 20;

  if (Object.keys(comparisonResults.mismatches).length > 0) {
    drawText('Mismatches:', 50, yOffset, { bold: true });
    yOffset -= 15;

    Object.entries(comparisonResults.mismatches).forEach(([field, mismatches]) => {
      yOffset = checkYPosition(yOffset, 40);
      drawText(`${field}:`, 70, yOffset);
      yOffset -= 15;
      mismatches.forEach(mismatch => {
        yOffset = checkYPosition(yOffset, 40);
        drawText(`• ${mismatch.doc1.filename}: ${mismatch.doc1.value}`, 90, yOffset);
        yOffset -= 15;
        drawText(`• ${mismatch.doc2.filename}: ${mismatch.doc2.value}`, 90, yOffset);
        yOffset -= 15;
      });
    });
  } else {
    drawText('No mismatches found.', 70, yOffset);
    yOffset -= 15;
  }

  yOffset -= 15;

  if (Object.keys(comparisonResults.missingInfo).length > 0) {
    drawText('Missing Information:', 50, yOffset, { bold: true });
    yOffset -= 15;
    Object.entries(comparisonResults.missingInfo).forEach(([field, documents]) => {
      yOffset = checkYPosition(yOffset, 20);
      drawText(`${field} is missing in: ${documents.join(', ')}`, 70, yOffset);
      yOffset -= 15;
    });
  } else {
    drawText('No missing information found.', 70, yOffset);
  }

  yOffset = checkYPosition(yOffset, 40);
  yOffset -= 30;
  drawText('Database Verification', 50, yOffset, { size: 14, bold: true });
  yOffset -= 20;

  for (const result of extractionResults) {
    const dbPerson = await PersonInfo.findOne({ idNumber: { $regex: new RegExp('^' + result.keyInformation.IDNumber + '$', 'i') }
  });
    
    if (dbPerson) {
      drawText(`Record found for document ${result.filename}:`, 70, yOffset, { bold: true });
      yOffset -= 15;

      const fieldsToCompare = [
        { extracted: 'Name', db: 'name' },
        { extracted: 'IDNumber', db: 'idNumber' },
        { extracted: 'District', db: 'address' },
        { extracted: 'City', db: 'address' },
        { extracted: 'PinCode', db: 'address' },
        { extracted: 'Degree', db: null },
        { extracted: 'Department', db: null },
        { db: 'dateOfBirth', extracted: null },
        { db: 'phoneNumber', extracted: null },
        { db: 'email', extracted: null }
      ];

      for (const field of fieldsToCompare) {
        const extractedValue = result.keyInformation[field.extracted];
        const dbValue = field.db ? dbPerson[field.db] : null;

        let comparisonResult = 'No match';
        if (extractedValue && dbValue) {
          if (field.db === 'address') {
            comparisonResult = dbValue.includes(extractedValue) ? 'Partial match' : 'Mismatch';
          } else {
            comparisonResult = extractedValue === dbValue ? 'Exact match' : 'Mismatch';
          }
        } else if (extractedValue && !dbValue) {
          comparisonResult = 'Missing in database';
        } else if (!extractedValue && dbValue) {
          comparisonResult = 'Missing in extracted data';
        }

        yOffset = checkYPosition(yOffset, 40);
        drawText(`${field.extracted || field.db}: ${comparisonResult}`, 90, yOffset);
        yOffset -= 15;

        if (extractedValue) {
          yOffset = checkYPosition(yOffset, 20);
          drawText(`  Extracted: ${extractedValue}`, 110, yOffset);
          yOffset -= 15;
        }
        if (dbValue) {
          yOffset = checkYPosition(yOffset, 20);
          drawText(`  Database: ${dbValue}`, 110, yOffset);
          yOffset -= 15;
        }

        if (comparisonResult === 'Mismatch') {
          yOffset = checkYPosition(yOffset, 20);
          drawText('  MISMATCH DETECTED', 110, yOffset, { color: rgb(1, 0, 0) }); // Red text for mismatches
          yOffset -= 15;
        }
      }
    } else {
      yOffset = checkYPosition(yOffset, 60);
      drawText(`No record found in database for document ${result.filename}`, 70, yOffset);
      yOffset -= 15;
      drawText(`ID Number: ${result.keyInformation.IDNumber}`, 90, yOffset);
      yOffset -= 15;
      drawText(`Please check if this ID exists in the database with exact matching.`, 90, yOffset);
      yOffset -= 15;
    }

    yOffset -= 10;
    drawLine(50, yOffset, width - 50, yOffset);
    yOffset -= 10;
  }

  // Footer
  drawLine(50, 50, width - 40, 50);
  drawText('Confidential - For internal use only', width / 2, 30, { size: 8, color: rgb(0.5, 0.5, 0.5) });

  return pdfDoc.save();
}


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});