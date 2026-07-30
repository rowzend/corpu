/**
 * Simple API Test Script
 * Run: node test-api.js
 */

const API_URL = 'http://192.1.6.24:8008/api';

async function testLogin() {
  console.log('Testing API Connection...');
  console.log('API URL:', API_URL);
  console.log('');

  const testData = {
    username: 'test',
    password: 'test123'
  };

  try {
    console.log('Sending POST request to:', `${API_URL}/auth/login`);
    console.log('Request body:', JSON.stringify(testData, null, 2));
    console.log('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    const responseText = await response.text();
    console.log('Response Body (raw):', responseText);
    console.log('');

    try {
      const responseJson = JSON.parse(responseText);
      console.log('Response Body (parsed):', JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log('Response is not valid JSON');
    }

    if (!response.ok) {
      console.error('❌ Request failed with status:', response.status);
    } else {
      console.log('✅ Request successful!');
    }

  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

// Test basic connectivity first
async function testConnectivity() {
  console.log('=== Testing Basic Connectivity ===');
  console.log('');
  
  try {
    const response = await fetch(API_URL.replace('/api', ''), {
      method: 'GET',
    });
    console.log('Base URL accessible:', response.status);
  } catch (error) {
    console.error('Cannot reach base URL:', error.message);
  }
  console.log('');
}

async function runTests() {
  await testConnectivity();
  console.log('=== Testing Login Endpoint ===');
  console.log('');
  await testLogin();
}

runTests();
