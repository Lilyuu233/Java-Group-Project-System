"""A client app that uses NTLM authentication"""
__author__ = "Ross Kelso"
__docformat__ = 'reStructuredText'

from getpass import getpass

from requests_ntlm import HttpNtlmAuth

import intelligent_plant.data_core_client as data_core_client

# This is the the base url for an app store connected installed locally
# This is the same as the URL of the admin UI
# YOU MUST INCLUDE THE TRAILING '/'
base_url = 'http://localhost:2006/Service/runtime/997A4E3FD58B6CA3DEAA6C222108C040C078CF21844D0481236EE8DCEC831464/datacore/'

print("Username:")
username = input()

password = getpass()

auth = HttpNtlmAuth(username, password)

data_core= data_core_client.DataCoreClient(base_url=base_url, auth=auth)

data_sources = data_core.get_data_sources()

print(list(map(lambda x: x['Name']['QualifiedName'], data_sources)))