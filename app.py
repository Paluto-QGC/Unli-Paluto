from flask import Flask, request, jsonify, render_template, send_from_directory
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import os
import traceback
import json
from pytz import timezone
import requests

app = Flask(__name__, static_folder='static')

# Set timezone to Manila
manila_tz = timezone('Asia/Manila')

# Google Sheets setup
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

# Get credentials from environment variable
if os.environ.get('GOOGLE_CREDENTIALS'):
    # Create a temporary credentials file from environment variable
    creds_dict = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
else:
    # Fallback to local file for development
    creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)

client = gspread.authorize(creds)

# Replace with your Google Sheet name
SPREADSHEET_NAME = 'PALUTO_Reservations'

# Worksheet headers
VISITOR_HEADERS = ['Timestamp', 'Full Name', 'Phone Number']
RESERVATION_HEADERS = [
    'Reservation Code',
    'Timestamp',
    'Full Name',
    'Phone Number',
    'Inquiry Type',
    'Date',
    'Time',
    'Number of People',
    'Special Requests',
]
# Frequent customer headers
FREQUENT_CUSTOMER_HEADERS = ['Full Name', 'Phone Number', 'Reservation Count']

# Campaign worksheet names
CAMPAIGN_SHEETS = {
    'Unli-Paluto': 'Campaign1_Reservations',
    'Campaign 2': 'Campaign2_Reservations',
    'Campaign 3': 'Campaign3_Reservations',
    'Basic': 'Basic_Reservations'  # New sheet for basic reservations
}

# Google Places API configuration
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
PLACE_ID = os.getenv('PLACE_ID')  # Your restaurant's Google Place ID

def initialize_worksheet(sheet, worksheet_name, headers):
    """Initialize worksheet with headers if it doesn't exist or is empty"""
    try:
        worksheet = sheet.worksheet(worksheet_name)
    except gspread.WorksheetNotFound:
        worksheet = sheet.add_worksheet(worksheet_name, 1, len(headers))
    
    # Check if headers exist
    existing_headers = worksheet.row_values(1)
    if not existing_headers:
        worksheet.insert_row(headers, 1)
    
    return worksheet

def get_sheet():
    try:
        # Try to open existing sheet
        sheet = client.open(SPREADSHEET_NAME)
        print(f"Successfully opened sheet: {SPREADSHEET_NAME}")
        
        # Initialize worksheets
        initialize_worksheet(sheet, 'VisitorLogs', VISITOR_HEADERS)
        
        # Initialize campaign worksheets
        for sheet_name in CAMPAIGN_SHEETS.values():
            initialize_worksheet(sheet, sheet_name, RESERVATION_HEADERS)
        
        # Initialize frequent customers worksheet
        initialize_worksheet(sheet, 'Frequent_Customers', FREQUENT_CUSTOMER_HEADERS)
        
        return sheet
    except gspread.SpreadsheetNotFound:
        print(f"Spreadsheet {SPREADSHEET_NAME} not found")
        # Create new spreadsheet
        sheet = client.create(SPREADSHEET_NAME)
        
        # Initialize worksheets
        initialize_worksheet(sheet, 'VisitorLogs', VISITOR_HEADERS)
        
        # Initialize campaign worksheets
        for sheet_name in CAMPAIGN_SHEETS.values():
            initialize_worksheet(sheet, sheet_name, RESERVATION_HEADERS)
        
        # Initialize frequent customers worksheet
        initialize_worksheet(sheet, 'Frequent_Customers', FREQUENT_CUSTOMER_HEADERS)
        
        print(f"Created new spreadsheet: {SPREADSHEET_NAME}")
        return sheet
    except Exception as e:
        print(f"Error opening spreadsheet: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise

def generate_reservation_code(campaign, row_number):
    """Generate a unique reservation code based on campaign and row number."""
    if campaign == 'Basic':
        return f"PLT-{row_number:04d}"
    else:
        campaign_num = campaign.split()[-1]  # Gets '1' from 'Campaign 1'
        return f"PLTCP{campaign_num}-{row_number:04d}"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/unli-paluto')
def unli_paluto():
    return render_template('unli-paluto.html', campaign="Unli-Paluto")

@app.route('/campaign2')
def campaign2():
    return render_template('campaign2.html', campaign="Campaign 2")

@app.route('/campaign3')
def campaign3():
    return render_template('campaign3.html', campaign="Campaign 3")

@app.route('/basic')
def basic_reservation():
    return render_template('basic.html', campaign="Basic")

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/submit_visitor', methods=['POST'])
def submit_visitor():
    try:
        data = request.json
        if not data:
            return jsonify({'status': 'error', 'message': 'No JSON data received'})
            
        print(f"Received visitor data: {data}")
        
        try:
            sheet = get_sheet()
            worksheet = sheet.worksheet('VisitorLogs')
            
            # Get next available row
            next_row = len(worksheet.get_all_values()) + 1
            
            # Get current time in Manila timezone
            timestamp = datetime.now(manila_tz).strftime('%Y-%m-%d %H:%M:%S')
            
            # Insert new row
            worksheet.append_row([
                timestamp,
                data['fullName'],
                data['phoneNumber']
            ])
            
            print(f"Successfully added visitor: {data['fullName']}")
            return jsonify({'status': 'success'})
            
        except Exception as e:
            print(f"Error accessing/updating worksheet: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return jsonify({'status': 'error', 'message': f'Error updating worksheet: {str(e)}'})
            
    except Exception as e:
        print(f"Error in submit_visitor: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/submit_reservation', methods=['POST'])
def submit_reservation():
    try:
        data = request.json
        if not data:
            return jsonify({'status': 'error', 'message': 'No data received'})

        print(f"Received reservation data: {data}")
        
        try:
            sheet = get_sheet()
            campaign = data.get('campaign', 'Basic')  # Default to Basic if no campaign selected
            worksheet_name = CAMPAIGN_SHEETS.get(campaign)
            
            if not worksheet_name:
                return jsonify({'status': 'error', 'message': 'Invalid campaign selected'})
            
            try:
                worksheet = sheet.worksheet(worksheet_name)
            except Exception as e:
                # If worksheet doesn't exist, create it with headers
                worksheet = sheet.add_worksheet(worksheet_name, 1000, 20)
                worksheet.append_row(RESERVATION_HEADERS)
            
            # Get next row number for the reservation code
            next_row = len(worksheet.get_all_values()) + 1
            reservation_code = generate_reservation_code(campaign, next_row)
            
            # Get current time in Manila timezone
            timestamp = datetime.now(manila_tz).strftime('%Y-%m-%d %H:%M:%S')
            
            # Insert new reservation
            worksheet.append_row([
                reservation_code,
                timestamp,
                data['fullName'],
                data['phoneNumber'],
                data['inquiryType'],  
                data['date'],
                data['time'],
                data['numberOfPeople'],
                data.get('message', '')  
            ])
            
            # Track frequent customers
            customer_name = data['fullName']
            customer_phone = data['phoneNumber']
            
            # Update or add to the frequent customers sheet
            update_frequent_customers(sheet, customer_name, customer_phone)
            
            print(f"Successfully added reservation: {reservation_code}")
            return jsonify({
                'status': 'success',
                'message': 'Reservation submitted successfully',
                'reservationCode': reservation_code
            })
            
        except Exception as e:
            print(f"Error accessing/updating worksheet: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return jsonify({'status': 'error', 'message': f'Error updating worksheet: {str(e)}'})
            
    except Exception as e:
        print(f"Error in submit_reservation: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'status': 'error', 'message': str(e)})

def update_frequent_customers(sheet, customer_name, customer_phone):
    """Update the frequent customers sheet when a reservation is made"""
    try:
        # Get the Frequent_Customers worksheet
        freq_worksheet = sheet.worksheet('Frequent_Customers')
        
        # Check all reservation sheets to count the total reservations for this customer
        total_reservations = 0
        
        # Count existing reservations across all campaign worksheets
        for sheet_name in CAMPAIGN_SHEETS.values():
            try:
                campaign_worksheet = sheet.worksheet(sheet_name)
                # Get all data
                all_data = campaign_worksheet.get_all_values()
                
                if len(all_data) > 1:  # Check if there are any reservations (excluding headers)
                    # Count reservations with matching phone number (column index 3)
                    for row in all_data[1:]:  # Skip header row
                        if len(row) > 3 and row[3] == customer_phone:
                            total_reservations += 1
            except Exception as e:
                print(f"Error counting reservations in {sheet_name}: {str(e)}")
                continue
        
        # If total reservations is more than 1, update or add to the frequent customers sheet
        if total_reservations > 1:
            # Try to find existing customer by phone number
            try:
                cell = freq_worksheet.find(customer_phone)
                if cell:
                    # Update existing row with new count
                    row_idx = cell.row
                    freq_worksheet.update_cell(row_idx, 3, total_reservations)  # Update count in column 3
                else:
                    # Add new row for customer
                    freq_worksheet.append_row([customer_name, customer_phone, total_reservations])
            except gspread.exceptions.CellNotFound:
                # Add new row for customer
                freq_worksheet.append_row([customer_name, customer_phone, total_reservations])
            
            print(f"Updated frequent customer: {customer_name} with {total_reservations} reservations")
    except Exception as e:
        print(f"Error updating frequent customers: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        # Don't raise exception to prevent interrupting the main reservation process

@app.route('/api/reviews')
def get_reviews():
    try:
        # Google Places API endpoint for place details
        url = f'https://maps.googleapis.com/maps/api/place/details/json'
        params = {
            'place_id': PLACE_ID,
            'fields': 'reviews',
            'key': GOOGLE_PLACES_API_KEY
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if data.get('status') == 'OK' and 'reviews' in data.get('result', {}):
            reviews = []
            for review in data['result']['reviews']:
                reviews.append({
                    'name': review.get('author_name', 'Anonymous'),
                    'avatar': review.get('profile_photo_url', ''),
                    'rating': review.get('rating', 0),
                    'text': review.get('text', ''),
                    'date': datetime.fromtimestamp(review.get('time', 0)).strftime('%B %d, %Y'),
                    'relative_time': review.get('relative_time_description', '')
                })
            return jsonify({'success': True, 'reviews': reviews})
        
        return jsonify({'success': False, 'error': 'No reviews found'})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
