"""An example of creating a tag in IP Hist"""
__author__ = "Ross Kelso"
__docformat__ = 'reStructuredText'

from requests_negotiate_sspi import HttpNegotiateAuth

import intelligent_plant.data_core_client as data_core_client
import intelligent_plant.utility as utility
import intelligent_plant.ip_hist as ip_hist

base_url = 'http://localhost:2006/Service/runtime/997A4E3FD58B6CA3DEAA6C222108C040C078CF21844D0481236EE8DCEC831464/datacore/'

auth = HttpNegotiateAuth() # use the currently logged in user

data_core= data_core_client.DataCoreClient(base_url=base_url, auth=auth)

dsn = 'Edge Historian'

result = data_core.create_tag(dsn, utility.construct_tag_definition('tag-name', properties=ip_hist.construct_ip_hist_tag_properties()))

print(result)