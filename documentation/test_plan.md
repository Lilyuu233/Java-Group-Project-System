# Test Plan

## Front End

### Configuration Panel

| ID    | Test Type     | Description                               | Notes                                                                                                           | Pass/Fail                              | Change Notes |
|-------|---------------|-------------------------------------------|-----------------------------------------------------------------------------------------------------------------|----------------------------------------|--------------|
| 1.1.1 | Functionality | "optimise" button can be pressed          | When the user presses the "optimise" button, the app should calculate and apply the optimal compression values. | Written - 14/11/24, Passed - 14/04/25  | n/a          |
| 1.1.2 | Functionality | Clicking data with no no file selected.   | This should result in an error.                                                                                 | Written - 21/11/24, Passed - 14/04/25  | n/a          |
| 1.1.3 | Functionality | Provide input for valid parameter 1       | Input is saved.                                                                                                 | Written - 21/11/24, Passed - 14/04/25  | n/a          |
| 1.1.4 | Functionality | Provide valid input for parameter 2       | Input is saved.                                                                                                 | Written - 21/11/24, Passed - 14/04/25  | n/a          |
| 1.1.5 | Functionality | Clicking compress without a selected file | Should result in an error message.                                                                              | Written - 21/11/24, Passed - 14/04/25  | n/a          |
| 1.1.6 | Functionality | Clicking compress icon                    | Should download current compressed data represented currently.                                                  | Written - 21/11/24, Passed - 14/04/25  | n/a          |

### Compression Sidebar Panel

| ID     | Test Type      | Description                                                                            | Notes                                                               | Pass/Fail                             | Change Notes |
|--------|----------------|----------------------------------------------------------------------------------------|---------------------------------------------------------------------|---------------------------------------|--------------|
| 1.2.1  | Functionality  | Sidebar renders correctly when the app is opened, displaying the title and search box. | Ensures the basic UI elements load correctly.                       | Written - 18/11/24, Passed - 14/04/25 | n/a          |
| 1.2.2  | Functionality  | Clicking the button opens the sidebar when it is closed.                               | Ensures the sidebar is displayed after clicking the button.         | Written - 18/11/24, Passed - 14/04/25 | n/a          |
| 1.2.3  | Functionality  | Clicking the button closes the sidebar when it is open.                                | Ensures the sidebar is hidden after clicking the button.            | Written - 18/11/24, Passed - 14/04/25 | n/a          |
| 1.2.4  | Functionality  | Clicking the "..." button shows a menu with Load, Edit, Download, and Delete options.  | Validates the menu appears with the correct options.                | Written - 18/11/24, Passed - 14/04/25 | n/a          |
| 1.2.5  | Functionality  | Filters configurations based on the entered keyword (case-insensitive).                | Keyword matching should work regardless of letter case.             | Written - 18/11/24, Passed - 14/04/25 | n/a          |
| 1.2.6  | Functionality  | Shows "No matching configurations" when no names match the keyword.                    | Ensures user receives clear feedback when no results are found.     | Written - 18/11/24, Passed - 14/04/25 | n/a          |
| 1.2.7  | Functionality  | Clicking the magnifying glass activates the search input field.                        | Ensures the input field is focused and ready for text.              | Written - 18/11/24, Passed - 14/04/25 | n/a          |
| 1.2.8  | Interaction    | Dynamically updates the list as the user types in the search box.                      | Ensures seamless user experience with real-time filtering.          | Written - 18/11/24, Passed - 14/04/25 | n/a          |
| 1.2.9  | Edge Case      | Handles special characters (e.g., "&", "%") and overly long keywords without crashing. | Includes validation for uncommon input scenarios.                   | Written - 18/11/24, Passed - 14/04/25 | n/a          |
| 1.2.10 | Responsiveness | Sidebar renders correctly on mobile devices                                            | Ensure layout and usability on smaller screens (e.g., iPhone width) | Written - 29/03/25, Passed - 14/04/25 | New          |
| 1.2.11 | Functionality  | Clicking "Start New Configuration" button triggers action                              | Confirms user can start a new configuration session                 | Written - 29/03/25, Passed - 14/04/25 | New          |
| 1.2.12 | Functionality  | Clicking "Load" option loads the selected configuration                                | Ensures configuration loading callback is triggered                 | Written - 29/03/25, Passed - 14/04/25 | New          |
| 1.2.13 | Functionality  | Clicking "Delete" option deletes a configuration                                       | Verifies deletion works and user is notified                        | Written - 29/03/25, Passed - 14/04/25 | New          |
| 1.2.14 | Functionality  | Clicking "Download" option compresses and saves config                                 | Ensures ZIP creation and download initiation                        | Written - 29/03/25, Passed - 14/04/25 | New          |
| 1.2.15 | Edge Case      | Empty configuration list displays fallback message                                     | Clear UI feedback when no saved configurations                      | Written - 29/03/25, Passed - 14/04/25 | New          |

### Compression Visualisation Graphs

| ID    | Test Type        | Description                                      | Notes                                                                                                         | Pass/Fail                             | Change Notes |
|-------|------------------|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------|---------------------------------------|--------------|
| 1.3.1 | Functionality    | Graph renders on page                            | When the user sends data to be compressed, the app should display the resulting compression graph             | Written - 17/11/24, Passed - 14/04/25 | n/a          |
| 1.3.2 | Functionality    | Graph updates with parameter changes             | Ensure the graph dynamically updates when a user adjusts compression parameters such as accuracy or file size | Written - 17/11/24, Passed - 14/04/25 | n/a          |
| 1.3.3 | Functionality    | Multiple compression methods can be compared     | Verify that users can select multiple compression methods and view them on the same graph for comparison      | Written - 17/11/24, Passed - 14/04/25 |  n/a         |
| 1.3.4 | Functionality    | Legends and tooltips display correctly           | Ensure legends and tooltips are visible and show correct information for data points                          | Written - 17/11/24, Passed - 14/04/25 | n/a          |
| 1.3.5 | Performance      | Graph renders with large datasets                | Measure load time and responsiveness of the graph when handling datasets of varying sizes                     | Written - 17/11/24, Passed - 14/04/25 | n/a          |
| 1.3.6 | Responsiveness   | Graph adjusts to screen size                     | Ensure the graph scales and remains readable on different devices (desktop, tablet, mobile)                   | Written - 17/11/24, Passed - 14/04/25 | n/a          |
| 1.3.7 | Back End         | Data integrity for plotted points                | Validate the plotted data matches the raw dataset values and compression calculations                         | Written - 17/11/24, Passed - 14/04/25 | n/a          |

[Ideas to Enhance Functionality](../tests/graph_testing_notes/graph_enhancements.md)
<br>
[Test Cases](../tests/graph_testing_notes/graph_test_cases.md)

### Compression Matrix Table

| ID     | Test Type      | Description                                                                      | Notes                                                    | Pass/Fail                              | Change Notes |
|--------|----------------|----------------------------------------------------------------------------------|----------------------------------------------------------|----------------------------------------|--------------|
| 1.4.1  | Functionality  | Displays original data metrics correctly.                                        | Verifies correct rendering of original dataset metrics.  | Written - 14/11/24, Passed - 14/04/25  | n/a          |
| 1.4.2  | Functionality  | Displays optimal configuration metrics after running the compression algorithm.  | Ensures metrics like compression rate are accurate.      | Written - 18/11/24, Passed - 14/04/25  | n/a          |
| 1.4.3  | Functionality  | Saves optimal configuration when "Save Optimal Configuration" button is clicked. | Confirms saved configuration metrics are accurate.       | Written - 18/11/24, Passed - 14/04/25  | n/a          |
| 1.4.4  | Functionality  | Updates the table dynamically when parameters are adjusted.                      | Ensures real-time table updates after parameter changes. | Written - 18/11/24, Passed - 14/04/25  | n/a          |
| 1.4.5  | Edge Case      | Handles empty datasets gracefully with "No data available" message.              | Ensures proper feedback for empty inputs.                | Written - 18/11/24, Passed - 14/04/25  | n/a          |
| 1.4.6  | Functionality	 | Show "Configuration saved successfully" after saving	                            | Confirms user feedback on successful save	               | Written - 29/03/25, Passed - 14/04/25	 | New          |
| 1.4.7  | UI Styling     | Table headers have correct background and font styling                           | Visual consistency check                                 | Written - 29/03/25, Passed - 14/04/25  | New          |
| 1.4.8  | UI Styling     | Table cells have correct border styling                                          | Validate table visual consistency                        | Written - 29/03/25, Passed - 14/04/25  | New          |
| 1.4.9  | UI Styling     | Save button has correct color, padding, and size                                 | Ensures button looks polished                            | Written - 29/03/25, Passed - 14/04/25  | New          |
| 1.4.10 | UI Styling     | Scrollable container has correct scroll behavior and style                       | Ensures large data can scroll inside container           | Written - 29/03/25, Passed - 14/04/25  | New          |

### UI Layout

| ID    | Test Type     | Description                                                                             | Notes                                                                                         | Pass/Fail                             | Change Notes |
|-------|---------------|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|---------------------------------------|--------------|
| 1.5.1 | Functionality | The logo is present on the page.                                                        | Ensures the component is visible.                                                             | Written - 20/11/24, Passed - 14/04/25 | n/a          |
| 1.5.2 | Functionality | The configuration panel is present on the page.                                         | Ensures the component is visible.                                                             | Written - 20/11/24, Passed - 14/04/25 | n/a          |
| 1.5.3 | Functionality | The compression visualisation graph is present on the page.                             | Ensures the component is visible.                                                             | Written - 20/11/24, Passed - 14/04/25 | n/a          |
| 1.5.4 | Functionality | The compression matrix is present on the page.                                          | Ensures the component is visible.                                                             | Written - 20/11/24, Passed - 14/04/25 | n/a          |
| 1.5.5 | Functionality | The save optimal parameters button is present on the page.                              | Ensures the component is visible.                                                             | Written - 20/11/24, Passed - 14/04/25 | n/a          |
| 1.5.6 | Functionality | The sidebar toggle is present on the page.                                              | Ensures the component is visible.                                                             | Written - 20/11/24, Passed - 14/04/25 | n/a          |

## Back End

### Compression Algorithm

| ID    | Test Type       | Description                                                                | Notes                                                                                                              | Pass/Fail          | Change Notes |
|-------|-----------------|----------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|--------------------|--------------|
| 2.1.1 | Functionality   | Verify the algorithm compresses data correctly                             | Successfully compresses data and outputs the compressed data. | Written - 14/11/24, Passed - 16/04/25 | New          |
| 2.1.2 | Accuracy        | Check that the compression retains critical data within acceptable limits. | Key points are preserved while reducing less critical data.                                                 | Written - 16/11/24, Passed - 16/04/25 | New          |
| 2.1.3 | Error Handling  | Verify the algorithm handles invalid or malformed data properly.           | The algorithm returns clear error messages or warnings for invalid input.                                    | Written - 16/11/24, Passed - 16/04/25 | New          |
| 2.1.4 | Configurability | Ensure the algorithm correctly applies user-defined parameters.            | User-provided settings, i.e., compression ratio affects the output as expected.                                | Written - 16/11/24, Passed - 16/04/25 | New          |
| 2.1.5 | Scalability     | Test the algorithm's ability to handle large datasets.                     | The algorithm compresses up to 1 million points without failing. However, testing process takes a very long time depending on device, might cause issues on low-performance hardware.                                | Written - 16/11/24, Passed - 16/04/25, Failed - 16/04/25| New          |
| 2.1.6 | Performance     | Ensure compression completes within a reasonable time.                     | Compression time does not exceed 5 seconds for 1 million points.                                                 | Written - 16/11/24, Passed - 17/04/25 | New          |
| 2.1.7 | Integration     | Check that the algorithm integrates well with other components.            | Compressed data works correctly with the Data Core API. However, unable to conduct conduct test with visualisation tools.                              | Written - 16/11/24, Passed - 17/04/25, Failed - 17/04/25 | New          |
| 2.1.8 | Output Metrics  | Confirm the algorithm calculates and displays metrics correctly.           | Metrics, i.e., storage savings, point counts, etc align with the actual results.                   | Written - 16/11/24, Passed - 17/04/25 | New          |
| 2.1.9 | Edge Cases      | Test the algorithm with unusual or extreme datasets.                       | Algorithm handles datasets with single points, duplicates or high frequency noise correctly.                                           | Written - 16/11/24, Passed - 17/04/25 | New          |

### Infrastructure

| ID     | Test Type      | Description                                                                  | Notes                                                                                                                       | Pass/Fail          | Change Notes |
|--------|----------------|------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|--------------------|--------------|
| 2.2.1  | Functionality  | Compression configuration can be stored                                      | When the user chooses to save configuration parameters, this is written into storage.                                       | Written - 14/11/24 | n/a          |
| 2.2.2  | Functionality  | Input Blob Container exists                                                  | Input Blob Container exists under the name of "IP-input-container"                                                          | Written - 24/11/24 | n/a          |
| 2.2.3  | Functionality  | Output Blob Container exists                                                 | Output Blob Container exists under the name of "IP-output-container"                                                        | Written - 24/11/24 | n/a          |
| 2.2.4  | Functionality  | Service Bus Queue exists                                                     | Service Bus Queue exists under the name of "IP-fifo-queue"                                                                  | Written - 24/11/24 | n/a          |
| 2.2.5  | Functionality  | Compression Azure Function exists                                            | Compression Azure Function exists under the name of "IP-compression-function"                                               | Written - 24/11/24 | n/a          |
| 2.2.6  | Functionality  | Intelligent Plant API Data Collection Azure Function exists                  | Intelligent Plant API Data Collection Azure Function exists under the name of "IP-API-data-getter-function"                 | Written - 24/11/24 | n/a          |
| 2.2.7  | Functionality  | Event Grid Subscription exists                                               | Event Grid Subscription for "BlobCreated" event exists under the name of "IP-blob-created"                                  | Written - 24/11/24 | n/a          |
| 2.2.8  | Integration    | Check API Data Collection Azure Function can write to Input Blob Container   | API Data Collection Azure Function can successfully write to Input Blob Container                                           | Written - 24/11/24 | n/a          |
| 2.2.9  | Integration    | Check BlobCreated Event Emission                                             | When a file is uploaded to IP-input-container, Azure Blob Storage emits an event for the new blob in the container          | Written - 24/11/24 | n/a          |
| 2.2.10 | Integration    | Check BlobCreated Event has a valid and full Blob URL                        | The Blob URL created is the full path to the uploaded file and the file can be accessed using that path                     | Written - 24/11/24 | n/a          |
| 2.2.11 | Integration    | Check Event Type of BlobCreated Event                                        | The event type of the event created has to be "Microsoft.Storage.BlobCreated"                                               | Written - 24/11/24 | n/a          |
| 2.2.12 | Integration    | Check Metadata is available for Event                                        | The file size, content type, and upload timestamp must all be available in the event that was created                       | Written - 24/11/24 | n/a          |
| 2.2.13 | Integration    | Check Event is routed via Azure Event Grid                                   | Check that the Event is sent to Azure Event Grid and that it is then forwarded to IP-fifo-queue                             | Written - 24/11/24 | n/a          |
| 2.2.14 | Integration    | Check Event is enqueued in in Service Bus Queue                              | The newly created event should be in IP-fifo-queue                                                                          | Written - 24/11/24 | n/a          |
| 2.2.15 | Accuracy       | Check Events enqueued to Service Bus Queue are FIFO                          | The events enqueued to IP-fifo-queue should be stored FIFO                                                                  | Written - 24/11/24 | n/a          |
| 2.2.16 | Integration    | Events from IP-fifo-queue trigger IP-compression-function                    | Each event in IP-fifo-queue triggers a new instance of IP-compression-function                                              | Written - 24/11/24 | n/a          |
| 2.2.17 | Integration    | Events are removed from IP-fifo-queue once IP-compression-function triggered | Once IP-compression-function is triggered by an event in IP-fifo-queue, said event should be removed from the queue         | Written - 24/11/24 | n/a          |
| 2.2.18 | Integration    | IP-compression-function writes file to IP-output-container                   | IP-compression-function writes file to IP-output-container                                                                  | Written - 24/11/24 | n/a          |
| 2.2.19 | Error Handling | Event Grid failure to deliver event to IP-fifo-queue causes retries          | If the Event Grid fails to route the event to IP-fifo-queue then it should retry with exponential backoff                   | Written - 24/11/24 | n/a          |
| 2.2.20 | Error Handling | Azure functions failure causes retries 1                                     | If IP-compression-function does not produce a file in a configured amount of time then it will be terminated and re-run     | Written - 24/11/24 | n/a          |
| 2.2.21 | Error Handling | Azure functions failure causes retries 2                                     | If IP-API-data-getter-function does not produce a file in a configured amount of time then it will be terminated and re-run | Written - 24/11/24 | n/a          |
| 2.2.22 | Error Handling | Dead Letter Queue configured for Event Grid                                  | A dead letter queue is configured for Event Grid for undelivered Event messages for manual inspection                       | Written - 24/11/24 | n/a          |
| 2.2.23 | Error Handling | Dead Letter Queue configured for IP-fifo-queue                               | A dead letter queue is configured for IP-fifo-queue for undelivered Event messages for manual inspection                    | Written - 24/11/24 | n/a          |

### Optimisation Algorithm

| ID    | Test Type     | Description                                      | Notes                                                                                                               | Pass/Fail                             | Change Notes |
|-------|---------------|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|---------------------------------------|--------------|
| 2.3.1 | Functionality | Verify algorithm optimises parameters correctly. | Optimisation algorithm should correctly identify a preset dictionary of optimal values by performing a grid search. | Written - 13/02/25, Passed - 25/03/25 | n/a          |
| 2.3.2 | Functionality | Test mock optimal parameters getter and setter.  | Test optimal parameter getter and setter work for mock compression of data.                                         | Written - 13/02/25, Passed - 25/03/25 | n/a          |
| 2.3.3 | Functionality | Retrieve Top 5 optimal compression parameters.   | Test the optimisation algorithm returns the top five compression parameters.                                        | Written - 13/02/25, Passed - 27/03/25 | n/a          |
| 2.3.4 | Functionality | Retrieve optimal compression parameter.          | Test the algorithm returns the most optimal value for each compression parameter.                                   | Written - 13/02/25, Passed - 25/03/25 | n/a          |
| 2.3.5 | Accuracy      | Test optimal result values.                      | Test the optimal result returned by the algorithm matches the set optimal parameters for testing.                   | Written - 13/02/25, Passed - 25/03/25 | n/a          |
