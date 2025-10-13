import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV URL from Google Sheets
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMnQxBKvT_9U-M0s-g76jAYH9e_bTYqDFR4DZEBYuAaLqP1WmhL3ptdBqaclSgrZPhSYIpq3-W7Xk9/pub?gid=2104269342&single=true&output=csv';

// Output path for sessions.json
const OUTPUT_PATH = path.join(__dirname, '../src/data/sessions.json');

/**
 * Fetch CSV data from URL (follows redirects)
 */
function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        fetchCSV(res.headers.location).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch CSV: ${res.statusCode}`));
        return;
      }

      res.setEncoding('utf8'); // Ensure UTF-8 encoding
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Parse CSV string to array of objects
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV line (handles quoted fields with commas)
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
}

/**
 * Determine region based on city
 */
function getRegion(city) {
  const northCities = ['台北', '新北', '基隆', '桃園', '新竹', '宜蘭'];
  const centralCities = ['台中', '彰化', '南投', '雲林', '苗栗'];
  const southCities = ['台南', '高雄', '屏東', '嘉義'];
  const eastCities = ['花蓮', '台東'];

  for (const region of northCities) {
    if (city.includes(region)) return 'north';
  }
  for (const region of centralCities) {
    if (city.includes(region)) return 'central';
  }
  for (const region of southCities) {
    if (city.includes(region)) return 'south';
  }
  for (const region of eastCities) {
    if (city.includes(region)) return 'east';
  }

  return 'north'; // default
}

/**
 * Parse Unix timestamp (seconds) to Date object
 */
function parseTimestamp(timestamp) {
  if (!timestamp) return null;

  // Convert Unix timestamp (seconds) to milliseconds
  const numTimestamp = parseInt(timestamp, 10);
  if (isNaN(numTimestamp)) return null;

  const date = new Date(numTimestamp * 1000);
  if (isNaN(date.getTime())) return null;

  return date;
}

/**
 * Format date string to ISO format
 */
function formatDateTime(timestamp, hoursOffset = 0) {
  const date = parseTimestamp(timestamp);
  if (!date) return '';

  if (hoursOffset !== 0) {
    date.setHours(date.getHours() + hoursOffset);
  }

  return date.toISOString().replace('Z', '+08:00');
}

/**
 * Format time from timestamp (HH:MM format)
 */
function formatTime(timestamp) {
  const date = parseTimestamp(timestamp);
  if (!date) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format date only (YYYY-MM-DD format)
 */
function formatDate(timestamp) {
  const date = parseTimestamp(timestamp);
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Transform CSV data to sessions.json format
 */
function transformData(csvData) {
  return csvData.map(row => {
    const startTime = formatTime(row.ClassStartTimestamp);
    const endTime = formatTime(row.ClassStopTimestamp);
    const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '';

    // Calculate registration start (30 days before class start)
    let registrationStart = '';
    if (row.ClassStartTimestamp) {
      const startTimestamp = parseInt(row.ClassStartTimestamp, 10);
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60; // 30 days in seconds
      const registrationStartTimestamp = startTimestamp - thirtyDaysInSeconds;
      registrationStart = formatDateTime(registrationStartTimestamp.toString());
    }

    return {
      title: row.title || '',
      date: formatDateTime(row.ClassStartTimestamp),
      time: timeRange,
      location: row.location || '',
      address: row.address || '',
      city: row.city || '',
      region: getRegion(row.city || ''),
      description: row.description || '',
      locationUrl: row.locationUrl || '',
      startDate: formatDate(row.ClassStartTimestamp),
      startTime: startTime,
      endTime: endTime,
      registrationStart: registrationStart,
      registrationEnd: formatDateTime(row.registrationEnd),
      recruitUrl: row.recruitUrl || '',
      recruitEnd: formatDateTime(row.recruitEnd),
      registerUrl: row.registerUrl || '',
      telegramUrl: row.telegramUrl || ''
    };
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Fetching CSV data...');
    const csvText = await fetchCSV(CSV_URL);

    console.log('Parsing CSV...');
    const csvData = parseCSV(csvText);
    console.log(`Found ${csvData.length} sessions`);

    console.log('Transforming data...');
    const sessions = transformData(csvData);

    console.log(`Writing to ${OUTPUT_PATH}...`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sessions, null, 2) + '\n');

    console.log('- Successfully updated sessions.json');
  } catch (error) {
    console.error('L Error:', error.message);
    process.exit(1);
  }
}

main();
