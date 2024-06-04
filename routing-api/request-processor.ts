import { Request } from 'express'

interface Instance {
  address: string;
  cursor: boolean;
}

export class RequestProcessor {
  instances: Instance[] = []

  constructor() {
    this.setInstances();
  }

  public async run(request: Request) {
    // console.log('Before', { instances: this.instances })
    const address = this.getAddress()
    const res = await this.request(address, request)
    console.log({ res })
    return res
    // console.log('After', { instances: this.instances, address })
  }

  private getAddress(): string {
    let address: string | undefined

    this.instances.forEach((i, index) => {
      if (i.cursor && !address) {
        this.setCursorToNext(index)
        address = i.address
      }
    })

    if (!address) {
      throw new Error('No instances available')
    }

    return address
  }

  private setCursorToNext(index: number) {
    let nextIndex = index + 1
    if (nextIndex >= this.instances.length) {
      nextIndex = 0
    }

    this.instances[index].cursor = false 
    this.instances[nextIndex].cursor = true 
  }

  private setInstances() {
    this.instances = [
      {
        address: 'localhost:3001',
        cursor: true
      },
      {
        address: 'localhost:3002',
        cursor: false
      },
      {
        address: 'localhost:3003',
        cursor: false
      }
    ]
  }

  private async request(address: string, request: Request) {
    let res
    try {
      res = await fetch(`http://${address}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request.body),
      })
      // console.log({ res, response: await res.json(), request: request.body })
    } catch (error) {
      console.error('HttpRequestError', error)
    }
    return res.json()
  }
}
