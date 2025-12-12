import azure.functions as func
from ..grid_search import main


def main(req: func.HttpRequest) -> func.HttpResponse:
    return main(req)
