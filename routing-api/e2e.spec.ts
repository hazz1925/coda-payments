
describe('E2E Routing API', () => {
  it('should work as expected', async () => {
    // Pre
    const body = {
      name: 'John',
      age: 30,
      city: 'New York',
    }
    fetch.mockImplementationOnce(JSON.stringify(body))
    
    // Action
    const response = await fetch('http://localhost:3000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const res = await response.json()

    // Assert
    expect(res).toEqual(body)
  })
})
