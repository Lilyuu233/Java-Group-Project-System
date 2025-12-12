data "azurerm_storage_account_sas" "IP_blob_sas" {
  connection_string = azurerm_storage_account.IP_storage_account.primary_connection_string
  https_only        = true

  resource_types {
    service   = true
    container = true
    object    = true
  }

  services {
    blob  = true
    queue = false
    table = false
    file  = false
  }

  start  = "2025-01-01T00:00:00Z"
  expiry = "2026-01-01T00:00:00Z"

  permissions {
    read    = true
    write   = true
    delete  = true
    list    = true
    add     = true
    create  = true
    update  = true
    process = true
    filter  = false
    tag     = false
  }
}

output "blob_sas_token" {
  value       = data.azurerm_storage_account_sas.IP_blob_sas.sas
  sensitive   = true
  description = "SAS token for accessing Blob Storage"
}
