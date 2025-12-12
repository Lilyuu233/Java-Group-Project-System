import grid_search

test_optimal_params = {
    'cf_deviation_limit': 4,
    'cf_deviation_type': 'absolute',
    'ef_deviation_limit': 8,
    'ef_deviation_type': 'percentage',
    'max_resample_limit': (0, 2, 30),
    'min_resample_limit': (0, 1, 0)
}


# test 2.3.1 - functionality
def test_optimisation():
    grid_search.set_optimal_params(test_optimal_params)

    results = grid_search.run_optimisation()
    best_result = results[:1]
    best_result = best_result[0][0]

    assert best_result == test_optimal_params


# test 2.3.2 - functionality
def test_optimal_params_getter_and_setter():
    grid_search.set_optimal_params(test_optimal_params)

    assert grid_search.get_optimal_params() == test_optimal_params


# test 2.3.3 - functionality
def test_top_5_results_number():
    grid_search.set_optimal_params(test_optimal_params)

    results = grid_search.run_optimisation()
    top_5_results = grid_search.get_top_5_results(results)

    assert len(top_5_results) == 5


# test 2.3.4 - functionality
def test_optimal_result_number():
    grid_search.set_optimal_params(test_optimal_params)

    results = grid_search.run_optimisation()
    optimal_result = grid_search.get_optimal_result(results)

    assert len(optimal_result) == 6


# test 2.3.5 - accuracy
def test_optimal_result_valid():
    grid_search.set_optimal_params(test_optimal_params)

    results = grid_search.run_optimisation()
    optimal_result = grid_search.get_optimal_result(results)

    assert optimal_result == test_optimal_params
