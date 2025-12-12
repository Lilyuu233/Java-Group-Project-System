"""Print the stored session stored with keyring"""
__author__ = "Ross Kelso"
__docformat__ = 'reStructuredText'

import json

import intelligent_plant.session_manager as session_manager

#load the json config file with the app information
with open('config.json') as json_config_file:
    config = json.load(json_config_file)

    app_id = config['app']['id']
    app_secret = config['app']['secret']
    base_url = config['app_store']['base_url']

print(session_manager.load_session(app_id).to_json())