import { Request } from 'express'

interface Instance {
  address: string;
  cursor: boolean;
  failCount: number;
  status: 'active' | 'inactive' | 'paused';
  lastUsedAt?: Date;
}

export class RequestProcessor {
  readonly FAIL_THRESHOLD = 3
  readonly PAUSED_COOLDOWN = 1000 * 60 * 10 // 10 minutes
  instances: Instance[] = []

  constructor() {
    this.setInstances();
  }

  public async run(request: Request, tries: number = 0) {
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
  }

  private getAddress(): string {
    let address: string | undefined

    this.instances.forEach((i, index) => {
      if (i.cursor && !address) {
        if (i.status === 'inactive'
            || i.status === 'paused'
            && (new Date().getTime() - i.lastUsedAt?.getTime()) < this.PAUSED_COOLDOWN
        ) {
          return
        }
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

    if (instance.failCount >= this.FAIL_THRESHOLD) {
      instance.status = 'inactive'
    }
  }

  private setPaused(address: string) {
    const instance = this.instances.find(i => i.address === address)
    if (!instance) {
      throw new Error('Instance not found')
    }
    instance.status = 'paused'
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
    const start = new Date().getTime()
    const res = await fetch(`http://${address}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.body),
    })

    const end = new Date().getTime()
    const duration = end - start
    if (duration > 1000) {
      this.setPaused(address)
    }

    return res.json()
  }
}
