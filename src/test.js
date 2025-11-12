require('dotenv').config();
const axios = require('axios');

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
 * Test HubSpot API connection
 */
async function testHubSpotConnection() {
  console.log('=== Testing HubSpot Connection ===\n');

  try {
    // Test 1: Get account info
    console.log('1. Testing HubSpot API authentication...');
    const accountResponse = await hubspotClient.get('/crm/v3/objects/contacts', {
      params: { limit: 1 }
    });
    console.log('   ✅ HubSpot API authentication successful\n');

    // Test 2: Search for contacts
    console.log('2. Testing contact search...');
    const searchResponse = await hubspotClient.post('/crm/v3/objects/contacts/search', {
      filterGroups: [],
      properties: ['firstname', 'lastname', 'email', 'phone'],
      limit: 5
    });

    const contactCount = searchResponse.data.total;
    console.log(`   ✅ Contact search successful`);
    console.log(`   📊 Total contacts in HubSpot: ${contactCount}`);

    if (searchResponse.data.results.length > 0) {
      console.log(`   📋 Sample contacts found:\n`);
      searchResponse.data.results.forEach((contact, index) => {
        const props = contact.properties;
        console.log(`   ${index + 1}. ${props.firstname || ''} ${props.lastname || ''}`);
        if (props.email) console.log(`      Email: ${props.email}`);
        if (props.phone) console.log(`      Phone: ${props.phone}`);
        console.log('');
      });
    }

    // Test 3: Test search with sample criteria
    console.log('3. Testing search with sample criteria...');
    const testSearchResponse = await hubspotClient.post('/crm/v3/objects/contacts/search', {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'HAS_PROPERTY'
            }
          ]
        }
      ],
      properties: ['firstname', 'lastname', 'email', 'phone', 'address', 'city', 'state'],
      limit: 3
    });

    console.log(`   ✅ Advanced search successful`);
    console.log(`   📊 Contacts with email: ${testSearchResponse.data.results.length}\n`);

    console.log('=== All Tests Passed! ===\n');
    console.log('Your connector is ready to use!');
    console.log(`Run 'npm start' to start the server.\n`);

    return true;

  } catch (error) {
    console.error('❌ Error testing HubSpot connection:');

    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.message}`);

      if (error.response.status === 401) {
        console.error('\n   💡 This looks like an authentication error.');
        console.error('   Please check that:');
        console.error('   1. HUBSPOT_API_KEY is set correctly in your .env file');
        console.error('   2. The API key is valid and not expired');
        console.error('   3. The private app has "crm.objects.contacts.read" scope\n');
      }
    } else {
      console.error(`   ${error.message}\n`);
    }

    return false;
  }
}

// Run tests
if (require.main === module) {
  testHubSpotConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testHubSpotConnection };
