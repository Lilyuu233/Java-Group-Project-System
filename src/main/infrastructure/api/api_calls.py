import json
import pkce
import datetime
import csv
import os

from bottle import route, run, request, redirect, static_file

import intelligent_plant.app_store_client as app_store
import intelligent_plant.data_core_client as data_core

app_id = None
app_secret = None
base_url = None

#in the real world a new client would need to be instanced per user
client = None
code_verifier = None

#we will write the data selected in the datasource to the public folder the react front end relies on
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REACT_PUBLIC = os.path.abspath(
    os.path.join(BASE_DIR, '..', '..', '..', 'public')
)
assert os.path.isdir(REACT_PUBLIC), f"Path not found: {REACT_PUBLIC}"

#load the json config file with the app information
with open('config.json') as json_config_file:
    config = json.load(json_config_file)

    app_id = config['app']['id']
    app_secret = config['app']['secret']
    base_url = config['app_store']['base_url']

@route('/auth')
def auth():
    """After logging in the browser is redirected here where the server complete authorization"""
    global client
    auth_code = request.query.code

    client = app_store.complete_authorization_code_grant_flow(auth_code, app_id, app_secret, "http://localhost:8080/auth", code_verifier=code_verifier, base_url=base_url)

    #print(client.refresh_token)

    redirect('/data_sources')

@route('/info')
def info():
    """Once authorized the user is redirected here which displays there app store user info"""
    data = client.get_user_info()
    print("info")
    return str(data)

@route('/data_sources')
def data_sources():
    #once authorised, the data sources names are retrieved from the API and stored in a list
    global client
    global qualifiedNames
    global dsnNames
    qualifiedNames = [] #list of qualified names
    dsnNames = {} #dictionary where keys are qualified names and values are plain text names

    sources = client.get_data_core_client().get_data_sources()

    for i in range(len(sources)):
        for k, v in sources[i].items():
            if k == 'Name':
                qualifiedNames.append(v['QualifiedName'])
                dsnNames[v['QualifiedName']] = v['Name']
    
    QUALIFIED_CSV_PATH = os.path.join(REACT_PUBLIC, "qualified_names.csv")
    with open(QUALIFIED_CSV_PATH, "w", newline="") as fp:
        writer = csv.writer(fp)
        writer.writerow(["QualifiedName"])
        for qn in qualifiedNames:
            writer.writerow([qn])
    print("✔ wrote", QUALIFIED_CSV_PATH)

    redirect('/get_data')


# Route handler to fetch data from multiple data sources and save it to a CSV file
@route('/get_data')
def get_data():
    global client  # Assume client is an initialized global object for data fetching

    returnData = []  # Will store the collected data rows
    pointCount = 5000  # Maximum number of points to retrieve per tag
    success_sources = []  # List of successfully processed data sources
    failed_sources = []   # List of failed data sources with reasons

    # Define the time range for data collection: last 365 days
    endDate = datetime.datetime.utcnow()
    startDate = endDate - datetime.timedelta(days=365)

    # Iterate over all qualified data source names
    for dsn in qualifiedNames:
        print(f"\n Checking data source: {dsn}")
        try:
            # Attempt to retrieve tags for the data source
            tags = client.get_data_core_client().get_tags(dsn)
            if not tags:
                print(f"⚠ No tags found for {dsn}")
                failed_sources.append((dsn, "No tags"))
                continue

            tag_success = False  # Track if any tag returned usable data

            # Try each tag under the data source
            for tag in tags:
                tag_id = tag.get("Id", "")
                tag_name = tag.get("Name", "<unknown>")
                try:
                    # Attempt to get raw data for this tag
                    data = client.get_data_core_client().get_raw_data({dsn: [tag_id]}, startDate, endDate, pointCount)
                    values = data[dsn][tag_id]['Values']

                    # If data points are found, add to return list and mark as successful
                    if values:
                        print(f" Tag '{tag_name}' returned {len(values)} values")
                        for v in values:
                            returnData.append([dsn, v['UtcSampleTime'], v['NumericValue']])
                        success_sources.append(f"{dsn} ({tag_name})")
                        tag_success = True
                        break  # Stop after the first successful tag

                    else:
                        print(f" Tag '{tag_name}' returned 0 values")

                except Exception as te:
                    print(f" Error with tag '{tag_name}': {te}")
                    continue  # Try next tag if one fails

            if not tag_success:
                failed_sources.append((dsn, "No tag returned values"))

        except Exception as e:
            print(f" Error with {dsn}: {e}")
            failed_sources.append((dsn, str(e)))
            continue

    # Save all collected data into a CSV file accessible to React frontend
    CSV_PATH = os.path.join(REACT_PUBLIC, "data_points.csv")
    with open(CSV_PATH, "w", newline="") as fp:
        writer = csv.writer(fp)
        writer.writerow(["DataSource", "UtcSampleTime", "NumericValue"])  # CSV header
        writer.writerows(returnData)

    # Print summary of results to server log
    print("\n CSV saved to:", CSV_PATH)
    print(f"\n SUCCESSFUL SOURCES: {len(success_sources)}")
    for s in success_sources:
        print(f"   - {s}")
    print(f"\n FAILED SOURCES: {len(failed_sources)}")
    for s, reason in failed_sources:
        print(f"   - {s}: {reason}")

    # Return the collected data as a string (for debugging or confirmation)
    return str(returnData)



@route('/refresh')
def info():
    """Refresh the client session using the refresh token"""
    global client
    print("Old access token: ", client.access_token)
    client = client.refresh_session(app_id, app_secret)
    print("New access token: ", client.access_token)
    return "Refreshed"

@route('/')
def index():
    """Users land here at the route and get redirected to the app store login page"""
    global code_verifier
    code_verifier, code_challenge = pkce.generate_pkce_pair()
    url = app_store.get_authorization_code_grant_flow_url(app_id, "http://localhost:8080/auth", ["UserInfo", "DataRead"], code_challenge=code_challenge, code_challenge_method='S256', access_type='offline', base_url=base_url)
    redirect(url)

run(host='localhost', port=8080, debug = True)