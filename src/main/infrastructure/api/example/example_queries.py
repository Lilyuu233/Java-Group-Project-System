"""This module includes exmpale queries that can be made using the clients"""
__author__ = "Ross Kelso"
__docformat__ = 'reStructuredText'

import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime, timedelta

import intelligent_plant.utility as utility

def app_store_queries(app_store):
    """
    Tests the app store queries.
    :param app_store: An app store client instance.
    """
    #get the current users app store info
    print(app_store.get_user_info())

    #debit 1 credit from the account
    # ref = app_store.debit_account(1)

    # print(ref)

    #refund the transaction
    # app_store.refund_account(ref)

def data_source(data_core):
    """
    Get all available data sources.
    :param data_core: A data core client instance
    :return: The available data sources
    """
    #get all datasources
    return data_core.get_data_sources()

def tag_search(data_core, dsn):
    """
    Do a tag search
    :param data_core: A data core client instance
    :param dsn: The fully qualified name of a data source
    :return: The tags matching the search
    """
    #get the first page of tags from the provided data sourse fully qualified name
    return data_core.get_tags(dsn)

def plot_tag(data_core, dsn, tag):
    """
    Plot the data for a specific tag.
    :param data_core: A data core client instance
    :param dsn: The fully qualified name of a data source
    :param tag: The name of the tag that should be plotted.
    """
    #request some data
    data = data_core.get_plot_data({dsn: tag}, "*-30d", "*", 30)
    
    data_frame = utility.query_result_to_data_frame(data, force_numeric=True)

    #plot the data frame
    plt.plot(data_frame)
    plt.show()

def plot_tags(data_core, dsn, tag_names):
    """
    Plot the data for multiple tags
    :param data_core: A data core client instance
    :param dsn: The fully qualified name of a data source
    :param tags: The name of the tags that should be plotted.
    """
    #fetch the data for all the tags we found
    
    data = data_core.get_plot_data({dsn: tag_names}, "*-30d", "*", 30)

    data_frame = utility.query_result_to_data_frame(data, force_numeric=True)

    data_frame.fillna(method='ffill', inplace=True)
    
    #plot the data frame
    plt.plot(data_frame)
    plt.show()

def snapshot(data_core, dsn, tag):
    """
    Get the snapshot value for a tag
    :param data_core: A data core client instance
    :param dsn: The fully qualified name of a data source
    :param tag: The name of the tag to query.
    """
    #do a snapshot query
    return data_core.get_snapshot_data({dsn: [tag]})

def at_times(data_core, dsn, tags, times):
    """
    Get the value of the tags at the given time
    :param data_core: A data core client instance
    :param dsn: The fully qualified name of a data source
    :param tags: A list of tag names
    :param times: the list of times to fetch values for.
    """
    return data_core.get_data_at_times({dsn: tags}, times)

def write_snapshot(data_core):
    """
    Writes a value at a given time.

    :param data_core: A data core client instance
    """
    dsn = "6E950F38B717309C996E5E5FEE1DD155FAE50A8FEEF1BE97B42523A8F3E26857.Edge Historian"

    tag_value = utility.construct_tag_value("PnID.Write.Test", numeric_value=100)

    return data_core.write_snapshot_values(dsn, [tag_value])

def write_historical(data_core):
    """
    Writes historical value.

    :param data_core: A data core client instance
    """
    dsn = "6E950F38B717309C996E5E5FEE1DD155FAE50A8FEEF1BE97B42523A8F3E26857.Edge Historian"

    sample_time = datetime.now() - timedelta(days=1)

    tag_value = utility.construct_tag_value("PnID.Write.Test", utc_sample_time=sample_time, numeric_value=50)

    return data_core.write_historical_values(dsn, [tag_value])