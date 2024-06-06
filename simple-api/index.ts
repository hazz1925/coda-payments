import express from 'express';

const app = express();
const ports = [3001, 3002, 3003];

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (_, res) => {
  res.send('Hello World!')
})

app.post('/', (req, res) => {
  res.send(req.body)
})

ports.forEach(port => {
  app.listen(port, () => {
    console.log(`App is listening on port ${port}`)
  })
})
