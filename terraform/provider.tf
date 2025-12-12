terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.117.1"
    }
  }
  backend "azurerm" {
    resource_group_name = "tfstate"
    storage_account_name = "tfstatejmlbw"
    container_name = "tfstate"
    key = "terraform.tfstate"
  }
  required_version = ">= 1.3.0"
}

provider "azurerm" {
  features {}
  subscription_id = "40086bc9-0489-470c-a527-869baa9c5c62"
}
