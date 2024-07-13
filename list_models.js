require('dotenv').config();
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const listModels = async () => {
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });
    console.log('Available models:', response.data.data);
  } catch (error) {
    console.error('Error listing models:', error.response ? error.response.data : error.message);
  }
};

listModels();
