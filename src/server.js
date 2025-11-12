require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;

// HubSpot API Client
const hubspotClient = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Search HubSpot contacts by multiple criteria
 */
async function searchHubSpotContacts(searchParams) {
  try {
    const { firstName, lastName, phone, email, street, city, state, zip } = searchParams;

    // Build filter groups - we'll use OR logic to find potential matches
    const filterGroups = [];

    // Email is the most unique identifier
    if (email) {
      filterGroups.push({
        filters: [{
          propertyName: 'email',
          operator: 'EQ',
          value: email
        }]
      });
    }

    // Phone number
    if (phone) {
      // Clean phone number (remove formatting)
      const cleanPhone = phone.replace(/\D/g, '');
      filterGroups.push({
        filters: [{
          propertyName: 'phone',
          operator: 'CONTAINS_TOKEN',
          value: cleanPhone
        }]
      });
    }

    // Name + Address combination (using AND within a filter group)
    if (firstName && lastName && (street || city)) {
      const nameAddressFilters = [
        { propertyName: 'firstname', operator: 'EQ', value: firstName },
        { propertyName: 'lastname', operator: 'EQ', value: lastName }
      ];

      if (street) {
        nameAddressFilters.push({ propertyName: 'address', operator: 'CONTAINS_TOKEN', value: street });
      }
      if (city) {
        nameAddressFilters.push({ propertyName: 'city', operator: 'EQ', value: city });
      }

      filterGroups.push({ filters: nameAddressFilters });
    }

    // If no filters, return empty
    if (filterGroups.length === 0) {
      return [];
    }

    // Search HubSpot
    const response = await hubspotClient.post('/crm/v3/objects/contacts/search', {
      filterGroups: filterGroups,
      properties: [
        'firstname',
        'lastname',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'zip',
        'company',
        'jobtitle',
        'lifecyclestage',
        'hs_lead_status',
        'roofing_pro',
        'setter',
        'hubspot_owner_id',
        'notes_last_updated',
        'createdate',
        'lastmodifieddate'
      ],
      limit: 10
    });

    return response.data.results;

  } catch (error) {
    console.error('Error searching HubSpot contacts:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Generate HTML for displaying contact results
 */
function generateResultsHTML(contacts, searchParams) {
  if (contacts.length === 0) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>No Matches Found</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          }
          .no-results {
            text-align: center;
            padding: 40px 20px;
          }
          .no-results h1 {
            color: #666;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .no-results p {
            color: #999;
            font-size: 16px;
          }
          .search-params {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
          }
          .search-params h3 {
            margin-top: 0;
            color: #333;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .search-params p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="no-results">
            <h1>🔍 No Matches Found</h1>
            <p>We couldn't find any HubSpot contacts matching the search criteria.</p>
          </div>
          <div class="search-params">
            <h3>Search Criteria</h3>
            ${searchParams.firstName ? `<p><strong>First Name:</strong> ${searchParams.firstName}</p>` : ''}
            ${searchParams.lastName ? `<p><strong>Last Name:</strong> ${searchParams.lastName}</p>` : ''}
            ${searchParams.email ? `<p><strong>Email:</strong> ${searchParams.email}</p>` : ''}
            ${searchParams.phone ? `<p><strong>Phone:</strong> ${searchParams.phone}</p>` : ''}
            ${searchParams.street ? `<p><strong>Street:</strong> ${searchParams.street}</p>` : ''}
            ${searchParams.city ? `<p><strong>City:</strong> ${searchParams.city}</p>` : ''}
            ${searchParams.state ? `<p><strong>State:</strong> ${searchParams.state}</p>` : ''}
            ${searchParams.zip ? `<p><strong>ZIP:</strong> ${searchParams.zip}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  const contactsHTML = contacts.map((contact, index) => {
    const props = contact.properties;
    const contactUrl = `https://app.hubspot.com/contacts/${contact.id}`;

    return `
      <div class="contact-card">
        <div class="contact-header">
          <h2>${props.firstname || ''} ${props.lastname || ''}</h2>
          <span class="match-badge">Match ${index + 1}</span>
        </div>

        <div class="contact-details">
          ${props.email ? `
            <div class="detail-row">
              <span class="label">📧 Email:</span>
              <a href="mailto:${props.email}">${props.email}</a>
            </div>
          ` : ''}

          ${props.phone ? `
            <div class="detail-row">
              <span class="label">📱 Phone:</span>
              <a href="tel:${props.phone}">${props.phone}</a>
            </div>
          ` : ''}

          ${props.company ? `
            <div class="detail-row">
              <span class="label">🏢 Company:</span>
              <span>${props.company}</span>
            </div>
          ` : ''}

          ${props.jobtitle ? `
            <div class="detail-row">
              <span class="label">💼 Job Title:</span>
              <span>${props.jobtitle}</span>
            </div>
          ` : ''}

          ${(props.address || props.city || props.state || props.zip) ? `
            <div class="detail-row">
              <span class="label">📍 Address:</span>
              <span>${[props.address, props.city, props.state, props.zip].filter(Boolean).join(', ')}</span>
            </div>
          ` : ''}

          ${props.lifecyclestage ? `
            <div class="detail-row">
              <span class="label">🎯 Lifecycle Stage:</span>
              <span class="badge">${props.lifecyclestage}</span>
            </div>
          ` : ''}

          ${props.hs_lead_status ? `
            <div class="detail-row">
              <span class="label">📊 Lead Status:</span>
              <span class="badge">${props.hs_lead_status}</span>
            </div>
          ` : ''}

          ${props.roofing_pro ? `
            <div class="detail-row">
              <span class="label">👷 Roofing Pro:</span>
              <span>${props.roofing_pro}</span>
            </div>
          ` : ''}

          ${props.setter ? `
            <div class="detail-row">
              <span class="label">🎯 Setter:</span>
              <span>${props.setter}</span>
            </div>
          ` : ''}

          ${props.hubspot_owner_id ? `
            <div class="detail-row">
              <span class="label">👤 Owner ID:</span>
              <span>${props.hubspot_owner_id}</span>
            </div>
          ` : ''}
        </div>

        <div class="contact-actions">
          <a href="${contactUrl}" target="_blank" class="btn-primary">View in HubSpot →</a>
        </div>

        <div class="contact-meta">
          <small>Created: ${new Date(props.createdate).toLocaleDateString()}</small>
          <small>Updated: ${new Date(props.lastmodifieddate).toLocaleDateString()}</small>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>HubSpot Contact Results</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          color: white;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 32px;
          margin: 0 0 10px 0;
        }
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        .contact-card {
          background: white;
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .contact-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 50px rgba(0,0,0,0.15);
        }
        .contact-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }
        .contact-header h2 {
          margin: 0;
          color: #333;
          font-size: 24px;
        }
        .match-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .contact-details {
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          padding: 12px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: 600;
          color: #555;
          min-width: 140px;
          font-size: 14px;
        }
        .detail-row span:not(.label):not(.badge),
        .detail-row a {
          color: #333;
          text-decoration: none;
          font-size: 14px;
        }
        .detail-row a:hover {
          color: #667eea;
          text-decoration: underline;
        }
        .badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .contact-actions {
          margin: 25px 0 15px 0;
        }
        .btn-primary {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        .contact-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #f0f0f0;
        }
        .contact-meta small {
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ HubSpot Contacts Found</h1>
          <p>Found ${contacts.length} matching contact${contacts.length > 1 ? 's' : ''}</p>
        </div>
        ${contactsHTML}
      </div>
    </body>
    </html>
  `;
}

/**
 * Main connector endpoint - receives SalesRabbit data via URL parameters
 */
app.get('/connector', async (req, res) => {
  try {
    console.log('Received connector request with params:', req.query);

    // Extract SalesRabbit parameters
    const searchParams = {
      firstName: req.query.firstName || req.query.firstname || '',
      lastName: req.query.lastName || req.query.lastname || '',
      phone: req.query.phone || '',
      email: req.query.email || '',
      street: req.query.street || req.query.address || '',
      city: req.query.city || '',
      state: req.query.state || '',
      zip: req.query.zip || req.query.postalCode || req.query.postal_code || ''
    };

    // Search HubSpot
    const contacts = await searchHubSpotContacts(searchParams);

    console.log(`Found ${contacts.length} matching contacts`);

    // Return HTML results
    const html = generateResultsHTML(contacts, searchParams);
    res.send(html);

  } catch (error) {
    console.error('Error in connector endpoint:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>Error</h1>
          <p>An error occurred while searching HubSpot contacts.</p>
          <p style="color: #999; font-size: 14px;">${error.message}</p>
        </body>
      </html>
    `);
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SalesRabbit-HubSpot Connector'
  });
});

/**
 * Root endpoint with instructions
 */
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>SalesRabbit HubSpot Connector</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          line-height: 1.6;
        }
        h1 { color: #333; }
        code {
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 14px;
        }
        .endpoint {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <h1>🔗 SalesRabbit HubSpot Connector</h1>
      <p>This service connects SalesRabbit with HubSpot to search and display contact information.</p>

      <div class="endpoint">
        <h3>Connector Endpoint:</h3>
        <p><code>GET /connector</code></p>
        <p>Accepts URL parameters from SalesRabbit:</p>
        <ul>
          <li><code>firstName</code> - Contact's first name</li>
          <li><code>lastName</code> - Contact's last name</li>
          <li><code>phone</code> - Phone number</li>
          <li><code>email</code> - Email address</li>
          <li><code>street</code> or <code>address</code> - Street address</li>
          <li><code>city</code> - City</li>
          <li><code>state</code> - State</li>
          <li><code>zip</code> or <code>postalCode</code> - ZIP/Postal code</li>
        </ul>
        <p><strong>Example URL:</strong></p>
        <code>/connector?firstName=John&lastName=Doe&email=john@example.com&phone=5551234567&street=123+Main+St&city=Raleigh&state=NC&zip=27601</code>
      </div>

      <h3>Status: ✅ Active</h3>
      <p><a href="/health">Health Check</a></p>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`SalesRabbit-HubSpot Connector listening on port ${PORT}`);
  console.log(`Connector URL: http://localhost:${PORT}/connector`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
