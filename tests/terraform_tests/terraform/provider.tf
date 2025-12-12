terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
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
}
