"""A client app that uses NTLM authentication"""
__author__ = "Ross Kelso"
__docformat__ = 'reStructuredText'

from getpass import getpass

from requests_negotiate_sspi import HttpNegotiateAuth

import intelligent_plant.data_core_client as data_core_client

import example.example_queries as example_queries

# This is the the base url for an app store connected installed locally
# This is the same as the URL of the admin UI
# YOU MUST INCLUDE THE TRAILING '/'
base_url = 'http://localhost:2006/Service/runtime/997A4E3FD58B6CA3DEAA6C222108C040C078CF21844D0481236EE8DCEC831464/datacore/'

# print('Domain:')
# domain = input()

# print("Username:")
# username = input()

# password = getpass()

# auth = HttpNegotiateAuth(domain=domain, username=username, password=password) # explicitly pass user credentials
auth = HttpNegotiateAuth() # use the currently logged in user

data_core= data_core_client.DataCoreClient(base_url=base_url, auth=auth)

data_sources = data_core.get_data_sources()

#load the available datasources
data_sources = example_queries.data_source(data_core)

print(data_sources)

print("\n")

dsn = 'Edge Historian'

#load the available tags for the 1st loaded datasource
tags = example_queries.tag_search(data_core, dsn)

print(tags)

print("\n")

tags = [{'Id': 'Wave'}]

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

