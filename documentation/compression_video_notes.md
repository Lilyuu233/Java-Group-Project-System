# Exception and Compression Video Notes


## Intro
- Idea is to only store meaningful data (discarding all the noise)
- The trends are kept but points which do not add anything are taken out

## Exception
- Involves filtering out obvious noise
- Removing values inside a certain range (e.g. if it is within a certain value range and within a certain time range, then we shouldn't base decisions on this value -> so it can be removed)
- Need to keep track of current piece of sample data and the previous (so that we can work out if the values are different enough)

## Compression
- Based on 3 values: previous data sample, current data sample and incoming data sample
- Incoming value is compared to maximum and 
minimum slope values(?)
- Exception settings should be about half of the deviation limit

## Questions to ask
- Where the output data is stored?
