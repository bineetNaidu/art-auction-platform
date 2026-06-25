import { Kafka, Producer, Consumer, KafkaConfig } from 'kafkajs';

export class KafkaBrokerClient {
  private kafka: Kafka;
  private producerInstance?: Producer;

  constructor(config: KafkaConfig) {
    this.kafka = new Kafka(config);
  }

  async getProducer(): Promise<Producer> {
    if (!this.producerInstance) {
      this.producerInstance = this.kafka.producer();
      await this.producerInstance.connect();
    }
    return this.producerInstance;
  }

  async createConsumer(groupId: string): Promise<Consumer> {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    return consumer;
  }

  async disconnect(): Promise<void> {
    if (this.producerInstance) {
      await this.producerInstance.disconnect();
    }
  }
}
