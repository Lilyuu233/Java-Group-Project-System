"""A client app that uses the implicit grant flow"""
__author__ = "Ross Kelso"
__docformat__ = 'reStructuredText'

import json
import urllib

import requests
import webview

import numpy as np
import matplotlib.pyplot as plt
import pandas as pd

import intelligent_plant.app_store_client as app_store_client

import example.example_queries as example_queries

#this url is authorised by the app, for this application it doesn't really matter
#as the access token is read by reading fragment from the web view
redirect_url = "https://www.intelligentplant.com"

base_url = None

def test_client(token):
    """
    Test that the app store and data core clients are working
    :param token: The user's access token.
    """
    app_store = app_store_client.AppStoreClient(token, None, base_url = base_url)

    example_queries.app_store_queries(app_store)

    data_core = app_store.get_data_core_client(data_core_url)

    #load the available datasources
    data_sources = example_queries.data_source(data_core)

    print(data_sources)

    print("\n")

    dsn = 'FCBB05262EADC0B147746EE6DFB2B3EA5C272C33C2C5E3FE8F473D85529461CA.Oil Co Demo'

    #load the available tags for the 1st loaded datasource
    tags = example_queries.tag_search(data_core, dsn)

    print(tags)

    print("\n")

    #query some snapshot data
    val = example_queries.snapshot(data_core, dsn, tags[0]["Id"])

    print(val)

    #query historical data for a single tag
    example_queries.plot_tag(data_core, dsn, tags[0]["Id"])

    #query historical data for multiple tags
    example_queries.plot_tags(data_core, dsn, list(map(lambda x: x["Id"], tags)))

    #get the values at specific times
    times = example_queries.at_times(data_core, dsn, list(map(lambda x: x["Id"], tags)), ["2019-07-06T19:50:36.0113792Z"])

    print(times)

    #writes a value at the current time
    write_snapshot_result = example_queries.write_snapshot(data_core)

    #writes a value at a time in the past
    write_historical_result = example_queries.write_historical(data_core)


def on_loaded(window):
    while True: #TODO: listening for an event would be better than this busy wait
        url = window.get_current_url()

        #check if the user has been redirected (i.e. logeed in)
        if (url.startswith(redirect_url)):
            window.destroy()
            #get the access code from the current url
            parsed = urllib.parse.urlparse(url)

            access_token = urllib.parse.parse_qs(parsed.fragment)['access_token'][0]
            print(access_token)
            #test the app store and data core clients
            test_client(access_token)
            break

#load the json config file with the app information
with open('config.json') as json_config_file:
    config = json.load(json_config_file)

    app_id = config['app']['id']
    app_secret = config['app']['secret']
    base_url = config['app_store']['base_url']
    data_core_url = config['data_core']['base_url']

    #generate the implicit grant flow url
    url = app_store_client.get_implicit_grant_flow_url(app_id, redirect_url, ["UserInfo", "DataRead", "AccountDebit"], base_url = base_url)

    #open a web view window with the appstore login
    window = webview.create_window('Login', url)
    webview.start(on_loaded, window)
    