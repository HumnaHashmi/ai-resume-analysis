const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { extractTextFromPDF } = require('../utils/pdfUtils');
const axios = require('axios');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let analysisResults = []; // In-memory storage for analysis results

router.post('/analyze-cv', upload.single('cv'), async (req, res) => {
  const jobDescription = req.body.jobDescription;
  const cvFile = req.file;

  if (!cvFile || !jobDescription) {
    return res.status(400).send('CV file and job description are required.');
  }

  try {
    const cvText = await extractTextFromPDF(cvFile.path);
    const analysis = await analyzeCV(cvText, jobDescription);

    fs.unlinkSync(cvFile.path);

    const result = { jobDescription, analysis, timestamp: new Date() };
    analysisResults.push(result);

    res.json({ analysis });
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error && error.response.data.error.code === 'insufficient_quota') {
      console.error('Quota exceeded:', error.response.data.error.message);
      res.status(429).send('You have exceeded your API quota. Please check your plan and billing details.');
    } else {
      console.error('Error analyzing CV:', error.response ? error.response.data : error.message);
      res.status(500).send('Error analyzing CV.');
    }
  }
});

router.get('/results', (req, res) => {
  res.json(analysisResults);
});

const analyzeCV = async (cvText, jobDescription) => {
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: `
      Analyze the following CV for suitability for the given job description. Provide feedback on the strengths and weaknesses and a suitability score out of 10.

      CV: ${cvText}

      Job Description: ${jobDescription}
    `}
  ];

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error from OpenAI API:', error.response ? error.response.data : error.message);
    throw new Error('Failed to analyze CV using OpenAI API.');
  }
};

module.exports = router;
