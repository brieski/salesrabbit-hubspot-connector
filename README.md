# SalesRabbit to HubSpot Connector

A web connector that integrates SalesRabbit with HubSpot to search and display contact information based on lead data.

## Features

- ✅ Receives lead data from SalesRabbit via URL parameters
- ✅ Searches HubSpot contacts by multiple criteria (name, email, phone, address)
- ✅ Beautiful web interface displaying matched contacts
- ✅ Direct links to HubSpot contact records
- ✅ Responsive design for mobile and desktop
- ✅ Real-time contact matching

## How It Works

1. **SalesRabbit sends lead data** via URL parameters when the connector is opened
2. **Connector searches HubSpot** using multiple criteria:
   - Email (exact match)
   - Phone number (contains)
   - Name + Address combination
3. **Displays results** in a clean web interface with:
   - Contact details
   - Company and job title
   - Lifecycle stage and lead status
   - Direct link to HubSpot record

## Prerequisites

1. **HubSpot Private App Token**
   - Go to HubSpot → Settings → Integrations → Private Apps
   - Create a new private app with these scopes:
     - `crm.objects.contacts.read`
   - Copy the access token

2. **SalesRabbit Account with API Access**
   - Pro or Enterprise plan required for custom connectors

3. **Node.js** (version 14 or higher)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
HUBSPOT_API_KEY=pat-na1-xxxxx-xxxxx
SALESRABBIT_API_KEY=xxxxx-xxxxx-xxxxx
PORT=3000
```

### 3. Test Locally

```bash
npm start
```

Visit: `http://localhost:3000`

### 4. Test the Connector with Sample Data

```bash
npm test
```

Or manually test by visiting:
```
http://localhost:3000/connector?firstName=John&lastName=Doe&email=john@example.com&phone=5551234567&street=123+Main+St&city=Raleigh&state=NC&zip=27601
```

## SalesRabbit Configuration

### Setting Up the Connector in SalesRabbit

1. Log in to SalesRabbit Admin Portal
2. Go to **Settings → Integrations → Connectors**
3. Click **"Add Connector"**
4. Select **"Web Connect"** type
5. Configure the connector:

   **Connector Name:** HubSpot Contact Lookup

   **Connector URL:**
   ```
   https://your-domain.com/connector?firstName={{lead.firstName}}&lastName={{lead.lastName}}&email={{lead.email}}&phone={{lead.phone}}&street={{lead.street}}&city={{lead.city}}&state={{lead.state}}&zip={{lead.postalCode}}
   ```

   Replace `your-domain.com` with your deployed URL (see Deployment section below)

6. **Save** the connector
7. Test by opening the connector from a lead in SalesRabbit mobile app

### URL Parameter Mapping

The connector accepts these URL parameters from SalesRabbit:

| Parameter | SalesRabbit Field | Description |
|-----------|------------------|-------------|
| `firstName` | `{{lead.firstName}}` | Contact's first name |
| `lastName` | `{{lead.lastName}}` | Contact's last name |
| `email` | `{{lead.email}}` | Email address |
| `phone` | `{{lead.phone}}` | Phone number |
| `street` | `{{lead.street}}` | Street address |
| `city` | `{{lead.city}}` | City |
| `state` | `{{lead.state}}` | State |
| `zip` | `{{lead.postalCode}}` | ZIP/Postal code |

## Deployment

### Option 1: Deploy to Render

```bash
# 1. Push code to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main

# 2. Create new Web Service on Render
# - Connect your GitHub repository
# - Build Command: npm install
# - Start Command: npm start

# 3. Set environment variables in Render dashboard:
#    - HUBSPOT_API_KEY
#    - SALESRABBIT_API_KEY
#    - PORT (auto-set by Render)

# 4. Deploy!
```

Your connector URL will be: `https://your-app-name.onrender.com/connector`

### Option 2: Deploy to Heroku

```bash
heroku login
heroku create your-app-name

heroku config:set HUBSPOT_API_KEY=your_key
heroku config:set SALESRABBIT_API_KEY=your_key

git push heroku main
```

Your connector URL will be: `https://your-app-name.herokuapp.com/connector`

### Option 3: Deploy to any VPS

```bash
# On your server
git clone your-repo
cd your-repo
npm install
npm install -g pm2

# Create .env file with your keys
nano .env

# Start with PM2
pm2 start src/server.js --name salesrabbit-hubspot-connector
pm2 save
pm2 startup
```

## API Endpoints

### `GET /connector`
Main connector endpoint that receives SalesRabbit lead data and searches HubSpot.

**Query Parameters:**
- `firstName` - First name
- `lastName` - Last name
- `email` - Email address
- `phone` - Phone number
- `street` or `address` - Street address
- `city` - City
- `state` - State
- `zip` or `postalCode` - ZIP code

**Response:** HTML page with contact results

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-12T12:00:00.000Z",
  "service": "SalesRabbit-HubSpot Connector"
}
```

### `GET /`
Root endpoint with documentation.

## Search Logic

The connector uses HubSpot's Search API with the following logic:

1. **Email Match** (highest priority)
   - Exact match on email address
   - Most unique identifier

2. **Phone Match**
   - Contains token match on phone number
   - Strips formatting for better matching

3. **Name + Address Match**
   - Combines first name, last name, and address
   - Uses AND logic within the filter group

Results are limited to 10 contacts and displayed in match order.

## Troubleshooting

### "No Matches Found"

- Verify the lead data in SalesRabbit is complete
- Check that HubSpot contacts have matching email, phone, or address data
- Try searching with just email or phone first
- Ensure HubSpot API key has `crm.objects.contacts.read` scope

### "Error occurred while searching"

- Check HubSpot API key is valid in `.env`
- Verify API key has correct scopes
- Check server logs for detailed error messages
- Test HubSpot API connection with `npm test`

### Connector not loading in SalesRabbit

- Verify connector URL is publicly accessible (HTTPS)
- Check that URL parameters are properly formatted
- Test the URL directly in a web browser
- Ensure server is running and accessible

### Deployment fails

- Ensure Node.js engine is specified in package.json
- Verify all environment variables are set
- Check deployment logs for specific errors
- Make sure start command is `npm start` or `node src/server.js`

## Development

### Running locally

```bash
npm run dev
```

This uses nodemon for auto-reload on file changes.

### Testing the connector

```bash
npm test
```

This will test the HubSpot API connection and search functionality.

## Security

- API keys are stored in environment variables (never committed to git)
- HubSpot requests use bearer token authentication
- HTTPS required for production deployment
- Rate limiting handled by HubSpot API

## License

MIT
