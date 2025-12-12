resource "azurerm_storage_queue" "IP_fifo_queue" {
  name                 = "ip-fifo-queue"
  storage_account_name = azurerm_storage_account.IP_storage_account.name
}

resource "azurerm_eventgrid_event_subscription" "IP_blob_created" {
  name  = "ip-blob-created"
  scope = azurerm_resource_group.IP_resource_group.id

  storage_queue_endpoint {
    storage_account_id = azurerm_storage_account.IP_storage_account.id
    queue_name         = azurerm_storage_queue.IP_fifo_queue.name
  }
}
