# Intelligent Plant: Compression Optimisation

[![React](https://img.shields.io/badge/Frontend-React-blue)](https://reactjs.org/)
[![Azure](https://img.shields.io/badge/Cloud-Azure_Serverless-0078D4)](https://azure.microsoft.com/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-623CE4)](https://www.terraform.io/)
[![Python](https://img.shields.io/badge/Optimisation-Python_Scikit--Learn-yellow)]()
[![C#](https://img.shields.io/badge/Algorithm-C%23_.NET-green)]()

> **An industrial-grade application developed for the Intelligent Plant Industrial App Store.**
> * **Project Type:** Software Engineering Group Project (University of Nottingham)
> * **Industry Partner:** Intelligent Plant
> * **Role:** Frontend Lead & UI/UX Developer

## Project Overview

**Compression Optimisation** is a full-stack web application designed to solve the challenge of storing massive amounts of Industrial IoT (IIoT) time-series data. It allows engineers to:

1.  **Compress Data:** Reduce storage costs and transmission time using a bespoke compression algorithm (Swinging Door / Box Car variants).
2.  **Optimise Parameters:** Automatically calculate the "sweet spot" for compression settings (balancing data fidelity vs. file size) using a **Grid Search optimisation algorithm**.
3.  **Visualise Results:** View real-time interactive charts comparing raw vs. compressed data to verify accuracy.

This project was developed using **Agile Scrum** methodology and integrates directly with the **Intelligent Plant Industrial App Store API**.

## System Architecture

The system utilizes a **Serverless Microservices Architecture** hosted on **Microsoft Azure**, provisioned entirely via **Terraform (Infrastructure as Code)**.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React.js, Chart.js | Hosted on Azure Static Web Apps. Provides data visualisation and configuration UI. |
| **Infrastructure** | Terraform | Manages all Azure resources (Resource Groups, Blob Storage, Functions) as code. |
| **Compression Engine** | C# (.NET 8.0) | Azure Function executing the core compression logic (high performance). |
| **Optimisation Engine** | Python (Scikit-learn) | Azure Function running Grid Search to find optimal compression parameters. |
| **Storage** | Azure Blob & Table Storage | Stores raw/compressed datasets and user configuration history. |

## Screenshots
<img width="776" height="449" alt="image" src="https://github.com/user-attachments/assets/eafcc17b-c8aa-4ad7-a406-9bab15416229" />

## My Contributions

As the **Frontend Lead / UI Developer** (and contributor to Testing), my specific contributions included:

* **UI Architecture:** Designed and implemented the modular React interface, including the **Data Source Selection**, **Configuration Panel**, and **History Sidebar**.
* **Data Visualisation:** Implemented high-performance interactive charts using **Chart.js** to handle and render thousands of industrial data points smoothly.
* **Testing Strategy:** Established the frontend testing framework using **Jest** and **React Testing Library**. Wrote unit tests for components to verify metric calculations and edge cases (e.g., empty datasets).
* **Integration:** Collaborated with the backend team to connect the React frontend with Azure Functions and the Optimisation API.

## Key Features

* **Automatic Optimisation:** Uses a Python-based Grid Search to recommend the best deviation limits and exception filters.
* **Cloud-Native:** Fully serverless backend ensuring scalability and cost-efficiency.
* **Historical Configurations:** Users can save, load, and manage previous compression setups via Azure Table Storage.
* **Real-time Metrics:** Instantly calculates Compression Ratio, Storage Savings, and Error Rate.

## Installation & Setup

### Prerequisites
* Node.js (v16+)
* Python 3.9+
* .NET SDK 8.0
* Azure CLI & Terraform
