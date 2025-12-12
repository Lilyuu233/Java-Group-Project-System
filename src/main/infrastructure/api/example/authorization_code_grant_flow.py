"""A simple web server that implments the suthorization code grant flow"""
__author__ = "Ross Kelso"
__docformat__ = 'reStructuredText'

import json
import urllib

from bottle import route, run, request, redirect

import intelligent_plant.app_store_client as app_store

app_id = None
app_secret = None
base_url = None

#in the real world a new client would need to be instanced per user
client = None

#load the json config file with the app information
with open('config.json') as json_config_file:
    config = json.load(json_config_file)

    print(config)

    app_id = config['app']['id']
    app_secret = config['app']['secret']
    base_url = config['app_store']['base_url']

@route('/auth')
def auth():
    """After logging in the browser is redirected here where the server complete authorization"""
    global client
    auth_code = request.query.code

    client = app_store.complete_authorization_code_grant_flow(auth_code, app_id, app_secret, "http://localhost:8080/auth", base_url=base_url)

    redirect('/info')

@route('/info')
def info():
    """Once authorized the user is redirected here which displays there app store user info"""
    data = client.get_user_info()
    return str(data)

@route('/refresh')
def info():
    """Refresh teh client session using the refresh token"""
    global client
    client = client.refresh_session(app_id, app_secret)
    return "Refreshed"

@route('/')
def index():
    """Users land here at the route and get redirected to the app store login page"""
    url = app_store.get_authorization_code_grant_flow_url(app_id, "http://localhost:8080/auth", ["UserInfo", "DataRead"], base_url=base_url)
    redirect(url)


run(host='localhost', port=8080)

