import { Request } from 'express'

interface Instance {
  address: string;
  cursor: boolean;
  failCount: number;
  status: 'active' | 'inactive';
}

export class RequestProcessor {
  instances: Instance[] = []

  constructor() {
    this.setInstances();
  }

  public async run(request: Request, tries: number = 0) {
    // console.log('Before', { instances: this.instances })
    if (tries >= 3) {
      throw new Error('Max tries exceeded')
    }

    const address = this.getAddress()
    let res
    try {
      res = await this.request(address, request)
    } catch (error) {
      console.error('HttpRequestError', error)
      this.incrementFailCount(address)
      await this.run(request, tries + 1)
    }

    if (res.statusCode === 500) {
      this.incrementFailCount(address)
      await this.run(request, tries + 1)
    }

    return res
    // console.log('After', { instances: this.instances, address })
  }

  private getAddress(): string {
    let address: string | undefined

    this.instances.forEach((i, index) => {
      if (i.cursor && i.status === 'active' && !address) {
        this.setCursorToNext(index)
        address = i.address
      }
    })

    if (!address) {
      throw new Error('No instances available')
    }

    return address
  }

  private incrementFailCount(address: string) {
    const instance = this.instances.find(i => i.address === address)
    if (!instance) {
      throw new Error('Instance not found')
    }
    instance.failCount += 1

    if (instance.failCount >= 3) {
      instance.status = 'inactive'
    }
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
        cursor: true,
        failCount: 0,
        status: 'active',
      },
      {
        address: 'localhost:3002',
        cursor: false,
        failCount: 0,
        status: 'active',
      },
      {
        address: 'localhost:3003',
        cursor: false,
        failCount: 0,
        status: 'active',
      }
    ]
  }

  private async request(address: string, request: Request) {
    const res = await fetch(`http://${address}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.body),
    })
    return res.json()
  }
}
