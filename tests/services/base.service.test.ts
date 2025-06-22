import { ServiceBroker } from 'moleculer';

describe('Base Service Tests', () => {
  let broker: ServiceBroker;

  beforeAll(async () => {
    broker = new ServiceBroker({
      logger: false,
      transporter: null
    });
  });

  afterAll(async () => {
    if (broker) {
      await broker.stop();
    }
  });

  it('should create service broker', () => {
    expect(broker).toBeDefined();
  });
});