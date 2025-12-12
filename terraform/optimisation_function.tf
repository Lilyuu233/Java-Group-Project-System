resource "azurerm_linux_function_app" "IP_optimisation_function" {
  name                       = "ip-team6-optimisation-function"
  location                   = azurerm_resource_group.IP_resource_group.location
  resource_group_name        = azurerm_resource_group.IP_resource_group.name
  service_plan_id            = azurerm_service_plan.IP_service_plan.id
  storage_account_name       = azurerm_storage_account.IP_storage_account.name
  storage_account_access_key = azurerm_storage_account.IP_storage_account.primary_access_key

  app_settings = {
    "FUNCTIONS_EXTENSION_VERSION"     = "~4"
    "FUNCTIONS_WORKER_RUNTIME"        = "python"
    "WEBSITE_RUN_FROM_PACKAGE"        = "1"
    "COMPRESSION_API_URL"             = "https://ip-team6-compression-function.azurewebsites.net/api/compressdata"
    "COMPRESSION_API_KEY"             = "cY1UQbInfG8J47x6HpICBc_rrCFwSNen_geoVqVGgZAEAzFuv_plDw=="
    "BLOB_STORAGE_CONNECTION_STRING"  = azurerm_storage_account.IP_storage_account.primary_connection_string
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_role_assignment" "IP_blob_contributor_optimisation" {
  scope                = azurerm_storage_account.IP_storage_account.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_linux_function_app.IP_optimisation_function.identity[0].principal_id
}
