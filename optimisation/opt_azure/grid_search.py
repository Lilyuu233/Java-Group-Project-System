from sklearn.model_selection import ParameterGrid
import os
import requests
import csv
from io import StringIO
import azure.functions as func

# from azure.storage.blob import BlobServiceClient

"""
parameters:
- compression filter deviation type: absolute or percentage
- compression filter deviation limit: integer
- exception filter deviation type: absolute or percentage
- exception filter deviation limit: integer
- minimum resample limit: hours, minutes, seconds
- maximum resample limit: hours, minutes, seconds
"""

"""
measures:
- smallest file size
- smallest compression ratio (minimum number of points lost)

objective: decrease file size, decrease compression ratio
return 6 best parameters
"""

COMPRESSION_API_URL = (
    "https://ip-team6-compression-function.azurewebsites.net/api/compressdata"
)
COMPRESSION_API_KEY = "cY1UQbInfG8J47x6HpICBc_rrCFwSNen_geoVqVGgZAEAzFuv_plDw=="
BLOB_STORAGE_CONNECTION_STRING = os.environ.get("BLOB_STORAGE_CONNECTION_STRING")


def run_compression(test_params, data):
    """
    Call the compression API with given parameters and data.
    Returns file_size (number of compressed points), compression_ratio, and data_kept.
    """
    try:
        request_data = {
            "rawData": [
                {"timestamp": point["timestamp"], "value": point["value"]}
                for point in data
            ],
            "parameters": {
                "deviationLimit": test_params["cf_deviation_limit"],
                "deviationType": test_params["cf_deviation_type"].upper(),
            },
        }

        response = requests.post(
            COMPRESSION_API_URL,
            headers={
                "Content-Type": "application/json",
                "x-functions-key": COMPRESSION_API_KEY,
            },
            json=request_data,
        )

        if response.status_code != 200:
            print(f"Compression API error: {response.text}")
            return float("inf"), 1.0, 0.0

        result = response.json()
        if not isinstance(result, list):
            print(f"Unexpected response format: {result}")
            return float("inf"), 1.0, 0.0

        raw_points = len(data)
        compressed_points = len(result)
        compression_ratio = compressed_points / raw_points if raw_points > 0 else 1.0
        data_kept = (1 - compression_ratio) * 100
        file_size = compressed_points

        return file_size, compression_ratio, data_kept

    except Exception as e:
        print(f"Error calling compression API: {e}")
        return float("inf"), 1.0, 0.0


# run parameter optimisation on compression algorithm with grid search
def run_optimisation(data=None, storage_url=None):
    """
    Run grid search optimisation over compression parameters.
    Data: List of {timestamp, value} or storage_url to fetch data from Blob Storage.
    """
    if storage_url and not data:
        data = [
            {"timestamp": "2025-02-18T00:00:00Z", "value": 1},
            {"timestamp": "2025-02-18T00:01:00Z", "value": 2},
            {"timestamp": "2025-02-18T00:02:00Z", "value": 1.5},
            {"timestamp": "2025-02-18T00:03:00Z", "value": 3},
            {"timestamp": "2025-02-18T00:04:00Z", "value": 2.8},
        ]

    if not data:
        print("No data provided")
        return []

    # pass in parameter values to parameter grid
    param_grid = {
        "cf_deviation_type": ["absolute", "percentage"],
        "cf_deviation_limit": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "ef_deviation_type": ["absolute", "percentage"],
        "ef_deviation_limit": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "min_resample_limit": [
            (0, 0, 0),
            (0, 0, 5),
            (0, 0, 10),
            (0, 0, 30),
            (0, 0, 60),
            (0, 1, 0),
            (0, 2, 30),
            (0, 5, 0),
        ],
        "max_resample_limit": [
            (0, 0, 0),
            (0, 0, 5),
            (0, 0, 10),
            (0, 0, 30),
            (0, 0, 60),
            (0, 1, 0),
            (0, 2, 30),
            (0, 5, 0),
        ],
    }

    # generate parameter combinations
    param_combinations = list(ParameterGrid(param_grid))

    # store results
    results = []

    # test each parameter combination
    for params in param_combinations:
        file_size, compression_ratio = run_compression(params, data)
        data_kept = (1 - compression_ratio) * 100  # Convert to percentage
        file_size_reduction = round(
            100 - ((file_size / 5000) * 100), 2
        )  # File size reduction percentage
        results.append((params, file_size, file_size_reduction, round(data_kept, 2)))

    # sort results by smallest file size and highest data retention
    results.sort(key=lambda x: (x[1], -x[3]))

    return results


def get_top_5_results(results):
    # get the best 5 parameter sets
    best_results = results[:5]

    # print the best parameters and results
    print("Top 5 Parameter Combinations:")
    for i, (params, file_size, file_size_reduction, data_kept) in enumerate(
        best_results, 1
    ):
        print(
            f"{i}. Parameters: {params}, File Size: {file_size} bytes, File Size Reduction: {file_size_reduction}%, "
            f"Data Kept: {data_kept}%"
        )

    return best_results


# take the best parameters and send to compression algorithm/UI to use as optimal
def get_optimal_result(results):
    if not results:
        return {
            "cf_deviation_limit": 9,
            "cf_deviation_type": "absolute",
            "ef_deviation_limit": 2,
            "ef_deviation_type": "percentage",
            "min_resample_limit": [0, 2, 0],
            "max_resample_limit": [0, 2, 30],
        }

    best_result = results[0][0]
    return {
        "cf_deviation_limit": best_result["cf_deviation_limit"],
        "cf_deviation_type": best_result["cf_deviation_type"],
        "ef_deviation_limit": best_result["ef_deviation_limit"],
        "ef_deviation_type": best_result["ef_deviation_type"],
        "min_resample_limit": list(best_result["min_resample_limit"]),
        "max_resample_limit": list(best_result["max_resample_limit"]),
    }


def main(req: func.HttpRequest):
    """
    Azure Function entry point to handle HTTP requests
    """
    try:
        req_body = req.get_json()
        data = req_body.get("data", [])
        storage_url = req_body.get("storage_url")

        if not data and not storage_url:
            return func.HttpResponse(
                "Please provide 'data' or 'storage_url' in the request body",
                status_code=400,
            )

        results = run_optimisation(data, storage_url)
        optimal_params = get_optimal_result(results)

        return func.HttpResponse(
            json.dumps(optimal_params), mimetype="application/json", status_code=200
        )

    except Exception as e:
        return func.HttpResponse(f"Error processing request: {str(e)}", status_code=500)
