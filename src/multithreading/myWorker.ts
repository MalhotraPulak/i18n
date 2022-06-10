import workerpool from 'workerpool';
import {processFile} from '../fileProcessor.js'



// create a worker and register public functions
workerpool.worker({
  processFile
});