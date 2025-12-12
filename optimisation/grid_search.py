from sklearn.model_selection import ParameterGrid
import requests
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from azure.storage.blob import BlobServiceClient

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/optimise": {
            "origins": [
                "https://delightful-dune-0bf943403-preview.westeurope.6.azurestaticapps.net",
                "https://delightful-dune-0bf943403.6.azurestaticapps.net",
                "http://localhost:3000",
            ]
        }
    },
)
logging.basicConfig(level=logging.INFO)

COMPRESSION_API_URL = (
    "https://ip-team6-compression-function.azurewebsites.net/api/compressdata"
)
COMPRESSION_API_KEY = "cY1UQbInfG8J47x6HpICBc_rrCFwSNen_geoVqVGgZAEAzFuv_plDw=="
BLOB_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=team6ipstorageaccount;AccountKey=Tt8rQKp/Vi6QAsxdTuSCJH1+s7HODqclwW4+/gZLUawwvDllOmKMRQq2wlOOFffQOmkdjHObgvMA+AStB3Sfog==;EndpointSuffix=core.windows.net"


def fetch_blob_data(storage_url):
    try:
        blob_service_client = BlobServiceClient.from_connection_string(
            BLOB_STORAGE_CONNECTION_STRING
        )
        blob_url_parts = storage_url.split("/")
        container_name = blob_url_parts[3]
        blob_name = "/".join(blob_url_parts[4:])
        blob_client = blob_service_client.get_blob_client(
            container=container_name, blob=blob_name
        )
        blob_data = blob_client.download_blob().readall().decode("utf-8")
        import csv
        from io import StringIO

        reader = csv.DictReader(StringIO(blob_data))
        data = [
            {"timestamp": row["timestamp"], "value": float(row["value"])}
            for row in reader
        ]
        return data
    except Exception as e:
        logging.error(f"Error fetching blob: {str(e)}")
        return []


def run_compression(test_params, data):
    try:
        request_data = {
            "rawData": [
                {"timestamp": point["timestamp"], "value": point["value"]}
                for point in data
            ],
            "parameters": {
                "deviationLimit": test_params["cf_deviation_limit"],
                "deviationType": test_params["cf_deviation_type"].upper(),
                "exceptionFilterDeviationLimit": test_params["ef_deviation_limit"],
                "exceptionFilterDeviationType": test_params[
                    "ef_deviation_type"
                ].upper(),
                "minResampleLimit": test_params["min_resample_limit"],
                "maxResampleLimit": test_params["max_resample_limit"],
            },
        }

        logging.info(f"Calling compression API with params: {test_params}")
        response = requests.post(
            COMPRESSION_API_URL,
            headers={
                "Content-Type": "application/json",
                "x-functions-key": COMPRESSION_API_KEY,
            },
            json=request_data,
        )

        if response.status_code != 200:
            logging.error(f"Compression API error: {response.text}")
            return float("inf"), 1.0, 0.0

        result = response.json()
        if not isinstance(result, list):
            logging.error(f"Unexpected response format: {result}")
            return float("inf"), 1.0, 0.0

        raw_points = len(data)
        compressed_points = len(result)
        compression_ratio = compressed_points / raw_points if raw_points > 0 else 1.0
        data_kept = (1 - compression_ratio) * 100
        file_size = compressed_points  # Approximation based on number of points

        logging.info(
            f"Compression result: file_size={file_size}, ratio={compression_ratio}, data_kept={data_kept}"
        )
        return file_size, compression_ratio, data_kept

    except Exception as e:
        logging.error(f"Error calling compression API: {e}")
        return float("inf"), 1.0, 0.0


def run_optimisation(data):
    logging.info("Starting optimisation")
    if not data:
        logging.error("No data provided")
        return []

    param_grid = {
        "cf_deviation_type": ["absolute", "percentage"],
        "cf_deviation_limit": [2, 5],
        "ef_deviation_type": ["percentage"],
        "ef_deviation_limit": [2],
        "min_resample_limit": [(0, 0, 0), (0, 1, 0)],
        "max_resample_limit": [(0, 0, 0)],
    }

    param_combinations = list(ParameterGrid(param_grid))
    logging.info(f"Testing {len(param_combinations)} parameter combinations")
    results = []

    for params in param_combinations:
        file_size, compression_ratio, data_kept = run_compression(params, data)
        file_size_reduction = round(100 - ((file_size / 5000) * 100), 2)
        results.append((params, file_size, file_size_reduction, round(data_kept, 2)))

    results.sort(key=lambda x: (x[1], -x[3]))
    logging.info(f"Optimisation complete, found {len(results)} results")
    return results


def get_top_5_results(results):
    best_results = results[:5]
    logging.info("Top 5 Parameter Combinations:")
    for i, (params, file_size, file_size_reduction, data_kept) in enumerate(
        best_results, 1
    ):
        logging.info(
            f"{i}. Parameters: {params}, File Size: {file_size} bytes, "
            f"File Size Reduction: {file_size_reduction}%, Data Kept: {data_kept}%"
        )
    return best_results


def get_optimal_result(results):
    if not results:
        default = {
            "cf_deviation_limit": 5,
            "cf_deviation_type": "absolute",
            "ef_deviation_limit": 2,
            "ef_deviation_type": "percentage",
            "min_resample_limit": [0, 0, 0],
            "max_resample_limit": [0, 0, 0],
        }
        logging.warning(f"No results, returning default: {default}")
        return default

    best_result = results[0][0]
    optimal = {
        "cf_deviation_limit": best_result["cf_deviation_limit"],
        "cf_deviation_type": best_result["cf_deviation_type"],
        "ef_deviation_limit": best_result["ef_deviation_limit"],
        "ef_deviation_type": best_result["ef_deviation_type"],
        "min_resample_limit": list(best_result["min_resample_limit"]),
        "max_resample_limit": list(best_result["max_resample_limit"]),
    }
    logging.info(f"Optimal parameters: {optimal}")
    return optimal


@app.route("/optimise", methods=["POST"])
def optimise():
    try:
        data = request.json.get("data", [])
        storage_url = request.json.get("storage_url", "")

        if not data and not storage_url:
            logging.error("No data or storage_url provided")
            return jsonify({"error": "No data or storage_url provided"}), 400

        if storage_url:
            data = fetch_blob_data(storage_url)
            if not data:
                return jsonify({"error": "Failed to fetch data from storage_url"}), 400

        results = run_optimisation(data)
        get_top_5_results(results)  # Log top 5 for debugging
        optimal_params = get_optimal_result(results)
        return jsonify(optimal_params), 200

    except Exception as e:
        logging.error(f"Error processing request: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
