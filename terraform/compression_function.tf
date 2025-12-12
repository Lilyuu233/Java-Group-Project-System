resource "azurerm_linux_function_app" "IP_compression_function" {
  name                       = "ip-team6-compression-function"
  location                   = azurerm_resource_group.IP_resource_group.location
  resource_group_name        = azurerm_resource_group.IP_resource_group.name
  service_plan_id            = azurerm_service_plan.IP_service_plan.id
  storage_account_name       = azurerm_storage_account.IP_storage_account.name
  storage_account_access_key = azurerm_storage_account.IP_storage_account.primary_access_key

  app_settings = {
    "FUNCTIONS_EXTENSION_VERSION" = "~4"
    "FUNCTIONS_WORKER_RUNTIME"    = "dotnet-isolated"
    "WEBSITE_RUN_FROM_PACKAGE"    = "1"
  }

  site_config {
    application_stack {
      dotnet_version              = "8.0"
      use_dotnet_isolated_runtime = true
    }

    cors {
      allowed_origins = [
        "http://localhost:3000",
        "https://delightful-dune-0bf943403-preview.westeurope.6.azurestaticapps.net",
        "https://delightful-dune-0bf943403.6.azurestaticapps.net"
      ]
      support_credentials = false
    }
  }
}
