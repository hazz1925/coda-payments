import express from 'express';
import { RequestProcessor } from './request-processor';

const app = express();
const port = 3000;
const requestProcessor = new RequestProcessor()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (_, res) => {
  res.send('Hello World!')
})

app.post('/', async (req, res) => {
  console.time('RoundRobin')
  const resp = await requestProcessor.run(req)
  console.timeEnd('RoundRobin')
  console.log({ resp })
  res.send(resp)
})

app.listen(port, () => {
  console.log(`App is listening on port ${port}`)
})
