# Data filters

## Tuneable Parameters

### Deviation Limit
- Value which decides how close a data point can be to another point before it is discarded (e.g. DeviationLimit = 2 means if two points are 2% or less different then one of them is discarded as they are too similar)
- Higher deviation means more aggressive compression (less data points stored), lower deviation limit means less compression (more data points stored, higher accuracy)

### Deviation type
- Either absolute e.g. 2 i.e. 2 points OR percentage e.g. 2 i.e. 2% either way

### Callback filter
- Can be used to filter out certain values e.g. smaller than or greater than a certain value e.g. reject all values less than 50 (fine grained control over what data gets processed)
- Can use custom rules?

### Exception filter
- Compares incoming samples to the last-emitted sample using deviation limits
- Checks timestamps of samples to see if they are too close together (?)

## Linking to optimisation
- Use optimisation algorithm after compression then run compression again with tuned values?
- Need default values to start with? (need to decide on what are our base values?)


## Questions to ask Josh
- How each of these parameters work? in this context
- Advice on which the users should be able to access/change? (should they be able to change all of them?)
- Define what is good compressed? i.e. what is compressed enough - value status variable in Model folder returning Good, Uncertain or Bad?
- Save after results after first run of compression algorithm and then depending on result of compression e.g Good, Uncertain or Bad, either run again or save to Azure infrastructure

- Understanding how the pipeline processes data? We will likely need to access the file uploaded as a csv?


## Feedback pt 1
- All 4 of these parameters should be able to be modified by the user (currently hardcoded? -> need to be able to get values from UI)
- Optimisation work should be looked into only once the main functionality is working (added-extra opt-in feature for the user but not essential right now -> focus on producing something to show before Easter break)
- The Good, Uncertain, Bad options are for the data itself

## Feedback pt 2
- Pipeline acts a queue, taking each data element one by one
- Goes through the filters and removes data elements based on certain conditions (different for each filter)
- Sampling filter based on time interval
- Callback filter section is where you get the data back -> we need to add code to tell the program to add each data element which has managed to pass through all the filters (which is stored in the value variable), to a list/array which we can then save and send back to the UI for visualisation
- Reccomendation to also interact with another filter (library is there but not currently implemented in program.cs), called 'Value Change Filter' whichs specifies the maximum and minimum resample limits, which the user should also be able to modify
- We can use the 'Run with Debug' mode in VSCode, with a breakpoint on line 19, and hover over the 'value' variable, to see what data is currently being held (e.g. what value has managed to pass through all of the filters), and what the results were for each filter.

### Resulting next steps...
- Communicate with UI team re: parameters which users should have access to and be able to modify
- Check the format in which the data will be passed in and also the format in which they want the data to be returned e.g. csv, json etc. (with UI team)
- Implement writing values to list/array/other storage medium before saving as the correct format (Compression Team)
- Implement compression filters
- Access the user-defined values for the filters and pass them in to the algorithm
