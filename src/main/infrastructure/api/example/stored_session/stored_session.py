"""A client app that uses the device code flow and stores its session with keyring"""
__author__ = "Ross Kelso"
__docformat__ = 'reStructuredText'

import json

import intelligent_plant.session_manager as session_manager

# Remeber to enable the device code flow in the app store app registration

#load the json config file with the app information
with open('config.json') as json_config_file:
    config = json.load(json_config_file)

    app_id = config['app']['id']
    app_secret = config['app']['secret']
    base_url = config['app_store']['base_url']


app_store = session_manager.load_session_or_login(app_id, app_secret, scopes=['DataRead'], base_url=base_url)

data_core = app_store.get_data_core_client()

print(list(map(lambda x: x['Name']['QualifiedName'], data_core.get_data_sources())))
