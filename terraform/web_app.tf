resource "azurerm_static_web_app" "ip_react_static_app" {
  name                = "ip-team6-static-webapp"
  resource_group_name = azurerm_resource_group.IP_resource_group.name
  location            = azurerm_resource_group.IP_resource_group.location
  sku_tier            = "Free"
  sku_size            = "Free"

  tags = {
    "environment" = "dev"
  }
}

output "static_app_url" {
  value       = "https://${azurerm_static_web_app.ip_react_static_app.default_host_name}"
  description = "The URL of the deployed React static web app"
}

output "optimisation_function_url" {
  value       = "https://${azurerm_linux_function_app.IP_optimisation_function.default_hostname}/api/optimise"
  description = "The URL of the optimisation Function App"
}
