# WhatsApp Business API Integration

This document describes how to set up the WhatsApp Business API integration for the Valuations App.

## Overview

The Valuations App includes WhatsApp integration for sending appointment confirmations to customers when the "Activate the event to send invitations and updates" checkbox is selected during appointment booking.

## Prerequisites

To use the WhatsApp Business API integration, you need:

1. A WhatsApp Business account
2. Access to the WhatsApp Business API through Meta's Graph API
3. A registered Phone Number ID
4. A valid access token with appropriate permissions

## Configuration

Add the following environment variables to your `.env` file:

```
# WhatsApp Business API Configuration
REACT_APP_WHATSAPP_API_URL=https://graph.facebook.com/v17.0
REACT_APP_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
REACT_APP_WHATSAPP_ACCESS_TOKEN=your_access_token
```

### How to obtain your Phone Number ID

1. Go to the [Meta Developer Dashboard](https://developers.facebook.com/)
2. Navigate to your WhatsApp Business account
3. Go to "WhatsApp > Getting Started"
4. Your Phone Number ID will be displayed there

### How to obtain your Access Token

1. Go to the [Meta Developer Dashboard](https://developers.facebook.com/)
2. Navigate to your WhatsApp Business app
3. Go to "WhatsApp > Configuration"
4. Under "Temporary access token", generate a new token
5. For production, create a System User with the appropriate permissions and generate a permanent token

## How it Works

When an appointment is booked with the "Activate the event" checkbox selected:

1. The appointment is first saved to the database
2. The WhatsApp API is called to send a confirmation message to the customer's phone number
3. The message includes appointment details such as date, time, location, and survey type
4. A toast notification appears in the UI indicating whether the WhatsApp message was sent successfully

## Troubleshooting

Common issues:

1. **Invalid Phone Number Format**: Ensure all customer phone numbers include the country code (e.g., +27 for South Africa)
2. **Authentication Errors**: Check that your access token is valid and has not expired
3. **Rate Limits**: The WhatsApp Business API has rate limits. Check the Meta Developer Dashboard for your usage

## Development Mode

In development, the WhatsApp API calls are mocked if the API returns an error. This allows you to test the UI without making actual API calls.

## Message Format

The WhatsApp message follows this format:

```
*Appointment Confirmation*

Dear [Customer Name],

Your appointment has been scheduled successfully:

📅 *Date:* [Date]
🕒 *Time:* [Start Time] - [End Time]
📍 *Location:* [Address]
🧰 *Survey Type:* [Survey Types]
👤 *Surveyor:* [Surveyor Name]

If you need to reschedule or have any questions, please contact us.

Thank you for choosing our services.
``` 